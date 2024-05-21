<template>
    <div class="add-item-container">
      <h1>새로운 아이템 추가</h1>
      <form @submit.prevent="addItem">
        <div>
          <label for="itemName">Item Name</label>
          <input type="text" id="itemName" v-model="itemName" required />
        </div>
        <div>
          <label for="category">Category</label>
          <select id="category" v-model="selectedCategoryId" required>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
          <input type="text" v-model="newCategory" placeholder="Add new category" />
          <button type="button" @click="addCategory">Add Category</button>
        </div>
        <div>
          <label for="itemDescription">Item Description</label>
          <textarea id="itemDescription" v-model="itemDescription"></textarea>
        </div>
        <div>
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
        categories: []
      };
    },
    methods: {
      async fetchCategories() {
        try {
          const response = await axios.get(`${process.env.VUE_APP_BACKEND_URL}/categories`);
          this.categories = response.data;
        } catch (err) {
          console.error('Failed to fetch categories:', err);
        }
      },
      onFileChange(event) {
        this.file = event.target.files[0];
      },
      async addCategory() {
        if (!this.newCategory) return;
  
        try {
          const response = await axios.post(`${process.env.VUE_APP_BACKEND_URL}/categories`, {
            name: this.newCategory
          });
          this.categories.push(response.data);
          this.newCategory = '';
        } catch (err) {
          console.error('Failed to add category:', err);
        }
      },
      async addItem() {
        const userId = localStorage.getItem('userId'); // 사용자 ID 가져오기
  
        if (!this.itemName || !this.selectedCategoryId || !userId) {
          alert('Please fill in all required fields');
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
            console.error('File upload failed:', err);
          }
        }
  
        try {
          const response = await axios.post(`${process.env.VUE_APP_BACKEND_URL}/items`, {
            name: this.itemName,
            categoryId: this.selectedCategoryId,
            imageUrl,
            description: this.itemDescription,
            userId // 사용자 ID 추가
          });
          console.log('Item added successfully:', response.data);
          this.$router.push('/mainpage');
        } catch (err) {
          console.error('Failed to add item:', err);
          if (err.response && err.response.data) {
            console.error('Error details:', err.response.data);
          }
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
  </style>
  