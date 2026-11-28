<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Delete, Plus } from '@element-plus/icons-vue'
import type { SelectOption, WidgetType } from '@/schema/types'
import { WIDGET_METAS } from '@/schema/defaults'
import { listDatasets, previewDataset, type DatasetItem } from '@/api/datasets'
import type { OptionsMode } from '@/api/fields'
import {
  createDraftFromWidget,
  ensureDatasetPaginationProps,
  isOptionWidget,
  type FieldDraft,
} from './fieldDraft'
import { getLabelDisplay, parseLabelDisplay } from '@/schema/labelDisplay'

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

const datasets = ref<DatasetItem[]>([])
const datasetFields = ref<string[]>([])
const loadingDatasets = ref(false)
const loadingPreview = ref(false)

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

/**
 * 更新草稿字段
 * @param partial - 需要合并的草稿片段
 */
function patch(partial: Partial<FieldDraft>) {
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

/**
 * 更新某一行选项的 label 或 value
 * @param index - 选项下标
 * @param key - 字段名
 * @param val - 新值
 */
function updateOption(index: number, key: 'label' | 'value', val: string) {
  const options: SelectOption[] = props.draft.options.map((item, i) =>
    i === index ? { ...item, [key]: val } : { ...item },
  )
  patch({ options, optionsMode: 'static' })
}

/** 新增一行空选项 */
function addOption() {
  patch({
    options: [...props.draft.options, { label: '', value: '' }],
    optionsMode: 'static',
  })
}

/**
 * 删除指定选项行
 * @param index - 选项下标
 */
function removeOption(index: number) {
  patch({
    options: props.draft.options.filter((_, i) => i !== index),
    optionsMode: 'static',
  })
}

function setOptionsMode(mode: OptionsMode) {
  if (mode === 'static') {
    patch({
      optionsMode: mode,
      datasetId: null,
      valueKey: '',
      labelKey: '',
      labelTemplate: '',
      options: props.draft.options.length
        ? props.draft.options
        : [{ label: '', value: '' }],
    })
    return
  }
  const nextProps = { ...props.draft.props }
  if (nextProps.pageKey === undefined) nextProps.pageKey = 'page'
  if (nextProps.page === undefined) nextProps.page = 1
  if (nextProps.pageSizeKey === undefined) nextProps.pageSizeKey = 'pageSize'
  if (nextProps.pageSize === undefined) nextProps.pageSize = 50
  patch({
    optionsMode: mode,
    options: [],
    props: nextProps,
  })
}

/**
 * 从草稿 props 组装预览用的分页参数
 */
function buildPreviewQuery() {
  const p = ensureDatasetPaginationProps(props.draft.props || {})
  const query: {
    pageKey?: string
    page?: number
    pageSizeKey?: string
    pageSize?: number
  } = {}
  const pageKey = p.pageKey != null ? String(p.pageKey).trim() : ''
  const pageSizeKey = p.pageSizeKey != null ? String(p.pageSizeKey).trim() : ''
  if (pageKey) {
    query.pageKey = pageKey
    query.page = p.page != null ? Number(p.page) : 1
  }
  if (pageSizeKey) {
    query.pageSizeKey = pageSizeKey
    query.pageSize = p.pageSize != null ? Number(p.pageSize) : 50
  }
  return query
}

async function loadDatasetFields(id: number) {
  loadingPreview.value = true
  try {
    const preview = await previewDataset(id, buildPreviewQuery())
    datasetFields.value = preview.fields
  } catch {
    datasetFields.value = []
  } finally {
    loadingPreview.value = false
  }
}

/** 已是 dataset 模式时，把界面默认分页写回 draft，避免只显示未入库 */
watch(
  () => props.draft.optionsMode,
  (mode) => {
    if (mode !== 'dataset') return
    const ensured = ensureDatasetPaginationProps(props.draft.props || {})
    const cur = props.draft.props || {}
    if (
      cur.pageKey === undefined ||
      cur.page === undefined ||
      cur.pageSizeKey === undefined ||
      cur.pageSize === undefined
    ) {
      patch({ props: ensured })
    }
  },
  { immediate: true },
)

async function onDatasetChange(id: number | null) {
  patch({
    datasetId: id,
    valueKey: '',
    labelKey: '',
    labelTemplate: '',
  })
  if (id) await loadDatasetFields(id)
  else datasetFields.value = []
}

/** 当前显示模板输入框的值 */
const labelDisplay = computed(() =>
  getLabelDisplay(props.draft.labelKey, props.draft.labelTemplate),
)

/**
 * 更新显示模板（含 ${} 走 template，否则走单字段）
 * @param input - 输入内容
 */
function onLabelDisplayChange(input: string) {
  const parsed = parseLabelDisplay(input)
  patch({
    labelKey: parsed.labelKey,
    labelTemplate: parsed.labelTemplate,
  })
}

/**
 * 在显示模板末尾插入 ${field}
 * @param fieldName - 数据集字段名
 */
function insertLabelField(fieldName: string) {
  const current = labelDisplay.value
  const token = `\${${fieldName}}`
  const next = current ? `${current}${token}` : token
  onLabelDisplayChange(next)
}

/**
 * 更新分页相关 props，改数值时补齐默认参数名
 * @param partial - 分页字段片段
 */
function updatePaginationProps(partial: {
  pageKey?: string
  page?: number
  pageSizeKey?: string
  pageSize?: number
}) {
  const next = { ...props.draft.props, ...partial }
  if (partial.page !== undefined && next.pageKey === undefined) {
    next.pageKey = 'page'
  }
  if (partial.pageSize !== undefined && next.pageSizeKey === undefined) {
    next.pageSizeKey = 'pageSize'
  }
  patch({ props: next })
}
</script>

<template>
  <el-form class="field-editor" label-position="top" size="default">
    <div class="field-editor__grid">
      <el-form-item label="表单类型" required class="span-2">
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

      <el-form-item label="字段名 (key)" required>
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

      <el-form-item
        v-if="!isLayout && ['Input', 'Textarea', 'Select', 'DatePicker', 'TimePicker'].includes(draft.component)"
        label="占位提示"
        :class="{ 'span-2': !['Input', 'Textarea'].includes(draft.component) }"
      >
        <el-input
          :model-value="(draft.props.placeholder as string) || ''"
          @update:model-value="updateProp('placeholder', $event)"
        />
      </el-form-item>

      <el-form-item
        v-if="!isLayout && ['Input', 'Textarea'].includes(draft.component)"
        label="最大长度"
      >
        <el-input-number
          :model-value="(draft.props.maxlength as number) || undefined"
          :min="1"
          controls-position="right"
          style="width: 100%"
          @update:model-value="updateProp('maxlength', $event)"
        />
      </el-form-item>

      <template v-if="!isLayout && draft.component === 'InputNumber'">
        <el-form-item label="最小值">
          <el-input-number
            :model-value="draft.props.min as number"
            controls-position="right"
            style="width: 100%"
            @update:model-value="updateProp('min', $event)"
          />
        </el-form-item>
        <el-form-item label="最大值">
          <el-input-number
            :model-value="draft.props.max as number"
            controls-position="right"
            style="width: 100%"
            @update:model-value="updateProp('max', $event)"
          />
        </el-form-item>
      </template>

      <template v-if="!isLayout && draft.component === 'Switch'">
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

      <el-form-item v-if="isLayout" label="分割线文案" class="span-2">
        <el-input
          :model-value="(draft.props.content as string) || ''"
          @update:model-value="updateProp('content', $event)"
        />
      </el-form-item>
    </div>

    <!-- 开关类配置：横排紧凑 -->
    <div v-if="!isLayout" class="field-editor__switches">
      <label class="switch-chip">
        <span>必填</span>
        <el-switch
          :model-value="draft.required"
          @update:model-value="(v: boolean) => patch({ required: v })"
        />
      </label>

      <template v-if="draft.component === 'Select'">
        <label class="switch-chip">
          <span>多选</span>
          <el-switch
            :model-value="!!draft.props.multiple"
            @update:model-value="(val: boolean) => {
              patch({
                props: { ...draft.props, multiple: val },
                jsonType: val ? 'array' : 'string',
              })
            }"
          />
        </label>
        <label class="switch-chip">
          <span>可搜索</span>
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
        </label>
        <label class="switch-chip">
          <span>远程搜索</span>
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
        </label>
      </template>
    </div>

    <p
      v-if="!isLayout && draft.component === 'Select'"
      class="form-tip form-tip--block"
    >
      开启远程搜索后，输入关键字请求选项；数据集模式会把参数拼到上游 URL
    </p>

    <div
      v-if="!isLayout && draft.component === 'Select' && draft.props.remote"
      class="field-editor__grid"
    >
      <el-form-item label="搜索参数名" class="span-2">
        <el-input
          :model-value="(draft.props.searchKey as string) || 'keyword'"
          placeholder="默认 keyword"
          @update:model-value="updateProp('searchKey', $event || 'keyword')"
        />
      </el-form-item>
    </div>

    <template v-if="hasOptions">
      <el-form-item label="选项来源" required class="field-editor__full">
        <el-radio-group
          :model-value="draft.optionsMode || 'static'"
          @update:model-value="setOptionsMode"
        >
          <el-radio-button value="static">手动配置</el-radio-button>
          <el-radio-button value="dataset">关联数据集</el-radio-button>
        </el-radio-group>
      </el-form-item>

      <template v-if="draft.optionsMode === 'static'">
        <el-form-item label="选项" class="field-editor__full">
          <div class="option-list">
            <div
              v-for="(opt, index) in draft.options"
              :key="index"
              class="option-row"
            >
              <el-input
                :model-value="opt.label"
                placeholder="标签"
                @update:model-value="updateOption(index, 'label', $event)"
              />
              <el-input
                :model-value="String(opt.value ?? '')"
                placeholder="值"
                @update:model-value="updateOption(index, 'value', $event)"
              />
              <el-button
                :icon="Delete"
                type="danger"
                plain
                @click="removeOption(index)"
              />
            </div>
            <el-button type="primary" plain :icon="Plus" @click="addOption">
              新增选项
            </el-button>
          </div>
        </el-form-item>
      </template>

      <div
        v-else-if="draft.optionsMode === 'dataset'"
        class="field-editor__grid"
      >
        <el-form-item label="数据集" required class="span-2">
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
        <el-form-item label="显示模板" required class="span-2">
          <el-input
            :model-value="labelDisplay"
            placeholder="${code} - ${name}"
            clearable
            @update:model-value="onLabelDisplayChange"
          />
          <div v-if="datasetFields.length" class="label-field-chips">
            <button
              v-for="f in datasetFields"
              :key="`chip-${f}`"
              type="button"
              class="label-field-chip"
              @click="insertLabelField(f)"
            >
              {{ f }}
            </button>
          </div>
          <p class="form-tip">
            单字段直接填字段名；组合显示用 ${字段名}，点击上方字段可插入
          </p>
        </el-form-item>
        <el-form-item label="页码参数名">
          <el-input
            :model-value="(draft.props.pageKey as string) ?? 'page'"
            placeholder="如 page / pageNo，空则不传"
            clearable
            @update:model-value="updatePaginationProps({ pageKey: $event })"
          />
        </el-form-item>
        <el-form-item label="页码">
          <el-input-number
            :model-value="(draft.props.page as number) ?? 1"
            :min="1"
            controls-position="right"
            style="width: 100%"
            @update:model-value="updatePaginationProps({ page: $event ?? 1 })"
          />
        </el-form-item>
        <el-form-item label="每页条数参数名">
          <el-input
            :model-value="(draft.props.pageSizeKey as string) ?? 'pageSize'"
            placeholder="如 pageSize / limit，空则不传"
            clearable
            @update:model-value="updatePaginationProps({ pageSizeKey: $event })"
          />
        </el-form-item>
        <el-form-item label="每页条数">
          <el-input-number
            :model-value="(draft.props.pageSize as number) ?? 50"
            :min="1"
            :max="500"
            controls-position="right"
            style="width: 100%"
            @update:model-value="updatePaginationProps({ pageSize: $event ?? 50 })"
          />
        </el-form-item>
        <p class="form-tip form-tip--block span-2">
          参数名留空表示不传给上游；与 searchKey 一样写入字段 props
        </p>
      </div>
    </template>
  </el-form>
