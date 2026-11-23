# dy-form — Element Plus 表单设计器 + JSON Schema 渲染器

基于 **Vue 3 + Element Plus** 的可视化表单设计器。设计结果导出为带 `x-*` 扩展的 JSON Schema；业务页使用同一 Schema 通过 `SchemaForm` 动态渲染与校验。

## 快速开始

```bash
npm install
npm run dev
```

- 可视化设计器：[/](http://localhost:5173/)
- 列表配置（表格新增/编辑）：[/list](http://localhost:5173/list)
- 预览页：[/preview](http://localhost:5173/preview)（默认加载 `src/mock/sample-schema.json`；也可从设计器「预览页」跳转并携带当前 Schema）

## Schema 约定

字段以 **数组** 保存（顺序即渲染顺序）：

```json
{
  "type": "object",
  "title": "用户信息",
  "fields": [
    {
      "name": "name",
      "type": "string",
      "title": "姓名",
      "required": true,
      "x-component": "Input",
      "x-component-props": { "placeholder": "请输入姓名" },
      "x-rules": [{ "required": true, "message": "必填" }]
    },
    {
      "name": "gender",
      "type": "string",
      "title": "性别",
      "x-component": "Radio",
      "x-component-props": {
        "options": [
          { "label": "男", "value": "male" },
          { "label": "女", "value": "female" }
        ]
      }
    }
  ]
}
```

| 字段 | 说明 |
|------|------|
| `fields` | 字段数组，顺序即渲染/提交顺序 |
| `fields[].name` | 字段名（写入表单 model 的 key） |
| `fields[].required` | 是否必填（与 `x-rules` 同步） |
| `type` / `title` / `enum` / `default` | 字段类型与默认值 |
| `x-component` | 控件名，对应 Widget Registry |
| `x-component-props` | 透传给 Element Plus 控件的 props |
| `x-rules` | Element Plus 表单校验规则 |
| `x-hidden-value` | 布局控件（如 Divider）不写入 model |

导入时仍兼容旧版 `properties` + `x-order` 结构，导入后会转为 `fields` 数组。

### 首期控件

`Input` / `Textarea` / `InputNumber` / `Select` / `Radio` / `Checkbox` / `Switch` / `DatePicker` / `TimePicker` / `Divider`

## SchemaForm API

```vue
<script setup lang="ts">
import { ref } from 'vue'
import SchemaForm from '@/renderer/SchemaForm.vue'
import type { FormSchema } from '@/schema/types'

const formRef = ref<InstanceType<typeof SchemaForm>>()
const schema = ref<FormSchema>(/* 后端返回的 schema */)

async function submit() {
  const ok = await formRef.value?.validate()
  if (ok) {
    const data = formRef.value?.getModel()
    console.log(data)
  }
}
</script>

<template>
  <SchemaForm
    ref="formRef"
    :schema="schema"
    label-width="100px"
    @submit="(model) => console.log(model)"
  />
</template>
```

暴露方法：

- `validate()` — 校验，返回 `Promise<boolean>`
- `getModel()` — 获取当前表单值（深拷贝）
- `reset()` — 按 schema 默认值重置
- `model` — 响应式表单对象

## 设计器用法

1. 左侧点击或拖拽组件到画布
2. 画布内拖拽排序、点击选中、删除
3. 右侧编辑字段名、标题、必填、占位符、选项等
4. 工具栏：运行预览 / 查看 JSON / 导出 / 导入 / 清空

## 目录结构

```
src/
  schema/      # 类型、默认值、转换、校验
  widgets/     # 控件组件与注册表
  renderer/    # SchemaForm 动态渲染
  designer/    # 可视化设计器
  views/       # 页面
  mock/        # 示例 schema
```

## 脚本

```bash
npm run dev      # 开发
npm run build    # 类型检查 + 构建
npm run preview  # 预览构建产物
```
