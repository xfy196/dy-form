<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, Plus, View } from '@element-plus/icons-vue'
import {
  createDataset,
  deleteDataset,
  listDatasets,
  previewDataset,
  updateDataset,
  type DatasetItem,
  type DatasetPreview,
} from '@/api/datasets'

const router = useRouter()
const loading = ref(false)
const rows = ref<DatasetItem[]>([])

const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)

const datasetForm = reactive({
  name: '',
  title: '',
  method: 'GET',
  url: '',
  dataPath: '',
  headersText: '',
})

/** 内置演示上游预设，选择后自动填充 url / data_path */
const BUILTIN_SOURCES = [
  {
    label: '城市列表 /api/mock/cities',
    url: '/api/mock/cities',
    dataPath: 'data.list',
    method: 'GET',
  },
  {
    label: '员工列表 /api/mock/employees',
    url: '/api/mock/employees',
    dataPath: 'payload.items',
    method: 'GET',
  },
] as const

const previewVisible = ref(false)
const previewLoading = ref(false)
const previewData = ref<DatasetPreview | null>(null)

/**
 * 选择内置上游或自定义 URL
 * @param url - 选中的地址
 */
function onUrlChange(url: string) {
  datasetForm.url = url
  const preset = BUILTIN_SOURCES.find((item) => item.url === url)
  if (preset) {
    datasetForm.dataPath = preset.dataPath
    datasetForm.method = preset.method
  }
}

async function load() {
  loading.value = true
  try {
    rows.value = await listDatasets()
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '加载失败')
    rows.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void load()
})

function resetForm() {
  datasetForm.name = ''
  datasetForm.title = ''
  datasetForm.method = 'GET'
  datasetForm.url = '/api/mock/cities'
  datasetForm.dataPath = 'data.list'
  datasetForm.headersText = ''
}

function openCreate() {
  isEdit.value = false
  editingId.value = null
  resetForm()
  dialogVisible.value = true
}

function openEdit(row: DatasetItem) {
  isEdit.value = true
  editingId.value = row.id
  datasetForm.name = row.name
  datasetForm.title = row.title
  datasetForm.method = row.method || 'GET'
  datasetForm.url = row.url
  datasetForm.dataPath = row.dataPath || ''
  datasetForm.headersText = row.headers ? JSON.stringify(row.headers, null, 2) : ''
  dialogVisible.value = true
}

function parseHeaders(): Record<string, string> | null {
  const text = datasetForm.headersText.trim()
  if (!text) return null
  try {
    const obj = JSON.parse(text)
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      throw new Error('headers 必须是对象')
    }
    return obj as Record<string, string>
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'headers JSON 无效')
  }
}

async function save() {
  if (!datasetForm.name.trim()) {
    ElMessage.warning('请填写标识名')
    return
  }
  if (!datasetForm.url.trim()) {
    ElMessage.warning('请填写 URL')
    return
  }
  saving.value = true
  try {
    const headers = parseHeaders()
    if (isEdit.value && editingId.value) {
      await updateDataset(editingId.value, {
        title: datasetForm.title.trim(),
        method: datasetForm.method,
        url: datasetForm.url.trim(),
        dataPath: datasetForm.dataPath.trim(),
        headers,
      })
      ElMessage.success('已更新')
    } else {
      await createDataset({
        name: datasetForm.name.trim(),
        title: datasetForm.title.trim() || datasetForm.name.trim(),
        method: datasetForm.method,
        url: datasetForm.url.trim(),
        dataPath: datasetForm.dataPath.trim(),
        headers,
      })
      ElMessage.success('已创建')
    }
    dialogVisible.value = false
    await load()
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '保存失败')
  } finally {
    saving.value = false
  }
}

async function removeRow(row: DatasetItem) {
  await ElMessageBox.confirm(`确认删除数据集「${row.title || row.name}」？`, '删除确认', {
    type: 'warning',
  })
  try {
    await deleteDataset(row.id)
    ElMessage.success('已删除')
    await load()
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '删除失败')
  }
}

