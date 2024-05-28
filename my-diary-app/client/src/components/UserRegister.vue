<template>
  <div class="register-container">
    <h1>회원가입</h1>
    <form @submit.prevent="register">
      <div>
        <label for="email">이메일:</label>
        <input type="email" id="email" v-model="userData.email" @input="validateEmail" :class="{ 'is-invalid': !isEmailValid || emailExists, 'is-valid': isEmailValid && !emailExists }" maxlength="100" required>
        <p v-if="!isEmailValid" class="warning-text">유효한 이메일 주소를 입력해주세요.</p>
        <p v-else-if="emailExists" class="warning-text">이미 존재하는 메일입니다.</p>
      </div>
      <div>
        <label for="password">비밀번호:</label>
        <input type="password" id="password" v-model="userData.password" @input="validatePassword" :class="{ 'is-invalid': !isPasswordValid, 'is-valid': isPasswordValid }" maxlength="20" required>
        <p v-if="!isPasswordValid && isPasswordEntered" class="warning-text">{{ errorMessage }}</p>
      </div>
      <div>
        <label for="confirmPassword">비밀번호 확인:</label>
        <input type="password" id="confirmPassword" v-model="confirmPassword" @input="validatePassword" :class="{ 'is-invalid': !isPasswordMatch, 'is-valid': isPasswordValid && confirmPassword }" maxlength="20" required>
        <p v-if="!isPasswordMatch && confirmPassword" class="warning-text">비밀번호가 일치하지 않습니다.</p>
      </div>

      <div>
        <label for="name">이름:</label>
        <input type="text" id="name" v-model="userData.name" @input="validateName" :class="{ 'is-invalid': !isNameValid, 'is-valid': isNameValid }" maxlength="50" required>
        <p v-if="!userData.name" class="warning-text">이름을 입력해주세요.</p>
      </div>
      <div>
        <label for="phone">전화번호:</label>
        <input type="text" id="phone" v-model="userData.phone" @input="formatPhoneNumber" :class="{ 'is-invalid': !isPhoneValid || phoneExists, 'is-valid': isPhoneValid && !phoneExists }" maxlength="13" required>
        <p v-if="!isPhoneValid" class="warning-text">01x-xxxx-xxxx 형식으로 입력해주세요.</p>
        <p v-else-if="phoneExists" class="warning-text">이미 사용 중인 전화번호입니다.</p>
      </div>
      <div>
        <label for="address">주소:</label>
        <input type="text" id="sample5_address" placeholder="주소" v-model="userData.address" readonly maxlength="200">
        <input type="button" @click="sample5_execDaumPostcode()" value="주소 검색">
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
        phone: '',
        address: ''
      },
      confirmPassword: '',
      isNameValid: false,
      isPasswordEntered: false,
      isPasswordValid: false,
      isEmailValid: false,
      isPhoneValid: false,
      phoneExists: false,
      emailExists: false
    };
  },
  mounted() {
    this.loadDaumPostcode();
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
    // HTML 이스케이프 함수
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
    // Daum 주소 API 스크립트 로드
    loadDaumPostcode() {
      const script = document.createElement('script');
      script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
      script.onload = () => this.initializePostcode();
      document.head.appendChild(script);
    },
    // Daum 주소 API 초기화
    initializePostcode() {
      // 스크립트 로드가 완료된 후 필요한 초기화 코드
    },
    // Daum 주소 검색 실행
    sample5_execDaumPostcode() {
      if (typeof daum !== 'undefined') {
        // eslint-disable-next-line no-undef
        new daum.Postcode({
          oncomplete: (data) => {
            this.userData.address = data.address; // 주소 필드를 업데이트
          }
        }).open();
      } else {
        console.error("Daum 우편번호 스크립트가 로드되지 않았습니다.");
      }
    },
    // 이메일 유효성 검사
    validateEmail() {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      this.isEmailValid = emailPattern.test(this.userData.email);
      this.emailExists = false;

      if (this.isEmailValid) {
        axios.get(`${process.env.VUE_APP_BACKEND_URL}/check-email/${this.userData.email}`)
          .then(() => {
            this.errorMessage = '';
          })
          .catch(error => {
            if (error.response && error.response.status === 409) {
              this.errorMessage = '이미 존재하는 메일입니다.';
              this.emailExists = true;
            } else {
              this.errorMessage = error.response.data.message || '이메일 검증 중 오류가 발생했습니다.';
            }
          });
      }
    },
    // 비밀번호 유효성 검사
    validatePassword() {
      const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
      this.isPasswordEntered = this.userData.password.length > 0;
      this.isPasswordMatch = this.userData.password === this.confirmPassword;
      this.isPasswordValid = passwordPattern.test(this.userData.password);
      if (!this.isPasswordValid && this.isPasswordEntered) {
        this.errorMessage = '비밀번호는 8자 이상 20자 이하이며, 대소문자, 숫자, 특수문자를 포함해야 합니다.';
      } else {
        this.errorMessage = '';
      }
    },
    // 이름 유효성 검사
    validateName() {
      this.isNameValid = this.userData.name.length > 0 && this.userData.name.length <= 50;
    },
    // 전화번호 유효성 검사
    validatePhone() {
      const phonePattern = /^01[0-9]-[0-9]{3,4}-[0-9]{4}$/;
      this.isPhoneValid = phonePattern.test(this.userData.phone);

      if (this.isPhoneValid) {
        axios.get(`${process.env.VUE_APP_BACKEND_URL}/check-phone/${this.userData.phone}`)
          .then(() => {
            this.phoneExists = false;
          })
          .catch(error => {
            if (error.response && error.response.status === 409) {
              this.phoneExists = true;
            } else {
              this.errorMessage = '전화번호 검증 중 오류가 발생했습니다.';
              console.error('Error checking phone number:', error);
              alert(this.errorMessage);
            }
          });
      }
    },
    // 전화번호 형식 자동 변경
    formatPhoneNumber(event) {
      let cursorPosition = event.target.selectionStart;
      let oldValue = this.userData.phone;
      let newValue = '';
      let numbers = oldValue.replace(/[^\d]/g, '');

      for (let i = 0; i < numbers.length; i++) {
        if (i === 3 || i === 7) newValue += '-';
        newValue += numbers[i];
      }

      newValue = newValue.slice(0, 13);
      this.userData.phone = newValue;

      if (oldValue.length < newValue.length && (cursorPosition === 4 || cursorPosition === 9)) {
        cursorPosition++;
      }

      this.$nextTick(() => {
        event.target.setSelectionRange(cursorPosition, cursorPosition);
      });

      this.validatePhone();
    },
    // 회원가입 처리
    register() {
      const escapedUserData = {
        email: this.escapeHtml(this.userData.email),
        password: this.userData.password,
        name: this.escapeHtml(this.userData.name),
        phone: this.escapeHtml(this.userData.phone),
        address: this.escapeHtml(this.userData.address)
      };

      axios.post(`${process.env.VUE_APP_BACKEND_URL}/userregister`, escapedUserData)
        .then(() => {
          alert("회원가입이 완료되었습니다.\n이메일 인증을 진행해주세요.\n인증 링크는 이메일로 발송되었습니다.");
          this.$router.push('/userlogin');
        })
        .catch(error => {
          let errorMessage = '회원가입에 실패했습니다.';

          if (error.response) {
            errorMessage = error.response.data.message || errorMessage;
            alert(`회원가입에 실패했습니다: ${this.errorMessage}`);
          } else {
            errorMessage = "서버 오류 또는 네트워크 문제로 인한 회원가입 실패";
          }

          console.error('회원가입 실패:', errorMessage);
          alert(errorMessage);

          this.resetFormData();
          location.reload();
        });
    },
    // 폼 데이터 초기화
    resetFormData() {
      this.userData.email = '';
      this.userData.password = '';
      this.userData.name = '';
      this.userData.phone = '';
      this.userData.address = '';
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
input[type="button"],
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

button.button-active {
  background-color: blue;
  color: white;
}

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
