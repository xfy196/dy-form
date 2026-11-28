/**
 * 解析「显示模板」输入：含 ${} 走 labelTemplate，否则走单字段 labelKey（互斥）
 * @param input - 用户输入
 */
export function parseLabelDisplay(input: string): {
  labelKey: string
  labelTemplate: string
} {
  const trimmed = input.trim()
  if (!trimmed) return { labelKey: '', labelTemplate: '' }
  if (/\$\{[^{}]+\}/.test(trimmed)) {
    return { labelKey: '', labelTemplate: trimmed }
  }
  return { labelKey: trimmed, labelTemplate: '' }
}

/**
 * 从已存配置还原输入框展示值
 * @param labelKey - 单字段
 * @param labelTemplate - 模板
 */
export function getLabelDisplay(
  labelKey?: string | null,
  labelTemplate?: string | null,
): string {
  const template = labelTemplate != null ? String(labelTemplate).trim() : ''
  if (template) return template
  return labelKey != null ? String(labelKey) : ''
}
