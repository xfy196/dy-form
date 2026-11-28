<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Delete,
  Edit,
  Bottom,
  Top,
  Plus,
  View,
  FolderOpened,
} from '@element-plus/icons-vue'
import { WIDGET_METAS } from '@/schema/defaults'
import SchemaForm from '@/renderer/SchemaForm.vue'
import { checkBackendHealth } from '@/api/http'
import type { FieldRecord } from '@/api/fields'
import FieldEditorForm from './FieldEditorForm.vue'
import { useListConfigStore } from './store'
import type { FieldDraft } from './fieldDraft'

const store = useListConfigStore()
const router = useRouter()

const backendOnline = ref<boolean | null>(null)
let healthTimer: number | undefined

async function refreshBackendHealth() {
  backendOnline.value = await checkBackendHealth()
}

onMounted(async () => {
  void refreshBackendHealth()
  healthTimer = window.setInterval(() => {
    void refreshBackendHealth()
  }, 10000)
  await store.loadFields()
})

onUnmounted(() => {
  if (healthTimer) window.clearInterval(healthTimer)
})

const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const draft = ref<FieldDraft>(store.createEmptyDraft())
const saving = ref(false)

const previewVisible = ref(false)
const previewLoading = ref(false)

const widgetLabelMap = Object.fromEntries(WIDGET_METAS.map((m) => [m.type, m.label]))

function openCreate() {
  isEdit.value = false
  editingId.value = null
  draft.value = store.createEmptyDraft()
  dialogVisible.value = true
}

function openEdit(row: FieldRecord) {
  isEdit.value = true
  editingId.value = row.id
  draft.value = store.toDraft(row)
  dialogVisible.value = true
}

async function saveDraft() {
  if (backendOnline.value === false) {
    ElMessage.error('后端未连通')
    return
  }
  saving.value = true
  try {
    await store.saveDraft(draft.value, editingId.value)
    dialogVisible.value = false
    ElMessage.success(isEdit.value ? '已更新' : '已新增')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '保存失败')
  } finally {
    saving.value = false
  }
}

async function removeRow(row: FieldRecord) {
  await ElMessageBox.confirm(`确认删除字段「${row.title || row.name}」？`, '删除确认', {
    type: 'warning',
  })
  try {
    await store.removeField(row.id)
    ElMessage.success('已删除')
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '删除失败')
  }
}

async function openPreview() {
  if (!store.sortedFields.length) {
    ElMessage.warning('请先新增字段')
    return
  }
  previewLoading.value = true
  try {
    await store.preparePreview()
    previewVisible.value = true
  } catch (err) {
    ElMessage.error(err instanceof Error ? err.message : '预览失败')
  } finally {
    previewLoading.value = false
  }
}
</script>

<template>
  <div class="list-config">
    <header class="list-config__header">
      <div class="list-config__title-wrap">
        <h2>全局字段库</h2>
        <el-tag
          size="small"
          :type="backendOnline === true ? 'success' : backendOnline === false ? 'danger' : 'info'"
        >
          {{ backendOnline === true ? '后端已连通' : backendOnline === false ? '后端未连通' : '检测中…' }}
        </el-tag>
      </div>
      <div class="list-config__actions">
        <el-button type="primary" :icon="Plus" @click="openCreate">新增字段</el-button>
        <el-button :icon="View" :loading="previewLoading" @click="openPreview">运行预览</el-button>
        <el-button :icon="FolderOpened" @click="router.push({ name: 'datasets' })">数据集</el-button>
        <el-button @click="router.push({ name: 'designer' })">可视化设计器</el-button>
        <el-button @click="store.loadFields()">刷新</el-button>
      </div>
    </header>

    <el-card v-loading="store.loading" shadow="never" class="list-config__card">
      <el-table :data="store.sortedFields" stripe empty-text="暂无字段，点击右上角新增">
        <el-table-column type="index" label="#" width="56" />
        <el-table-column prop="name" label="字段名" min-width="120" />
        <el-table-column prop="title" label="标题" min-width="120" />
        <el-table-column label="表单类型" width="120">
          <template #default="{ row }">
            {{ widgetLabelMap[row.component] || row.component }}
          </template>
        </el-table-column>
        <el-table-column label="选项来源" width="110">
          <template #default="{ row }">
            <el-tag v-if="row.optionsMode === 'static'" size="small">静态</el-tag>
            <el-tag v-else-if="row.optionsMode === 'dataset'" size="small" type="warning">数据集</el-tag>
            <span v-else class="muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="必填" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.required" type="danger" size="small">是</el-tag>
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
              :disabled="$index === store.sortedFields.length - 1"
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
      class="field-editor-dialog"
      :title="isEdit ? '编辑字段' : '新增字段'"
      width="720px"
      append-to-body
      destroy-on-close
      align-center
    >
      <div class="dialog-scroll-body">
        <FieldEditorForm v-model:draft="draft" :type-selectable="!isEdit" />
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveDraft">保存到后端</el-button>
      </template>
    </el-dialog>

    <el-dialog
      v-model="previewVisible"
      class="field-preview-dialog"
      title="字段库预览"
      width="720px"
      append-to-body
      destroy-on-close
      align-center
    >
      <div class="dialog-scroll-body">
        <SchemaForm
          v-if="store.previewSchema"
          :schema="store.previewSchema"
          @submit="(m) => ElMessage.success('提交: ' + JSON.stringify(m))"
        />
      </div>
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

.dialog-scroll-body {
  max-height: min(62vh, 560px);
  overflow-y: auto;
  overflow-x: hidden;
  padding-left: 1px;
  padding-right: 4px;
}
</style>

<style>
/* append-to-body：固定弹窗高度，仅内容区滚动，页脚常驻 */
.field-editor-dialog.el-dialog,
.field-preview-dialog.el-dialog {
  margin-top: 8vh !important;
  display: flex;
  flex-direction: column;
  max-height: 84vh;
}

.field-editor-dialog .el-dialog__body,
.field-preview-dialog .el-dialog__body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding-top: 12px;
  padding-bottom: 8px;
}

.field-editor-dialog .el-dialog__footer,
.field-preview-dialog .el-dialog__footer {
  flex-shrink: 0;
}
</style>
