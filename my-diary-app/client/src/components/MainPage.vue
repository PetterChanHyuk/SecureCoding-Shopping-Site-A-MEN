<template>
  <div id="app">
    <header>
      <h1 @click="refreshPage">108번가</h1>
      <div class="timer">자동 로그아웃: {{ remainingTime }}초</div>
      <div class="user-info">
        {{ userName }}님 | 
        <router-link to="/mypage">마이페이지</router-link> |
        <a href="#" @click="logout">로그아웃</a>
      </div>
    </header>
    <main>
      <div>
        <input type="text" v-model="searchQuery" placeholder="Search for items..." />
        <button @click="search">검색</button>
      </div>
      <div class="category-container">
        <button 
          :class="{'active': selectedCategory === null}" 
          @click="filterByCategory(null)">
          전체
        </button>
        <button 
          v-for="category in categories" 
          :key="category.id" 
          @click="filterByCategory(category)"
          :class="{'active': selectedCategory === category}">
          {{ category.name }}
        </button>
      </div>
      <div class="item-container">
        <div v-for="item in filteredItems" :key="item.id" class="item">
          <img :src="getImageUrl(item.image_url)" alt="Item Image" class="item-image" />
          <div class="item-details">
            <h3>{{ escapeHtml(item.name) }}</h3>
            <p>{{ escapeHtml(item.description) }}</p>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import axios from 'axios';
import escapeHtml from 'escape-html';

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
      items: [],
      csrfToken: '' // CSRF 토큰 추가
    };
  },
  computed: {
    filteredItems() {
      return this.items.filter(item => {
        const matchesQuery = escapeHtml(item.name.toLowerCase()).includes(this.filteredQuery.toLowerCase());
        const matchesCategory = this.selectedCategory ? item.category_id === this.selectedCategory.id : true;
        return matchesQuery && matchesCategory;
      });
    }
  },
  methods: {
    async fetchCsrfToken() {
      try {
        const response = await axios.get(`${process.env.VUE_APP_BACKEND_URL}/csrf-token`);
        this.csrfToken = response.data.csrfToken;
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
      }
    },
    getImageUrl(imageUrl) {
      return `${process.env.VUE_APP_BACKEND_URL}/${imageUrl}`;
    },
    search() {
      this.filteredQuery = this.searchQuery;
      this.fetchItems();
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
    async logout() {
      clearInterval(this.timer);
      const userId = localStorage.getItem('userId');
      if (userId) {
        try {
          await axios.post(`${process.env.VUE_APP_BACKEND_URL}/userlogout`, { userId }, {
            headers: { 'X-CSRF-Token': this.csrfToken }
          });
          localStorage.removeItem('userId');
          this.$router.push('/userlogin');
        } catch (error) {
          console.error('로그아웃 실패:', error);
        }
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
    async fetchCategories() {
      try {
        const response = await axios.get(`${process.env.VUE_APP_BACKEND_URL}/categories`);
        this.categories = response.data;
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    },
    async fetchItems() {
      const params = {
        searchQuery: this.searchQuery,
        categoryId: this.selectedCategory ? this.selectedCategory.id : null
      };
      try {
        const response = await axios.get(`${process.env.VUE_APP_BACKEND_URL}/items`, { params });
        this.items = response.data;
      } catch (error) {
        console.error('Error fetching items:', error);
      }
    }
  },
  async created() {
    await this.fetchCsrfToken(); // 컴포넌트 생성 시 CSRF 토큰 가져오기
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
}
#app {
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
input {
  padding: 10px;
  font-size: 16px;
  margin-right: 10px;
}
button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  margin: 5px;
}
button.active {
  background-color: #007bff;
  color: white;
}
.category-container {
  margin: 20px 0;
}
.item-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}
.item {
  background-color: #e9ecef;
  margin: 10px;
  padding: 10px;
  font-size: 18px;
  width: calc(25% - 20px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.item-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
}
.item-details {
  text-align: left;
}
</style>
