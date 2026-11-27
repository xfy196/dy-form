'use strict';

const { Controller } = require('egg');

class FieldController extends Controller {
  async index() {
    const { ctx, service } = this;
    const list = await service.field.list();
    ctx.body = ctx.helper.ok(list);
  }

  async show() {
    const { ctx, service } = this;
    const id = Number(ctx.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      ctx.status = 400;
      ctx.body = ctx.helper.fail('无效的 id');
      return;
    }
    const row = await service.field.findById(id);
    if (!row) {
      ctx.status = 404;
      ctx.body = ctx.helper.fail('字段不存在');
      return;
    }
    ctx.body = ctx.helper.ok(row);
  }

  async create() {
    const { ctx, service } = this;
    const body = ctx.request.body || {};
    const errors = service.field.validatePayload(body, { isCreate: true });
    if (errors.length) {
      ctx.status = 400;
      ctx.body = ctx.helper.fail(errors[0]);
      return;
    }

    if (body.optionsMode === 'dataset' && body.datasetId) {
      const ds = await service.dataset.findById(Number(body.datasetId));
      if (!ds) {
        ctx.status = 400;
        ctx.body = ctx.helper.fail('关联数据集不存在');
        return;
      }
    }

    try {
      const row = await service.field.create({
        name: body.name,
        title: body.title,
        component: body.component,
        jsonType: body.jsonType,
        required: !!body.required,
        sortOrder: body.sortOrder,
        props: body.props,
        optionsMode: body.optionsMode,
        options: body.options,
        datasetId: body.datasetId ? Number(body.datasetId) : null,
        valueKey: body.valueKey,
        labelKey: body.labelKey,
        rules: body.rules,
      });
      ctx.status = 201;
      ctx.body = ctx.helper.ok(row, '创建成功');
    } catch (err) {
      if (err && err.code === 'ER_DUP_ENTRY') {
        ctx.status = 400;
        ctx.body = ctx.helper.fail('字段名已存在');
        return;
      }
      throw err;
    }
  }

  async update() {
    const { ctx, service } = this;
    const id = Number(ctx.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      ctx.status = 400;
      ctx.body = ctx.helper.fail('无效的 id');
      return;
    }
    const existing = await service.field.findById(id);
    if (!existing) {
      ctx.status = 404;
      ctx.body = ctx.helper.fail('字段不存在');
      return;
    }

    const body = ctx.request.body || {};
    const merged = {
      ...existing,
      ...body,
      component: body.component || existing.component,
      optionsMode: body.optionsMode !== undefined ? body.optionsMode : existing.optionsMode,
      options: body.options !== undefined ? body.options : existing.options,
      datasetId: body.datasetId !== undefined ? body.datasetId : existing.datasetId,
      valueKey: body.valueKey !== undefined ? body.valueKey : existing.valueKey,
      labelKey: body.labelKey !== undefined ? body.labelKey : existing.labelKey,
    };
    const errors = service.field.validatePayload(merged, { isCreate: false });
    if (errors.length) {
      ctx.status = 400;
      ctx.body = ctx.helper.fail(errors[0]);
      return;
    }

    if (merged.optionsMode === 'dataset' && merged.datasetId) {
      const ds = await service.dataset.findById(Number(merged.datasetId));
      if (!ds) {
        ctx.status = 400;
        ctx.body = ctx.helper.fail('关联数据集不存在');
        return;
      }
    }

    try {
      const row = await service.field.update(id, {
        name: body.name,
        title: body.title,
        component: body.component,
        jsonType: body.jsonType,
        required: body.required,
        sortOrder: body.sortOrder,
        props: body.props,
        optionsMode: body.optionsMode,
        options: body.options,
        datasetId: body.datasetId !== undefined
          ? (body.datasetId ? Number(body.datasetId) : null)
          : undefined,
        valueKey: body.valueKey,
        labelKey: body.labelKey,
        rules: body.rules,
      });
      ctx.body = ctx.helper.ok(row, '更新成功');
    } catch (err) {
      if (err && err.code === 'ER_DUP_ENTRY') {
        ctx.status = 400;
        ctx.body = ctx.helper.fail('字段名已存在');
        return;
      }
      throw err;
    }
  }

  async destroy() {
    const { ctx, service } = this;
    const id = Number(ctx.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      ctx.status = 400;
      ctx.body = ctx.helper.fail('无效的 id');
      return;
    }
    const existing = await service.field.findById(id);
    if (!existing) {
      ctx.status = 404;
      ctx.body = ctx.helper.fail('字段不存在');
      return;
    }
    await service.field.destroy(id);
    ctx.body = ctx.helper.ok(null, '删除成功');
  }

  async options() {
    const { ctx, service } = this;
    const id = Number(ctx.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      ctx.status = 400;
      ctx.body = ctx.helper.fail('无效的 id');
      return;
    }
    const field = await service.field.findById(id);
    if (!field) {
      ctx.status = 404;
      ctx.body = ctx.helper.fail('字段不存在');
      return;
    }
    try {
      const keyword = ctx.query.keyword != null ? String(ctx.query.keyword) : '';
      const searchKey = ctx.query.searchKey != null ? String(ctx.query.searchKey) : undefined;
      const query = { keyword, searchKey };
      if (ctx.query.pageKey != null && String(ctx.query.pageKey).trim()) {
        query.pageKey = String(ctx.query.pageKey).trim();
        if (ctx.query.page != null) query.page = Number(ctx.query.page);
      }
      if (ctx.query.pageSizeKey != null && String(ctx.query.pageSizeKey).trim()) {
        query.pageSizeKey = String(ctx.query.pageSizeKey).trim();
        if (ctx.query.pageSize != null) query.pageSize = Number(ctx.query.pageSize);
      }
      const options = await service.field.resolveOptions(field, query);
      ctx.body = ctx.helper.ok(options);
    } catch (err) {
      ctx.status = 400;
      ctx.body = ctx.helper.fail(err instanceof Error ? err.message : '解析选项失败');
    }
  }
}

module.exports = FieldController;
