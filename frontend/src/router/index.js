import { createRouter, createWebHistory } from 'vue-router'
import VotingView from '../views/VotingView.vue'
import AdminView from '../views/AdminView.vue'
import AddChiliView from '../views/AddChiliView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/vote'
    },
    {
      path: '/vote',
      name: 'vote',
      component: VotingView
    },
    {
      path: '/add-chili',
      name: 'add-chili',
      component: AddChiliView
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView
    }
  ]
})

export default router