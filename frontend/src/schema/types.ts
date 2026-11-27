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
  /** 本地过滤 / 远程搜索的前置条件 */
  filterable?: boolean
  /** 远程搜索（请求 /api/fields/:id/options?keyword=） */
  remote?: boolean
  /** 传给上游数据集的搜索参数名，默认 keyword */
  searchKey?: string
  /** 上游分页：页码参数名，默认 page；空字符串表示不传 */
  pageKey?: string
  /** 上游分页：页码值，默认 1 */
  page?: number
  /** 上游分页：每页条数参数名，默认 pageSize；空字符串表示不传 */
  pageSizeKey?: string
  /** 上游分页：每页条数，默认 50 */
  pageSize?: number
  /** 运行时字段 id，供远程搜索调用 options 接口 */
  fieldId?: number
  /** 选项来源：手动 / 数据集（设计器写入 schema） */
  optionsMode?: 'static' | 'dataset'
  /** 关联数据集 id */
  datasetId?: number | null
  /** 数据集 value 字段名 */
  valueKey?: string
  /** 数据集 label 字段名 */
  labelKey?: string
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
  component: WidgetType
  componentProps?: ComponentProps
  rules?: FormItemRule[]
  /** Layout-only widgets are not written into the form model */
  'hidden-value'?: boolean
}

/** One field in the array-form schema */
export interface FormFieldItem extends FieldSchema {
  name: string
  /** Convenience flag; kept in sync with rules required */
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
 *     { name: 'name', type: 'string', title: '姓名', component: 'Input', required: true }
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
  order?: string[]
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
