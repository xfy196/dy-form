<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Delete, Plus } from '@element-plus/icons-vue'
import type { SelectOption } from '@/schema/types'
import {
  listDatasets,
  previewDataset,
  type DatasetItem,
} from '@/api/datasets'
import { useDesignerStore } from './store'

const store = useDesignerStore()

const field = computed(() => store.selectedField)
const nameInput = ref('')

const datasets = ref<DatasetItem[]>([])
const datasetFields = ref<string[]>([])
const loadingDatasets = ref(false)
const loadingPreview = ref(false)

watch(
  field,
  (f) => {
    nameInput.value = f?.name ?? ''
    if (f?.schema.componentProps?.datasetId) {
      void loadDatasetFields(Number(f.schema.componentProps.datasetId))
    } else {
      datasetFields.value = []
    }
  },
  { immediate: true },
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
})

const isLayout = computed(
  () => field.value?.schema['hidden-value'] || field.value?.schema.type === 'void',
)

const isRequired = computed(() =>
  !!field.value?.schema['rules']?.some((r) => r.required),
)

const hasOptions = computed(() =>
  ['Select', 'Radio', 'Checkbox'].includes(field.value?.schema['component'] || ''),
)

const optionList = computed<SelectOption[]>(() =>
  field.value?.schema.componentProps?.options || [],
)

const optionsMode = computed(
  () => field.value?.schema.componentProps?.optionsMode || 'static',
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
  const props = { ...(field.value.schema.componentProps || {}), [key]: value }
  store.updateFieldSchema(field.value.id, { componentProps: props })
}

/**
 * 批量合并 componentProps
 * @param partial - 要合并的 props
 */
function patchProps(partial: Record<string, unknown>) {
  if (!field.value) return
  const props = { ...(field.value.schema.componentProps || {}), ...partial }
  store.updateFieldSchema(field.value.id, { componentProps: props })
}

function toggleRequired(val: boolean) {
  if (!field.value) return
  store.setRequired(field.value.id, val)
}

function setSelectMultiple(val: boolean) {
  if (!field.value) return
  updateProp('multiple', val)
  store.updateFieldSchema(field.value.id, {
    type: val ? 'array' : 'string',
    default: val ? [] : undefined,
  })
}

/**
 * 写入选项列表，并同步非 Checkbox 的 enum
 * @param options - 选项数组
 */
function commitOptions(options: SelectOption[]) {
  if (!field.value) return
  updateProp('options', options)
  if (field.value.schema['component'] !== 'Checkbox') {
    store.updateFieldSchema(field.value.id, {
      enum: options
        .filter((o) => o.label !== '' || o.value !== '')
        .map((o) => o.value as string | number | boolean),
    })
  }
}

/**
 * 更新某一行选项
 * @param index - 选项下标
 * @param key - 字段名
 * @param val - 新值
 */
function updateOption(index: number, key: 'label' | 'value', val: string) {
  const options = optionList.value.map((item, i) =>
    i === index ? { ...item, [key]: val } : { ...item },
  )
  commitOptions(options)
}

/** 新增一行空选项 */
function addOption() {
  commitOptions([...optionList.value, { label: '', value: '' }])
}

/**
 * 删除指定选项行
 * @param index - 选项下标
 */
function removeOption(index: number) {
  commitOptions(optionList.value.filter((_, i) => i !== index))
}

/**
 * 切换选项来源
 * @param mode - static | dataset
 */
function setOptionsMode(mode: 'static' | 'dataset') {
  if (!field.value) return
  if (mode === 'static') {
    patchProps({
      optionsMode: 'static',
      datasetId: null,
      valueKey: '',
      labelKey: '',
      options: optionList.value.length ? optionList.value : [{ label: '', value: '' }],
    })
    datasetFields.value = []
    return
  }
  // 数据集模式：schema 只存配置，不落查询结果 options/enum
  const {
    options: _omitOptions,
    ...rest
  } = field.value.schema.componentProps || {}
  store.updateFieldSchema(field.value.id, {
    enum: undefined,
    componentProps: {
      ...rest,
      optionsMode: 'dataset',
      options: undefined,
      pageKey: rest.pageKey ?? 'page',
      page: rest.page ?? 1,
      pageSizeKey: rest.pageSizeKey ?? 'pageSize',
      pageSize: rest.pageSize ?? 50,
    },
  })
}

async function loadDatasetFields(id: number) {
  loadingPreview.value = true
  try {
    const preview = await previewDataset(id, {
      pageKey: 'page',
      page: 1,
      pageSizeKey: 'pageSize',
      pageSize: 50,
    })
    datasetFields.value = preview.fields
  } catch {
    datasetFields.value = []
  } finally {
    loadingPreview.value = false
  }
}

