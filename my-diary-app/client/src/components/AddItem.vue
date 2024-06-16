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
        <select id="category" v-model="selectedCategoryId" required class="category-select">
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
        </select>
        <input type="text" v-model="newCategory" @input="validateNewCategory" placeholder="Add new category" class="new-category-input"/>
        <button type="button" @click="addCategory" :disabled="newCategoryError || !newCategory" class="add-category-btn">Add Category</button>
        <p v-if="newCategoryError" class="error-message">{{ newCategoryError }}</p>
      </div>

      <div class="form-group">
        <label for="price">Price</label>
        <input type="number" id="price" v-model="price" required />
      </div>

      <div class="form-group">
        <label for="itemDescription">Item Description</label>
        <textarea id="itemDescription" v-model="itemDescription"></textarea>
      </div>

      <div class="form-group">
        <label for="file">Image</label>
        <input type="file" id="file" @change="onFileChange" />
      </div>

      <button type="submit" class="submit-btn">추가</button>
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
      price: 0,
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
        console.error('카테고리 목록을 불러오는 데 실패했습니다');
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
        console.error('카테고리 추가에 실패했습니다');
      }
    },
    async addItem() {
      const userId = localStorage.getItem('userId');

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
          userId,
          price: this.price
        });
        console.log('아이템 추가에 성공했습니다');
        this.$router.push('/mainpage');
      } catch (err) {
        console.error('아이템 추가에 실패했습니다');
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
body {
  font-family: 'Arial', sans-serif;
  background-color: #f8f9fa;
  margin: 0;
  padding: 0;
}

.add-item-container {
  background-color: #fff;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  margin: 50px auto;
  text-align: left;
}

h1 {
  margin-bottom: 20px;
  color: #333;
  font-size: 24px;
  text-align: center;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  color: #495057;
}

input[type="text"],
input[type="number"],
textarea,
select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

textarea {
  height: 100px;
  resize: none;
}

input[type="file"] {
  border: none;
}

.add-category-btn,
.submit-btn {
  background-color: #007bff;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  width: 100%;
  margin-top: 10px;
}

.add-category-btn[disabled] {
  background-color: #6c757d;
  cursor: not-allowed;
}

.add-category-btn:hover:not([disabled]),
.submit-btn:hover {
  background-color: #0056b3;
}

.error-message {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 5px;
}

.category-input-container {
  display: flex;
  align-items: center;
}

.category-select {
  width: 100%; /* Ensure the select element takes the full width */
}

.new-category-input {
  width: calc(100% - 22px); /* Ensure the new category input takes the full width */
  margin-top: 10px;
  box-sizing: border-box;
}

.add-category-btn {
  width: 100%;
}
</style>