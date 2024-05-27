<template>
    <div class="order-history-container">
      <header>
        <h1 @click="goToMainPage">108번가</h1>
        <div class="user-info">
          {{ userName }}님 | 
          <router-link to="/mypage">마이페이지</router-link> |
          <a href="#" @click="logout">로그아웃</a>
        </div>
      </header>
      <main>
        <h2>구매 목록</h2>
        <div v-if="orders.length === 0">구매 목록이 없습니다.</div>
        <div v-else>
          <div v-for="order in orders" :key="order.id" class="order-item">
            <h3>주문 ID: {{ order.id }}</h3>
            <div v-for="item in order.items" :key="item.item_id" class="order-item-details">
              <p>{{ item.name }} - {{ item.quantity }}개 - {{ item.price }}원</p>
            </div>
            <p>총 금액: {{ order.total_amount }}원</p>
            <button @click="deleteOrder(order.id)">삭제</button>
          </div>
        </div>
      </main>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    data() {
      return {
        userName: '익명',
        orders: []
      };
    },
    methods: {
      async fetchOrders() {
        const userId = localStorage.getItem('userId');
        try {
          const response = await axios.get(`${process.env.VUE_APP_BACKEND_URL}/orders/${userId}`);
          this.orders = response.data;
        } catch (error) {
          console.error('Failed to fetch orders:', error);
        }
      },
      async deleteOrder(orderId) {
        try {
          await axios.delete(`${process.env.VUE_APP_BACKEND_URL}/orders/${orderId}`);
          this.orders = this.orders.filter(order => order.id !== orderId);
          alert('주문이 삭제되었습니다.');
        } catch (error) {
          console.error('Failed to delete order:', error);
          alert('주문 삭제에 실패했습니다.');
        }
      },
      async fetchUserName() {
        try {
          const response = await axios.get(`${process.env.VUE_APP_BACKEND_URL}/username`, {
            params: { userId: localStorage.getItem('userId') }
          });
          this.userName = response.data.name;
        } catch (error) {
          console.error('Error fetching user name:', error);
        }
      },
      goToMainPage() {
        this.$router.push('/mainpage');
      },
      async logout() {
        const userId = localStorage.getItem('userId');
        try {
          await axios.post(`${process.env.VUE_APP_BACKEND_URL}/userlogout`, { userId });
          localStorage.removeItem('userId');
          this.$router.push('/userlogin');
        } catch (error) {
          console.error('로그아웃 실패:', error);
        }
      }
    },
    created() {
      this.fetchUserName();
      this.fetchOrders();
  
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert("비정상적인 접근입니다.");
        this.$router.push('/userlogin');
      }
    }
  };
  </script>
  
  <style>
  .order-history-container {
    text-align: center;
  }
  header {
    background-color: #f8f9fa;
    padding: 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  h1 {
    margin: 0;
    cursor: pointer;
  }
  main {
    padding: 20px;
  }
  .order-item {
    border: 1px solid #dee2e6;
    padding: 10px;
    margin: 10px 0;
  }
  .order-item-details {
    padding-left: 20px;
  }
  button {
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    margin: 10px 0;
  }
  button:hover {
    background-color: #0056b3;
  }
  </style>
  