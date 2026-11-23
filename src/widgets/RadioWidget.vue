<script setup lang="ts">
import type { SelectOption } from '@/schema/types'

defineProps<{
  modelValue?: string | number | boolean
  options?: SelectOption[]
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string | number | boolean]
}>()
</script>

<template>
  <el-radio-group
    :model-value="modelValue"
    :disabled="disabled"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-radio
      v-for="opt in options || []"
      :key="String(opt.value)"
      :value="opt.value"
    >
      {{ opt.label }}
    </el-radio>
  </el-radio-group>
</template>
