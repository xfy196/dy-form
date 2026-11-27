import type { ComponentProps, FormSchema, SelectOption } from '@/schema/types'
import { resolveDatasetOptions, type DatasetOptionsQuery } from '@/api/datasets'

/**
 * 从 componentProps 组装数据集 options 查询参数
 * @param props - 控件 props
 */
export function buildDatasetOptionsQuery(
  props: ComponentProps,
): DatasetOptionsQuery | null {
  const datasetId = props.datasetId
  const valueKey = props.valueKey != null ? String(props.valueKey).trim() : ''
  const labelKey = props.labelKey != null ? String(props.labelKey).trim() : ''
  if (!datasetId || !valueKey || !labelKey) return null

  const pageKey = props.pageKey != null ? String(props.pageKey).trim() : ''
  const pageSizeKey = props.pageSizeKey != null ? String(props.pageSizeKey).trim() : ''

  const query: DatasetOptionsQuery = {
    valueKey,
    labelKey,
    searchKey: (props.searchKey as string) || 'keyword',
  }
  if (pageKey) {
    query.pageKey = pageKey
    query.page = props.page != null ? Number(props.page) : 1
  }
  if (pageSizeKey) {
    query.pageSizeKey = pageSizeKey
    query.pageSize = props.pageSize != null ? Number(props.pageSize) : 50
  }
  return query
}

/**
 * 拉取单个字段的数据集 options
 * @param props - 控件 props
 */
export async function fetchOptionsFromDatasetProps(
  props: ComponentProps,
  keyword?: string,
): Promise<SelectOption[]> {
  if (props.optionsMode !== 'dataset') return props.options || []
  const query = buildDatasetOptionsQuery(props)
  if (!query || !props.datasetId) return []
  return resolveDatasetOptions(props.datasetId, {
    ...query,
    ...(keyword != null && keyword !== '' ? { keyword } : {}),
  })
}

/**
 * 为表单 schema 中关联数据集的字段刷新 options（预览前调用）
 * @param schema - 表单 schema
 */
export async function hydrateSchemaDatasetOptions(
  schema: FormSchema,
): Promise<FormSchema> {
  const fields = await Promise.all(
    (schema.fields || []).map(async (field) => {
      const props = field.componentProps || {}
      if (props.optionsMode !== 'dataset' || !props.datasetId) return field
      // 远程搜索由控件运行时拉取，这里不预拉全量
      if (props.remote && field.component === 'Select') return field
      try {
        const options = await fetchOptionsFromDatasetProps(props)
        return {
          ...field,
          componentProps: { ...props, options },
          ...(field.component !== 'Checkbox'
            ? { enum: options.map((o) => o.value as string | number | boolean) }
            : {}),
        }
      } catch {
        return field
      }
    }),
  )
  return { ...schema, fields }
}
