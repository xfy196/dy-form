<script setup lang="ts">
defineProps<{
  modelValue?: string
  placeholder?: string
  maxlength?: number
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <el-input
    type="textarea"
    :model-value="modelValue"
    :placeholder="placeholder"
    :maxlength="maxlength"
    :disabled="disabled"
    :rows="3"
    show-word-limit
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>
