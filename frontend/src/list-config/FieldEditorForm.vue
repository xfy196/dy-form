<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { SelectOption, WidgetType } from '@/schema/types'
import { WIDGET_METAS } from '@/schema/defaults'
import { listDatasets, previewDataset, type DatasetItem } from '@/api/datasets'
import type { OptionsMode } from '@/api/fields'
import {
  createDraftFromWidget,
  isOptionWidget,
  type FieldDraft,
} from './fieldDraft'

const props = withDefaults(
  defineProps<{
    draft: FieldDraft
    typeSelectable?: boolean
  }>(),
  { typeSelectable: false },
)

const emit = defineEmits<{
  'update:draft': [value: FieldDraft]
}>()

const optionText = ref('')
const datasets = ref<DatasetItem[]>([])
const datasetFields = ref<string[]>([])
const loadingDatasets = ref(false)
const loadingPreview = ref(false)

watch(
  () => props.draft.options,
  (options) => {
    optionText.value = options?.length
      ? options.map((o) => `${o.label}|${o.value}`).join('\n')
      : ''
  },
  { immediate: true, deep: true },
)

onMounted(async () => {
  loadingDatasets.value = true
  try {
    datasets.value = await listDatasets()
  } catch {
    datasets.value = []
  } finally {
    loadingDatasets.value = false
  }
  if (props.draft.datasetId) {
    void loadDatasetFields(props.draft.datasetId)
  }
})

const hasOptions = computed(() => isOptionWidget(props.draft.component))
const isLayout = computed(
  () => props.draft.component === 'Divider' || props.draft.jsonType === 'void',
)

function patch( partial: Partial<FieldDraft>) {
  emit('update:draft', { ...props.draft, ...partial })
}

function updateProp(key: string, value: unknown) {
  patch({ props: { ...props.draft.props, [key]: value } })
}

function onTypeChange(type: WidgetType) {
  const next = createDraftFromWidget(type)
  next.name = props.draft.name || next.name
  emit('update:draft', next)
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
  patch({ options, optionsMode: 'static' })
}

function setOptionsMode(mode: OptionsMode) {
  patch({
    optionsMode: mode,
    ...(mode === 'static'
      ? { datasetId: null, valueKey: '', labelKey: '' }
      : { options: [] }),
  })
}

async function loadDatasetFields(id: number) {
  loadingPreview.value = true
  try {
    const preview = await previewDataset(id)
    datasetFields.value = preview.fields
  } catch {
    datasetFields.value = []
  } finally {
    loadingPreview.value = false
  }
}

async function onDatasetChange(id: number | null) {
  patch({
    datasetId: id,
    valueKey: '',
    labelKey: '',
  })
  if (id) await loadDatasetFields(id)
  else datasetFields.value = []
}
</script>

