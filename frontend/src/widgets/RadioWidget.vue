<script setup lang="ts">
import { computed } from 'vue'
import type { SelectOption } from '@/schema/types'
import { useDatasetOptions } from '@/composables/useDatasetOptions'

/**
 * modelValue 联合类型含 boolean 时，缺省会被 Vue 转成 false。
 * 设计器未绑 v-model 时会误显示，因此默认 null。
 */
const props = withDefaults(
  defineProps<{
    modelValue?: string | number | boolean | null
    options?: SelectOption[]
    optionsMode?: 'static' | 'dataset'
    datasetId?: number | null
    valueKey?: string
    labelKey?: string
    labelTemplate?: string
    searchKey?: string
    pageKey?: string
    page?: number
    pageSizeKey?: string
    pageSize?: number
    disabled?: boolean
  }>(),
  {
    modelValue: null,
  },
)

defineEmits<{
  'update:modelValue': [value: string | number | boolean]
}>()

const datasetEnabled = computed(() => props.optionsMode === 'dataset')
const { options: datasetOptions, loading } = useDatasetOptions(
  () => props,
  datasetEnabled,
)

const displayOptions = computed(() =>
  datasetEnabled.value ? datasetOptions.value : props.options || [],
)
</script>

<template>
  <div v-loading="loading" class="radio-wrap">
    <el-radio-group
      :model-value="(modelValue ?? undefined) as string | number | boolean | undefined"
      :disabled="disabled"
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <el-radio
        v-for="opt in displayOptions"
        :key="String(opt.value)"
        :value="opt.value"
      >
        {{ opt.label }}
      </el-radio>
    </el-radio-group>
  </div>
</template>

<style scoped>
.radio-wrap {
  min-height: 24px;
}
</style>
