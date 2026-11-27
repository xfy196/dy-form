'use strict';

const { Service } = require('egg');

function mapRow(row, helper) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    method: row.method,
    url: row.url,
    headers: helper.parseJson(row.headers_json, null),
    body: helper.parseJson(row.body_json, null),
    dataPath: row.data_path || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

class DatasetService extends Service {
  async list() {
    const rows = await this.app.mysql.select('dataset', {
      orders: [[ 'updated_at', 'desc' ], [ 'id', 'desc' ]],
    });
    return rows.map(row => mapRow(row, this.ctx.helper));
  }

  async findById(id) {
    const row = await this.app.mysql.get('dataset', { id });
    return mapRow(row, this.ctx.helper);
  }

  async findByName(name) {
    const row = await this.app.mysql.get('dataset', { name });
    return mapRow(row, this.ctx.helper);
  }

  async create(payload) {
    const result = await this.app.mysql.insert('dataset', {
      name: payload.name,
      title: payload.title || '',
      method: payload.method || 'GET',
      url: payload.url,
      headers_json: payload.headers != null ? JSON.stringify(payload.headers) : null,
      body_json: payload.body != null ? JSON.stringify(payload.body) : null,
      data_path: payload.dataPath || '',
    });
    return this.findById(result.insertId);
  }

  async update(id, payload) {
    const patch = {};
    if (payload.title !== undefined) patch.title = payload.title;
    if (payload.method !== undefined) patch.method = payload.method;
    if (payload.url !== undefined) patch.url = payload.url;
    if (payload.headers !== undefined) {
      patch.headers_json = payload.headers != null ? JSON.stringify(payload.headers) : null;
    }
    if (payload.body !== undefined) {
      patch.body_json = payload.body != null ? JSON.stringify(payload.body) : null;
    }
    if (payload.dataPath !== undefined) patch.data_path = payload.dataPath || '';
    if (Object.keys(patch).length) {
      await this.app.mysql.update('dataset', patch, { where: { id } });
    }
    return this.findById(id);
  }

  async destroy(id) {
    await this.app.mysql.delete('dataset', { id });
  }

