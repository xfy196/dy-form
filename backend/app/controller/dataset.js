'use strict';

const { Controller } = require('egg');

class DatasetController extends Controller {
  async index() {
    const { ctx, service } = this;
    const list = await service.dataset.list();
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
    const row = await service.dataset.findById(id);
    if (!row) {
      ctx.status = 404;
      ctx.body = ctx.helper.fail('数据集不存在');
      return;
    }
    ctx.body = ctx.helper.ok(row);
  }

  async create() {
    const { ctx, service } = this;
    const body = ctx.request.body || {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      ctx.status = 400;
      ctx.body = ctx.helper.fail('name 必填');
      return;
    }
    if (!/^[a-zA-Z_][\w-]*$/.test(name)) {
      ctx.status = 400;
      ctx.body = ctx.helper.fail('name 格式无效');
      return;
    }
    if (!body.url || typeof body.url !== 'string') {
      ctx.status = 400;
      ctx.body = ctx.helper.fail('url 必填');
      return;
    }
    const method = (body.method || 'GET').toUpperCase();
    if (![ 'GET', 'POST' ].includes(method)) {
      ctx.status = 400;
      ctx.body = ctx.helper.fail('method 仅支持 GET/POST');
      return;
    }

    try {
      const row = await service.dataset.create({
        name,
        title: typeof body.title === 'string' ? body.title.trim() : name,
        method,
        url: body.url.trim(),
        headers: body.headers,
        body: body.body,
        dataPath: typeof body.dataPath === 'string' ? body.dataPath.trim() : '',
      });
      ctx.status = 201;
      ctx.body = ctx.helper.ok(row, '创建成功');
    } catch (err) {
      if (err && err.code === 'ER_DUP_ENTRY') {
        ctx.status = 400;
        ctx.body = ctx.helper.fail('name 已存在');
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
    const existing = await service.dataset.findById(id);
    if (!existing) {
      ctx.status = 404;
      ctx.body = ctx.helper.fail('数据集不存在');
      return;
    }

    const body = ctx.request.body || {};
    if (body.method !== undefined) {
      const method = String(body.method).toUpperCase();
      if (![ 'GET', 'POST' ].includes(method)) {
        ctx.status = 400;
        ctx.body = ctx.helper.fail('method 仅支持 GET/POST');
        return;
      }
      body.method = method;
    }

    const row = await service.dataset.update(id, {
      title: body.title,
      method: body.method,
      url: body.url,
      headers: body.headers,
      body: body.body,
      dataPath: body.dataPath,
    });
    ctx.body = ctx.helper.ok(row, '更新成功');
  }

  async destroy() {
    const { ctx, service } = this;
    const id = Number(ctx.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      ctx.status = 400;
      ctx.body = ctx.helper.fail('无效的 id');
      return;
    }
    const existing = await service.dataset.findById(id);
    if (!existing) {
      ctx.status = 404;
      ctx.body = ctx.helper.fail('数据集不存在');
      return;
    }
    await service.dataset.destroy(id);
    ctx.body = ctx.helper.ok(null, '删除成功');
  }

  async preview() {
    const { ctx, service } = this;
    const id = Number(ctx.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      ctx.status = 400;
      ctx.body = ctx.helper.fail('无效的 id');
      return;
    }
    try {
      const body = ctx.request.body || {};
      const query = {};
      if (body.keyword != null) query.keyword = String(body.keyword);
      if (body.searchKey != null) query.searchKey = String(body.searchKey);
      if (body.pageKey != null && String(body.pageKey).trim()) {
        query.pageKey = String(body.pageKey).trim();
        query.page = body.page != null ? Number(body.page) : 1;
      }
      if (body.pageSizeKey != null && String(body.pageSizeKey).trim()) {
        query.pageSizeKey = String(body.pageSizeKey).trim();
        query.pageSize = body.pageSize != null ? Number(body.pageSize) : 50;
      }
      const limit = body.limit != null ? Number(body.limit) : 20;
      const data = await service.dataset.preview(id, limit, query);
      if (!data) {
        ctx.status = 404;
        ctx.body = ctx.helper.fail('数据集不存在');
        return;
      }
      ctx.body = ctx.helper.ok(data);
    } catch (err) {
      ctx.status = 400;
      ctx.body = ctx.helper.fail(err instanceof Error ? err.message : '预览失败');
    }
  }

  /** 设计器等场景：按映射直接返回 options */
  async options() {
    const { ctx, service } = this;
    const id = Number(ctx.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      ctx.status = 400;
      ctx.body = ctx.helper.fail('无效的 id');
      return;
    }
    try {
      const body = ctx.request.body || {};
      const valueKey = body.valueKey != null ? String(body.valueKey) : '';
      const labelKey = body.labelKey != null ? String(body.labelKey) : '';
      const labelTemplate = body.labelTemplate != null ? String(body.labelTemplate) : '';
      if (!valueKey.trim() || (!labelKey.trim() && !labelTemplate.trim())) {
        ctx.status = 400;
        ctx.body = ctx.helper.fail('valueKey 必填，且 labelTemplate 或 labelKey 至少一个');
        return;
      }
      const params = {
        valueKey: valueKey.trim(),
        labelKey: labelKey.trim(),
        labelTemplate: labelTemplate.trim(),
      };
      if (body.keyword != null) params.keyword = String(body.keyword);
      if (body.searchKey != null) params.searchKey = String(body.searchKey);
      if (body.pageKey != null && String(body.pageKey).trim()) {
        params.pageKey = String(body.pageKey).trim();
        params.page = body.page != null ? Number(body.page) : 1;
      }
      if (body.pageSizeKey != null && String(body.pageSizeKey).trim()) {
        params.pageSizeKey = String(body.pageSizeKey).trim();
        params.pageSize = body.pageSize != null ? Number(body.pageSize) : 50;
      }
      const data = await service.dataset.resolveOptions(id, params);
      if (!data) {
        ctx.status = 404;
        ctx.body = ctx.helper.fail('数据集不存在');
        return;
      }
      ctx.body = ctx.helper.ok(data);
    } catch (err) {
      ctx.status = 400;
      ctx.body = ctx.helper.fail(err instanceof Error ? err.message : '解析选项失败');
    }
  }
}

module.exports = DatasetController;
