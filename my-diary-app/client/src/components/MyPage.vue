<template>
  <div class="my-container">
    <div class="timer">자동 로그아웃: {{ remainingTime }}초</div>
    <!-- 페이지 제목 -->
    <h1 class="my-title">My Page</h1>

    <!-- 사용자 이름 표시 -->
    <div class="user-name-section">
      {{ userName }} 님
    </div>

    <!-- 내 정보 -->
    <div class="user-info-section" @click="showUserInfo">
      내 정보 조회
    </div>

    <!-- 비밀번호 재설정 -->
    <div class="password-reset-section" @click="ResetPassword">
      비밀번호 재설정
    </div>

    <!-- 아이템 추가하기 -->
    <div class="add-item-section">
      <router-link to="/add-item">아이템 추가하기</router-link>
    </div>

    <!-- 아이템 수정하기 -->
    <div class="edit-item-section">
      <router-link to="/edit-item/1">아이템 수정하기</router-link> <!-- 임시로 1번 아이템을 수정하는 링크 -->
    </div>

    <!-- 메인 페이지로 이동하기 -->
    <div class="go-to-main-section">
      <button @click="goToMainPage">메인 페이지로 이동</button>
    </div>

    <!-- 아이템 목록 -->
    <div class="item-list-section">
      <h2>내 아이템 목록</h2>
      <div v-for="item in items" :key="item.id" class="item">
        <p>{{ item.name }}</p>
        <button @click="deleteItem(item.id)">삭제</button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      userName: '익명',
      remainingTime: 600, // 초단위 (10분)
      timer: null,
      items: [] // 아이템 목록 추가
    };
  },
  methods: {
    showUserInfo() {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert("사용자 정보를 불러올 수 없습니다.");
        return;
      }
      axios.get(`${process.env.VUE_APP_BACKEND_URL}/userinfo/${userId}`)
        .then(response => {
          const userInfo = response.data;
          alert(`귀하의 정보입니다.\n이메일: ${userInfo.email}\n이름: ${userInfo.name}\n전화번호: ${userInfo.phone}`);
        })
        .catch(error => {
          console.error('Error fetching user info:', error);
          alert('사용자 정보를 불러오는데 실패했습니다.');
        });
    },
    ResetPassword() {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        alert("사용자 ID를 불러올 수 없습니다.");
        return;
      }
      this.$router.push({ path: '/reset-password', query: { userId } });
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
    },
    fetchItems() {
      const userId = localStorage.getItem('userId'); // 현재 로그인한 사용자 ID 가져오기
      axios.get(`${process.env.VUE_APP_BACKEND_URL}/items`, {
        params: { userId }
      })
      .then(response => {
        this.items = response.data;
      })
      .catch(error => {
        console.error('Failed to fetch items:', error);
      });
    },
    deleteItem(itemId) {
      const userId = localStorage.getItem('userId');
      axios.delete(`${process.env.VUE_APP_BACKEND_URL}/items/${itemId}`, { data: { userId } })
        .then(() => {
          this.items = this.items.filter(item => item.id !== itemId);
          alert('아이템이 성공적으로 삭제되었습니다.');
        })
        .catch(error => {
          console.error('Failed to delete item:', error);
          alert('아이템 삭제에 실패했습니다.');
        });
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
    handleBeforeUnload() {
      this.logout();
    },
    goToMainPage() {
      this.$router.push('/mainpage');
    }
  },
  created() {
    this.fetchUserName(); // 컴포넌트 생성 시 사용자 이름 조회
    this.fetchItems(); // 아이템 목록 조회
    
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
.my-container {
  max-width: 600px;
  margin: 50px auto;
  padding: 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  text-align: center;
  background-color: #f8f9fa;
  border-radius: 10px;
}

.my-title {
  font-size: 2.5rem;
  margin-bottom: 20px;
  color: #343a40;
}

.user-name-section {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: #495057;
}

.user-info-section, .password-reset-section, .add-item-section, .edit-item-section, .go-to-main-section, .item-list-section {
  width: 100%;
  padding: 15px 0;
  cursor: pointer;
  font-size: 1.25rem;
  color: #007bff;
  text-decoration: none;
  text-align: center;
  border: 1px solid #dee2e6;
  border-radius: 5px;
  margin-bottom: 10px;
}

.user-info-section:hover, .password-reset-section:hover, .add-item-section:hover, .edit-item-section:hover, .go-to-main-section:hover, .item-list-section:hover {
  background-color: #e9ecef;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  margin-top: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
}

button:hover {
  background-color: #0056b3;
}

.item-list-section {
  text-align: left;
  background-color: #ffffff;
  padding: 20px;
  border-radius: 10px;
}

.item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #dee2e6;
}

.item p {
  margin: 0;
  font-size: 1rem;
  color: #495057;
}

.item button {
  background-color: #dc3545;
  padding: 5px 10px;
  font-size: 0.875rem;
  border-radius: 5px;
}

.item button:hover {
  background-color: #c82333;
}
</style>
