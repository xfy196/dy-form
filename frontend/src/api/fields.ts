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

export function getFieldOptions(
  id: number,
  query?: { keyword?: string; searchKey?: string },
) {
  const params = new URLSearchParams()
  if (query?.keyword != null && query.keyword !== '') {
    params.set('keyword', query.keyword)
  }
  if (query?.searchKey) {
    params.set('searchKey', query.searchKey)
  }
  const qs = params.toString()
  return request<SelectOption[]>(`/api/fields/${id}/options${qs ? `?${qs}` : ''}`)
}
