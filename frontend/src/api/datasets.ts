import { request } from './http'
import type { SelectOption } from '@/schema/types'

export interface DatasetItem {
  id: number
  name: string
  title: string
  method: 'GET' | 'POST' | string
  url: string
  headers: Record<string, string> | null
  body: unknown
  dataPath: string
  createdAt: string
  updatedAt: string
}

export interface DatasetPreview {
  total: number
  fields: string[]
  samples: Record<string, unknown>[]
}

export type DatasetPayload = {
  name: string
  title?: string
  method?: string
  url: string
  headers?: Record<string, string> | null
  body?: unknown
  dataPath?: string
}

export function listDatasets() {
  return request<DatasetItem[]>('/api/datasets')
}

export function getDataset(id: number) {
  return request<DatasetItem>(`/api/datasets/${id}`)
}

export function createDataset(payload: DatasetPayload) {
  return request<DatasetItem>('/api/datasets', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateDataset(id: number, payload: Partial<DatasetPayload>) {
  return request<DatasetItem>(`/api/datasets/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteDataset(id: number) {
  return request<null>(`/api/datasets/${id}`, { method: 'DELETE' })
}

/** 数据集预览时可透传的上游查询参数（含分页） */
export type DatasetPreviewQuery = {
  keyword?: string
  searchKey?: string
  pageKey?: string
  page?: number
  pageSizeKey?: string
  pageSize?: number
  limit?: number
}

/**
 * 预览数据集上游数据
 * @param id - 数据集 id
 * @param query - 可选搜索/分页参数，会拼到上游请求
 */
export function previewDataset(id: number, query?: DatasetPreviewQuery) {
  return request<DatasetPreview>(`/api/datasets/${id}/preview`, {
    method: 'POST',
    body: JSON.stringify(query || {}),
  })
}

/** 解析数据集 options 的请求参数 */
export type DatasetOptionsQuery = DatasetPreviewQuery & {
  valueKey: string
  labelKey: string
}

/**
 * 按映射解析数据集为标准 options（设计器无 fieldId 时使用）
 * @param id - 数据集 id
 * @param query - valueKey/labelKey 及分页、搜索
 */
export function resolveDatasetOptions(id: number, query: DatasetOptionsQuery) {
  return request<SelectOption[]>(`/api/datasets/${id}/options`, {
    method: 'POST',
    body: JSON.stringify(query),
  })
}
