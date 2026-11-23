<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Delete,
  DocumentCopy,
  Download,
  Edit,
  Bottom,
  Top,
  Plus,
  Upload,
  View,
} from '@element-plus/icons-vue'
import type { FieldNode, FieldSchema } from '@/schema/types'
import { WIDGET_METAS, createDefaultFieldSchema } from '@/schema/defaults'
import SchemaForm from '@/renderer/SchemaForm.vue'
import FieldEditorForm from './FieldEditorForm.vue'
import { useListConfigStore } from './store'

const store = useListConfigStore()
const router = useRouter()

const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<string | null>(null)
const draft = reactive({
  name: '',
  schema: createDefaultFieldSchema('Input') as FieldSchema,
})

const jsonDrawer = ref(false)
const jsonText = ref('')
const importVisible = ref(false)
const importText = ref('')
const previewVisible = ref(false)

const widgetLabelMap = computed(() =>
  Object.fromEntries(WIDGET_METAS.map((m) => [m.type, m.label])),
)

function openCreate() {
  isEdit.value = false
  editingId.value = null
  draft.name = `input_${Date.now().toString().slice(-4)}`
  draft.schema = createDefaultFieldSchema('Input')
  dialogVisible.value = true
}

function openEdit(row: FieldNode) {
  isEdit.value = true
  editingId.value = row.id
  draft.name = row.name
  draft.schema = JSON.parse(JSON.stringify(row.schema)) as FieldSchema
  dialogVisible.value = true
}

function saveDraft() {
  const ok = isEdit.value && editingId.value
    ? store.updateField(editingId.value, draft.name, draft.schema)
    : store.addField(draft.name, draft.schema)
  if (ok) {
    dialogVisible.value = false
    ElMessage.success(isEdit.value ? '已更新' : '已新增')
  }
}

async function removeRow(row: FieldNode) {
  await ElMessageBox.confirm(`确认删除字段「${row.schema.title || row.name}」？`, '删除确认', {
    type: 'warning',
  })
  store.removeField(row.id)
}

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

function confirmImport() {
  try {
    const parsed = JSON.parse(importText.value)
    if (store.importSchema(parsed)) importVisible.value = false
  } catch {
    ElMessage.error('JSON 解析失败')
  }
}

function goPreview() {
  sessionStorage.setItem('dy-form-preview-schema', store.exportSchemaJson())
  router.push({ name: 'preview' })
}

function isRequired(row: FieldNode) {
  return !!row.schema['x-rules']?.some((r) => r.required)
}
</script>

<template>
  <div class="list-config">
    <header class="list-config__header">
      <div class="list-config__title-wrap">
        <h2>字段配置列表</h2>
        <el-input
          v-model="store.formTitle"
          size="small"
          style="width: 220px"
          placeholder="表单标题"
        />
      </div>
      <div class="list-config__actions">
        <el-button @click="$router.push({ name: 'designer' })">可视化设计器</el-button>
        <el-button :icon="View" @click="previewVisible = true">运行预览</el-button>
        <el-button @click="goPreview">预览页</el-button>
        <el-button :icon="DocumentCopy" @click="openJson">查看 JSON</el-button>
        <el-button :icon="Download" @click="downloadJson">导出</el-button>
        <el-button :icon="Upload" @click="importVisible = true; importText = ''">导入</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreate">新增字段</el-button>
      </div>
    </header>

    <el-card shadow="never" class="list-config__card">
      <el-table :data="store.fields" stripe empty-text="暂无字段，点击右上角新增">
        <el-table-column type="index" label="#" width="56" />
        <el-table-column prop="name" label="字段名" min-width="120" />
        <el-table-column label="标题" min-width="120">
          <template #default="{ row }">{{ row.schema.title || '-' }}</template>
        </el-table-column>
        <el-table-column label="表单类型" width="120">
          <template #default="{ row }">
            {{ widgetLabelMap[row.schema['x-component']] || row.schema['x-component'] }}
          </template>
        </el-table-column>
        <el-table-column label="必填" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="isRequired(row)" type="danger" size="small">是</el-tag>
            <span v-else class="muted">否</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row, $index }">
            <el-button link type="primary" :icon="Edit" @click="openEdit(row)">编辑</el-button>
            <el-button
              link
              :icon="Top"
              :disabled="$index === 0"
              @click="store.moveField(row.id, -1)"
            >
              上移
            </el-button>
            <el-button
              link
              :icon="Bottom"
              :disabled="$index === store.fields.length - 1"
              @click="store.moveField(row.id, 1)"
            >
              下移
            </el-button>
            <el-button link type="danger" :icon="Delete" @click="removeRow(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑字段' : '新增字段'"
      width="520px"
      append-to-body
      destroy-on-close
    >
      <FieldEditorForm
        v-model:name="draft.name"
        v-model:schema="draft.schema"
        :type-selectable="!isEdit"
      />
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveDraft">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="jsonDrawer" title="FormSchema JSON" size="40%" append-to-body>
      <pre class="json-view">{{ jsonText }}</pre>
      <template #footer>
        <el-button type="primary" @click="copyJson">复制</el-button>
      </template>
    </el-drawer>

    <el-dialog v-model="importVisible" title="导入 Schema JSON" width="560px" append-to-body>
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
      <el-empty v-else description="请先新增字段" />
    </el-dialog>
  </div>
</template>

<style scoped>
.list-config {
  min-height: 100vh;
  padding: 20px 24px 40px;
  background: linear-gradient(160deg, #f5f7fa 0%, #eef2f7 100%);
}

.list-config__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.list-config__title-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.list-config__title-wrap h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.list-config__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.list-config__card {
  border-radius: 8px;
}

.muted {
  color: #c0c4cc;
  font-size: 13px;
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
