<script setup lang="ts">
defineProps<{
  content?: string
}>()
</script>

<template>
  <el-divider content-position="left">
    {{ content || '分割线' }}
  </el-divider>
</template>