  /** 相对路径补全为可 fetch 的绝对地址（如 /api/mock/cities） */
  resolveFetchUrl(rawUrl) {
    const trimmed = String(rawUrl || '').trim();
    if (!trimmed) {
      throw new Error('url 为空');
    }
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }
    if (trimmed.startsWith('/')) {
      const configBase = this.app.config.datasetBaseUrl;
      if (configBase) {
        return `${String(configBase).replace(/\/$/, '')}${trimmed}`;
      }
      // 优先用当前请求的协议/主机，回退本地 Egg 端口
      const protocol = (this.ctx && this.ctx.protocol) || 'http';
      const host = (this.ctx && this.ctx.host) || '127.0.0.1:7001';
      return `${protocol}://${host}${trimmed}`;
    }
    throw new Error('url 需为 http(s) 绝对地址，或以 / 开头的相对路径');
  }

  /**
   * 收集需要透传给上游的查询参数（搜索 + 分页）
   * @param {{ keyword?: string, searchKey?: string, pageKey?: string, page?: number, pageSizeKey?: string, pageSize?: number }} query
   * @returns {Record<string, string|number>}
   */
  buildUpstreamParams(query = {}) {
    const params = {};
    const keyword = query.keyword != null ? String(query.keyword) : '';
    const searchKey = query.searchKey || 'keyword';
    if (keyword !== '' && searchKey) {
      params[searchKey] = keyword;
    }

    const pageKey = query.pageKey != null ? String(query.pageKey).trim() : '';
    if (pageKey && query.page != null && query.page !== '' && !Number.isNaN(Number(query.page))) {
      params[pageKey] = Number(query.page);
    }

    const pageSizeKey = query.pageSizeKey != null ? String(query.pageSizeKey).trim() : '';
    if (
      pageSizeKey &&
      query.pageSize != null &&
      query.pageSize !== '' &&
      !Number.isNaN(Number(query.pageSize))
    ) {
      params[pageSizeKey] = Number(query.pageSize);
    }

    return params;
  }

  /**
   * Fetch upstream and extract list by dataPath.
   * @param {{ keyword?: string, searchKey?: string, pageKey?: string, page?: number, pageSizeKey?: string, pageSize?: number }} [query]
   */
  async fetchList(dataset, query = {}) {
    const method = (dataset.method || 'GET').toUpperCase();
    const headers = {
      Accept: 'application/json',
      ...(dataset.headers || {}),
    };

    let url = this.resolveFetchUrl(dataset.url);
    const upstreamParams = this.buildUpstreamParams(query);

    if (method === 'GET') {
      if (Object.keys(upstreamParams).length) {
        const u = new URL(url);
        Object.entries(upstreamParams).forEach(([ key, value ]) => {
          u.searchParams.set(key, String(value));
        });
        url = u.toString();
      }
    }

    const init = { method, headers };
    if (method !== 'GET') {
      let body = dataset.body;
      if (Object.keys(upstreamParams).length) {
        if (body && typeof body === 'object' && !Array.isArray(body)) {
          body = { ...body, ...upstreamParams };
        } else if (body == null || body === '') {
          body = { ...upstreamParams };
        }
      }
      if (body != null) {
        if (!headers['Content-Type'] && !headers['content-type']) {
          headers['Content-Type'] = 'application/json';
        }
        init.body = typeof body === 'string' ? body : JSON.stringify(body);
      }
    }

    const res = await fetch(url, init);
    if (!res.ok) {
      throw new Error(`上游请求失败 HTTP ${res.status}`);
    }
    const json = await res.json();
    const extracted = this.ctx.helper.getByPath(json, dataset.dataPath);
    if (!Array.isArray(extracted)) {
      throw new Error(`data_path "${dataset.dataPath || '(root)'}" 未解析到数组`);
    }
    return extracted;
  }

  /**
   * @param {number} id
   * @param {number} [limit]
   * @param {{ keyword?: string, searchKey?: string, pageKey?: string, page?: number, pageSizeKey?: string, pageSize?: number }} [query]
   */
  async preview(id, limit = 20, query = {}) {
    const dataset = await this.findById(id);
    if (!dataset) return null;
    const list = await this.fetchList(dataset, query);
    const samples = list.slice(0, limit);
    const keys = new Set();
    for (const item of samples) {
      if (item && typeof item === 'object' && !Array.isArray(item)) {
        Object.keys(item).forEach(k => keys.add(k));
      }
    }
    return {
      total: list.length,
      fields: [ ...keys ],
      samples,
    };
  }

  /**
   * 按 valueKey/labelKey 解析为标准 options（供设计器等无 fieldId 场景）
   * @param {number} id
   * @param {{ valueKey: string, labelKey: string, keyword?: string, searchKey?: string, pageKey?: string, page?: number, pageSizeKey?: string, pageSize?: number }} params
   */
  async resolveOptions(id, params = {}) {
    const dataset = await this.findById(id);
    if (!dataset) return null;
    const valueKey = String(params.valueKey || '').trim();
    const labelKey = String(params.labelKey || '').trim();
    if (!valueKey || !labelKey) {
      throw new Error('valueKey / labelKey 必填');
    }
    const list = await this.fetchList(dataset, {
      keyword: params.keyword,
      searchKey: params.searchKey,
      pageKey: params.pageKey,
      page: params.page,
      pageSizeKey: params.pageSizeKey,
      pageSize: params.pageSize,
    });
    return list.map(item => {
      if (item == null || typeof item !== 'object') {
        return { label: String(item), value: item };
      }
      return {
        label: item[labelKey],
        value: item[valueKey],
      };
    });
  }
}

module.exports = DatasetService;
