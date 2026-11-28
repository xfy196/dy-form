-- 字段库：支持数据集 label 模板字符串（如 ${code} - ${name}）
ALTER TABLE `form_field`
  ADD COLUMN `label_template` VARCHAR(255) NULL COMMENT '数据集 label 模板' AFTER `label_key`;