</template>

<style scoped>
.field-editor {
  --fe-gap: 12px 16px;
}

.field-editor__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--fe-gap);
  align-items: start;
}

.field-editor__grid > .span-2,
.field-editor__full {
  grid-column: 1 / -1;
}

.field-editor :deep(.el-form-item) {
  margin-bottom: 0;
}

.field-editor :deep(.el-form-item__label) {
  padding-bottom: 4px;
  line-height: 1.3;
  font-size: 13px;
  color: #606266;
}

.field-editor__switches {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin-top: 14px;
  padding: 10px 14px;
  border-radius: 8px;
  background: linear-gradient(135deg, #f7f9fc 0%, #eef2f8 100%);
  border: 1px solid #e4eaf2;
}

.switch-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  cursor: pointer;
  font-size: 13px;
  color: #606266;
  user-select: none;
}

.field-editor__full {
  margin-top: 14px;
}

/* 仅防裁切，不改 EP 原生边框，避免左右粗细不一致 */
.field-editor__full :deep(.el-radio-group) {
  display: inline-flex;
  padding: 1px;
  margin: -1px;
}

.form-tip {
  margin: 0;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}

.form-tip--block {
  margin-top: 8px;
  grid-column: 1 / -1;
}

.option-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.option-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.option-row .el-input {
  flex: 1;
}

.label-field-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.label-field-chip {
  margin: 0;
  padding: 2px 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: #fff;
  color: #606266;
  font-size: 12px;
  line-height: 1.6;
  cursor: pointer;
}

.label-field-chip:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

@media (max-width: 560px) {
  .field-editor__grid {
    grid-template-columns: 1fr;
  }
}
</style>
