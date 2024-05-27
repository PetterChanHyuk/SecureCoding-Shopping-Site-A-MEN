<template>
  <div class="login-container">
    <div class="login-box">
      <h1 class="login-header">108번가</h1>
      <div class="inputs-container">
        <div class="fields-container">
          <input type="email" placeholder="이메일" class="input-field" v-model="email" @keyup.enter="login" maxlength="100"/>
          <input type="password" placeholder="비밀번호" class="input-field" v-model="password" @keyup.enter="login" maxlength="20"/>
        </div>
        <button class="login-btn" @click="login" :disabled="loginDelay" :class="{ 'disabled': loginDelay }">로그인</button>
      </div>
      <div class="links">
        <a href="/userregister">회원가입</a> |
        <a href="/find-account">아이디/비밀번호 찾기</a>
      </div>
    </div>
  </div>
</template>

<script>
  import axios from 'axios';
  import router from '../router'; // 라우터 인스턴스

  export default {
    data() {
      return {
        email: '',
        password: '',
        errorMessage: '', // 로그인 실패 시 에러 메시지를 저장할 변수
        loginDelay: false // 로그인 버튼 딜레이를 주기 위한 변수
      };
    },
    methods: {
      login() {
        if (this.loginDelay) {
          return;
        }

        // 이메일과 비밀번호의 길이 제한을 검사합니다.
        if (this.email.length > 100) {
          alert("이메일은 최대 100자까지 입력할 수 있습니다.");
          return;
        }
        if (this.password.length > 20) {
          alert("비밀번호는 최대 20자까지 입력할 수 있습니다.");
          return;
        }

        this.loginDelay = true;
        const userData = {
          email: this.email,
          password: this.password
        };

        axios.post(`${process.env.VUE_APP_BACKEND_URL}/userlogin`, userData)
          .then(response => {
            // 로그인 성공
            alert("108번가에 오신 것을 환영합니다.");
            console.log('로그인 성공:', response.data);
            localStorage.setItem('userId', response.data.userId);
            router.push('/mainpage');
          })
          .catch(error => {
            // 로그인 실패
            if (error.response) {
              if (error.response.status === 401) {
                if (error.response.data.message === '이메일 인증이 완료되지 않았습니다.') {
                  alert("이메일 인증이 완료되지 않았습니다.");
                } else if (error.response.data.message === '이미 다른 디바이스에서 로그인 중입니다.') {
                  alert("이미 다른 디바이스에서 로그인 중입니다.");
                } else {
                  alert("잘못된 정보입니다.\n다시 확인해주세요.");
                }
              } else if (error.response.status === 429) {
                // rate limit 초과 시 처리
                alert("요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
              } else {
                alert("알 수 없는 오류가 발생했습니다.");
              }
              console.error('로그인 실패:', error.response.data.message);
            } else {
              alert("알 수 없는 오류가 발생했습니다.");
              console.error('로그인 실패:', error);
            }
            this.errorMessage = error.response ? error.response.data.message : "로그인에 실패했습니다.";

            setTimeout(() => {
              this.loginDelay = false;
            }, 1000);
          });
      }
    }
  };
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh;
}

.login-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 10px 20px 20px;
  border: 2px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background-color: #f9f9f9;
  margin: auto;
  width: 300px;
  height: 20vh;
}

.inputs-container {
  display: flex;
  justify-content: space-between;
}

.fields-container {
  display: flex;
  flex-direction: column;
}

.login-header {
  font-size: 2em;
  font-weight: bold;
  margin-bottom: 20px;
  margin-top: 0;
}

.input-field {
  margin-bottom: 10px;
  width: 150px;
}

.login-btn {
  height: 52px;
  width: 52px;
  margin-left: 20px;
  background-color: blue;
  color: white;
  cursor: pointer;
  border: none;
}

.login-btn.disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.links {
  text-align: center;
  width: 100%;
  padding-top: 10px;
}
</style>
