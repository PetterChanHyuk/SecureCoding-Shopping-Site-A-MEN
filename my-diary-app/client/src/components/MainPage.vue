<template>
  <div id="app">
    <header>
      <h1 @click="refreshPage">108번가</h1> <!-- 클릭 이벤트 추가 -->
      <!-- 남은 시간 타이머 -->
      <div class="timer">자동 로그아웃: {{ remainingTime }}초</div>
      <!-- 사용자 정보, 마이페이지 및 로그아웃 링크 -->
      <div class="user-info">
        {{ userName }}님 | 
        <router-link to="/mypage">마이페이지</router-link> |
        <a href="#" @click="logout">로그아웃</a>
      </div>
      <button @click="login">로그인</button>
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
          <div class="item-content">{{ item.name }}</div>
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
      remainingTime: 600, // 초단위 (10분)
      timer: null,
      searchQuery: '', // 입력 필드의 값을 저장
      filteredQuery: '', // 실제로 필터링에 사용되는 값을 저장
      selectedCategory: null, // 선택된 카테고리를 저장
      categories: [
        { id: 1, name: '카테고리 1' },
        { id: 2, name: '카테고리 2' },
        { id: 3, name: '카테고리 3' },
        { id: 4, name: '카테고리 4' },
      ],
      items: [
        { id: 1, name: 'Item 1', category: 1 },
        { id: 2, name: 'Item 2', category: 2 },
        { id: 3, name: 'Item 3', category: 3 },
        { id: 4, name: 'Item 4', category: 4 },
        { id: 5, name: 'Item 5', category: 1 },
        { id: 6, name: 'Item 6', category: 2 },
        { id: 7, name: 'Item 7', category: 3 },
        { id: 8, name: 'Item 8', category: 4 },
        { id: 9, name: 'Item 9', category: 1 },
        { id: 10, name: 'Item 10', category: 2 },
        { id: 11, name: 'Item 11', category: 3 },
        { id: 12, name: 'Item 12', category: 4 },
        { id: 13, name: 'Item 13', category: 1 },
        { id: 14, name: 'Item 14', category: 2 },
        { id: 15, name: 'Item 15', category: 3 },
        { id: 16, name: 'Item 16', category: 4 },
        { id: 17, name: 'Item 17', category: 1 },
        { id: 18, name: 'Item 18', category: 2 },
        { id: 19, name: 'Item 19', category: 3 },
        { id: 20, name: 'Item 20', category: 4 },
      ]
    };
  },
  computed: {
    filteredItems() {
      return this.items.filter(item => {
        const matchesQuery = item.name.toLowerCase().includes(this.filteredQuery.toLowerCase());
        const matchesCategory = this.selectedCategory ? item.category === this.selectedCategory.id : true;
        return matchesQuery && matchesCategory;
      });
    }
  },
  methods: {
    login() {
      alert('로그인 버튼 클릭!');
    },
    search() {
      this.filteredQuery = this.searchQuery; // 검색 버튼 클릭 시 filteredQuery 업데이트
    },
    refreshPage() {
      window.location.reload(); // 페이지 새로고침
    },
    filterByCategory(category) {
      this.selectedCategory = category;
    },
    resetTimer() {
      this.remainingTime = 600; // 타이머를 10분으로 재설정
    },

    updateTimer() {
      if (this.remainingTime > 0) {
        this.remainingTime--;
      } else {
        this.logout(); // 타이머가 0이 되면 로그아웃 실행
      }
    },
    
    logout() {
      clearInterval(this.timerId); // 타이머 초기화
      const userId = localStorage.getItem('userId');
      if (userId) {
        axios.post(`${process.env.VUE_APP_BACKEND_URL}/userlogout`, { userId })
          .then(() => {
            localStorage.removeItem('userId');
            this.$router.push('/userlogin'); // 로그인 페이지로 리디렉션
          })
          .catch(error => {
            console.error('로그아웃 실패:', error);
          });
      }
    },

    fetchUserName() {
      axios.get(`${process.env.VUE_APP_BACKEND_URL}/username`, {
          params: {
          userId: localStorage.getItem('userId') // 사용자 ID 가져오기
          }
      })
      .then(response => {
          this.userName = response.data.name; // 사용자 이름 설정
      })
      .catch(error => {
          console.error('Error fetching user name:', error);
      });
    }
  },

  created() {
    this.fetchUserName(); // 컴포넌트 생성 시 사용자 이름 조회
    
    // 로컬 스토리지에서 사용자 ID 확인
    const userId = localStorage.getItem('userId');

    // 사용자 ID가 없으면 로그인 페이지로 리디렉션
    if (!userId) {
      alert("비정상적인 접근입니다.");
      this.$router.push('/userlogin');
    }
  },
  mounted() {
    this.timer = setInterval(this.updateTimer, 1000); // 1초마다 타이머 감소

    // 사용자 활동 감지
    window.addEventListener('mousemove', this.resetTimer);
    window.addEventListener('keydown', this.resetTimer);
  }, 
  beforeUnmount() {
    clearInterval(this.timer); // 컴포넌트가 제거되면 타이머 정리
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
  cursor: pointer; /* 클릭 가능한 커서 */
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
  width: calc(25% - 20px); /* 4 columns with margin */
  box-sizing: border-box;
  position: relative;
  /* 정사각형을 만들기 위해 추가된 스타일 */
}
.item::before {
  content: "";
  display: block;
  padding-bottom: 100%; /* 1:1 비율을 위해 */
}
.item-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>