async function openPreview(row: DatasetItem) {
  previewVisible.value = true
  previewLoading.value = true
  previewData.value = null
  try {
    // 预览默认带上常见分页，便于对接 /api/mock/employees 等分页上游
    previewData.value = await previewDataset(row.id, {
      pageKey: 'page',
      page: 1,
      pageSizeKey: 'pageSize',
      pageSize: 50,
    })
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '预览失败')
  } finally {
    previewLoading.value = false
  }
}
</script>

<template>
  <div class="datasets">
    <header class="datasets__header">
      <div class="datasets__title-wrap">
        <h2>数据集管理</h2>
        <span class="hint">配置上游接口，供字段 options 映射 value / label</span>
      </div>
      <div class="datasets__actions">
        <el-button type="primary" :icon="Plus" @click="openCreate">新建数据集</el-button>
        <el-button @click="router.push({ name: 'list-config' })">字段库</el-button>
        <el-button @click="load">刷新</el-button>
      </div>
    </header>

    <el-card v-loading="loading" shadow="never">
      <el-table :data="rows" stripe empty-text="暂无数据集">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="标识名" min-width="120" />
        <el-table-column prop="title" label="标题" min-width="120" />
        <el-table-column prop="method" label="方法" width="80" />
        <el-table-column prop="url" label="URL" min-width="220" show-overflow-tooltip />
        <el-table-column prop="dataPath" label="data_path" width="140" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="openPreview(row)">预览</el-button>
            <el-button link type="primary" :icon="Edit" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" :icon="Delete" @click="removeRow(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑数据集' : '新建数据集'"
      width="720px"
      append-to-body
    >
      <el-form label-width="100px">
        <el-form-item label="标识名" required>
          <el-input
            :model-value="datasetForm.name"
            :disabled="isEdit"
            placeholder="如 city_list"
            @update:model-value="(v: string) => (datasetForm.name = v)"
          />
        </el-form-item>
        <el-form-item label="标题">
          <el-input
            :model-value="datasetForm.title"
            placeholder="城市列表"
            @update:model-value="(v: string) => (datasetForm.title = v)"
          />
        </el-form-item>
        <el-form-item label="方法" required>
          <el-select
            :model-value="datasetForm.method"
            style="width: 160px"
            @update:model-value="(v: string) => (datasetForm.method = v)"
          >
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
          </el-select>
        </el-form-item>
        <el-form-item label="URL" required>
          <el-select
            :model-value="datasetForm.url"
            style="width: 100%"
            filterable
            allow-create
            default-first-option
            placeholder="选择内置接口，或直接输入自定义 URL"
            @update:model-value="onUrlChange"
          >
            <el-option
              v-for="item in BUILTIN_SOURCES"
              :key="item.url"
              :label="item.label"
              :value="item.url"
            />
          </el-select>
          <div class="hint" style="margin-top: 4px">
            可选内置接口；也可输入任意 http(s) 或 / 开头的相对路径
          </div>
        </el-form-item>
        <el-form-item label="data_path">
          <el-input
            :model-value="datasetForm.dataPath"
            placeholder="如 data.list / payload.items，空则根为数组"
            @update:model-value="(v: string) => (datasetForm.dataPath = v)"
          />
        </el-form-item>
        <el-form-item label="headers">
          <el-input
            :model-value="datasetForm.headersText"
            type="textarea"
            :rows="4"
            placeholder="可选 JSON 对象字符串"
            @update:model-value="(v: string) => (datasetForm.headersText = v)"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="previewVisible" title="数据集预览" width="720px" append-to-body>
      <div v-loading="previewLoading">
        <template v-if="previewData">
          <p>共 {{ previewData.total }} 条，可用字段：{{ previewData.fields.join(', ') || '-' }}</p>
          <el-table :data="previewData.samples" stripe max-height="360">
            <el-table-column
              v-for="f in previewData.fields"
              :key="f"
              :prop="f"
              :label="f"
              min-width="100"
            />
          </el-table>
        </template>
        <el-empty v-else description="暂无预览数据" />
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.datasets {
  min-height: 100vh;
  padding: 20px 24px 40px;
  background: linear-gradient(160deg, #f5f7fa 0%, #eef2f7 100%);
}

.datasets__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.datasets__title-wrap h2 {
  margin: 0 0 4px;
  font-size: 20px;
  font-weight: 600;
}

.hint {
  color: #909399;
  font-size: 13px;
}

.datasets__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
