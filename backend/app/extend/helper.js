'use strict';

module.exports = {
  ok(data = null, message = 'ok') {
    return { code: 0, message, data };
  },

  fail(message, code = 1) {
    return { code, message, data: null };
  },

  parseJson(value, fallback = null) {
    if (value == null || value === '') return fallback;
    if (typeof value === 'object') return value;
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  },

  getByPath(obj, path) {
    if (!path || !String(path).trim()) return obj;
    return String(path)
      .split('.')
      .filter(Boolean)
      .reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
  },
};
