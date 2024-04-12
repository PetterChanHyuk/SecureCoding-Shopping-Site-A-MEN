import { createRouter, createWebHistory } from 'vue-router';
import UserLogin from '../components/UserLogin.vue';
import UserRegister from '../components/UserRegister.vue';
import MainPage from '../components/MainPage.vue';
import MyPage from '../components/MyPage.vue';
import FindAccount from '../components/FindAccount';
import ResetPassword from '../components/ResetPassword';
import EmailVerification from '../components/EmailVerification.vue';

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
];

// 라우터 인스턴스 생성 및 내보내기
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

export default router;
