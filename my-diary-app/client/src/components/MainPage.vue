<template>
  <div id="app">
    <header>
      <h1 @click="refreshPage">108번가</h1>
      <div class="user-info">
        {{ userName }}님 |
        <router-link to="/mypage">마이페이지</router-link> |
        <router-link to="/cart">장바구니</router-link> |
        <router-link to="/orders">주문 목록</router-link> |
        <a href="#" @click="logout">로그아웃</a>
      </div>
      <div class="timer">자동 로그아웃: {{ remainingTime }}초</div>
    </header>
    <nav class="category-menu">
      <button :class="{'active': selectedCategory === null}" @click="filterByCategory(null)">
        전체
      </button>
      <button v-for="category in categories" :key="category.id" @click="filterByCategory(category)"
        :class="{'active': selectedCategory === category}">
        {{ category.name }}
      </button>
    </nav>
    <main>
      <div class="search-bar">
        <input type="text" v-model="searchQuery" placeholder="Search for items..." />
        <button @click="search">검색</button>
      </div>
      <div class="item-container">
        <div v-for="item in filteredItems" :key="item.id" class="item">
          <img :src="getImageUrl(item.image_url)" alt="Item Image" class="item-image" />
          <div class="item-details">
            <h3>{{ item.name }}</h3>
            <p>{{ item.description }}</p>
            <div class="item-actions">
              <button @click="addToCart(item.id)">장바구니에 추가</button>
              <button @click="buyNow(item.id)">바로 구매</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'MainPage',
  data() {
    return {
      userName: '익명',
      remainingTime: 600,
      timer: null,
      searchQuery: '',
      filteredQuery: '',
      selectedCategory: null,
      categories: [],
      items: []
    };
  },
  computed: {
    filteredItems() {
      return this.items.filter(item => {
        const matchesQuery = item.name.toLowerCase().includes(this.filteredQuery.toLowerCase());
        const matchesCategory = this.selectedCategory ? item.category_id === this.selectedCategory.id : true;
        return matchesQuery && matchesCategory;
      });
    }
  },
  methods: {
    escapeHtml(text) {
      return text.replace(/[&<>"'`=]/g, function (s) {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
          '`': '&#x60;',
          '=': '&#x3D;'
        }[s];
      });
    },
    getImageUrl(imageUrl) {
      return `${process.env.VUE_APP_BACKEND_URL}/${imageUrl}`;
    },
    search() {
      const validatedQuery = this.validateSearchQuery(this.searchQuery);
      if (!validatedQuery) {
        alert('Invalid search query. Please enter alphanumeric characters only.');
        return;
      }
      this.filteredQuery = validatedQuery;
      this.fetchItems();
    },
    validateSearchQuery(query) {
      const regex = /^[a-zA-Z가-힣0-9 ]*$/;
      if (!regex.test(query)) {
        return false;
      }
      return this.escapeHtml(query);
    },
    refreshPage() {
      window.location.reload();
    },
    filterByCategory(category) {
      this.selectedCategory = category;
      this.fetchItems();
    },
    resetTimer() {
      this.remainingTime = 600;
    },
    updateTimer() {
      if (this.remainingTime > 0) {
        this.remainingTime--;
      } else {
        this.logout();
      }
    },
    logout() {
      clearInterval(this.timer);
      const userId = localStorage.getItem('userId');
      if (userId) {
        axios.post(`${process.env.VUE_APP_BACKEND_URL}/userlogout`, { userId })
          .then(() => {
            localStorage.removeItem('userId');
            this.$router.push('/userlogin');
          })
          .catch(error => {
            console.error('로그아웃 실패:', error);
          });
      }
    },
    fetchUserName() {
      axios.get(`${process.env.VUE_APP_BACKEND_URL}/username`, {
          params: {
          userId: localStorage.getItem('userId')
          }
      })
      .then(response => {
          this.userName = this.escapeHtml(response.data.name);
      })
      .catch(error => {
          console.error('Error fetching user name:', error);
      });
    },
    fetchCategories() {
      axios.get(`${process.env.VUE_APP_BACKEND_URL}/categories`)
        .then(response => {
          this.categories = response.data.map(category => ({
            ...category,
            name: this.escapeHtml(category.name)
          }));
        })
        .catch(error => {
          console.error('Error fetching categories:', error);
        });
    },
    fetchItems() {
      const params = {
        searchQuery: this.filteredQuery,
        categoryId: this.selectedCategory ? this.selectedCategory.id : null
      };
      axios.get(`${process.env.VUE_APP_BACKEND_URL}/items`, { params })
        .then(response => {
          this.items = response.data.map(item => ({
            ...item,
            name: this.escapeHtml(item.name),
            description: this.escapeHtml(item.description)
          }));
        })
        .catch(error => {
          console.error('Error fetching items:', error);
        });
    },
    addToCart(itemId) {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('로그인이 필요합니다.');
        this.$router.push('/userlogin');
        return;
      }
      axios.post(`${process.env.VUE_APP_BACKEND_URL}/cart`, { userId, itemId, quantity: 1 })
        .then(() => {
          alert('장바구니에 추가되었습니다.');
        })
        .catch(error => {
          console.error('Failed to add item to cart:', error);
          alert('장바구니 추가에 실패했습니다.');
        });
    },
    buyNow(itemId) {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert('로그인이 필요합니다.');
        this.$router.push('/userlogin');
        return;
      }
      axios.post(`${process.env.VUE_APP_BACKEND_URL}/orders`, { userId, items: [{ item_id: itemId, quantity: 1 }] })
        .then(() => {
          alert('구매가 완료되었습니다.');
        })
        .catch(error => {
          console.error('Failed to complete purchase:', error);
          alert('구매에 실패했습니다.');
        });
    }
  },
  created() {
    this.fetchUserName();
    this.fetchCategories();
    this.fetchItems();

    const userId = localStorage.getItem('userId');
    if (!userId) {
      alert("비정상적인 접근입니다.");
      this.$router.push('/userlogin');
    }
  },
  mounted() {
    this.timer = setInterval(this.updateTimer, 1000);

    window.addEventListener('mousemove', this.resetTimer);
    window.addEventListener('keydown', this.resetTimer);
  },
  beforeUnmount() {
    clearInterval(this.timer);
    window.removeEventListener('mousemove', this.resetTimer);
    window.removeEventListener('keydown', this.resetTimer);
  }
};
</script>

