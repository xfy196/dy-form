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
   * Fetch upstream and extract list by dataPath.
   * @param {{ keyword?: string, searchKey?: string }} [query]
   */
  async fetchList(dataset, query = {}) {
    const method = (dataset.method || 'GET').toUpperCase();
    const headers = {
      Accept: 'application/json',
      ...(dataset.headers || {}),
    };

    let url = this.resolveFetchUrl(dataset.url);
    const keyword = query.keyword != null ? String(query.keyword) : '';
    const searchKey = query.searchKey || 'keyword';
    if (keyword !== '') {
      if (method === 'GET') {
        const u = new URL(url);
        u.searchParams.set(searchKey, keyword);
        url = u.toString();
      }
    }

    const init = { method, headers };
    if (method !== 'GET') {
      let body = dataset.body;
      if (keyword !== '' && body && typeof body === 'object' && !Array.isArray(body)) {
        body = { ...body, [searchKey]: keyword };
      } else if (keyword !== '' && (body == null || body === '')) {
        body = { [searchKey]: keyword };
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

  async preview(id, limit = 20) {
    const dataset = await this.findById(id);
    if (!dataset) return null;
    const list = await this.fetchList(dataset);
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
}

module.exports = DatasetService;
