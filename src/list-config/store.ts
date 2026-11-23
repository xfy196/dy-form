import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import type { FieldNode, FieldSchema, FormSchema, WidgetType } from '@/schema/types'
import { createDefaultFieldSchema } from '@/schema/defaults'
import { fromSchema, toSchema } from '@/schema/convert'
import { validateFormSchema } from '@/schema/validate'

let seq = 1

function nextId() {
  return `list_${Date.now()}_${seq++}`
}

function nextFieldName(fields: FieldNode[], widget: WidgetType) {
  const base = widget.toLowerCase()
  let i = 1
  const names = new Set(fields.map((f) => f.name))
  while (names.has(`${base}_${i}`)) i += 1
  return `${base}_${i}`
}

export const useListConfigStore = defineStore('list-config', () => {
  const fields = ref<FieldNode[]>([])
  const formTitle = ref('列表配置表单')

  const schema = computed(() => toSchema(fields.value, formTitle.value))

  function createDraft(widget: WidgetType): FieldNode {
    return {
      id: nextId(),
      name: nextFieldName(fields.value, widget),
      schema: createDefaultFieldSchema(widget),
    }
  }

  function addField(name: string, fieldSchema: FieldSchema): boolean {
    const trimmed = name.trim()
    if (!trimmed) {
      ElMessage.warning('字段名不能为空')
      return false
    }
    if (!/^[a-zA-Z_][\w]*$/.test(trimmed)) {
      ElMessage.warning('字段名需以字母或下划线开头，仅含字母数字下划线')
      return false
    }
    if (fields.value.some((f) => f.name === trimmed)) {
      ElMessage.warning('字段名已存在')
      return false
    }
    fields.value.push({
      id: nextId(),
      name: trimmed,
      schema: JSON.parse(JSON.stringify(fieldSchema)) as FieldSchema,
    })
    return true
  }

  function updateField(id: string, name: string, fieldSchema: FieldSchema): boolean {
    const trimmed = name.trim()
    if (!trimmed) {
      ElMessage.warning('字段名不能为空')
      return false
    }
    if (!/^[a-zA-Z_][\w]*$/.test(trimmed)) {
      ElMessage.warning('字段名需以字母或下划线开头，仅含字母数字下划线')
      return false
    }
    if (fields.value.some((f) => f.id !== id && f.name === trimmed)) {
      ElMessage.warning('字段名已存在')
      return false
    }
    const field = fields.value.find((f) => f.id === id)
    if (!field) return false
    field.name = trimmed
    field.schema = JSON.parse(JSON.stringify(fieldSchema)) as FieldSchema
    return true
  }

  function removeField(id: string) {
    const idx = fields.value.findIndex((f) => f.id === id)
    if (idx >= 0) fields.value.splice(idx, 1)
  }

  function moveField(id: string, direction: -1 | 1) {
    const idx = fields.value.findIndex((f) => f.id === id)
    if (idx < 0) return
    const target = idx + direction
    if (target < 0 || target >= fields.value.length) return
    const list = [...fields.value]
    const [item] = list.splice(idx, 1)
    list.splice(target, 0, item)
    fields.value = list
  }

  function clear() {
    fields.value = []
    formTitle.value = '列表配置表单'
  }

  function importSchema(raw: unknown): boolean {
    const result = validateFormSchema(raw)
    if (!result.valid) {
      ElMessage.error(result.errors[0] || 'Schema 无效')
      return false
    }
    const formSchema = raw as FormSchema
    fields.value = fromSchema(formSchema)
    formTitle.value = formSchema.title || '列表配置表单'
    ElMessage.success('导入成功')
    return true
  }

  function exportSchemaJson(): string {
    return JSON.stringify(schema.value, null, 2)
  }

  return {
    fields,
    formTitle,
    schema,
    createDraft,
    addField,
    updateField,
    removeField,
    moveField,
    clear,
    importSchema,
    exportSchemaJson,
  }
})