async function onDatasetChange(id: number | null) {
  patchProps({
    datasetId: id,
    valueKey: '',
    labelKey: '',
    options: undefined,
  })
  if (field.value) {
    store.updateFieldSchema(field.value.id, { enum: undefined })
  }
  if (id) await loadDatasetFields(id)
  else datasetFields.value = []
}

/**
 * 更新分页 props（只改配置，不写入 options）
 * @param partial - 分页字段
 */
function updatePaginationProps(partial: {
  pageKey?: string
  page?: number
  pageSizeKey?: string
  pageSize?: number
}) {
  const cur = field.value?.schema.componentProps || {}
  const next = { ...cur, ...partial, options: undefined }
  if (partial.page !== undefined && next.pageKey === undefined) next.pageKey = 'page'
  if (partial.pageSize !== undefined && next.pageSizeKey === undefined) {
    next.pageSizeKey = 'pageSize'
  }
  patchProps(next)
}

function onValueKeyChange(v: string) {
  patchProps({ valueKey: v, options: undefined })
}

function onLabelKeyChange(v: string) {
  patchProps({ labelKey: v, options: undefined })
}
</script>

<template>
  <div class="props-panel">
    <h3 class="props-panel__title">属性配置</h3>

    <el-empty v-if="!field" description="请选择画布中的字段" :image-size="64" />

    <el-form v-else label-position="top" size="small">
      <el-form-item label="控件类型">
        <el-tag>{{ field.schema['component'] }}</el-tag>
      </el-form-item>

      <el-form-item label="字段名 (key)">
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
          v-if="['Input', 'Textarea', 'Select', 'DatePicker', 'TimePicker'].includes(field.schema['component'])"
          label="占位提示"
        >
          <el-input
            :model-value="(field.schema.componentProps?.placeholder as string) || ''"
            @update:model-value="updateProp('placeholder', $event)"
          />
        </el-form-item>

        <el-form-item
          v-if="['Input', 'Textarea'].includes(field.schema['component'])"
          label="最大长度"
        >
          <el-input-number
            :model-value="(field.schema.componentProps?.maxlength as number) || undefined"
            :min="1"
            controls-position="right"
            @update:model-value="updateProp('maxlength', $event)"
          />
        </el-form-item>

        <template v-if="field.schema['component'] === 'InputNumber'">
          <el-form-item label="最小值">
            <el-input-number
              :model-value="field.schema.componentProps?.min as number"
              controls-position="right"
              @update:model-value="updateProp('min', $event)"
            />
          </el-form-item>
          <el-form-item label="最大值">
            <el-input-number
              :model-value="field.schema.componentProps?.max as number"
              controls-position="right"
              @update:model-value="updateProp('max', $event)"
            />
          </el-form-item>
        </template>

        <template v-if="field.schema['component'] === 'Select'">
          <el-form-item label="多选">
            <el-switch
              :model-value="!!field.schema.componentProps?.multiple"
              @update:model-value="setSelectMultiple"
            />
          </el-form-item>
          <el-form-item label="可搜索">
            <el-switch
              :model-value="!!(field.schema.componentProps?.filterable || field.schema.componentProps?.remote)"
              @update:model-value="(val: boolean) => {
                if (!field) return
                const next = { ...(field.schema.componentProps || {}) }
                if (!val) {
                  next.filterable = false
                  next.remote = false
                } else {
                  next.filterable = true
                }
                store.updateFieldSchema(field.id, { componentProps: next })
              }"
            />
          </el-form-item>
          <el-form-item label="远程搜索">
            <el-switch
              :model-value="!!field.schema.componentProps?.remote"
              @update:model-value="(val: boolean) => {
                if (!field) return
                const next = {
                  ...(field.schema.componentProps || {}),
                  remote: val,
                  filterable: val ? true : field.schema.componentProps?.filterable,
                  searchKey: val
                    ? (field.schema.componentProps?.searchKey || 'keyword')
                    : field.schema.componentProps?.searchKey,
                }
                store.updateFieldSchema(field.id, {
                  componentProps: { ...next, options: undefined },
                  enum: undefined,
                })
              }"
            />
            <div class="form-tip">开启后按关键字请求数据集；需配置关联数据集</div>
          </el-form-item>
          <el-form-item v-if="field.schema.componentProps?.remote" label="搜索参数名">
            <el-input
              :model-value="(field.schema.componentProps?.searchKey as string) || 'keyword'"
              placeholder="默认 keyword"
              @update:model-value="updateProp('searchKey', $event || 'keyword')"
            />
          </el-form-item>
        </template>

        <template v-if="field.schema['component'] === 'Switch'">
          <el-form-item label="打开文案">
            <el-input
              :model-value="(field.schema.componentProps?.activeText as string) || ''"
              @update:model-value="updateProp('activeText', $event)"
            />
          </el-form-item>
          <el-form-item label="关闭文案">
            <el-input
              :model-value="(field.schema.componentProps?.inactiveText as string) || ''"
              @update:model-value="updateProp('inactiveText', $event)"
            />
          </el-form-item>
        </template>
      </template>

      <el-form-item v-if="isLayout" label="分割线文案">
        <el-input
          :model-value="(field.schema.componentProps?.content as string) || ''"
          @update:model-value="updateProp('content', $event)"
        />
      </el-form-item>

      <template v-if="hasOptions">
        <el-form-item label="选项来源" required>
          <el-radio-group
            :model-value="optionsMode"
            @update:model-value="setOptionsMode"
          >
            <el-radio-button value="static">手动配置</el-radio-button>
            <el-radio-button value="dataset">关联数据集</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <template v-if="optionsMode === 'static'">
          <el-form-item label="选项">
            <div class="option-list">
              <div
                v-for="(opt, index) in optionList"
                :key="index"
                class="option-row"
              >
                <el-input
                  :model-value="opt.label"
                  placeholder="标签"
                  size="small"
                  @update:model-value="updateOption(index, 'label', $event)"
                />
                <el-input
                  :model-value="String(opt.value ?? '')"
                  placeholder="值"
                  size="small"
                  @update:model-value="updateOption(index, 'value', $event)"
                />
                <el-button
                  :icon="Delete"
                  type="danger"
                  plain
                  size="small"
                  @click="removeOption(index)"
                />
              </div>
              <el-button type="primary" plain size="small" :icon="Plus" @click="addOption">
                新增选项
              </el-button>
            </div>
          </el-form-item>
        </template>

        <template v-else>
          <el-form-item label="数据集" required>
            <el-select
              :model-value="field.schema.componentProps?.datasetId as number | null | undefined"
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
              :model-value="(field.schema.componentProps?.valueKey as string) || undefined"
              style="width: 100%"
              filterable
              allow-create
              default-first-option
              :loading="loadingPreview"
              placeholder="如 code / userId"
              @update:model-value="onValueKeyChange"
            >
              <el-option v-for="f in datasetFields" :key="`v-${f}`" :label="f" :value="f" />
            </el-select>
          </el-form-item>
          <el-form-item label="label 字段" required>
            <el-select
              :model-value="(field.schema.componentProps?.labelKey as string) || undefined"
              style="width: 100%"
              filterable
              allow-create
              default-first-option
              :loading="loadingPreview"
              placeholder="如 name / displayName"
              @update:model-value="onLabelKeyChange"
            >
              <el-option v-for="f in datasetFields" :key="`l-${f}`" :label="f" :value="f" />
            </el-select>
          </el-form-item>
          <el-form-item label="页码参数名">
            <el-input
              :model-value="(field.schema.componentProps?.pageKey as string) ?? 'page'"
              placeholder="如 page / pageNo，空则不传"
              clearable
              @update:model-value="updatePaginationProps({ pageKey: $event })"
            />
          </el-form-item>
          <el-form-item label="页码">
            <el-input-number
              :model-value="(field.schema.componentProps?.page as number) ?? 1"
              :min="1"
              controls-position="right"
              @update:model-value="updatePaginationProps({ page: $event ?? 1 })"
            />
          </el-form-item>
          <el-form-item label="每页条数参数名">
            <el-input
              :model-value="(field.schema.componentProps?.pageSizeKey as string) ?? 'pageSize'"
              placeholder="如 pageSize / limit，空则不传"
              clearable
              @update:model-value="updatePaginationProps({ pageSizeKey: $event })"
            />
          </el-form-item>
          <el-form-item label="每页条数">
            <el-input-number
              :model-value="(field.schema.componentProps?.pageSize as number) ?? 50"
              :min="1"
              :max="500"
              controls-position="right"
              @update:model-value="updatePaginationProps({ pageSize: $event ?? 50 })"
            />
            <div class="form-tip">
              Schema 只保存数据集配置；选项由运行时按配置请求，不写入 JSON
            </div>
          </el-form-item>
        </template>
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

.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
  line-height: 1.4;
}
</style>
