import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'designer',
      component: () => import('@/views/DesignerPage.vue'),
    },
    {
      path: '/list',
      name: 'list-config',
      component: () => import('@/views/ListConfigPage.vue'),
    },
    {
      path: '/datasets',
      name: 'datasets',
      component: () => import('@/views/DatasetsPage.vue'),
    },
    {
      path: '/preview',
      name: 'preview',
      component: () => import('@/views/PreviewPage.vue'),
    },
  ],
})

export default router
