<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  DocumentCopy,
  Download,
  Upload,
  View,
  Delete,
  Monitor,
  FolderOpened,
  UploadFilled,
} from '@element-plus/icons-vue'
import SchemaForm from '@/renderer/SchemaForm.vue'
import { createForm, getForm, listForms, updateForm, type FormListItem } from '@/api/forms'
import { checkBackendHealth } from '@/api/http'
import { useDesignerStore } from './store'

const store = useDesignerStore()
const router = useRouter()

const backendOnline = ref<boolean | null>(null)
let healthTimer: number | undefined

async function refreshBackendHealth() {
  backendOnline.value = await checkBackendHealth()
}

onMounted(() => {
  void refreshBackendHealth()
  healthTimer = window.setInterval(() => {
    void refreshBackendHealth()
  }, 10000)
})

onUnmounted(() => {
  if (healthTimer) window.clearInterval(healthTimer)
})

const jsonDrawer = ref(false)
const importVisible = ref(false)
const previewVisible = ref(false)
const importText = ref('')
const jsonText = ref('')

const saveVisible = ref(false)
const saveName = ref('')
const saving = ref(false)

const loadVisible = ref(false)
const loadingList = ref(false)
const formList = ref<FormListItem[]>([])
const selectedLoadId = ref<number | null>(null)
const loadingForm = ref(false)

function openJson() {
  jsonText.value = store.exportSchemaJson()
  jsonDrawer.value = true
}

