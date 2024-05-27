<template>
    <div class="cart-container">
      <header>
        <h1 @click="goToMainPage">108번가</h1>
        <div class="user-info">
          {{ userName }}님 | 
          <router-link to="/mypage">마이페이지</router-link> |
          <a href="#" @click="logout">로그아웃</a>
        </div>
      </header>
      <main>
        <h2>내 장바구니</h2>
        <div v-if="cartItems.length === 0">장바구니가 비어 있습니다.</div>
        <div v-else>
          <div v-for="item in cartItems" :key="item.item_id" class="cart-item">
            <input type="checkbox" v-model="selectedItems" :value="item">
            <img :src="getImageUrl(item.image_url)" alt="Item Image" class="item-image" />
            <p>{{ item.name }}</p>
            <input type="number" v-model.number="item.quantity" @change="updateQuantity(item)">
            <button @click="removeFromCart(item.item_id)">삭제</button>
          </div>
          <button @click="checkout">구매하기</button>
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
        cartItems: [],
        selectedItems: []
      };
    },
    methods: {
      async fetchCartItems() {
        const userId = localStorage.getItem('userId');
        try {
          const response = await axios.get(`${process.env.VUE_APP_BACKEND_URL}/cart/${userId}`);
          this.cartItems = response.data;
        } catch (error) {
          console.error('Failed to fetch cart items:', error);
        }
      },
      async removeFromCart(itemId) {
        const userId = localStorage.getItem('userId');
        try {
          await axios.delete(`${process.env.VUE_APP_BACKEND_URL}/cart/${userId}/${itemId}`);
          this.cartItems = this.cartItems.filter(item => item.item_id !== itemId);
          alert('장바구니에서 아이템이 삭제되었습니다.');
        } catch (error) {
          console.error('Failed to remove item from cart:', error);
          alert('장바구니 아이템 삭제에 실패했습니다.');
        }
      },
      async updateQuantity(item) {
        const userId = localStorage.getItem('userId');
        try {
          await axios.put(`${process.env.VUE_APP_BACKEND_URL}/cart/${userId}/${item.item_id}`, { quantity: item.quantity });
          alert('수량이 업데이트되었습니다.');
        } catch (error) {
          console.error('Failed to update item quantity:', error);
          alert('수량 업데이트에 실패했습니다.');
        }
      },
      async checkout() {
  const userId = localStorage.getItem('userId');
  try {
    const orderItems = this.selectedItems.map(item => ({
      item_id: item.item_id,
      quantity: item.quantity
    }));
    await axios.post(`${process.env.VUE_APP_BACKEND_URL}/orders`, { userId, items: orderItems });
    alert('구매가 완료되었습니다.');
    this.cartItems = this.cartItems.filter(item => !this.selectedItems.includes(item));
    this.selectedItems = [];
  } catch (error) {
    console.error('Failed to complete purchase:', error);
    alert('구매에 실패했습니다.');
  }
},
      getImageUrl(imageUrl) {
        return `${process.env.VUE_APP_BACKEND_URL}/${imageUrl}`;
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
      this.fetchCartItems();
  
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert("비정상적인 접근입니다.");
        this.$router.push('/userlogin');
      }
    }
  };
  </script>
  
  <style>
  .cart-container {
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
  .cart-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin: 10px;
    padding: 10px;
    border-bottom: 1px solid #ddd;
  }
  .item-image {
    width: 50px;
    height: 50px;
    object-fit: cover;
  }
  button {
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
    margin: 5px;
  }
  </style>
