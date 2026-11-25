'use strict';

const { Controller } = require('egg');

function ok(ctx, data = null, message = 'ok') {
  ctx.body = { code: 0, message, data };
}

function fail(ctx, message, code = 1, status = 400) {
  ctx.status = status;
  ctx.body = { code, message, data: null };
}

function isValidSchema(schema) {
  return (
    schema &&
    typeof schema === 'object' &&
    !Array.isArray(schema) &&
    schema.type === 'object' &&
    Array.isArray(schema.fields)
  );
}

class FormController extends Controller {
  async index() {
    const { ctx, service } = this;
    const list = await service.form.list();
    ok(ctx, list);
  }

  async show() {
    const { ctx, service } = this;
    const id = Number(ctx.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return fail(ctx, '无效的 id');
    }
    const row = await service.form.findById(id);
    if (!row) {
      return fail(ctx, '表单不存在', 1, 404);
    }
    ok(ctx, row);
  }

  async create() {
    const { ctx, service } = this;
    const { name, title, schema } = ctx.request.body || {};

    if (!name || typeof name !== 'string' || !name.trim()) {
      return fail(ctx, 'name 必填');
    }
    if (!/^[a-zA-Z_][\w-]*$/.test(name.trim())) {
      return fail(ctx, 'name 需以字母或下划线开头，仅含字母数字下划线或连字符');
    }
    if (!isValidSchema(schema)) {
      return fail(ctx, 'schema 无效：需为对象且 type 为 object，并包含 fields 数组');
    }

    try {
      const row = await service.form.create({
        name: name.trim(),
        title: typeof title === 'string' ? title.trim() : (schema.title || name.trim()),
        schema,
      });
      ctx.status = 201;
      ok(ctx, row, '创建成功');
    } catch (err) {
      if (err && err.code === 'ER_DUP_ENTRY') {
        return fail(ctx, 'name 已存在');
      }
      throw err;
    }
  }

  async update() {
    const { ctx, service } = this;
    const id = Number(ctx.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return fail(ctx, '无效的 id');
    }

    const { title, schema } = ctx.request.body || {};
    if (schema !== undefined && !isValidSchema(schema)) {
      return fail(ctx, 'schema 无效：需为对象且 type 为 object，并包含 fields 数组');
    }
    if (title === undefined && schema === undefined) {
      return fail(ctx, '至少提供 title 或 schema');
    }

    const existing = await service.form.findById(id);
    if (!existing) {
      return fail(ctx, '表单不存在', 1, 404);
    }

    const row = await service.form.update(id, {
      title: typeof title === 'string' ? title.trim() : undefined,
      schema,
    });
    ok(ctx, row, '更新成功');
  }

  async destroy() {
    const { ctx, service } = this;
    const id = Number(ctx.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return fail(ctx, '无效的 id');
    }
    const existing = await service.form.findById(id);
    if (!existing) {
      return fail(ctx, '表单不存在', 1, 404);
    }
    await service.form.destroy(id);
    ok(ctx, null, '删除成功');
  }
}

module.exports = FormController;
