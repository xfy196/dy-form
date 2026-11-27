import { onMounted, ref, watch, type Ref } from 'vue'
import type { ComponentProps, SelectOption } from '@/schema/types'
import { fetchOptionsFromDatasetProps } from '@/schema/resolveDatasetOptions'

type DatasetOptionProps = Pick<
  ComponentProps,
  | 'optionsMode'
  | 'datasetId'
  | 'valueKey'
  | 'labelKey'
  | 'searchKey'
  | 'pageKey'
  | 'page'
  | 'pageSizeKey'
  | 'pageSize'
  | 'remote'
  | 'options'
>

/**
 * 数据集模式下运行时拉取 options（不依赖 schema 内嵌查询结果）
 * @param getProps - 返回当前控件 props
 * @param enabled - 是否启用（如非 remote 的 Select / Radio / Checkbox）
 */
export function useDatasetOptions(
  getProps: () => DatasetOptionProps,
  enabled: Ref<boolean> | (() => boolean),
) {
  const options = ref<SelectOption[]>([])
  const loading = ref(false)

  async function reload(keyword?: string) {
    const props = getProps()
    const isEnabled = typeof enabled === 'function' ? enabled() : enabled.value
    if (!isEnabled || props.optionsMode !== 'dataset') {
      options.value = props.options ? [...props.options] : []
      return
    }
    loading.value = true
    try {
      options.value = await fetchOptionsFromDatasetProps(props, keyword)
    } catch {
      options.value = []
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    void reload()
  })

  watch(
    () => {
      const p = getProps()
      return [
        p.optionsMode,
        p.datasetId,
        p.valueKey,
        p.labelKey,
        p.pageKey,
        p.page,
        p.pageSizeKey,
        p.pageSize,
        p.searchKey,
        // 静态模式下仍跟随 props.options
        p.optionsMode === 'dataset' ? null : p.options,
      ]
    },
    () => {
      void reload()
    },
    { deep: true },
  )

  return { options, loading, reload }
}
