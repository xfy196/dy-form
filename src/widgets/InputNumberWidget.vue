<script setup lang="ts">
defineProps<{
  modelValue?: number
  min?: number
  max?: number
  step?: number
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: number | undefined]
}>()
</script>

<template>
  <el-input-number
    :model-value="modelValue"
    :min="min"
    :max="max"
    :step="step"
    :disabled="disabled"
    controls-position="right"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>
