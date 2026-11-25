<script setup lang="ts">
defineProps<{
  modelValue?: string
  placeholder?: string
  maxlength?: number
  clearable?: boolean
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <el-input
    :model-value="modelValue"
    :placeholder="placeholder"
    :maxlength="maxlength"
    :clearable="clearable"
    :disabled="disabled"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>
