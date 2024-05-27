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
import CartPage from '@/components/CartPage.vue'; // 새로 추가된 컴포넌트
import OrderHistoryPage from '@/components/OrderHistoryPage.vue'; // 새로 추가된 컴포넌트

const routes = [
  {
    path: '/',
    name: 'Home',
    component: UserLogin
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
  {
    path: '/cart',
    name: 'CartPage',
    component: CartPage
  },
  {
    path: '/orders',
    name: 'OrderHistoryPage',
    component: OrderHistoryPage
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
});

router.beforeEach((to, from, next) => {
  if (window.location.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
    window.location.href = 'https://' + window.location.hostname + window.location.pathname + window.location.hash;
  } else {
    next();
  }
});

export default router;
