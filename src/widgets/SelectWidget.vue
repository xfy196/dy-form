<script setup lang="ts">
import type { SelectOption } from '@/schema/types'

defineProps<{
  modelValue?: string | number | boolean | Array<string | number | boolean>
  placeholder?: string
  clearable?: boolean
  multiple?: boolean
  options?: SelectOption[]
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: unknown]
}>()
</script>

<template>
  <el-select
    :model-value="modelValue"
    :placeholder="placeholder"
    :clearable="clearable"
    :multiple="multiple"
    :disabled="disabled"
    style="width: 100%"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-option
      v-for="opt in options || []"
      :key="String(opt.value)"
      :label="opt.label"
      :value="opt.value"
    />
  </el-select>
</template>
