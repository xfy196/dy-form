<script setup lang="ts">
defineProps<{
  modelValue?: boolean
  activeText?: string
  inactiveText?: string
  disabled?: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<template>
  <el-switch
    :model-value="modelValue"
    :active-text="activeText"
    :inactive-text="inactiveText"
    :disabled="disabled"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>
