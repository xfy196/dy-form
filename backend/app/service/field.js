'use strict';

const { Service } = require('egg');

const OPTION_COMPONENTS = new Set([ 'Select', 'Radio', 'Checkbox' ]);

function mapRow(row, helper) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    component: row.component,
    jsonType: row.json_type,
    required: !!row.required,
    sortOrder: row.sort_order,
    props: helper.parseJson(row.props_json, {}) || {},
    optionsMode: row.options_mode || null,
    options: helper.parseJson(row.options_json, null),
    datasetId: row.dataset_id || null,
    valueKey: row.value_key || null,
    labelKey: row.label_key || null,
    rules: helper.parseJson(row.rules_json, null),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toDbRow(payload) {
  return {
    name: payload.name,
    title: payload.title || '',
    component: payload.component,
    json_type: payload.jsonType || 'string',
    required: payload.required ? 1 : 0,
    sort_order: payload.sortOrder != null ? payload.sortOrder : 0,
    props_json: payload.props != null ? JSON.stringify(payload.props) : null,
    options_mode: payload.optionsMode || null,
    options_json: payload.options != null ? JSON.stringify(payload.options) : null,
    dataset_id: payload.datasetId || null,
    value_key: payload.valueKey || null,
    label_key: payload.labelKey || null,
    rules_json: payload.rules != null ? JSON.stringify(payload.rules) : null,
  };
}

class FieldService extends Service {
  async list() {
    const rows = await this.app.mysql.select('form_field', {
      orders: [[ 'sort_order', 'asc' ], [ 'id', 'asc' ]],
    });
    return rows.map(row => mapRow(row, this.ctx.helper));
  }

  async findById(id) {
    const row = await this.app.mysql.get('form_field', { id });
    return mapRow(row, this.ctx.helper);
  }

  async findByName(name) {
    const row = await this.app.mysql.get('form_field', { name });
    return mapRow(row, this.ctx.helper);
  }

  validatePayload(payload, { isCreate = false } = {}) {
    const errors = [];
    if (isCreate) {
      if (!payload.name || typeof payload.name !== 'string' || !payload.name.trim()) {
        errors.push('name 必填');
      } else if (!/^[a-zA-Z_][\w]*$/.test(payload.name.trim())) {
        errors.push('name 需以字母或下划线开头，仅含字母数字下划线');
      }
      if (!payload.component) errors.push('component 必填');
    }

    if (payload.component && OPTION_COMPONENTS.has(payload.component)) {
      const mode = payload.optionsMode;
      if (!mode || ![ 'static', 'dataset' ].includes(mode)) {
        errors.push('选项类控件必须指定 optionsMode: static|dataset');
      } else if (mode === 'static') {
        if (!Array.isArray(payload.options) || !payload.options.length) {
          errors.push('static 模式需要非空 options');
        }
      } else if (mode === 'dataset') {
        if (!payload.datasetId) errors.push('dataset 模式需要 datasetId');
        if (!payload.valueKey) errors.push('dataset 模式需要 valueKey');
        if (!payload.labelKey) errors.push('dataset 模式需要 labelKey');
      }
    }

    return errors;
  }

  async create(payload) {
    const maxRow = await this.app.mysql.query(
      'SELECT COALESCE(MAX(sort_order), 0) AS maxSort FROM form_field'
    );
    const sortOrder = payload.sortOrder != null ? payload.sortOrder : (maxRow[0].maxSort + 1);
    const result = await this.app.mysql.insert('form_field', toDbRow({
      ...payload,
      name: payload.name.trim(),
      sortOrder,
    }));
    return this.findById(result.insertId);
  }

  async update(id, payload) {
    const existing = await this.findById(id);
    if (!existing) return null;

    const merged = {
      ...existing,
      ...payload,
      props: payload.props !== undefined ? payload.props : existing.props,
      options: payload.options !== undefined ? payload.options : existing.options,
      rules: payload.rules !== undefined ? payload.rules : existing.rules,
    };

    const patch = {};
    if (payload.name !== undefined) patch.name = payload.name.trim();
    if (payload.title !== undefined) patch.title = payload.title;
    if (payload.component !== undefined) patch.component = payload.component;
    if (payload.jsonType !== undefined) patch.json_type = payload.jsonType;
    if (payload.required !== undefined) patch.required = payload.required ? 1 : 0;
    if (payload.sortOrder !== undefined) patch.sort_order = payload.sortOrder;
    if (payload.props !== undefined) {
      patch.props_json = payload.props != null ? JSON.stringify(payload.props) : null;
    }
    if (payload.optionsMode !== undefined) patch.options_mode = payload.optionsMode;
    if (payload.options !== undefined) {
      patch.options_json = payload.options != null ? JSON.stringify(payload.options) : null;
    }
    if (payload.datasetId !== undefined) patch.dataset_id = payload.datasetId;
    if (payload.valueKey !== undefined) patch.value_key = payload.valueKey;
    if (payload.labelKey !== undefined) patch.label_key = payload.labelKey;
    if (payload.rules !== undefined) {
      patch.rules_json = payload.rules != null ? JSON.stringify(payload.rules) : null;
    }

    // clear dataset fields when switching to static / non-option
    if (merged.optionsMode === 'static' || !OPTION_COMPONENTS.has(merged.component)) {
      if (payload.optionsMode === 'static' || (payload.component && !OPTION_COMPONENTS.has(payload.component))) {
        patch.dataset_id = null;
        patch.value_key = null;
        patch.label_key = null;
      }
    }
    if (!OPTION_COMPONENTS.has(merged.component)) {
      patch.options_mode = null;
      patch.options_json = null;
      patch.dataset_id = null;
      patch.value_key = null;
      patch.label_key = null;
    }

    if (Object.keys(patch).length) {
      await this.app.mysql.update('form_field', patch, { where: { id } });
    }
    return this.findById(id);
  }

  async destroy(id) {
    await this.app.mysql.delete('form_field', { id });
  }

  /**
   * @param {object} field
   * @param {{ keyword?: string, searchKey?: string }} [query]
   */
  async resolveOptions(field, query = {}) {
    if (!field || !OPTION_COMPONENTS.has(field.component)) return [];
    const keyword = query.keyword != null ? String(query.keyword).trim() : '';
    const searchKey = query.searchKey || (field.props && field.props.searchKey) || 'keyword';

    if (field.optionsMode === 'static') {
      const options = Array.isArray(field.options) ? field.options : [];
      if (!keyword) return options;
      const q = keyword.toLowerCase();
      return options.filter(o =>
        String(o.label).toLowerCase().includes(q) ||
        String(o.value).toLowerCase().includes(q)
      );
    }
    if (field.optionsMode === 'dataset') {
      const dataset = await this.service.dataset.findById(field.datasetId);
      if (!dataset) throw new Error('关联数据集不存在');
      const list = await this.service.dataset.fetchList(dataset, {
        keyword,
        searchKey,
      });
      return list.map(item => {
        if (item == null || typeof item !== 'object') {
          return { label: String(item), value: item };
        }
        return {
          label: item[field.labelKey],
          value: item[field.valueKey],
        };
      });
    }
    return [];
  }
}

module.exports = FieldService;
