import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import QuizView from '../views/QuizView.vue'
import ReviewView from '../views/ReviewView.vue'
import CompleteView from '../views/CompleteView.vue'
import HistoryView from '../views/HistoryView.vue'
import AdminView from '../views/AdminView.vue'

const routes = [
  { path: '/', component: HomeView },
  { path: '/quiz', component: QuizView },
  { path: '/review', component: ReviewView },
  { path: '/complete', component: CompleteView },
  { path: '/history', component: HistoryView },
  { path: '/admin', component: AdminView },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
