<template>
  <div class="register-container">
    <h1>회원가입</h1>
    <form @submit.prevent="register">
      <div>
        <label for="email">이메일:</label>
        <input type="email" id="email" v-model="userData.email" @input="validateEmail" :class="{ 'is-invalid': !isEmailValid || emailExists, 'is-valid': isEmailValid && !emailExists }" required>
        <p v-if="!isEmailValid" class="warning-text">유효한 이메일 주소를 입력해주세요.</p>
        <p v-else-if="emailExists" class="warning-text">이미 존재하는 메일입니다.</p>
      </div>
      <div>
        <label for="password">비밀번호:</label>
        <input type="password" id="password" v-model="userData.password" @input="validatePassword" :class="{ 'is-invalid': !isPasswordEntered, 'is-valid': isPasswordEntered }" required>
        <p v-if="!isPasswordEntered" class="warning-text">비밀번호를 입력해주세요.</p>
      </div>
      <div>
        <label for="confirmPassword">비밀번호 확인:</label>
        <input type="password" id="confirmPassword" v-model="confirmPassword" @input="validatePassword" :class="{ 'is-invalid': !isPasswordValid, 'is-valid': isPasswordValid && confirmPassword }" required>
        <p v-if="!isPasswordMatch && confirmPassword" class="warning-text">비밀번호가 일치하지 않습니다.</p>
      </div>
      <div>
        <label for="name">이름:</label>
        <input type="text" id="name" v-model="userData.name" @input="validateName" :class="{ 'is-invalid': !isNameValid, 'is-valid': isNameValid }" required>
        <p v-if="!userData.name" class="warning-text">이름을 입력해주세요.</p>
      </div>
      <div>
        <label for="phone">전화번호:</label>
        <input type="text" id="phone" v-model="userData.phone" @input="formatPhoneNumber" :class="{ 'is-invalid': !isPhoneValid || phoneExists, 'is-valid': isPhoneValid && !phoneExists }" required>
        <p v-if="!isPhoneValid" class="warning-text">01x-xxxx-xxxx 형식으로 입력해주세요.</p>
        <p v-else-if="phoneExists" class="warning-text">이미 사용 중인 전화번호입니다.</p>
      </div>
      <button type="submit" :disabled="!isFormValid" :class="{ 'button-active': isFormValid, 'button-inactive': !isFormValid }">등록</button>
    </form>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      userData: {
        email: '',
        password: '',
        name: '',
        phone: ''
      },
      confirmPassword: '',
      isNameValid: false,
      isPasswordEntered: false,
      isPasswordValid: false,
      isEmailValid: false,
      isPhoneValid: false,
      phoneExists: false,
    };
  },
  computed: {
    isFormValid() {
      return (
        this.isEmailValid &&
        this.isPasswordValid &&
        this.isNameValid &&
        this.isPhoneValid &&
        !this.emailExists &&
        !this.phoneExists
      );
    }
  },
  methods: {
    // 이메일 필드에 대한 유효성 검사
    validateEmail() {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      this.isEmailValid = emailPattern.test(this.userData.email);
      this.emailExists = false; // 이메일 중복 확인 변수

      if (this.isEmailValid) {
        // 이메일 형식이 유효한 경우, 데이터베이스에서 중복 확인
        axios.get(`${process.env.VUE_APP_BACKEND_URL}/check-email/${this.userData.email}`)
          .then(() => {
            // 이메일이 중복되지 않음
            this.errorMessage = '';
          })
          .catch(error => {
            if (error.response && error.response.status === 409) { // 409 Conflict - 이메일 중복
              this.errorMessage = '이미 존재하는 메일입니다.';
              this.emailExists = true;
            } else {
              this.errorMessage = error.response.data.message || '이메일 검증 중 오류가 발생했습니다.';
            }
          });
      }
    },
    // 비밀번호 필드에 대한 유효성 검사
    validatePassword() {
      this.isPasswordEntered = this.userData.password.length > 0;
      this.isPasswordMatch = this.userData.password === this.confirmPassword;
      this.isPasswordValid = this.isPasswordEntered && this.isPasswordMatch;
    },
    // 이름 필드에 대한 유효성 검사
    validateName() {
      this.isNameValid = this.userData.name.length > 0;
    },
    // 전화번호 필드에 대한 유효성 검사
    validatePhone() {
      const phonePattern = /^01[0-9]-[0-9]{3,4}-[0-9]{4}$/;
      this.isPhoneValid = phonePattern.test(this.userData.phone);

      if (this.isPhoneValid) {
        // 전화번호 형식이 유효한 경우, 데이터베이스에서 중복 확인
        axios.get(`${process.env.VUE_APP_BACKEND_URL}/check-phone/${this.userData.phone}`)
          .then(() => {
            // 전화번호가 중복되지 않음
            this.phoneExists = false;
          })
          .catch(error => {
            if (error.response && error.response.status === 409) { // 409 Conflict - 전화번호 중복
              this.phoneExists = true;
            } else {
              this.errorMessage = '전화번호 검증 중 오류가 발생했습니다.';
              console.error('Error checking phone number:', error);
              alert(this.errorMessage);
            }
          });
      }
    },
    // 전화번호 입력 형식 자동 변경
    formatPhoneNumber(event) {
      let cursorPosition = event.target.selectionStart; // 현재 커서 위치 저장
      let oldValue = this.userData.phone;
      let newValue = '';
      
      // 숫자만 추출
      let numbers = oldValue.replace(/[^\d]/g, '');

      // 숫자를 형식에 맞게 '-' 추가
      for (let i = 0; i < numbers.length; i++) {
        if (i === 3 || i === 7) newValue += '-';
        newValue += numbers[i];
      }

      // 최대 길이 제한 (010-XXXX-XXXX)
      newValue = newValue.slice(0, 13);

      // 전화번호 업데이트
      this.userData.phone = newValue;

      // 커서 위치 조정 로직
      if (oldValue.length < newValue.length && (cursorPosition === 4 || cursorPosition === 9)) {
        cursorPosition++;
      }

      // 커서 위치 업데이트
      this.$nextTick(() => {
        event.target.setSelectionRange(cursorPosition, cursorPosition);
      });

      // 전화번호 형식 검증 메소드 호출
      this.validatePhone();
    },
    register() {
      axios.post(`${process.env.VUE_APP_BACKEND_URL}/userregister`, this.userData)
        .then(response => {
          // 회원가입 성공 시 처리 로직
          console.log('회원가입 성공:', response.data.message);
          alert("회원가입이 완료되었습니다.\n이메일 인증을 진행해주세요.\n인증 링크는 이메일로 발송되었습니다.");
          // 로그인 페이지나 홈페이지로 리디렉션
          this.$router.push('/userlogin');
        })
        .catch(error => {
          // 오류 메시지 초기화
          alert(error.response.data.message || '회원가입에 실패했습니다.')

          if (error.response) {
            // 서버에서 반환된 오류 메시지 처리
            this.errorMessage = error.response.data.message;
            alert(`회원가입에 실패했습니다: ${this.errorMessage}`);
          } else {
            // 서버 오류 또는 네트워크 문제로 인한 회원가입 실패
            this.errorMessage = "서버 오류 또는 네트워크 문제로 인한 회원가입 실패";
            alert(this.errorMessage);
          }

          // 폼 데이터 초기화 및 페이지 새로고침
          this.resetFormData();
          location.reload();
        });
    },
    resetFormData() {
      // 사용자 데이터를 초기 상태로 재설정
      this.userData.email = '';
      this.userData.password = '';
      this.userData.name = '';
      this.userData.phone = '';
      this.confirmPassword = '';
      this.isNameValid = false;
      this.isPasswordEntered = false;
      this.isPasswordValid = false;
      this.isEmailValid = false;
      this.isPhoneValid = false;
    }
  }
};
</script>

<style scoped>
.register-container {
  max-width: 300px;
  margin: auto;
  padding: 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

label {
  display: block;
}

input[type="email"],
input[type="password"],
input[type="text"],

button {
  width: 80%;
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
}

button {
  padding: 10px;
  background-color: blue;
  color: white;
  border: none;
  cursor: pointer;
}

/* 버튼에 대한 활성화 스타일 */
button.button-active {
  background-color: blue;
  color: white;
}

/* 버튼에 대한 비활성화 스타일 */
button.button-inactive {
  background-color: #ccc;
  color: #666;
  cursor: not-allowed;
}

input.is-valid {
  border: 1px solid green !important;
}

input.is-invalid {
  border: 1px solid red !important;
}

.warning-text {
  color: red;
  font-size: 0.8em;
  margin-top: -10px;
  margin-bottom: 10px;
}
</style>
  