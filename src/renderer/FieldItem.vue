<script setup lang="ts">
import { computed } from 'vue'
import type { FieldSchema } from '@/schema/types'
import { resolveWidget } from '@/widgets/registry'

const props = defineProps<{
  name: string
  schema: FieldSchema
  modelValue: unknown
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
}>()

const widget = computed(() => resolveWidget(props.schema['x-component']))
const isLayout = computed(
  () => props.schema['x-hidden-value'] || props.schema.type === 'void',
)
const componentProps = computed(() => props.schema['x-component-props'] || {})
</script>

<template>
  <el-divider v-if="isLayout" content-position="left">
    {{ componentProps.content || schema.title || '分割线' }}
  </el-divider>
  <el-form-item
    v-else
    :label="schema.title"
    :prop="name"
  >
    <p v-if="schema.description" class="field-desc">{{ schema.description }}</p>
    <component
      :is="widget"
      :model-value="modelValue"
      v-bind="componentProps"
      :disabled="disabled"
      @update:model-value="emit('update:modelValue', $event)"
    />
  </el-form-item>
</template>

<style scoped>
.field-desc {
  margin: 0 0 6px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}
</style>
