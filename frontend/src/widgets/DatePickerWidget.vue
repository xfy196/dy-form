<script setup lang="ts">
defineProps<{
  modelValue?: string
  placeholder?: string
  format?: string
  valueFormat?: string
  clearable?: boolean
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <el-date-picker
    :model-value="modelValue"
    type="date"
    :placeholder="placeholder"
    :format="format"
    :value-format="valueFormat"
    :clearable="clearable"
    :disabled="disabled"
    style="width: 100%"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>
