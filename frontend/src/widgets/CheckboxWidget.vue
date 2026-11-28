<script setup lang="ts">
import { computed } from 'vue'
import type { SelectOption } from '@/schema/types'
import { useDatasetOptions } from '@/composables/useDatasetOptions'

const props = defineProps<{
  modelValue?: Array<string | number | boolean>
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
}>()

defineEmits<{
  'update:modelValue': [value: Array<string | number | boolean>]
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
  <div v-loading="loading" class="checkbox-wrap">
    <el-checkbox-group
      :model-value="modelValue || []"
      :disabled="disabled"
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <el-checkbox
        v-for="opt in displayOptions"
        :key="String(opt.value)"
        :value="opt.value"
      >
        {{ opt.label }}
      </el-checkbox>
    </el-checkbox-group>
  </div>
</template>

<style scoped>
.checkbox-wrap {
  min-height: 24px;
}
</style>
