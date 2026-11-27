import type {
  FieldNode,
  FieldSchema,
  FormFieldItem,
  FormSchema,
  LegacyFormSchema,
} from './types'
import { getDefaultModelValue } from './defaults'

/** Deep clone plain JSON-compatible values (works with Vue reactive proxies). */
function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function cloneSchema(schema: FieldSchema): FieldSchema {
  return deepClone(schema)
}

function isRequiredField(schema: FieldSchema): boolean {
  return !!schema.rules?.some((r) => r.required)
}

/**
 * 关联数据集时 schema 只保留配置，不落地查询结果 options/enum
 * @param schema - 字段 schema
 */
function sanitizeDatasetBinding(schema: FieldSchema): FieldSchema {
  const props = schema.componentProps
  if (!props || props.optionsMode !== 'dataset') return schema

  const {
    options: _omitOptions,
    fieldId: _omitFieldId,
    ...restProps
  } = props

  return {
    ...schema,
    enum: undefined,
    componentProps: {
      ...restProps,
      optionsMode: 'dataset',
      // 静态 options 不写入；运行时按 datasetId 解析
      options: undefined,
    },
  }
}

function toFieldItem(name: string, schema: FieldSchema): FormFieldItem {
  const cloned = sanitizeDatasetBinding(cloneSchema(schema))
  const required = isRequiredField(cloned)
  return {
    name,
    ...cloned,
    ...(required ? { required: true } : {}),
  }
}

function fromFieldItem(item: FormFieldItem): { name: string; schema: FieldSchema } {
  const { name, required, ...rest } = item
  const schema = cloneSchema(rest as FieldSchema)

  if (required && !schema['hidden-value']) {
    const rules = schema.rules ? [...schema.rules] : []
    if (!rules.some((r) => r.required)) {
      rules.unshift({ required: true, message: `${schema.title || name}不能为空` })
    }
    schema.rules = rules
  }

  return { name, schema }
}

/** Designer FieldNode[] -> FormSchema (array fields) */
export function toSchema(fields: FieldNode[], title = '表单'): FormSchema {
  return {
    type: 'object',
    title,
    fields: fields.map((field) => toFieldItem(field.name, field.schema)),
  }
}

function isLegacySchema(schema: FormSchema | LegacyFormSchema): schema is LegacyFormSchema {
  return 'properties' in schema && !!schema.properties && !('fields' in schema && Array.isArray((schema as FormSchema).fields))
}

/** Normalize any accepted input into array FormSchema */
export function normalizeSchema(input: FormSchema | LegacyFormSchema): FormSchema {
  if (!isLegacySchema(input)) {
    return {
      type: 'object',
      title: input.title,
      description: input.description,
      fields: deepClone(input.fields || []),
    }
  }

  const order =
    input.order?.filter((key) => key in input.properties) ??
    Object.keys(input.properties)
  const requiredSet = new Set(input.required ?? [])

  return {
    type: 'object',
    title: input.title,
    description: input.description,
    fields: order.map((name) => {
      const fieldSchema = cloneSchema(input.properties[name])
      if (requiredSet.has(name) && !isRequiredField(fieldSchema)) {
        const rules = fieldSchema.rules ? [...fieldSchema.rules] : []
        rules.unshift({ required: true, message: `${fieldSchema.title || name}不能为空` })
        fieldSchema.rules = rules
      }
      return toFieldItem(name, fieldSchema)
    }),
  }
}

/** FormSchema -> Designer FieldNode[] */
export function fromSchema(schema: FormSchema | LegacyFormSchema): FieldNode[] {
  const normalized = normalizeSchema(schema)

  return normalized.fields.map((item, index) => {
    const { name, schema: fieldSchema } = fromFieldItem(item)
    return {
      id: `field_${name}_${index}_${Date.now()}`,
      name,
      schema: fieldSchema,
    }
  })
}

/** Build initial form model from schema */
export function createModel(schema: FormSchema | LegacyFormSchema): Record<string, unknown> {
  const normalized = normalizeSchema(schema)
  const model: Record<string, unknown> = {}

  for (const item of normalized.fields) {
    const { name, schema: field } = fromFieldItem(item)
    if (field['hidden-value'] || field.type === 'void') continue
    model[name] = getDefaultModelValue(field)
  }

  return model
}

/** Build Element Plus form rules from schema */
export function createRules(
  schema: FormSchema | LegacyFormSchema,
): Record<string, FieldSchema['rules']> {
  const normalized = normalizeSchema(schema)
  const rules: Record<string, FieldSchema['rules']> = {}

  for (const item of normalized.fields) {
    const { name, schema: field } = fromFieldItem(item)
    if (field['hidden-value'] || field.type === 'void') continue

    const fieldRules = field.rules ? [...field.rules] : []
    if (item.required && !fieldRules.some((r) => r.required)) {
      fieldRules.unshift({
        required: true,
        message: `${field.title || name}不能为空`,
      })
    }
    if (fieldRules.length) {
      rules[name] = fieldRules
    }
  }

  return rules
}

export function orderedFieldEntries(
  schema: FormSchema | LegacyFormSchema,
): Array<[string, FieldSchema]> {
  const normalized = normalizeSchema(schema)
  return normalized.fields.map((item) => {
    const { name, schema: field } = fromFieldItem(item)
    return [name, field]
  })
}
