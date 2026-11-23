<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { FieldSchema, SelectOption, WidgetType } from '@/schema/types'
import { WIDGET_METAS, createDefaultFieldSchema } from '@/schema/defaults'

const props = withDefaults(
  defineProps<{
    name: string
    schema: FieldSchema
    /** 新建时可切换控件类型 */
    typeSelectable?: boolean
  }>(),
  { typeSelectable: false },
)

const emit = defineEmits<{
  'update:name': [value: string]
  'update:schema': [value: FieldSchema]
}>()

const optionText = ref('')

watch(
  () => props.schema['x-component-props']?.options,
  (options) => {
    optionText.value = options
      ? options.map((o) => `${o.label}|${o.value}`).join('\n')
      : ''
  },
  { immediate: true, deep: true },
)

const widget = computed(() => props.schema['x-component'])

const isLayout = computed(
  () => props.schema['x-hidden-value'] || props.schema.type === 'void',
)

const isRequired = computed(() => !!props.schema['x-rules']?.some((r) => r.required))

const hasOptions = computed(() =>
  ['Select', 'Radio', 'Checkbox'].includes(widget.value),
)

function patchSchema(patch: Partial<FieldSchema>) {
  emit('update:schema', { ...props.schema, ...patch })
}

function updateProp(key: string, value: unknown) {
  const nextProps = { ...(props.schema['x-component-props'] || {}), [key]: value }
  patchSchema({ 'x-component-props': nextProps })
}

function setRequired(required: boolean) {
  if (isLayout.value) return
  const rules = props.schema['x-rules'] ? [...props.schema['x-rules']] : []
  const withoutRequired = rules.filter((r) => !r.required)
  if (required) {
    withoutRequired.unshift({
      required: true,
      message: `${props.schema.title || props.name || '该字段'}不能为空`,
    })
  }
  patchSchema({ 'x-rules': withoutRequired.length ? withoutRequired : undefined })
}

function onTypeChange(type: WidgetType) {
  const next = createDefaultFieldSchema(type)
  emit('update:schema', next)
  emit('update:name', `${type.toLowerCase()}_${Date.now().toString().slice(-4)}`)
}

function applyOptions() {
  const options: SelectOption[] = optionText.value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, value] = line.split('|').map((s) => s.trim())
      return { label: label || value, value: value ?? label }
    })

  updateProp('options', options)
  if (widget.value !== 'Checkbox') {
    patchSchema({ enum: options.map((o) => o.value as string | number | boolean) })
  }
}
</script>

<template>
  <el-form label-position="top" size="default">
    <el-form-item label="表单类型" required>
      <el-select
        v-if="typeSelectable"
        :model-value="widget"
        style="width: 100%"
        @update:model-value="onTypeChange"
      >
        <el-option-group
          v-for="group in [
            { label: '输入型', key: 'input' },
            { label: '选择型', key: 'select' },
            { label: '布局', key: 'layout' },
          ]"
          :key="group.key"
          :label="group.label"
        >
          <el-option
            v-for="item in WIDGET_METAS.filter((m) => m.group === group.key)"
            :key="item.type"
            :label="item.label"
            :value="item.type"
          />
        </el-option-group>
      </el-select>
      <el-tag v-else>{{ WIDGET_METAS.find((m) => m.type === widget)?.label || widget }}</el-tag>
    </el-form-item>

    <el-form-item label="字段名 (name)" required>
      <el-input
        :model-value="name"
        placeholder="如 name、userAge"
        @update:model-value="emit('update:name', $event)"
      />
    </el-form-item>

    <el-form-item label="标题">
      <el-input
        :model-value="schema.title"
        @update:model-value="patchSchema({ title: $event })"
      />
    </el-form-item>

    <el-form-item v-if="!isLayout" label="必填">
      <el-switch :model-value="isRequired" @update:model-value="setRequired" />
    </el-form-item>

    <template v-if="!isLayout">
      <el-form-item
        v-if="['Input', 'Textarea', 'Select', 'DatePicker', 'TimePicker'].includes(widget)"
        label="占位提示"
      >
        <el-input
          :model-value="(schema['x-component-props']?.placeholder as string) || ''"
          @update:model-value="updateProp('placeholder', $event)"
        />
      </el-form-item>

      <el-form-item
        v-if="['Input', 'Textarea'].includes(widget)"
        label="最大长度"
      >
        <el-input-number
          :model-value="(schema['x-component-props']?.maxlength as number) || undefined"
          :min="1"
          controls-position="right"
          @update:model-value="updateProp('maxlength', $event)"
        />
      </el-form-item>

      <template v-if="widget === 'InputNumber'">
        <el-form-item label="最小值">
          <el-input-number
            :model-value="schema['x-component-props']?.min as number"
            controls-position="right"
            @update:model-value="updateProp('min', $event)"
          />
        </el-form-item>
        <el-form-item label="最大值">
          <el-input-number
            :model-value="schema['x-component-props']?.max as number"
            controls-position="right"
            @update:model-value="updateProp('max', $event)"
          />
        </el-form-item>
      </template>

      <el-form-item v-if="widget === 'Select'" label="多选">
        <el-switch
          :model-value="!!schema['x-component-props']?.multiple"
          @update:model-value="(val: boolean) => {
            updateProp('multiple', val)
            patchSchema({
              type: val ? 'array' : 'string',
              default: val ? [] : undefined,
            })
          }"
        />
      </el-form-item>

      <template v-if="widget === 'Switch'">
        <el-form-item label="打开文案">
          <el-input
            :model-value="(schema['x-component-props']?.activeText as string) || ''"
            @update:model-value="updateProp('activeText', $event)"
          />
        </el-form-item>
        <el-form-item label="关闭文案">
          <el-input
            :model-value="(schema['x-component-props']?.inactiveText as string) || ''"
            @update:model-value="updateProp('inactiveText', $event)"
          />
        </el-form-item>
      </template>
    </template>

    <el-form-item v-if="isLayout" label="分割线文案">
      <el-input
        :model-value="(schema['x-component-props']?.content as string) || ''"
        @update:model-value="updateProp('content', $event)"
      />
    </el-form-item>

    <template v-if="hasOptions">
      <el-form-item label="选项 (每行: 标签|值)">
        <el-input
          v-model="optionText"
          type="textarea"
          :rows="5"
          placeholder="选项一|option1"
        />
      </el-form-item>
      <el-button type="primary" plain size="small" @click="applyOptions">
        应用选项
      </el-button>
    </template>
  </el-form>
</template>
