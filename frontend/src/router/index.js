import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/AdminView.vue')
  },
  {
    path: '/voting',
    name: 'Voting',
    component: () => import('../views/VotingView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router