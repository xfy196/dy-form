<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import SchemaForm from '@/renderer/SchemaForm.vue'
import type { FormSchema } from '@/schema/types'
import { validateFormSchema } from '@/schema/validate'
import sampleSchema from '@/mock/sample-schema.json'

const router = useRouter()
const schema = ref<FormSchema | null>(null)
const result = ref('')

const title = computed(() => schema.value?.title || '表单预览')

onMounted(() => {
  const cached = sessionStorage.getItem('dy-form-preview-schema')
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as FormSchema
      const check = validateFormSchema(parsed)
      if (check.valid) {
        schema.value = parsed
        return
      }
    } catch {
      // fall through to sample
    }
  }
  schema.value = sampleSchema as FormSchema
})

function onSubmit(model: Record<string, unknown>) {
  result.value = JSON.stringify(model, null, 2)
  ElMessage.success('校验通过并已提交')
}

function back() {
  router.push({ name: 'designer' })
}
</script>

<template>
  <div class="preview-page">
    <header class="preview-page__header">
      <div>
        <h2>{{ title }}</h2>
        <p>根据 JSON Schema 动态渲染（模拟后端下发）</p>
      </div>
      <el-button @click="back">返回设计器</el-button>
    </header>

    <div class="preview-page__body">
      <el-card shadow="never" class="preview-page__form">
        <SchemaForm
          v-if="schema"
          :schema="schema"
          @submit="onSubmit"
        />
      </el-card>

      <el-card v-if="result" shadow="never" class="preview-page__result">
        <template #header>提交结果</template>
        <pre>{{ result }}</pre>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.preview-page {
  min-height: 100vh;
  padding: 24px;
  background: linear-gradient(160deg, #f5f7fa 0%, #eef2f7 100%);
}

.preview-page__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  max-width: 720px;
  margin: 0 auto 20px;
}

.preview-page__header h2 {
  margin: 0 0 6px;
  font-size: 22px;
  color: #303133;
}

.preview-page__header p {
  margin: 0;
  font-size: 13px;
  color: #909399;
}

.preview-page__body {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-page__result pre {
  margin: 0;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