async function copyJson() {
  try {
    await navigator.clipboard.writeText(store.exportSchemaJson())
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

function downloadJson() {
  const blob = new Blob([store.exportSchemaJson()], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${store.formTitle || 'form-schema'}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function openImport() {
  importText.value = ''
  importVisible.value = true
}

function confirmImport() {
  try {
    const parsed = JSON.parse(importText.value)
    if (store.importSchema(parsed)) {
      importVisible.value = false
    }
  } catch {
    ElMessage.error('JSON 解析失败')
  }
}

function clearAll() {
  store.clear()
  ElMessage.success('已清空')
}

function goPreview() {
  sessionStorage.setItem('dy-form-preview-schema', store.exportSchemaJson())
  router.push({ name: 'preview' })
}

function openSave() {
  if (backendOnline.value === false) {
    ElMessage.error('后端未连通，请先启动 backend（npm run dev，端口 7001）')
    return
  }
  if (!store.fields.length) {
    ElMessage.warning('请先添加字段')
    return
  }
  saveName.value = store.formName || ''
  saveVisible.value = true
}

async function confirmSave() {
  if (!store.fields.length) {
    ElMessage.warning('请先添加字段')
    return
  }

  const schema = store.schema
  saving.value = true
  try {
    if (store.formId) {
      const row = await updateForm(store.formId, {
        title: store.formTitle,
        schema,
      })
      store.formTitle = row.title
      store.formName = row.name
      ElMessage.success('已更新到后端')
    } else {
      const name = saveName.value.trim()
      if (!name) {
        ElMessage.warning('请填写表单标识名')
        return
      }
      if (!/^[a-zA-Z_][\w-]*$/.test(name)) {
        ElMessage.warning('标识名需以字母或下划线开头，仅含字母数字下划线或连字符')
        return
      }
      const row = await createForm({
        name,
        title: store.formTitle,
        schema,
      })
      store.formId = row.id
      store.formName = row.name
      store.formTitle = row.title
      ElMessage.success('已保存到后端')
    }
    saveVisible.value = false
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '保存失败')
  } finally {
    saving.value = false
  }
}

async function openLoad() {
  if (backendOnline.value === false) {
    ElMessage.error('后端未连通，请先启动 backend（npm run dev，端口 7001）')
    return
  }
  loadVisible.value = true
  selectedLoadId.value = null
  loadingList.value = true
  try {
    formList.value = await listForms()
    backendOnline.value = true
  } catch (err) {
    backendOnline.value = false
    ElMessage.error(err instanceof Error ? err.message : '加载列表失败')
    formList.value = []
  } finally {
    loadingList.value = false
  }
}

async function confirmLoad() {
  if (!selectedLoadId.value) {
    ElMessage.warning('请选择一个表单')
    return
  }
  loadingForm.value = true
  try {
    const row = await getForm(selectedLoadId.value)
    if (store.importSchema(row.schema, { id: row.id, name: row.name })) {
      store.formTitle = row.title || row.schema.title || '未命名表单'
      loadVisible.value = false
    }
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '加载失败')
  } finally {
    loadingForm.value = false
  }
}
</script>

<template>
  <div class="toolbar">
    <div class="toolbar__left">
      <span class="toolbar__brand">表单设计器</span>
      <el-input
        v-model="store.formTitle"
        size="small"
        style="width: 180px"
        placeholder="表单标题"
      />
      <el-tag
        size="small"
        :type="backendOnline === true ? 'success' : backendOnline === false ? 'danger' : 'info'"
      >
        {{ backendOnline === true ? '后端已连通' : backendOnline === false ? '后端未连通' : '检测中…' }}
      </el-tag>
      <el-tag v-if="store.formId" size="small" type="success">
        已关联 #{{ store.formId }}
      </el-tag>
    </div>
    <div class="toolbar__actions">
      <el-button :icon="UploadFilled" type="primary" @click="openSave">保存到后端</el-button>
      <el-button :icon="FolderOpened" type="primary" plain @click="openLoad">从后端加载</el-button>
      <el-button @click="router.push({ name: 'list-config' })">字段库</el-button>
      <el-button @click="router.push({ name: 'datasets' })">数据集</el-button>
      <el-button :icon="View" @click="previewVisible = true">运行预览</el-button>
      <el-button :icon="Monitor" @click="goPreview">预览页</el-button>
      <el-button :icon="DocumentCopy" @click="openJson">查看 JSON</el-button>
      <el-button :icon="Download" @click="downloadJson">导出</el-button>
      <el-button :icon="Upload" @click="openImport">导入</el-button>
      <el-button :icon="Delete" type="danger" plain @click="clearAll">清空</el-button>
    </div>

    <el-drawer
      v-model="jsonDrawer"
      title="FormSchema JSON"
      size="40%"
      append-to-body
    >
      <pre class="json-view">{{ jsonText }}</pre>
      <template #footer>
        <el-button type="primary" @click="copyJson">复制</el-button>
      </template>
    </el-drawer>

    <el-dialog
      v-model="importVisible"
      title="导入 Schema JSON"
      width="560px"
      append-to-body
    >
      <el-input
        v-model="importText"
        type="textarea"
        :rows="14"
        placeholder="粘贴 FormSchema JSON"
      />
      <template #footer>
        <el-button @click="importVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmImport">导入</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="saveVisible"
      :title="store.formId ? '更新到后端' : '保存到后端'"
      width="420px"
      append-to-body
    >
      <el-form label-width="90px">
        <el-form-item v-if="!store.formId" label="标识名" required>
          <el-input
            v-model="saveName"
            placeholder="如 user_profile"
          />
        </el-form-item>
        <el-form-item v-else label="标识名">
          <span>{{ store.formName }}</span>
        </el-form-item>
        <el-form-item label="标题">
          <span>{{ store.formTitle }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="saveVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="confirmSave">
          {{ store.formId ? '更新' : '创建' }}
        </el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="loadVisible"
      title="从后端加载"
      width="560px"
      append-to-body
    >
      <el-table
        v-loading="loadingList"
        :data="formList"
        highlight-current-row
        height="320"
        @current-change="(row: FormListItem | undefined) => (selectedLoadId = row?.id ?? null)"
      >
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="name" label="标识名" min-width="120" />
        <el-table-column prop="title" label="标题" min-width="140" />
        <el-table-column prop="updatedAt" label="更新时间" min-width="170" />
      </el-table>
      <template #footer>
        <el-button @click="loadVisible = false">取消</el-button>
        <el-button type="primary" :loading="loadingForm" @click="confirmLoad">加载</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="previewVisible"
      title="运行时预览"
      width="640px"
      append-to-body
      destroy-on-close
    >
      <SchemaForm
        v-if="store.fields.length"
        :schema="store.schema"
        @submit="(m) => ElMessage.success('提交: ' + JSON.stringify(m))"
      />
      <el-empty v-else description="请先添加字段" />
    </el-dialog>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 56px;
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  flex-shrink: 0;
}

.toolbar__left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar__brand {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  white-space: nowrap;
}

.toolbar__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.json-view {
  margin: 0;
  padding: 12px;
  font-size: 12px;
  line-height: 1.5;
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: 6px;
  overflow: auto;
  max-height: calc(100vh - 180px);
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
