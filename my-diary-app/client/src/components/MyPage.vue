<template>
  <div class="my-container">
    <div class="timer">자동 로그아웃: {{ remainingTime }}초</div>
    <h1 class="my-title">My Page</h1>
    <div class="user-name-section">
      {{ userName }} 님
    </div>
    <div class="action-section">
      <div class="action-item" @click="showUserInfo">
        내 정보 조회
      </div>
      <div class="action-item" @click="ResetPassword">
        비밀번호 재설정
      </div>
      <router-link to="/add-item" class="action-item">아이템 추가하기</router-link>
      <router-link to="/edit-item/1" class="action-item">아이템 수정하기</router-link>
      <button @click="goToMainPage" class="action-item">메인 페이지로 이동</button>
    </div>
    <div class="item-list-section">
      <h2>내 아이템 목록</h2>
      <div class="items-container">
        <div v-for="item in items" :key="item.id" class="item">
          <p>{{ item.name }}</p>
          <button @click="deleteItem(item.id)">삭제</button>
        </div>
      </div>
    </div>
    <div class="action-section">
      <router-link to="/cart" class="action-item">내 장바구니 보기</router-link>
      <router-link to="/orders" class="action-item">구매 목록 보기</router-link>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      userName: '익명',
      remainingTime: 600,
      timer: null,
      items: []
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
    fetchItems() {
      const userId = localStorage.getItem('userId');
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
    handleBeforeUnload() {
      this.logout();
    },
    goToMainPage() {
      this.$router.push('/mainpage');
    }
  },
  created() {
    this.fetchUserName();
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
  background-color: #f8f9fa;
  font-family: Arial, sans-serif;
}

.my-container {
  max-width: 700px;
  margin: 50px auto;
  padding: 20px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  background-color: #fff;
  border-radius: 10px;
}

.my-title {
  font-size: 2.5rem;
  margin-bottom: 20px;
  color: #343a40;
  text-align: center;
}

.user-name-section {
  font-size: 1.5rem;
  margin-bottom: 20px;
  color: #495057;
  text-align: center;
}

.action-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.action-item {
  padding: 15px;
  cursor: pointer;
  font-size: 1.25rem;
  color: #007bff;
  text-decoration: none;
  text-align: center;
  border: 1px solid #dee2e6;
  border-radius: 5px;
  background-color: #ffffff;
  transition: background-color 0.2s, box-shadow 0.2s;
}

.action-item:hover {
  background-color: #e9ecef;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.item-list-section {
  text-align: left;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.item-list-section h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #343a40;
}

.items-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.item {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  width: calc(25% - 10px);
  padding: 10px;
  border: 1px solid #dee2e6;
  border-radius: 10px;
  background-color: #ffffff;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
}

.item p {
  margin: 0;
  font-size: 1rem;
  color: #495057;
  text-align: center;
}

.item button {
  margin-top: 10px;
  background-color: #dc3545;
  padding: 5px 10px;
  font-size: 0.875rem;
  border: none;
  border-radius: 5px;
  color: white;
  cursor: pointer;
  transition: background-color 0.2s;
}

.item button:hover {
  background-color: #c82333;
}

.timer {
  font-size: 1rem;
  color: #343a40;
  margin-bottom: 20px;
  text-align: center;
}
</style>