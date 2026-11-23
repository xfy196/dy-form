<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  DocumentCopy,
  Download,
  Upload,
  View,
  Delete,
  Monitor,
} from '@element-plus/icons-vue'
import SchemaForm from '@/renderer/SchemaForm.vue'
import { useDesignerStore } from './store'

const store = useDesignerStore()
const router = useRouter()

const jsonDrawer = ref(false)
const importVisible = ref(false)
const previewVisible = ref(false)
const importText = ref('')
const jsonText = ref('')

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
</script>

<template>
  <div class="toolbar">
    <div class="toolbar__left">
      <span class="toolbar__brand">表单设计器</span>
      <el-input
        v-model="store.formTitle"
        size="small"
        style="width: 200px"
        placeholder="表单标题"
      />
    </div>
    <div class="toolbar__actions">
      <el-button @click="router.push({ name: 'list-config' })">列表配置</el-button>
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
  height: 56px;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
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
