<template>
  <div class="main-page">
    <!-- 메인 헤더 -->
    <div class="main-header">
      <!-- 남은 시간 타이머 -->
      <div class="timer">자동 로그아웃: {{ remainingTime }}초</div>
      <!-- 사용자 정보, 마이페이지 및 로그아웃 링크 -->
      <div class="user-info">
        {{ userName }}님 | 
        <router-link to="/mypage">마이페이지</router-link> |
        <a href="#" @click="logout">로그아웃</a>
      </div>
    </div>

    <!-- 메인 컨테이너 -->
    <div class="main-container">
      <div class="diary-section">
        <!-- 날짜 선택 -->
        일자 : <input type="date" v-model="selectedDate" @change="fetchDiary">
        <hr>
        <!-- 일기장 표시 -->
        <div v-if="diaryContent" class="diary-content">
          <div v-html="formattedDiaryContent"></div>
          <br><br>
          <button @click="editDiary">수정</button>
          <button @click="deleteDiary">삭제</button>
        </div>
        <div v-else class="empty-diary">
          <textarea v-model="newDiaryContent" cols="50" rows="20"></textarea>
          <br>
          <button @click="saveDiary">저장</button>
        </div>
      </div>

      <!-- 최근 작성한 일기 섹션 -->
      <div class="recent-diaries">
        <h3>RECENT</h3>
        <hr>
        <div class="diary-list">
          <div v-for="date in recentDiaryDates" :key="date" class="diary-date" :class="{ 'diary-date-selected': isDateSelected(date) }" @click="selectDiaryDate(date)">
            {{ formatDate(date) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
  
<script>
import axios from 'axios';
import moment from 'moment';

export default {
  data() {
    return {
      userName: '익명',
      selectedDate: this.getCurrentDateInKST(),
      diaryContent: null,
      newDiaryContent: '',
      recentDiaryDates: [], // 최근 작성한 일기 날짜 배열
      remainingTime: 600, // 초단위 (10분)
      timer: null
    };
  },
  computed: {
    formattedDiaryContent() {
      return this.diaryContent.replace(/\n/g, '<br>'); // 개행 문자를 <br> 태그로 변환
    }
  },
  methods: {
    getCurrentDateInKST() {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000); // UTC 시간
      const kstTime = new Date(utc + (3600000 * 9)); // UTC+9
      return kstTime.toISOString().split('T')[0];
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

    editDiary() {
      // 수정 모드 활성화
      this.newDiaryContent = this.diaryContent;
      this.diaryContent = null;
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

    fetchDiary() {
      // 날짜 변경 시 기존 일기 내용 초기화
      this.diaryContent = null;
      this.newDiaryContent = '';

      const userId = localStorage.getItem('userId');
      axios.get(`${process.env.VUE_APP_BACKEND_URL}/diary/${this.selectedDate}`, {
        params: { userId }
      })
      .then(response => {
        // 해당 날짜의 일기 내용이 존재하는 경우
        this.diaryContent = response.data.content;
      })
      .catch(error => {
        if (error.response && error.response.status === 404) {
          // 해당 날짜에 일기가 없는 경우
          this.diaryContent = null;
        } else {
          console.error('Error fetching diary:', error);
        }
      });
    },

    saveDiary() {
      const userId = localStorage.getItem('userId');
      axios.post(`${process.env.VUE_APP_BACKEND_URL}/savediary`, {
        user_id: userId,
        date: this.selectedDate,
        content: this.newDiaryContent
      })
      .then(() => {
        this.diaryContent = this.newDiaryContent;
        this.newDiaryContent = '';
        alert('일기가 저장되었습니다.');
        this.fetchRecentDiaries();
      })
      .catch(error => {
        console.error('Error saving diary:', error);
      });
    },

    deleteDiary() {
      if (confirm('일기를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        axios.delete(`${process.env.VUE_APP_BACKEND_URL}/diary/${this.selectedDate}`, {
          params: { userId: localStorage.getItem('userId') }
        })
        .then(() => {
          alert('일기가 삭제되었습니다.');
          this.diaryContent = null; // 일기 내용 초기화
          this.fetchRecentDiaries(); // 최근 일기 날짜 목록 갱신
        })
        .catch(error => {
          console.error('Error deleting diary:', error);
          alert('일기 삭제에 실패했습니다.');
        });
      }
    },

    // 최근 작성된 일기 날짜 가져오기
    fetchRecentDiaries() {
      axios.get(`${process.env.VUE_APP_BACKEND_URL}/recent-diaries`, {
        params: { userId: localStorage.getItem('userId') }
      })
      .then(response => {
        this.recentDiaryDates = response.data.dates; // 서버에서 반환된 날짜 배열
      })
      .catch(error => {
        console.error('Error fetching recent diaries:', error);
      });
    },

    formatDate(date) {
      return moment(date).format('YYYY-MM-DD');
    },

    selectDiaryDate(date) {
      // 날짜 형식 변환
      const formattedDate = moment(date).format('YYYY-MM-DD');
      this.selectedDate = formattedDate;
      this.fetchDiary();
    },

    isDateSelected(date) {
      const formattedDate = moment(date).format('YYYY-MM-DD');
      return formattedDate === this.selectedDate;
    },
  },

  created() {
    this.fetchUserName(); // 컴포넌트 생성 시 사용자 이름 조회
    this.fetchRecentDiaries(); // 컴포넌트 생성 시 최근 일기 날짜 조회
    axios.get(`${process.env.VUE_APP_BACKEND_URL}/current-kst-date`)
    .then(response => {
      this.selectedDate = response.data.date;
      this.fetchDiary(); // 컴포넌트 생성 시 일기장 조회
    })
    .catch(error => {
      console.error('Error fetching current KST date:', error);
      this.fetchDiary(); // 컴포넌트 생성 시 일기장 조회
    });

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
  .main-page {
    padding: 20px;
    max-width: 600px; /* 메인 페이지 최대 너비 조정 */
    margin: auto;
  }

  .main-header {
    display: flex;
    justify-content: space-between; /* 좌우 균등 정렬 */
    margin-bottom: 10px;
  }

  .timer {
    text-align: left; /* 좌측 정렬 */
  }

  .user-info {
    text-align: right; /* 우측 정렬 */
  }
  .main-container {
    display: flex;
    margin-top: 20px;
    padding: 20px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }

  .diary-section {
    flex: 80%; /* 메인 컨테이너 좌측 85% 너비 할당 */
  }

  .empty-diary {
    width: 100%;
    box-sizing: border-box;
    padding: 10px;
  }

  .recent-diaries {
    flex: 20%; /* 메인 컨테이너 우측 15% 너비 할당 */
    display: flex;
    flex-direction: column;
    align-items: center;
    border-left: 1px solid #ddd;
    height: 380px;
    overflow-y: auto; /* 내용이 넘칠 경우 스크롤 */
  }

  .recent-diaries h3 {
    margin-top: 0px;
    margin-bottom: 1px;
  }

  .recent-diaries hr {
    width: 100%;
    border-top: 1px solid gray;
  }

  .diary-date {
    cursor: pointer;
    text-align: center;
    padding: 5px;
    border: 1px solid #eee;
    border-radius: 20px;
    margin-bottom: 5px;
    word-break: break-all;
    width: auto;
    background-color: rgb(198, 229, 240);
    font-size: 13px;
  }

  .diary-date-selected {
    background-color: rgb(101, 185, 219);
  }

  .diary-date:hover {
    background-color: rgb(101, 185, 219);
  }

  button {
    margin: 5px 5px;
  }

  /* 모바일 화면용 스타일 */
  @media (max-width: 600px) {
    .main-container {
      flex-direction: column;
    }

    .diary-section, .recent-diaries {
      width: 100%;
      flex: none;
      padding-left: 0;
      padding-right: 0;
    }

    .empty-diary textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 10px;
    }

    .recent-diaries {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      border: 1px solid;
    }

    .recent-diaries h3 {
      margin-top: 10px;
      margin-bottom: 0px;
    }

    .recent-diaries hr {
      width: 100%;
      border-top: 1px solid gray;
    }

    .diary-date {
      cursor: pointer;
      text-align: center;
      padding: 5px;
      border: 1px solid #eee;
      border-radius: 20px;
      margin-bottom: 5px;
      word-break: break-all;
      width: auto;
      background-color: rgb(198, 229, 240);
      font-size: 13px;
    }

    button {
      margin: 5px 5px;
    }
  }
</style>