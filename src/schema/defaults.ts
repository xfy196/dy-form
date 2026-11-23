import type { FieldSchema, WidgetMeta, WidgetType } from './types'

export const WIDGET_METAS: WidgetMeta[] = [
  { type: 'Input', label: '单行输入', group: 'input' },
  { type: 'Textarea', label: '多行输入', group: 'input' },
  { type: 'InputNumber', label: '数字输入', group: 'input' },
  { type: 'Select', label: '下拉选择', group: 'select' },
  { type: 'Radio', label: '单选框组', group: 'select' },
  { type: 'Checkbox', label: '多选框组', group: 'select' },
  { type: 'Switch', label: '开关', group: 'select' },
  { type: 'DatePicker', label: '日期选择', group: 'select' },
  { type: 'TimePicker', label: '时间选择', group: 'select' },
  { type: 'Divider', label: '分割线', group: 'layout' },
]

const DEFAULT_OPTIONS = [
  { label: '选项一', value: 'option1' },
  { label: '选项二', value: 'option2' },
]

export function createDefaultFieldSchema(widget: WidgetType): FieldSchema {
  switch (widget) {
    case 'Input':
      return {
        type: 'string',
        title: '单行输入',
        'x-component': 'Input',
        'x-component-props': { placeholder: '请输入', clearable: true },
      }
    case 'Textarea':
      return {
        type: 'string',
        title: '多行输入',
        'x-component': 'Textarea',
        'x-component-props': { placeholder: '请输入', maxlength: 200 },
      }
    case 'InputNumber':
      return {
        type: 'number',
        title: '数字输入',
        'x-component': 'InputNumber',
        'x-component-props': { min: 0, max: 9999, step: 1 },
      }
    case 'Select':
      return {
        type: 'string',
        title: '下拉选择',
        enum: DEFAULT_OPTIONS.map((o) => o.value),
        'x-component': 'Select',
        'x-component-props': {
          placeholder: '请选择',
          clearable: true,
          options: [...DEFAULT_OPTIONS],
        },
      }
    case 'Radio':
      return {
        type: 'string',
        title: '单选框组',
        enum: DEFAULT_OPTIONS.map((o) => o.value),
        'x-component': 'Radio',
        'x-component-props': { options: [...DEFAULT_OPTIONS] },
      }
    case 'Checkbox':
      return {
        type: 'array',
        title: '多选框组',
        default: [],
        'x-component': 'Checkbox',
        'x-component-props': { options: [...DEFAULT_OPTIONS] },
      }
    case 'Switch':
      return {
        type: 'boolean',
        title: '开关',
        default: false,
        'x-component': 'Switch',
        'x-component-props': {},
      }
    case 'DatePicker':
      return {
        type: 'string',
        title: '日期选择',
        'x-component': 'DatePicker',
        'x-component-props': {
          placeholder: '请选择日期',
          format: 'YYYY-MM-DD',
          valueFormat: 'YYYY-MM-DD',
          clearable: true,
        },
      }
    case 'TimePicker':
      return {
        type: 'string',
        title: '时间选择',
        'x-component': 'TimePicker',
        'x-component-props': {
          placeholder: '请选择时间',
          format: 'HH:mm:ss',
          valueFormat: 'HH:mm:ss',
          clearable: true,
        },
      }
    case 'Divider':
      return {
        type: 'void',
        title: '分割线',
        'x-component': 'Divider',
        'x-hidden-value': true,
        'x-component-props': { content: '分割线' },
      }
  }
}

export function getDefaultModelValue(schema: FieldSchema): unknown {
  if (schema.default !== undefined) {
    return JSON.parse(JSON.stringify(schema.default)) as unknown
  }
  if (schema['x-hidden-value'] || schema.type === 'void') return undefined
  switch (schema.type) {
    case 'boolean':
      return false
    case 'number':
      return undefined
    case 'array':
      return []
    case 'object':
      return {}
    default:
      return ''
  }
}
