import type { FormSchema } from '@/schema/types'
import { request } from './http'

export interface FormListItem {
  id: number
  name: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface FormDetail extends FormListItem {
  schema: FormSchema
}

export function listForms() {
  return request<FormListItem[]>('/api/forms')
}

export function getForm(id: number) {
  return request<FormDetail>(`/api/forms/${id}`)
}

export function createForm(payload: { name: string; title?: string; schema: FormSchema }) {
  return request<FormDetail>('/api/forms', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateForm(
  id: number,
  payload: { title?: string; schema?: FormSchema },
) {
  return request<FormDetail>(`/api/forms/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export function deleteForm(id: number) {
  return request<null>(`/api/forms/${id}`, {
    method: 'DELETE',
  })
}
