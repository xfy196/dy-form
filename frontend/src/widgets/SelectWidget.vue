<script setup lang="ts">
import { ref, watch } from 'vue'
import type { SelectOption } from '@/schema/types'
import { getFieldOptions } from '@/api/fields'

const props = defineProps<{
  modelValue?: string | number | boolean | Array<string | number | boolean>
  placeholder?: string
  clearable?: boolean
  multiple?: boolean
  filterable?: boolean
  remote?: boolean
  searchKey?: string
  fieldId?: number
  options?: SelectOption[]
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: unknown]
}>()

const loading = ref(false)
const remoteOptions = ref<SelectOption[]>([])

watch(
  () => props.options,
  (opts) => {
    if (!props.remote) {
      remoteOptions.value = opts ? [...opts] : []
    }
  },
  { immediate: true, deep: true },
)

async function onRemoteMethod(query: string) {
  if (!props.remote) return

  // 静态选项：本地过滤
  if (!props.fieldId) {
    const source = props.options || []
    const q = query.trim().toLowerCase()
    remoteOptions.value = !q
      ? [...source]
      : source.filter(
          (o) =>
            String(o.label).toLowerCase().includes(q) ||
            String(o.value).toLowerCase().includes(q),
        )
    return
  }

  loading.value = true
  try {
    remoteOptions.value = await getFieldOptions(props.fieldId, {
      keyword: query,
      searchKey: props.searchKey || 'keyword',
    })
  } catch {
    remoteOptions.value = []
  } finally {
    loading.value = false
  }
}

async function onVisibleChange(visible: boolean) {
  if (visible && props.remote && props.fieldId && !remoteOptions.value.length) {
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
    :loading="loading"
    style="width: 100%"
    @visible-change="onVisibleChange"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-option
      v-for="opt in remote ? remoteOptions : options || []"
      :key="String(opt.value)"
      :label="String(opt.label)"
      :value="opt.value"
    />
  </el-select>
</template>
