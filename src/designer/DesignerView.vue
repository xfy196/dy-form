<script setup lang="ts">
import Toolbar from './Toolbar.vue'
import Palette from './Palette.vue'
import Canvas from './Canvas.vue'
import PropsPanel from './PropsPanel.vue'
</script>

<template>
  <div class="designer">
    <Toolbar />
    <div class="designer__body">
      <aside class="designer__left">
        <Palette />
      </aside>
      <main class="designer__center">
        <Canvas />
      </main>
      <aside class="designer__right">
        <PropsPanel />
      </aside>
    </div>
  </div>
</template>

<style scoped>
.designer {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: #fff;
}

.designer__body {
  display: grid;
  grid-template-columns: 240px 1fr 280px;
  flex: 1;
  min-height: 0;
}

.designer__left,
.designer__right,
.designer__center {
  min-height: 0;
  overflow: hidden;
}
</style>
