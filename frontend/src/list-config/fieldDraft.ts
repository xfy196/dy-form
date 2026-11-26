import type { FormItemRule } from 'element-plus'
import type { ComponentProps, FieldSchema, FormSchema, JsonSchemaType, SelectOption, WidgetType } from '@/schema/types'
import { createDefaultFieldSchema } from '@/schema/defaults'
import type { FieldPayload, FieldRecord, OptionsMode } from '@/api/fields'
import { getFieldOptions } from '@/api/fields'

export interface FieldDraft {
  name: string
  title: string
  component: WidgetType
  jsonType: JsonSchemaType
  required: boolean
  props: ComponentProps
  optionsMode: OptionsMode | null
  options: SelectOption[]
  datasetId: number | null
  valueKey: string
  labelKey: string
  rules: FormItemRule[]
}

const OPTION_WIDGETS: WidgetType[] = [ 'Select', 'Radio', 'Checkbox' ]

export function isOptionWidget(component: WidgetType) {
  return OPTION_WIDGETS.includes(component)
}

export function createDraftFromWidget(widget: WidgetType): FieldDraft {
  const schema = createDefaultFieldSchema(widget)
  const options = schema.componentProps?.options || []
  const { options: _omit, ...restProps } = schema.componentProps || {}
  return {
    name: `${widget.toLowerCase()}_${Date.now().toString().slice(-4)}`,
    title: schema.title || '',
    component: widget,
    jsonType: schema.type,
    required: false,
    props: { ...restProps },
    optionsMode: isOptionWidget(widget) ? 'static' : null,
    options: [ ...options ],
    datasetId: null,
    valueKey: '',
    labelKey: '',
    rules: [],
  }
}

export function draftFromRecord(row: FieldRecord): FieldDraft {
  return {
    name: row.name,
    title: row.title || '',
    component: row.component,
    jsonType: row.jsonType,
    required: row.required,
    props: { ...(row.props || {}) },
    optionsMode: row.optionsMode,
    options: row.options ? [ ...row.options ] : [],
    datasetId: row.datasetId,
    valueKey: row.valueKey || '',
    labelKey: row.labelKey || '',
    rules: row.rules ? [ ...row.rules ] : [],
  }
}

export function draftToPayload(draft: FieldDraft): FieldPayload {
  const optionWidget = isOptionWidget(draft.component)
  const rules = [ ...draft.rules ]
  if (draft.required && !rules.some(r => r.required)) {
    rules.unshift({
      required: true,
      message: `${draft.title || draft.name}不能为空`,
    })
  }

  // fieldId 仅运行时注入，不入库
  const { fieldId: _fieldId, ...persistProps } = draft.props || {}

  return {
    name: draft.name.trim(),
    title: draft.title,
    component: draft.component,
    jsonType: draft.jsonType,
    required: draft.required,
    props: persistProps,
    optionsMode: optionWidget ? draft.optionsMode : null,
    options:
      optionWidget && draft.optionsMode === 'static'
        ? draft.options.filter((o) => String(o.label).trim() || String(o.value).trim())
        : null,
    datasetId: optionWidget && draft.optionsMode === 'dataset' ? draft.datasetId : null,
    valueKey: optionWidget && draft.optionsMode === 'dataset' ? draft.valueKey : null,
    labelKey: optionWidget && draft.optionsMode === 'dataset' ? draft.labelKey : null,
    rules: rules.length ? rules : null,
  }
}

export function recordToFieldSchema(row: FieldRecord, resolvedOptions?: SelectOption[]): FieldSchema {
  const props: ComponentProps = { ...(row.props || {}) }
  if (isOptionWidget(row.component)) {
    if (resolvedOptions) props.options = resolvedOptions
    else if (row.optionsMode === 'static' && row.options) props.options = row.options
  }
  // 远程搜索需要字段 id 调 options 接口
  if (row.component === 'Select' && props.remote) {
    props.fieldId = row.id
    if (!props.searchKey) props.searchKey = 'keyword'
  }

  return {
    type: row.jsonType,
    title: row.title,
    component: row.component,
    componentProps: props,
    rules: row.rules || undefined,
    'hidden-value': row.component === 'Divider' || row.jsonType === 'void' ? true : undefined,
    default: row.jsonType === 'array' ? [] : row.jsonType === 'boolean' ? false : undefined,
  }
}

export async function buildPreviewSchema(rows: FieldRecord[]): Promise<FormSchema> {
  const fields = []
  for (const row of rows) {
    let options: SelectOption[] | undefined
    const isRemoteSelect = row.component === 'Select' && !!row.props?.remote
    // 远程搜索下拉：初始不预拉全量，由控件 remote-method 请求
    if (isOptionWidget(row.component) && row.optionsMode === 'dataset' && !isRemoteSelect) {
      options = await getFieldOptions(row.id)
    } else if (isOptionWidget(row.component) && row.optionsMode === 'static') {
      options = row.options || []
    }
    fields.push({
      name: row.name,
      ...recordToFieldSchema(row, options),
      required: row.required,
    })
  }
  return {
    type: 'object',
    title: '字段库预览',
    fields,
  }
}
