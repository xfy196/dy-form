<script setup lang="ts">
import { computed } from 'vue'
import { WIDGET_METAS } from '@/schema/defaults'
import type { WidgetType } from '@/schema/types'
import { useDesignerStore } from './store'

const store = useDesignerStore()

const groups = computed(() => {
  const map = {
    input: { label: '输入型', items: WIDGET_METAS.filter((m) => m.group === 'input') },
    select: { label: '选择型', items: WIDGET_METAS.filter((m) => m.group === 'select') },
    layout: { label: '布局', items: WIDGET_METAS.filter((m) => m.group === 'layout') },
  }
  return Object.values(map)
})

function onDragStart(e: DragEvent, type: WidgetType) {
  e.dataTransfer?.setData('widget-type', type)
  e.dataTransfer!.effectAllowed = 'copy'
}

function add(type: WidgetType) {
  store.addWidget(type)
}
</script>

<template>
  <div class="palette">
    <h3 class="palette__title">组件库</h3>
    <div v-for="group in groups" :key="group.label" class="palette__group">
      <div class="palette__group-label">{{ group.label }}</div>
      <div class="palette__grid">
        <div
          v-for="item in group.items"
          :key="item.type"
          class="palette__item"
          draggable="true"
          @dragstart="onDragStart($event, item.type)"
          @click="add(item.type)"
        >
          {{ item.label }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.palette {
  height: 100%;
  padding: 12px;
  overflow: auto;
  background: #fafafa;
  border-right: 1px solid #e4e7ed;
}

.palette__title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.palette__group {
  margin-bottom: 16px;
}

.palette__group-label {
  margin-bottom: 8px;
  font-size: 12px;
  color: #909399;
}

.palette__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.palette__item {
  padding: 10px 8px;
  font-size: 13px;
  text-align: center;
  color: #606266;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  cursor: grab;
  user-select: none;
  transition: border-color 0.15s, color 0.15s;
}

.palette__item:hover {
  color: #409eff;
  border-color: #409eff;
}

.palette__item:active {
  cursor: grabbing;
}
</style>
