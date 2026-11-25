# dy-form

可视化表单设计器（Vue 3 + Element Plus）+ Egg.js 后端。支持**全局字段库**（字段逐条存库）与**数据集**（下拉 options 可映射上游接口字段）。

```
dy-form/
  frontend/   # Vue 3 + Vite
  backend/    # Egg.js API
```

## 环境要求

- Node.js >= 18
- MySQL（库名 `dy-form-dev`）

## 数据库初始化

```bash
mysql -uroot -proot < backend/sql/init.sql
```

已有库仅补字段库/数据集表时：

```bash
mysql -uroot -proot < backend/sql/002_field_dataset.sql
```

连接：`localhost` / `root` / `root` / `dy-form-dev`

## 启动

```bash
cd backend && npm install && npm run dev
cd frontend && npm install && npm run dev
```

- 字段库：http://127.0.0.1:5173/list
- 数据集：http://127.0.0.1:5173/datasets
- 设计器：http://127.0.0.1:5173/
- 预览页：http://127.0.0.1:5173/preview

Vite 将 `/api` 代理到 `http://127.0.0.1:7001`。

## 核心能力

1. **全局字段库**：新增字段即写入 `form_field`；列表加载全部字段；可排序/编辑/删除。
2. **数据集**：配置 method/url/`data_path`/headers；可预览样例与可用字段名。
3. **Options 双模式**（Select/Radio/Checkbox）：
   - `static`：手动 label|value
   - `dataset`：选数据集并映射 `valueKey` / `labelKey`
4. 内置演示上游：`GET /api/mock/cities`（`data.list`，字段 `code`/`name`）

## 主要 API

响应：`{ code, message, data }`（`code === 0` 成功）

| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | `/api/fields` | 字段列表 / 创建 |
| GET/PUT/DELETE | `/api/fields/:id` | 字段详情 / 更新 / 删除 |
| GET | `/api/fields/:id/options` | 解析后的 options |
| GET/POST | `/api/datasets` | 数据集列表 / 创建 |
| GET/PUT/DELETE | `/api/datasets/:id` | 数据集详情 / 更新 / 删除 |
| POST | `/api/datasets/:id/preview` | 拉取上游并抽样 |
| GET/POST… | `/api/forms` | 旧整表 Schema CRUD（设计器仍可用） |

## 推荐验收路径

1. 数据集页新建，URL 填 `http://127.0.0.1:7001/api/mock/cities`，`data_path`=`data.list`，预览可见城市列表  
2. 字段库新增 Select，选项来源选「关联数据集」，映射 value=`code`、label=`name`，保存  
3. 运行预览，下拉选项来自上游数据  
