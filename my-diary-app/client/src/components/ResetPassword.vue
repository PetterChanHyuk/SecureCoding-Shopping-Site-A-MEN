<template>
  <div class="reset-password-container">
    <div class="timer">자동 로그아웃: {{ remainingTime }}초</div>
    <h1 class="reset-password-header">비밀번호 재설정</h1>
    <div class="inputs-container">
      <div>
        <input type="password" placeholder="새 비밀번호" class="input-field" v-model="newPassword" @input="validateNewPassword" :class="{ 'is-invalid': !isNewPasswordValid, 'is-valid': isNewPasswordValid }" />
        <p v-if="!isNewPasswordValid" class="warning-text">비밀번호를 입력해주세요.</p>
      </div>
      <div>
        <input type="password" placeholder="새 비밀번호 확인" class="input-field" v-model="confirmPassword" @input="validateConfirmPassword" :class="{ 'is-invalid': !isConfirmPasswordValid, 'is-valid': isConfirmPasswordValid }" />
        <p v-if="!isConfirmPasswordValid" class="warning-text">같은 비밀번호를 입력해주세요.</p>
      </div>
      <button class="reset-password-btn" @click="updatePassword" :disabled="!isFormValid">재설정</button>
    </div>
  </div>
</template>
  
<script>
  import axios from 'axios';

  export default {
    data() {
      return {
        newPassword: '',
        confirmPassword: '',
        isNewPasswordValid: false,
        isConfirmPasswordValid: false,
        userId: this.$route.query.userId,
        remainingTime: 600, // 초단위 (10분)
        timer: null
      };
    },
    created() {
      const token = this.$route.query.token;

      if (token) {
        // 서버에 토큰 유효성 확인 요청
        axios.get(`${process.env.VUE_APP_BACKEND_URL}/verify-reset-token?token=${token}`)
          .then(response => {
            // 서버로부터 userId 받아 처리
            this.userId = response.data.userId;
          })
          .catch(() => {
            // 토큰 만료 또는 유효하지 않은 경우
            alert('링크가 만료되었거나 유효하지 않습니다.');
            this.$router.push('/');
          });
      } else {
        // 마이페이지에서 직접 접근한 경우
        // localStorage 등에서 userId 가져오기
        const userId = localStorage.getItem('userId');
        if (!userId) {
          alert("비정상적인 접근입니다.");
          this.$router.push('/userlogin');
        }
      }
    },
    computed: {
      isFormValid() {
        return this.isNewPasswordValid && this.isConfirmPasswordValid;
      }
    },

    methods: {
      validateNewPassword() {
        this.isNewPasswordValid = this.newPassword.length > 0;
      },
      validateConfirmPassword() {
        this.isConfirmPasswordValid = this.newPassword === this.confirmPassword;
      },
      updatePassword() {
        if (!this.isNewPasswordValid || !this.isConfirmPasswordValid) {
            alert("비밀번호 유효성 검사를 통과하지 못했습니다.");
            return;
        }
        if (!this.userId) {
          console.error("userId is undefined, cannot update password.");
          return;
        }
        axios.post(`${process.env.VUE_APP_BACKEND_URL}/updatePassword`, {
            userId: this.userId,
            newPassword: this.newPassword
        })
        .then(() => {
            alert("비밀번호가 성공적으로 변경되었습니다.");
            this.$router.push('/userlogin');
        })
        .catch(error => {
            console.error('비밀번호 변경 오류:', error);
            alert('비밀번호 변경 중 오류가 발생했습니다.');
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

      handleDateSelect(date) {
        // 날짜를 선택하면 해당 날짜로 설정
        this.selectedDate = date;
        // 일기장 날짜를 선택한 날짜로 갱신
        this.fetchDiary();
      },
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
  
<style scoped>
  .reset-password-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
    width: 400px;
    margin: auto;
  }
  
  .reset-password-header {
    font-size: 1.5rem;
    color: #333;
    margin-bottom: 20px;
  }
  
  .inputs-container {
    width: 100%;
  }
  
  .input-field {
    width: 250px;
    padding: 10px;
    margin-bottom: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  button {
    width: 100%;
    padding: 10px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
  
  .input-field.is-valid {
    border: 1px solid green;
  }
  
  .input-field.is-invalid {
    border: 1px solid red;
  }
  
  .warning-text {
    color: red;
    font-size: 0.8rem;
    margin-top: -5px;
  }
</style>  