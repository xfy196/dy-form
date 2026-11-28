'use strict';

const TEMPLATE_RE = /\$\{([^{}]+)\}/g;

/**
 * 判断字符串是否含模板占位符 ${field}
 * @param {unknown} value
 * @returns {boolean}
 */
function isLabelTemplate(value) {
  if (value == null || typeof value !== 'string') return false;
  return /\$\{[^{}]+\}/.test(value);
}

/**
 * 按模板或单字段解析选项 label
 * @param {Record<string, unknown>} item - 数据集行
 * @param {{ labelKey?: string|null, labelTemplate?: string|null }} config
 * @returns {string}
 */
function formatOptionLabel(item, config = {}) {
  const template = config.labelTemplate != null ? String(config.labelTemplate).trim() : '';
  if (template) {
    return template.replace(TEMPLATE_RE, (_match, key) => {
      const field = String(key).trim();
      if (!field) return '';
      const val = item[field];
      return val == null ? '' : String(val);
    });
  }
  const labelKey = config.labelKey != null ? String(config.labelKey).trim() : '';
  if (!labelKey) return '';
  const val = item[labelKey];
  return val == null ? '' : String(val);
}

module.exports = {
  isLabelTemplate,
  formatOptionLabel,
};
