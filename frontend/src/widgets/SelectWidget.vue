<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { SelectOption } from '@/schema/types'
import { getFieldOptions } from '@/api/fields'
import { fetchOptionsFromDatasetProps } from '@/schema/resolveDatasetOptions'
import { useDatasetOptions } from '@/composables/useDatasetOptions'

/**
 * 注意：modelValue 联合类型含 boolean 时，Vue 会对缺省 prop 做 Boolean 转换变成 false，
 * 设计器预览未绑 v-model 时就会显示文字 "false"。必须给非选中态显式默认 null。
 */
const props = withDefaults(
  defineProps<{
    modelValue?: string | number | boolean | Array<string | number | boolean> | null
    placeholder?: string
    clearable?: boolean
    multiple?: boolean
    filterable?: boolean
    remote?: boolean
    searchKey?: string
    pageKey?: string
    page?: number
    pageSizeKey?: string
    pageSize?: number
    fieldId?: number
    optionsMode?: 'static' | 'dataset'
    datasetId?: number | null
    valueKey?: string
    labelKey?: string
    labelTemplate?: string
    options?: SelectOption[]
    disabled?: boolean
  }>(),
  {
    modelValue: null,
  },
)

defineEmits<{
  'update:modelValue': [value: unknown]
}>()

const loading = ref(false)
const remoteOptions = ref<SelectOption[]>([])

/** 非远程的数据集选项：挂载时按配置拉取，不写入 schema */
const localDatasetEnabled = computed(
  () => props.optionsMode === 'dataset' && !props.remote && !props.fieldId,
)

const { options: datasetOptions, loading: datasetLoading } = useDatasetOptions(
  () => props,
  localDatasetEnabled,
)

const displayOptions = computed(() => {
  if (props.remote) return remoteOptions.value
  if (localDatasetEnabled.value) return datasetOptions.value
  return props.options || []
})

watch(
  () => props.options,
  (opts) => {
    if (!props.remote && props.optionsMode !== 'dataset') {
      remoteOptions.value = opts ? [...opts] : []
    }
  },
  { immediate: true, deep: true },
)

function canFetchByDataset() {
  return (
    props.optionsMode === 'dataset' &&
    !!props.datasetId &&
    !!props.valueKey &&
    !!(props.labelTemplate || props.labelKey)
  )
}

async function onRemoteMethod(query: string) {
  if (!props.remote) return

  if (props.fieldId) {
    loading.value = true
    try {
      remoteOptions.value = await getFieldOptions(props.fieldId, {
        keyword: query,
        searchKey: props.searchKey || 'keyword',
        ...(props.pageKey
          ? { pageKey: props.pageKey, page: props.page ?? 1 }
          : {}),
        ...(props.pageSizeKey
          ? { pageSizeKey: props.pageSizeKey, pageSize: props.pageSize ?? 50 }
          : {}),
      })
    } catch {
      remoteOptions.value = []
    } finally {
      loading.value = false
    }
    return
  }

  if (canFetchByDataset()) {
    loading.value = true
    try {
      remoteOptions.value = await fetchOptionsFromDatasetProps(props, query)
    } catch {
      remoteOptions.value = []
    } finally {
      loading.value = false
    }
    return
  }

  const source = props.options || []
  const q = query.trim().toLowerCase()
  remoteOptions.value = !q
    ? [...source]
    : source.filter(
        (o) =>
          String(o.label).toLowerCase().includes(q) ||
          String(o.value).toLowerCase().includes(q),
      )
}

async function onVisibleChange(visible: boolean) {
  if (visible && props.remote && !remoteOptions.value.length) {
    await onRemoteMethod('')
  }
}
</script>

<template>
  <el-select
    :model-value="modelValue"
    :placeholder="placeholder"
    :clearable="clearable"
    :multiple="multiple"
    :disabled="disabled"
    :filterable="!!(filterable || remote)"
    :remote="!!remote"
    :remote-method="remote ? onRemoteMethod : undefined"
    :loading="loading || datasetLoading"
    style="width: 100%"
    @visible-change="onVisibleChange"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-option
      v-for="opt in displayOptions"
      :key="String(opt.value)"
      :label="String(opt.label)"
      :value="opt.value"
    />
  </el-select>
</template>
