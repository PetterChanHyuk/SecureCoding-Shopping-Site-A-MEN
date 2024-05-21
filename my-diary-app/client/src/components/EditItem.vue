<template>
    <div>
      <h1>Edit Item</h1>
      <form @submit.prevent="updateItem">
        <div>
          <label for="name">Name:</label>
          <input type="text" id="name" v-model="item.name" required>
        </div>
        <div>
          <label for="category">Category:</label>
          <select id="category" v-model="item.category_id" required>
            <option v-for="category in categories" :key="category.id" :value="category.id">
              {{ category.name }}
            </option>
          </select>
        </div>
        <div>
          <label for="description">Description:</label>
          <textarea id="description" v-model="item.description" required></textarea>
        </div>
        <div>
          <label for="image">Image:</label>
          <input type="file" id="image" @change="onFileChange">
        </div>
        <button type="submit">Update Item</button>
      </form>
    </div>
  </template>
  
  <script>
  import axios from 'axios';
  
  export default {
    data() {
      return {
        item: {
          name: '',
          category_id: '',
          description: '',
          image_url: ''
        },
        categories: [],
        file: null
      };
    },
    created() {
      this.fetchItem();
      this.fetchCategories();
    },
    methods: {
      fetchItem() {
        const itemId = this.$route.params.id;
        axios.get(`${process.env.VUE_APP_BACKEND_URL}/items/${itemId}`)
          .then(response => {
            this.item = response.data;
          })
          .catch(error => {
            console.error('Failed to fetch item:', error);
            alert('아이템 데이터를 불러오는데 실패했습니다.');
          });
      },
      fetchCategories() {
        axios.get(`${process.env.VUE_APP_BACKEND_URL}/categories`)
          .then(response => {
            this.categories = response.data;
          })
          .catch(error => {
            console.error('Failed to fetch categories:', error);
          });
      },
      onFileChange(event) {
        this.file = event.target.files[0];
      },
      updateItem() {
        const itemId = this.$route.params.id;
        const formData = new FormData();
        formData.append('file', this.file);

        const userId = localStorage.getItem('userId'); // 사용자 ID 가져오기

        axios.post(`${process.env.VUE_APP_BACKEND_URL}/upload`, formData)
            .then(uploadResponse => {
            const imageUrl = uploadResponse.data.filePath;
            return axios.put(`${process.env.VUE_APP_BACKEND_URL}/items/${itemId}`, {
                name: this.item.name,
                categoryId: this.item.category_id,
                description: this.item.description,
                imageUrl: imageUrl,
                userId: userId // 사용자 ID 추가
            });
        })
        .then(() => {
            alert('아이템이 성공적으로 수정되었습니다.');
            this.$router.push('/mypage');
        })
        .catch(error => {
            console.error('Failed to update item:', error);
        alert('아이템 수정에 실패했습니다.');
         });
    }
    }
  };
  </script>
  