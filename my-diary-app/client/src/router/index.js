import { createRouter, createWebHistory } from 'vue-router';
import UserLogin from '../components/UserLogin.vue';
import UserRegister from '../components/UserRegister.vue';
import MainPage from '../components/MainPage.vue';
import MyPage from '../components/MyPage.vue';
import FindAccount from '../components/FindAccount';
import ResetPassword from '../components/ResetPassword';
import EmailVerification from '../components/EmailVerification.vue';
import AddItem from '@/components/AddItem';
import EditItem from '@/components/EditItem';

// 라우터 정의
const routes = [
  {
    path: '/',
    name: 'Home',
    component: UserLogin // 기본 페이지로 설정
  },
  {
    path: '/userlogin',
    name: 'UserLogin',
    component: UserLogin
  },
  {
    path: '/userregister',
    name: 'UserRegister',
    component: UserRegister
  },
  {
    path: '/mainpage',
    name: 'MainPage',
    component: MainPage
  },
  {
    path: '/mypage',
    name: 'MyPage',
    component: MyPage
  },
  {
    path: '/find-account',
    name: 'FindAccount',
    component: FindAccount
  },
  {
    path: '/reset-password',
    name: 'ResetPassword',
    component: ResetPassword,
  },
  {
    path: '/verify-email',
    name: 'EmailVerification',
    component: EmailVerification
  },
  {
    path: '/add-item',
    name: 'AddItem',
    component: AddItem
  },
  {
    path: '/edit-item/:id',
    name: 'EditItem',
    component: EditItem
  },
];

// 라우터 인스턴스 생성 및 내보내기
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

// HTTPS 강제를 위한 글로벌 가드 추가
router.beforeEach((to, from, next) => {
  if (window.location.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
    window.location.href = 'https://' + window.location.hostname + window.location.pathname + window.location.hash;
  } else {
    next();
  }
});

export default router;
