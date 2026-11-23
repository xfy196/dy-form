import type { FormFieldItem, FormSchema, LegacyFormSchema, WidgetType } from './types'

const WIDGET_TYPES = new Set<WidgetType>([
  'Input',
  'Textarea',
  'InputNumber',
  'Select',
  'Radio',
  'Checkbox',
  'Switch',
  'DatePicker',
  'TimePicker',
  'Divider',
])

export interface SchemaValidationResult {
  valid: boolean
  errors: string[]
}

function validateFieldItem(field: Partial<FormFieldItem>, label: string, errors: string[]) {
  if (!field || typeof field !== 'object') {
    errors.push(`${label} 无效`)
    return
  }
  if (!field['x-component']) {
    errors.push(`${label} 缺少 x-component`)
  } else if (!WIDGET_TYPES.has(field['x-component'] as WidgetType)) {
    errors.push(`${label} 的 x-component "${field['x-component']}" 不受支持`)
  }
  if (!field.type) {
    errors.push(`${label} 缺少 type`)
  }
}

export function validateFormSchema(input: unknown): SchemaValidationResult {
  const errors: string[] = []

  if (!input || typeof input !== 'object') {
    return { valid: false, errors: ['Schema 必须是对象'] }
  }

  const schema = input as Partial<FormSchema & LegacyFormSchema>

  if (schema.type !== 'object') {
    errors.push('type 必须为 "object"')
  }

  // New array format
  if (Array.isArray(schema.fields)) {
    if (!schema.fields.length) {
      errors.push('fields 不能为空')
    }

    const names = new Set<string>()
    schema.fields.forEach((field, index) => {
      const label = `fields[${index}]`
      if (!field?.name || typeof field.name !== 'string') {
        errors.push(`${label} 缺少 name`)
      } else if (names.has(field.name)) {
        errors.push(`字段名重复: ${field.name}`)
      } else {
        names.add(field.name)
      }
      validateFieldItem(field, field?.name ? `字段 ${field.name}` : label, errors)
    })

    return { valid: errors.length === 0, errors }
  }

  // Legacy object-map format (import compatibility)
  if (schema.properties && typeof schema.properties === 'object') {
    const keys = Object.keys(schema.properties)
    if (!keys.length) {
      errors.push('properties 不能为空')
    }

    for (const [key, field] of Object.entries(schema.properties)) {
      validateFieldItem(field, `字段 ${key}`, errors)
    }

    if (schema['x-order']) {
      if (!Array.isArray(schema['x-order'])) {
        errors.push('x-order 必须是字符串数组')
      } else {
        for (const key of schema['x-order']) {
          if (!(key in schema.properties)) {
            errors.push(`x-order 中的 "${key}" 不存在于 properties`)
          }
        }
      }
    }

    if (schema.required) {
      if (!Array.isArray(schema.required)) {
        errors.push('required 必须是字符串数组')
      } else {
        for (const key of schema.required) {
          if (!(key in schema.properties)) {
            errors.push(`required 中的 "${key}" 不存在于 properties`)
          }
        }
      }
    }

    return { valid: errors.length === 0, errors }
  }

  errors.push('缺少 fields 数组（或旧版 properties 对象）')
  return { valid: false, errors }
}
