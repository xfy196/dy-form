import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import type { FormSchema } from '@/schema/types'
import {
  createField,
  deleteField,
  listFields,
  updateField,
  type FieldRecord,
} from '@/api/fields'
import {
  buildPreviewSchema,
  createDraftFromWidget,
  draftFromRecord,
  draftToPayload,
  type FieldDraft,
} from './fieldDraft'

export const useListConfigStore = defineStore('list-config', () => {
  const fields = ref<FieldRecord[]>([])
  const loading = ref(false)
  const previewSchema = ref<FormSchema | null>(null)

  const sortedFields = computed(() =>
    [ ...fields.value ].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
  )

  async function loadFields() {
    loading.value = true
    try {
      fields.value = await listFields()
    } catch (err) {
      ElMessage.error(err instanceof Error ? err.message : '加载字段失败')
      fields.value = []
    } finally {
      loading.value = false
    }
  }

  function createEmptyDraft() {
    return createDraftFromWidget('Input')
  }

  function toDraft(row: FieldRecord): FieldDraft {
    return draftFromRecord(row)
  }

  async function saveDraft(draft: FieldDraft, editingId: number | null) {
    const payload = draftToPayload(draft)
    if (editingId) {
      const row = await updateField(editingId, payload)
      const idx = fields.value.findIndex(f => f.id === editingId)
      if (idx >= 0) fields.value[idx] = row
      else fields.value.push(row)
      return row
    }
    const row = await createField(payload)
    fields.value.push(row)
    return row
  }

  async function removeField(id: number) {
    await deleteField(id)
    fields.value = fields.value.filter(f => f.id !== id)
  }

  async function moveField(id: number, direction: -1 | 1) {
    const list = [ ...sortedFields.value ]
    const idx = list.findIndex(f => f.id === id)
    if (idx < 0) return
    const target = idx + direction
    if (target < 0 || target >= list.length) return
    const a = list[idx]
    const b = list[target]
    const aOrder = a.sortOrder
    const bOrder = b.sortOrder
    // swap sort orders; if equal, use index-based orders
    const nextA = bOrder === aOrder ? target : bOrder
    const nextB = bOrder === aOrder ? idx : aOrder
    await Promise.all([
      updateField(a.id, { sortOrder: nextA }),
      updateField(b.id, { sortOrder: nextB }),
    ])
    await loadFields()
  }

  async function preparePreview() {
    previewSchema.value = await buildPreviewSchema(sortedFields.value)
    return previewSchema.value
  }

  return {
    fields,
    sortedFields,
    loading,
    previewSchema,
    loadFields,
    createEmptyDraft,
    toDraft,
    saveDraft,
    removeField,
    moveField,
    preparePreview,
  }
})
