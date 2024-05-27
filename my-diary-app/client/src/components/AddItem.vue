<template>
  <div class="add-item-container">
    <h1>새로운 아이템 추가</h1>
    <form @submit.prevent="addItem">
      <div class="form-group">
        <label for="itemName">Item Name</label>
        <input type="text" id="itemName" v-model="itemName" @input="validateItemName" required />
        <p v-if="itemNameError" class="error-message">{{ itemNameError }}</p>
      </div>

      <div class="form-group">
        <label for="category">Category</label>
        <div class="category-input-container">
          <select id="category" v-model="selectedCategoryId" required size="1" class="category-select">
              <option v-for="category in categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
          </select>
        </div>
        <input type="text" v-model="newCategory" @input="validateNewCategory" placeholder="Add new category" />
        <button type="button" @click="addCategory" :disabled="newCategoryError || !newCategory" class="add-category-btn">Add Category</button>
        <p v-if="newCategoryError" class="error-message">{{ newCategoryError }}</p>
      </div>

      <div class="form-group">
        <label for="price">Price</label>
        <input type="number" id="price" v-model="price" required />
      </div>

      <label for="itemDescription">Item Description</label>
      <div class="form-group">
        <textarea id="itemDescription" v-model="itemDescription"></textarea>
      </div>

      <div class="form-group">
        <label for="file">Image</label>
        <input type="file" id="file" @change="onFileChange" />
      </div>
      
      <button type="submit">추가</button>
    </form>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  data() {
    return {
      itemName: '',
      selectedCategoryId: '',
      newCategory: '',
      itemDescription: '',
      file: null,
      price: 0, // price 필드 추가
      categories: [],
      itemNameError: '',
      newCategoryError: ''
    };
  },
  methods: {
    validateItemName() {
      const regex = /^[a-zA-Z0-9가-힣\s]+$/;
      if (!regex.test(this.itemName)) {
        this.itemNameError = '특수문자는 사용할 수 없습니다.';
      } else {
        this.itemNameError = '';
      }
    },
    validateNewCategory() {
      const regex = /^[a-zA-Z0-9가-힣\s]+$/;
      if (!regex.test(this.newCategory)) {
        this.newCategoryError = '특수문자는 사용할 수 없습니다.';
      } else {
        this.newCategoryError = '';
      }
    },
    async fetchCategories() {
      try {
        const response = await axios.get(`${process.env.VUE_APP_BACKEND_URL}/categories`);
        this.categories = response.data;
      } catch (err) {
        console.error('카테고리 목록을 불러오는 데 실패했습니다:', err);
      }
    },
    onFileChange(event) {
      const file = event.target.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      const maxSize = 2 * 1024 * 1024; // 2MB

      if (!validTypes.includes(file.type)) {
        alert('유효하지 않은 파일 형식입니다. 이미지 파일을 업로드하세요.');
        return;
      }

      if (file.size > maxSize) {
        alert('파일 크기가 2MB를 초과합니다. 더 작은 파일을 업로드하세요.');
        return;
      }

      this.file = file;
    },
    async addCategory() {
      if (!this.newCategory || this.newCategoryError) {
        alert('유효한 카테고리 이름을 입력해 주세요.');
        return;
      }

      try {
        const response = await axios.post(`${process.env.VUE_APP_BACKEND_URL}/categories`, {
          name: this.newCategory
        });
        this.categories.push(response.data);
        this.newCategory = '';
      } catch (err) {
        console.error('카테고리 추가에 실패했습니다:', err);
      }
    },
    async addItem() {
      const userId = localStorage.getItem('userId'); // 사용자 ID 가져오기

      if (!this.itemName || !this.selectedCategoryId || !userId || this.itemNameError || !this.price) {
        alert('모든 필수 항목을 올바르게 입력해 주세요.');
        return;
      }
      
      let imageUrl = '';
      if (this.file) {
        const formData = new FormData();
        formData.append('file', this.file);

        try {
          const uploadResponse = await axios.post(`${process.env.VUE_APP_BACKEND_URL}/upload`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          imageUrl = uploadResponse.data.filePath;
        } catch (err) {
          console.error('파일 업로드에 실패했습니다:', err);
          alert('파일 업로드에 실패했습니다.');
          return;
        }
      }

      try {
        const response = await axios.post(`${process.env.VUE_APP_BACKEND_URL}/items`, {
          name: this.itemName,
          categoryId: this.selectedCategoryId,
          imageUrl,
          description: this.itemDescription,
          userId, // 사용자 ID 추가
          price: this.price // price 추가
        });
        console.log('아이템 추가에 성공했습니다:', response.data);
        this.$router.push('/mainpage');
      } catch (err) {
        console.error('아이템 추가에 실패했습니다:', err);
        alert('아이템 추가에 실패했습니다.');
      }
    }
  },
  created() {
    this.fetchCategories();
  }
};
</script>

<style>
.add-item-container {
  width: 300px;
  margin: auto;
  padding: 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.form-group {
  margin-bottom: 20px;
}

.custom-select-container {
  position: relative;
  display: flex;
}

.category-select {
  flex: 0 0 50%; /* 50%의 고정된 너비 */
  margin-right: 10px;
  margin-bottom: 10px;
  overflow-y: auto;
}

.category-input-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

.custom-select-container input[type="text"] {
  flex: 1;
  margin-right: 10px;
}

.custom-select-container button {
  flex-shrink: 0;
}

.custom-select-container::after {
  content: '▼';
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  pointer-events: none;
}

.error-message {
  color: red;
  font-size: 0.9em;
}
</style>
