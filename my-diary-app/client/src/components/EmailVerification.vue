<template>
    <div class="email-verification-container">
      <h1>이메일 인증</h1>
      <p v-if="verificationMessage">{{ verificationMessage }}</p>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    data() {
      return {
        verificationMessage: ''
      };
    },
    created() {
      this.verifyEmail();
    },
    methods: {
        verifyEmail() {
            const token = this.$route.query.token; // URL에서 토큰 가져오기
            axios.get(`${process.env.VUE_APP_BACKEND_URL}/verify-email?token=${token}`)
                .then(response => {
                this.verificationMessage = response.data.message;
                })
                .catch(error => {
                if (error.response && error.response.status === 410) { // 410 : 유효시간 만료
                    this.verificationMessage = '만료되었습니다.';
                } else {
                    this.verificationMessage = '인증 중 오류가 발생했습니다.';
                }
            });
        }
    }
  };
  </script>
  
  <style scoped>
  .email-verification-container {
    max-width: 400px;
    margin: auto;
    padding: 20px;
    text-align: center;
  }
  </style>
  