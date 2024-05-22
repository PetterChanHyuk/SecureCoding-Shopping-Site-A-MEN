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
            <h3>{{ item.name }}</h3>
            <p>{{ item.description }}</p>
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
      const regex = /^[a-zA-Z0-9 ]*$/;
      if (!regex.test(query)) {
        return false;
      }
      // SQL 인젝션을 방지하기 위해 입력 값에 대해 이스케이핑 수행
      const escapedQuery = query.replace(/'/g, "''");

      // 이스케이핑된 검색어 반환
      return escapedQuery;
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
          this.userName = response.data.name;
      })
      .catch(error => {
          console.error('Error fetching user name:', error);
      });
    },
    fetchCategories() {
      axios.get(`${process.env.VUE_APP_BACKEND_URL}/categories`)
        .then(response => {
          this.categories = response.data;
        })
        .catch(error => {
          console.error('Error fetching categories:', error);
        });
    },
    fetchItems() {
      const params = {
        searchQuery: this.searchQuery,
        categoryId: this.selectedCategory ? this.selectedCategory.id : null
      };
      axios.get(`${process.env.VUE_APP_BACKEND_URL}/items`, { params })
        .then(response => {
          this.items = response.data;
        })
        .catch(error => {
          console.error('Error fetching items:', error);
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
