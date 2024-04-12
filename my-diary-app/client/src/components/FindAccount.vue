<template>
    <div class="find-account-container">
      <div class="find-account-box">
        <!-- 아이디 찾기 섹션 -->
        <h1 class="find-account-header">아이디 찾기</h1>
        <div class="inputs-container">
          <div class="fields-container">
            <div>
              <input type="text" placeholder="이름" class="input-field" v-model="name" @input="validateName" :class="{ 'is-invalid': !isNameValid, 'is-valid': isNameValid }" />
              <p v-if="!isNameValid" class="warning-text">이름을 입력해주세요.</p>
            </div>
            <div>
              <input type="text" placeholder="전화번호" class="input-field" v-model="phone" @input="formatPhoneNumber('phone', $event); validatePhone()" :class="{ 'is-invalid': !isPhoneValid, 'is-valid': isPhoneValid }" required>
              <p v-if="!isPhoneValid" class="warning-text">01x-xxxx-xxxx 형식으로 입력해주세요.</p>
            </div>
          </div>
          <button class="find-account-btn" @click="findAccount" :disabled="!isIdFormValid">찾기</button>
        </div>
  
        <hr class="divider" />
  
        <!-- 비밀번호 찾기 섹션 -->
        <h1 class="find-account-header">비밀번호 재설정</h1>
        <div class="inputs-container">
          <div class="fields-container">
            <div>
              <input type="email" placeholder="이메일" class="input-field" v-model="email" @input="validateEmail" :class="{ 'is-invalid': !isEmailValid, 'is-valid': isEmailValid }" />
              <p v-if="!isEmailValid" class="warning-text">유효한 이메일 주소를 입력해주세요.</p>
            </div>
            <div>
              <input type="text" placeholder="이름" class="input-field" v-model="nameForPassword" @input="validateNameForPassword" :class="{ 'is-invalid': !isNameForPasswordValid, 'is-valid': isNameForPasswordValid }" />
              <p v-if="!isNameForPasswordValid" class="warning-text">이름을 입력해주세요.</p>
            </div>
            <div>
              <div>
                <input type="text" placeholder="전화번호" class="input-field" v-model="phoneForPassword" @input="formatPhoneNumber('phoneForPassword', $event); validatePhoneForPassword()" :class="{ 'is-invalid': !isPhoneForPasswordValid, 'is-valid': isPhoneForPasswordValid }" required>
                <p v-if="!isPhoneForPasswordValid" class="warning-text">01x-xxxx-xxxx 형식으로 입력해주세요.</p>
              </div>
            </div>
          </div>
          <button class="reset-password-btn" @click="resetPassword" :disabled="!isPasswordFormValid">재설정</button>
        </div>
      </div>
    </div>
</template>
  
<script>
  import axios from 'axios';

  export default {
    data() {
      return {
        name: '',
        phone: '',
        email: '',
        nameForPassword: '',
        phoneForPassword: '',
        isNameValid: false,
        isPhoneValid: false,
        isEmailValid: false,
        isNameForPasswordValid: false,
        isPhoneForPasswordValid: false
      };
    },
    computed: {
      isIdFormValid() {
        return this.isNameValid && this.isPhoneValid;
      },
      isPasswordFormValid() {
        return this.isEmailValid && this.isNameForPasswordValid && this.isPhoneForPasswordValid;
      }
    },
    mounted() {
      this.validateName();
      this.validatePhone();
      this.validateEmail();
      this.validateNameForPassword();
      this.validatePhoneForPassword();
    },
    methods: {
      validateName() {
        this.isNameValid = this.name.length > 0;
      },
      // 전화번호 필드에 대한 유효성 검사
      validatePhone() {
        const phonePattern = /^01[0-9]-[0-9]{3,4}-[0-9]{4}$/;
        this.isPhoneValid = phonePattern.test(this.phone);
      },
      // 전화번호 입력 형식 자동 변경
      formatPhoneNumber(type, event) {
        let cursorPosition = event.target.selectionStart; // 현재 커서 위치 저장
        let oldValue = this[type];
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
        this[type] = newValue;

        // 커서 위치 조정
        if (oldValue.length < newValue.length && (cursorPosition === 4 || cursorPosition === 9)) {
          cursorPosition++;
        }

        // 커서 위치 업데이트
        this.$nextTick(() => {
          event.target.setSelectionRange(cursorPosition, cursorPosition);
        });

        // 전화번호 형식 검증 메소드 호출
        if (type === 'phone') {
          this.validatePhone();
        } else if (type === 'phoneForPassword') {
          this.validatePhoneForPassword();
        }
      },
      validateEmail() {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        this.isEmailValid = emailPattern.test(this.email);
      },
      validateNameForPassword() {
        this.isNameForPasswordValid = this.nameForPassword.length > 0;
      },
      validatePhoneForPassword() {
        const phonePattern = /^01[0-9]-[0-9]{3,4}-[0-9]{4}$/;
        this.isPhoneForPasswordValid = phonePattern.test(this.phoneForPassword);
      },
      findAccount() {
        axios.post(`${process.env.VUE_APP_BACKEND_URL}/findAccount`, {
            name: this.name,
            phone: this.phone
        })
        .then(response => {
            if(response.data.email) {
            alert(`귀하의 계정은 ${response.data.email}입니다.`);
            this.$router.push('/');
            } else {
            alert('해당 정보로 조회할 수 없습니다.');
            }
        })
        .catch(error => {
            if (error.response && error.response.status === 404) {
            // 일치하는 정보가 없는 경우
            alert('잘못된 정보입니다.');
            } else {
            // 기타 서버 오류
            console.error('계정 찾기 오류:', error);
            alert('오류가 발생했습니다.');
            }
        });
      },
      resetPassword() {
        axios.post(`${process.env.VUE_APP_BACKEND_URL}/requestPasswordReset`, {
          email: this.email,
          name: this.nameForPassword,
          phone: this.phoneForPassword
        })
        .then(() => {
          alert('비밀번호 재설정 링크가 이메일로 발송되었습니다.');
        })
        .catch(error => {
          // 오류 처리
          console.error('비밀번호 재설정 요청 오류:', error);
          alert('오류가 발생했습니다.');
        });
      }
    }
  };
</script>
  
<style scoped>
.find-account-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80vh;
}

.find-account-box {
  background-color: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  width: 400px;
  margin-bottom: 20px;
}

.inputs-container {
  display: flex;
  flex-direction: column;
}

.fields-container {
  margin-bottom: 10px;
}

.find-account-header {
  font-size: 1.5rem;
  color: #333;
  text-align: center;
  margin-bottom: 20px;
}

.input-field {
  width: 250px;
  padding: 10px;
  margin-bottom: 7px;
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

.divider {
  margin: 20px 0;
  border-top: 1px solid #ddd;
}
</style>