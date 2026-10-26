import { createRouter, createWebHistory } from 'vue-router'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'editor',
      component: () => import('@/pages/editor/ui/EditorPage.vue'),
    },
    {
      path: '/schemes/:id(\\d+)',
      name: 'scheme',
      component: () => import('@/pages/editor/ui/EditorPage.vue'),
    },
  ],
})
