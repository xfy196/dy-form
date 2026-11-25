'use strict';

const { Service } = require('egg');

function parseSchemaJson(value) {
  if (value == null) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function mapListRow(row) {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

function mapDetailRow(row) {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    schema: parseSchemaJson(row.schema_json),
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

class FormService extends Service {
  async list() {
    const rows = await this.app.mysql.select('form_schema', {
      columns: [ 'id', 'name', 'title', 'created_at', 'updated_at' ],
      orders: [[ 'updated_at', 'desc' ], [ 'id', 'desc' ]],
    });
    return rows.map(mapListRow);
  }

  async findById(id) {
    const row = await this.app.mysql.get('form_schema', { id });
    return row ? mapDetailRow(row) : null;
  }

  async create({ name, title, schema }) {
    const result = await this.app.mysql.insert('form_schema', {
      name,
      title: title || '',
      schema_json: JSON.stringify(schema),
    });
    return this.findById(result.insertId);
  }

  async update(id, { title, schema }) {
    const patch = {};
    if (title !== undefined) patch.title = title;
    if (schema !== undefined) patch.schema_json = JSON.stringify(schema);
    if (Object.keys(patch).length) {
      await this.app.mysql.update('form_schema', patch, { where: { id } });
    }
    return this.findById(id);
  }

  async destroy(id) {
    await this.app.mysql.delete('form_schema', { id });
  }
}

module.exports = FormService;
