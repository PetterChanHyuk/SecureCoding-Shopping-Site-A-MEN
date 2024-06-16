import axios from 'axios';

const instance = axios.create({
  baseURL: process.env.VUE_APP_BACKEND_URL,
  withCredentials: true, // 모든 요청에 쿠키 포함
});

export default instance;

export const getUsername = async () => {
  try {
    const response = await instance.get('/username');
    return response.data;
  } catch (error) {
    console.error('Error fetching user name:', error);
    throw error;
  }
};