<template>
  <el-form label-position="top" size="default">
    <el-form-item label="表单类型" required>
      <el-select
        v-if="typeSelectable"
        :model-value="draft.component"
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
      <el-tag v-else>
        {{ WIDGET_METAS.find((m) => m.type === draft.component)?.label || draft.component }}
      </el-tag>
    </el-form-item>

    <el-form-item label="字段名 (name)" required>
      <el-input
        :model-value="draft.name"
        placeholder="如 name、userAge"
        @update:model-value="patch({ name: $event })"
      />
    </el-form-item>

    <el-form-item label="标题">
      <el-input
        :model-value="draft.title"
        @update:model-value="patch({ title: $event })"
      />
    </el-form-item>

    <el-form-item v-if="!isLayout" label="必填">
      <el-switch
        :model-value="draft.required"
        @update:model-value="(v: boolean) => patch({ required: v })"
      />
    </el-form-item>

    <template v-if="!isLayout">
      <el-form-item
        v-if="['Input', 'Textarea', 'Select', 'DatePicker', 'TimePicker'].includes(draft.component)"
        label="占位提示"
      >
        <el-input
          :model-value="(draft.props.placeholder as string) || ''"
          @update:model-value="updateProp('placeholder', $event)"
        />
      </el-form-item>

      <el-form-item v-if="['Input', 'Textarea'].includes(draft.component)" label="最大长度">
        <el-input-number
          :model-value="(draft.props.maxlength as number) || undefined"
          :min="1"
          controls-position="right"
          @update:model-value="updateProp('maxlength', $event)"
        />
      </el-form-item>

      <template v-if="draft.component === 'InputNumber'">
        <el-form-item label="最小值">
          <el-input-number
            :model-value="draft.props.min as number"
            controls-position="right"
            @update:model-value="updateProp('min', $event)"
          />
        </el-form-item>
        <el-form-item label="最大值">
          <el-input-number
            :model-value="draft.props.max as number"
            controls-position="right"
            @update:model-value="updateProp('max', $event)"
          />
        </el-form-item>
      </template>

      <template v-if="draft.component === 'Select'">
        <el-form-item label="多选">
          <el-switch
            :model-value="!!draft.props.multiple"
            @update:model-value="(val: boolean) => {
              patch({
                props: { ...draft.props, multiple: val },
                jsonType: val ? 'array' : 'string',
              })
            }"
          />
        </el-form-item>
        <el-form-item label="可搜索">
          <el-switch
            :model-value="!!(draft.props.filterable || draft.props.remote)"
            @update:model-value="(val: boolean) => {
              if (!val) {
                patch({
                  props: { ...draft.props, filterable: false, remote: false },
                })
              } else {
                patch({
                  props: { ...draft.props, filterable: true },
                })
              }
            }"
          />
        </el-form-item>
        <el-form-item label="远程搜索">
          <el-switch
            :model-value="!!draft.props.remote"
            @update:model-value="(val: boolean) => {
              patch({
                props: {
                  ...draft.props,
                  remote: val,
                  filterable: val ? true : draft.props.filterable,
                  searchKey: val ? (draft.props.searchKey || 'keyword') : draft.props.searchKey,
                },
              })
            }"
          />
          <div class="form-tip">开启后输入关键字请求选项；数据集模式会把参数拼到上游 URL</div>
        </el-form-item>
        <el-form-item v-if="draft.props.remote" label="搜索参数名">
          <el-input
            :model-value="(draft.props.searchKey as string) || 'keyword'"
            placeholder="默认 keyword"
            @update:model-value="updateProp('searchKey', $event || 'keyword')"
          />
        </el-form-item>
      </template>

      <template v-if="draft.component === 'Switch'">
        <el-form-item label="打开文案">
          <el-input
            :model-value="(draft.props.activeText as string) || ''"
            @update:model-value="updateProp('activeText', $event)"
          />
        </el-form-item>
        <el-form-item label="关闭文案">
          <el-input
            :model-value="(draft.props.inactiveText as string) || ''"
            @update:model-value="updateProp('inactiveText', $event)"
          />
        </el-form-item>
      </template>
    </template>

    <el-form-item v-if="isLayout" label="分割线文案">
      <el-input
        :model-value="(draft.props.content as string) || ''"
        @update:model-value="updateProp('content', $event)"
      />
    </el-form-item>

    <template v-if="hasOptions">
      <el-form-item label="选项来源" required>
        <el-radio-group
          :model-value="draft.optionsMode || 'static'"
          @update:model-value="setOptionsMode"
        >
          <el-radio-button value="static">手动配置</el-radio-button>
          <el-radio-button value="dataset">关联数据集</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <template v-if="draft.optionsMode === 'static'">
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

      <template v-else-if="draft.optionsMode === 'dataset'">
        <el-form-item label="数据集" required>
          <el-select
            :model-value="draft.datasetId"
            style="width: 100%"
            clearable
            filterable
            :loading="loadingDatasets"
            placeholder="选择数据集"
            @update:model-value="onDatasetChange"
          >
            <el-option
              v-for="ds in datasets"
              :key="ds.id"
              :label="`${ds.title || ds.name} (${ds.name})`"
              :value="ds.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="value 字段" required>
          <el-select
            :model-value="draft.valueKey || undefined"
            style="width: 100%"
            filterable
            allow-create
            default-first-option
            :loading="loadingPreview"
            placeholder="如 code"
            @update:model-value="(v: string) => patch({ valueKey: v })"
          >
            <el-option v-for="f in datasetFields" :key="`v-${f}`" :label="f" :value="f" />
          </el-select>
        </el-form-item>
        <el-form-item label="label 字段" required>
          <el-select
            :model-value="draft.labelKey || undefined"
            style="width: 100%"
            filterable
            allow-create
            default-first-option
            :loading="loadingPreview"
            placeholder="如 name"
            @update:model-value="(v: string) => patch({ labelKey: v })"
          >
            <el-option v-for="f in datasetFields" :key="`l-${f}`" :label="f" :value="f" />
          </el-select>
        </el-form-item>
      </template>
    </template>
  </el-form>
</template>

<style scoped>
.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}
</style>

