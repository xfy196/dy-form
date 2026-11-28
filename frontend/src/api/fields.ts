import { request } from './http'
import type { FormItemRule } from 'element-plus'
import type { ComponentProps, JsonSchemaType, SelectOption, WidgetType } from '@/schema/types'

export type OptionsMode = 'static' | 'dataset'

export interface FieldRecord {
  id: number
  name: string
  title: string
  component: WidgetType
  jsonType: JsonSchemaType
  required: boolean
  sortOrder: number
  props: ComponentProps
  optionsMode: OptionsMode | null
  options: SelectOption[] | null
  datasetId: number | null
  valueKey: string | null
  labelKey: string | null
  labelTemplate: string | null
  rules: FormItemRule[] | null
  createdAt: string
  updatedAt: string
}

export type FieldPayload = {
  name: string
  title?: string
  component: WidgetType
  jsonType?: JsonSchemaType
  required?: boolean
  sortOrder?: number
  props?: ComponentProps
  optionsMode?: OptionsMode | null
  options?: SelectOption[] | null
  datasetId?: number | null
  valueKey?: string | null
  labelKey?: string | null
  labelTemplate?: string | null
  rules?: FormItemRule[] | null
}

export function listFields() {
  return request<FieldRecord[]>('/api/fields')
}

export function getField(id: number) {
  return request<FieldRecord>(`/api/fields/${id}`)
}

export function createField(payload: FieldPayload) {
  return request<FieldRecord>('/api/fields', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateField(id: number, payload: Partial<FieldPayload>) {
  return request<FieldRecord>(`/api/fields/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteField(id: number) {
  return request<null>(`/api/fields/${id}`, { method: 'DELETE' })
}

/** 拉取字段 options 时可透传的查询参数 */
export type FieldOptionsQuery = {
  keyword?: string
  searchKey?: string
  pageKey?: string
  page?: number
  pageSizeKey?: string
  pageSize?: number
}

/**
 * 获取字段解析后的选项（数据集模式会向上游透传搜索/分页）
 * @param id - 字段 id
 * @param query - 可选 keyword / 分页参数（会出现在请求 URL 上）
 */
export function getFieldOptions(id: number, query?: FieldOptionsQuery) {
  const params = new URLSearchParams()
  if (query?.keyword != null && query.keyword !== '') {
    params.set('keyword', query.keyword)
  }
  if (query?.searchKey) {
    params.set('searchKey', query.searchKey)
  }
  if (query?.pageKey) {
    params.set('pageKey', query.pageKey)
    if (query.page != null) params.set('page', String(query.page))
  }
  if (query?.pageSizeKey) {
    params.set('pageSizeKey', query.pageSizeKey)
    if (query.pageSize != null) params.set('pageSize', String(query.pageSize))
  }
  const qs = params.toString()
  return request<SelectOption[]>(`/api/fields/${id}/options${qs ? `?${qs}` : ''}`)
}
