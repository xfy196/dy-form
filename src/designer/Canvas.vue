<script setup lang="ts">
import { computed } from 'vue'
import draggable from 'vuedraggable'
import { Delete } from '@element-plus/icons-vue'
import type { WidgetType } from '@/schema/types'
import { resolveWidget } from '@/widgets/registry'
import { useDesignerStore } from './store'

const store = useDesignerStore()

const list = computed({
  get: () => store.fields,
  set: (val) => store.reorder(val),
})

function onDrop(e: DragEvent) {
  e.preventDefault()
  const type = e.dataTransfer?.getData('widget-type') as WidgetType | undefined
  if (type) store.addWidget(type)
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
}

function isSelected(id: string) {
  return store.selectedId === id
}
</script>

<template>
  <div class="canvas" @drop="onDrop" @dragover="onDragOver">
    <div v-if="!list.length" class="canvas__empty">
      从左侧拖拽或点击组件添加到此处
    </div>

    <draggable
      v-model="list"
      item-key="id"
      class="canvas__list"
      ghost-class="canvas__ghost"
      chosen-class="canvas__chosen"
      animation="180"
    >
      <template #item="{ element }">
        <div
          class="canvas__item"
          :class="{ 'is-active': isSelected(element.id) }"
          @click.stop="store.select(element.id)"
        >
          <div class="canvas__item-head">
            <span class="canvas__item-label">
              {{ element.schema.title || element.name }}
              <em>({{ element.name }})</em>
            </span>
            <el-button
              type="danger"
              link
              :icon="Delete"
              @click.stop="store.removeField(element.id)"
            />
          </div>

          <div class="canvas__item-body">
            <template v-if="element.schema['x-hidden-value'] || element.schema.type === 'void'">
              <el-divider content-position="left">
                {{ element.schema['x-component-props']?.content || element.schema.title }}
              </el-divider>
            </template>
            <el-form-item
              v-else
              :label="element.schema.title"
              label-width="90px"
            >
              <component
                :is="resolveWidget(element.schema['x-component'])"
                v-bind="element.schema['x-component-props'] || {}"
                disabled
              />
            </el-form-item>
          </div>
        </div>
      </template>
    </draggable>
  </div>
</template>

<style scoped>
.canvas {
  height: 100%;
  padding: 16px;
  overflow: auto;
  background: #f0f2f5;
}

.canvas__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  color: #909399;
  font-size: 14px;
  background: #fff;
  border: 1px dashed #dcdfe6;
  border-radius: 6px;
}

.canvas__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 100%;
}

.canvas__item {
  padding: 12px 12px 4px;
  background: #fff;
  border: 1px solid transparent;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  cursor: move;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.canvas__item:hover {
  border-color: #c6e2ff;
}

.canvas__item.is-active {
  border-color: #409eff;
  box-shadow: 0 0 0 1px #409eff inset;
}

.canvas__item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.canvas__item-label {
  font-size: 12px;
  color: #909399;
}

.canvas__item-label em {
  font-style: normal;
  color: #c0c4cc;
}

.canvas__item-body :deep(.el-form-item) {
  margin-bottom: 12px;
}

.canvas__ghost {
  opacity: 0.5;
}

.canvas__chosen {
  cursor: grabbing;
}
</style>
