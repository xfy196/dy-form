<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { FormInstance } from 'element-plus'
import type { FormSchema } from '@/schema/types'
import { createModel, createRules, orderedFieldEntries } from '@/schema/convert'
import FieldItem from './FieldItem.vue'

const props = withDefaults(
  defineProps<{
    schema: FormSchema
    labelWidth?: string
    disabled?: boolean
  }>(),
  {
    labelWidth: '100px',
    disabled: false,
  },
)

const emit = defineEmits<{
  submit: [model: Record<string, unknown>]
}>()

const formRef = ref<FormInstance>()
const model = reactive<Record<string, unknown>>({})

const fields = computed(() => orderedFieldEntries(props.schema))
const rules = computed(() => createRules(props.schema))

function syncModel(schema: FormSchema) {
  const next = createModel(schema)
  for (const key of Object.keys(model)) {
    if (!(key in next)) delete model[key]
  }
  Object.assign(model, next)
}

watch(
  () => props.schema,
  (schema) => syncModel(schema),
  { immediate: true, deep: true },
)

async function validate(): Promise<boolean> {
  if (!formRef.value) return false
  try {
    await formRef.value.validate()
    return true
  } catch {
    return false
  }
}

function getModel(): Record<string, unknown> {
  return JSON.parse(JSON.stringify(model)) as Record<string, unknown>
}

function reset() {
  syncModel(props.schema)
  formRef.value?.clearValidate()
}

async function handleSubmit() {
  const ok = await validate()
  if (ok) emit('submit', getModel())
}

defineExpose({
  validate,
  getModel,
  reset,
  model,
})
</script>

<template>
  <el-form
    ref="formRef"
    :model="model"
    :rules="rules"
    :label-width="labelWidth"
    :disabled="disabled"
    @submit.prevent="handleSubmit"
  >
    <template v-if="schema.title">
      <h3 class="schema-form__title">{{ schema.title }}</h3>
    </template>

    <FieldItem
      v-for="[name, field] in fields"
      :key="name"
      :name="name"
      :schema="field"
      :model-value="model[name]"
      :disabled="disabled"
      @update:model-value="model[name] = $event"
    />

    <slot name="actions" :validate="validate" :get-model="getModel" :reset="reset" :model="model">
      <el-form-item>
        <el-button type="primary" @click="handleSubmit">提交</el-button>
        <el-button @click="reset">重置</el-button>
      </el-form-item>
    </slot>
  </el-form>
</template>

<style scoped>
.schema-form__title {
  margin: 0 0 20px;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}
</style>