<style>
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 0;
  background-color: #f2f2f2;
}
#app {
  text-align: center;
}
header {
  background-color: #ffffff;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ddd;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
header h1 {
  margin: 0;
  cursor: pointer;
  font-size: 24px;
  color: #333;
}
.user-info {
  margin-left: auto;
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #333;
}
.user-info a, .user-info span {
  margin: 0 10px;
  text-decoration: none;
  color: #333;
}
.timer {
  margin-left: 20px;
  font-size: 14px;
  color: #777;
}
nav.category-menu {
  background-color: #fff;
  padding: 10px;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: center;
}
nav.category-menu button {
  background-color: transparent;
  border: none;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;
}
nav.category-menu button.active, nav.category-menu button:hover {
  background-color: #007bff;
  color: white;
}
main {
  padding: 20px;
}
.search-bar {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}
.search-bar input {
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
}
.search-bar button {
  padding: 10px;
  font-size: 16px;
  border: 1px solid #007bff;
  border-left: none;
  background-color: #007bff;
  color: white;
  cursor: pointer;
  border-radius: 0 4px 4px 0;
}
.item-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}
.item {
  background-color: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  margin: 10px;
  padding: 20px;
  width: calc(25% - 40px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}
.item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);
}
.item img.item-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-bottom: 1px solid #ddd;
  margin-bottom: 10px;
}
.item .item-details {
  text-align: left;
}
.item .item-details h3 {
  font-size: 18px;
  margin: 10px 0;
  color: #333;
}
.item .item-details p {
  font-size: 14px;
  color: #777;
}
.item .item-actions {
  display: flex;
  justify-content: space-between;
}
.item .item-actions button {
  padding: 10px;
  font-size: 14px;
  cursor: pointer;
  border: none;
  background-color: #007bff;
  color: white;
  border-radius: 4px;
  transition: background-color 0.3s;
}
.item .item-actions button:hover {
  background-color: #0056b3;
}
</style>
