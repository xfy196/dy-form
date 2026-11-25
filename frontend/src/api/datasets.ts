import { request } from './http'

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

export function previewDataset(id: number) {
  return request<DatasetPreview>(`/api/datasets/${id}/preview`, { method: 'POST' })
}
