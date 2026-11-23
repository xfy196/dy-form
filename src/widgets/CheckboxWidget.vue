<script setup lang="ts">
import type { SelectOption } from '@/schema/types'

defineProps<{
  modelValue?: Array<string | number | boolean>
  options?: SelectOption[]
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: Array<string | number | boolean>]
}>()
</script>

<template>
  <el-checkbox-group
    :model-value="modelValue || []"
    :disabled="disabled"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-checkbox
      v-for="opt in options || []"
      :key="String(opt.value)"
      :value="opt.value"
    >
      {{ opt.label }}
    </el-checkbox>
  </el-checkbox-group>
</template>
