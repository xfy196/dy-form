USE `dy-form-dev`;

CREATE TABLE IF NOT EXISTS `dataset` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` VARCHAR(100) NOT NULL COMMENT '唯一标识',
  `title` VARCHAR(200) NOT NULL DEFAULT '' COMMENT '展示名',
  `method` VARCHAR(10) NOT NULL DEFAULT 'GET' COMMENT 'HTTP 方法',
  `url` VARCHAR(1000) NOT NULL COMMENT '请求地址',
  `headers_json` JSON NULL COMMENT '请求头',
  `body_json` JSON NULL COMMENT 'POST body',
  `data_path` VARCHAR(200) NOT NULL DEFAULT '' COMMENT '响应数组路径',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_dataset_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='数据集';

CREATE TABLE IF NOT EXISTS `form_field` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `name` VARCHAR(100) NOT NULL COMMENT '字段名',
  `title` VARCHAR(200) NOT NULL DEFAULT '' COMMENT '标题',
  `component` VARCHAR(50) NOT NULL COMMENT '控件类型',
  `json_type` VARCHAR(20) NOT NULL DEFAULT 'string' COMMENT 'JSON Schema type',
  `required` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否必填',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
  `props_json` JSON NULL COMMENT '控件 props',
  `options_mode` VARCHAR(20) NULL COMMENT 'static|dataset',
  `options_json` JSON NULL COMMENT '静态选项',
  `dataset_id` BIGINT UNSIGNED NULL COMMENT '关联数据集',
  `value_key` VARCHAR(100) NULL COMMENT '数据集 value 字段',
  `label_key` VARCHAR(100) NULL COMMENT '数据集 label 字段',
  `rules_json` JSON NULL COMMENT '校验规则',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_field_name` (`name`),
  KEY `idx_field_sort` (`sort_order`),
  KEY `idx_field_dataset` (`dataset_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='全局字段库';
