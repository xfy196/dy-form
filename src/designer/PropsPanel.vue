<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { SelectOption } from '@/schema/types'
import { useDesignerStore } from './store'

const store = useDesignerStore()

const field = computed(() => store.selectedField)
const nameInput = ref('')
const optionText = ref('')

watch(
  field,
  (f) => {
    nameInput.value = f?.name ?? ''
    const options = f?.schema['x-component-props']?.options
    optionText.value = options
      ? options.map((o) => `${o.label}|${o.value}`).join('\n')
      : ''
  },
  { immediate: true },
)

const isLayout = computed(
  () => field.value?.schema['x-hidden-value'] || field.value?.schema.type === 'void',
)

const isRequired = computed(() =>
  !!field.value?.schema['x-rules']?.some((r) => r.required),
)

const hasOptions = computed(() =>
  ['Select', 'Radio', 'Checkbox'].includes(field.value?.schema['x-component'] || ''),
)

function commitName() {
  if (!field.value) return
  if (nameInput.value === field.value.name) return
  const ok = store.updateFieldName(field.value.id, nameInput.value)
  if (!ok) nameInput.value = field.value.name
}

function updateTitle(title: string) {
  if (!field.value) return
  store.updateFieldSchema(field.value.id, { title })
}

function updateProp(key: string, value: unknown) {
  if (!field.value) return
  const props = { ...(field.value.schema['x-component-props'] || {}), [key]: value }
  store.updateFieldSchema(field.value.id, { 'x-component-props': props })
}

function toggleRequired(val: boolean) {
  if (!field.value) return
  store.setRequired(field.value.id, val)
}

function applyOptions() {
  if (!field.value) return
  const options: SelectOption[] = optionText.value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, value] = line.split('|').map((s) => s.trim())
      return { label: label || value, value: value ?? label }
    })

  updateProp('options', options)
  if (field.value.schema['x-component'] !== 'Checkbox') {
    store.updateFieldSchema(field.value.id, {
      enum: options.map((o) => o.value as string | number | boolean),
    })
  }
}
</script>

<template>
  <div class="props-panel">
    <h3 class="props-panel__title">属性配置</h3>

    <el-empty v-if="!field" description="请选择画布中的字段" :image-size="64" />

    <el-form v-else label-position="top" size="small">
      <el-form-item label="控件类型">
        <el-tag>{{ field.schema['x-component'] }}</el-tag>
      </el-form-item>

      <el-form-item label="字段名 (name)">
        <el-input v-model="nameInput" @blur="commitName" @keyup.enter="commitName" />
      </el-form-item>

      <el-form-item label="标题">
        <el-input
          :model-value="field.schema.title"
          @update:model-value="updateTitle"
        />
      </el-form-item>

      <el-form-item v-if="!isLayout" label="必填">
        <el-switch :model-value="isRequired" @update:model-value="toggleRequired" />
      </el-form-item>

      <template v-if="!isLayout">
        <el-form-item
          v-if="['Input', 'Textarea', 'Select', 'DatePicker', 'TimePicker'].includes(field.schema['x-component'])"
          label="占位提示"
        >
          <el-input
            :model-value="(field.schema['x-component-props']?.placeholder as string) || ''"
            @update:model-value="updateProp('placeholder', $event)"
          />
        </el-form-item>

        <el-form-item
          v-if="['Input', 'Textarea'].includes(field.schema['x-component'])"
          label="最大长度"
        >
          <el-input-number
            :model-value="(field.schema['x-component-props']?.maxlength as number) || undefined"
            :min="1"
            controls-position="right"
            @update:model-value="updateProp('maxlength', $event)"
          />
        </el-form-item>

        <template v-if="field.schema['x-component'] === 'InputNumber'">
          <el-form-item label="最小值">
            <el-input-number
              :model-value="field.schema['x-component-props']?.min as number"
              controls-position="right"
              @update:model-value="updateProp('min', $event)"
            />
          </el-form-item>
          <el-form-item label="最大值">
            <el-input-number
              :model-value="field.schema['x-component-props']?.max as number"
              controls-position="right"
              @update:model-value="updateProp('max', $event)"
            />
          </el-form-item>
        </template>

        <el-form-item
          v-if="field.schema['x-component'] === 'Select'"
          label="多选"
        >
          <el-switch
            :model-value="!!field.schema['x-component-props']?.multiple"
            @update:model-value="(val: boolean) => {
              updateProp('multiple', val)
              store.updateFieldSchema(field.id, {
                type: val ? 'array' : 'string',
                default: val ? [] : undefined,
              })
            }"
          />
        </el-form-item>

        <template v-if="field.schema['x-component'] === 'Switch'">
          <el-form-item label="打开文案">
            <el-input
              :model-value="(field.schema['x-component-props']?.activeText as string) || ''"
              @update:model-value="updateProp('activeText', $event)"
            />
          </el-form-item>
          <el-form-item label="关闭文案">
            <el-input
              :model-value="(field.schema['x-component-props']?.inactiveText as string) || ''"
              @update:model-value="updateProp('inactiveText', $event)"
            />
          </el-form-item>
        </template>
      </template>

      <el-form-item v-if="isLayout" label="分割线文案">
        <el-input
          :model-value="(field.schema['x-component-props']?.content as string) || ''"
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
  </div>
</template>

<style scoped>
.props-panel {
  height: 100%;
  padding: 12px;
  overflow: auto;
  background: #fafafa;
  border-left: 1px solid #e4e7ed;
}

.props-panel__title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}
</style>
