import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import type { FieldNode, FormSchema, WidgetType } from '@/schema/types'
import { createDefaultFieldSchema } from '@/schema/defaults'
import { fromSchema, toSchema } from '@/schema/convert'
import { validateFormSchema } from '@/schema/validate'

let seq = 1

function nextId() {
  return `node_${Date.now()}_${seq++}`
}

function nextFieldName(fields: FieldNode[], widget: WidgetType) {
  const base = widget.toLowerCase()
  let i = 1
  const names = new Set(fields.map((f) => f.name))
  while (names.has(`${base}_${i}`)) i += 1
  return `${base}_${i}`
}

export const useDesignerStore = defineStore('designer', () => {
  const fields = ref<FieldNode[]>([])
  const selectedId = ref<string | null>(null)
  const formTitle = ref('未命名表单')
  /** Backend form id when loaded/saved */
  const formId = ref<number | null>(null)
  /** Backend unique name */
  const formName = ref('')

  const selectedField = computed(() =>
    fields.value.find((f) => f.id === selectedId.value) ?? null,
  )

  const schema = computed(() => toSchema(fields.value, formTitle.value))

  function select(id: string | null) {
    selectedId.value = id
  }

  function addWidget(widget: WidgetType, index?: number) {
    const node: FieldNode = {
      id: nextId(),
      name: nextFieldName(fields.value, widget),
      schema: createDefaultFieldSchema(widget),
    }
    if (index === undefined || index < 0 || index > fields.value.length) {
      fields.value.push(node)
    } else {
      fields.value.splice(index, 0, node)
    }
    selectedId.value = node.id
    return node
  }

  function removeField(id: string) {
    const idx = fields.value.findIndex((f) => f.id === id)
    if (idx < 0) return
    fields.value.splice(idx, 1)
    if (selectedId.value === id) {
      selectedId.value = fields.value[idx]?.id ?? fields.value[idx - 1]?.id ?? null
    }
  }

  function reorder(newList: FieldNode[]) {
    fields.value = newList
  }

  function updateFieldName(id: string, name: string): boolean {
    const trimmed = name.trim()
    if (!trimmed) {
      ElMessage.warning('字段名不能为空')
      return false
    }
    if (!/^[a-zA-Z_][\w]*$/.test(trimmed)) {
      ElMessage.warning('字段名需以字母或下划线开头，仅含字母数字下划线')
      return false
    }
    const conflict = fields.value.some((f) => f.id !== id && f.name === trimmed)
    if (conflict) {
      ElMessage.warning('字段名已存在')
      return false
    }
    const field = fields.value.find((f) => f.id === id)
    if (field) field.name = trimmed
    return true
  }

  function updateFieldSchema(id: string, patch: Partial<FieldNode['schema']>) {
    const field = fields.value.find((f) => f.id === id)
    if (!field) return
    field.schema = { ...field.schema, ...patch }
  }

  function setRequired(id: string, required: boolean) {
    const field = fields.value.find((f) => f.id === id)
    if (!field || field.schema['hidden-value']) return
    const rules = field.schema['rules'] ? [...field.schema['rules']] : []
    const withoutRequired = rules.filter((r) => !r.required)
    if (required) {
      withoutRequired.unshift({
        required: true,
        message: `${field.schema.title || field.name}不能为空`,
      })
    }
    field.schema['rules'] = withoutRequired.length ? withoutRequired : undefined
  }

  function clear() {
    fields.value = []
    selectedId.value = null
    formTitle.value = '未命名表单'
    formId.value = null
    formName.value = ''
  }

  function importSchema(raw: unknown, meta?: { id?: number; name?: string }): boolean {
    const result = validateFormSchema(raw)
    if (!result.valid) {
      ElMessage.error(result.errors[0] || 'Schema 无效')
      return false
    }
    const formSchema = raw as FormSchema
    fields.value = fromSchema(formSchema)
    formTitle.value = formSchema.title || '未命名表单'
    selectedId.value = fields.value[0]?.id ?? null
    formId.value = meta?.id ?? null
    formName.value = meta?.name ?? ''
    ElMessage.success('导入成功')
    return true
  }

  function exportSchemaJson(): string {
    return JSON.stringify(schema.value, null, 2)
  }

  return {
    fields,
    selectedId,
    selectedField,
    formTitle,
    formId,
    formName,
    schema,
    select,
    addWidget,
    removeField,
    reorder,
    updateFieldName,
    updateFieldSchema,
    setRequired,
    clear,
    importSchema,
    exportSchemaJson,
  }
})
