import type { FormItemRule } from 'element-plus'

/** Supported widget names registered in the widget registry */
export type WidgetType =
  | 'Input'
  | 'Textarea'
  | 'InputNumber'
  | 'Select'
  | 'Radio'
  | 'Checkbox'
  | 'Switch'
  | 'DatePicker'
  | 'TimePicker'
  | 'Divider'

export type JsonSchemaType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'void'

export interface SelectOption {
  label: string
  value: string | number | boolean
}

export interface ComponentProps {
  placeholder?: string
  maxlength?: number
  min?: number
  max?: number
  step?: number
  clearable?: boolean
  multiple?: boolean
  options?: SelectOption[]
  activeText?: string
  inactiveText?: string
  format?: string
  valueFormat?: string
  content?: string
  [key: string]: unknown
}

export interface FieldSchema {
  type: JsonSchemaType
  title?: string
  description?: string
  default?: unknown
  enum?: Array<string | number | boolean>
  'x-component': WidgetType
  'x-component-props'?: ComponentProps
  'x-rules'?: FormItemRule[]
  /** Layout-only widgets are not written into the form model */
  'x-hidden-value'?: boolean
}

/** One field in the array-form schema */
export interface FormFieldItem extends FieldSchema {
  name: string
  /** Convenience flag; kept in sync with x-rules required */
  required?: boolean
}

/**
 * Canonical schema format: fields as ordered array.
 *
 * @example
 * {
 *   type: 'object',
 *   title: '用户信息',
 *   fields: [
 *     { name: 'name', type: 'string', title: '姓名', 'x-component': 'Input', required: true }
 *   ]
 * }
 */
export interface FormSchema {
  type: 'object'
  title?: string
  description?: string
  fields: FormFieldItem[]
}

/** Legacy object-map schema (still accepted on import) */
export interface LegacyFormSchema {
  type: 'object'
  title?: string
  description?: string
  properties: Record<string, FieldSchema>
  required?: string[]
  'x-order'?: string[]
}

/** Designer internal node */
export interface FieldNode {
  id: string
  name: string
  schema: FieldSchema
}

export interface WidgetMeta {
  type: WidgetType
  label: string
  group: 'input' | 'select' | 'layout'
  icon?: string
}
