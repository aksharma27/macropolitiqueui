import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL || 'http://localhost:4000',
  timeout: 10000,
  withCredentials: true,
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    config.withCredentials = true;
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Only set Content-Type if not FormData
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized – session expired');
      if (!error.config.url.includes('/auth/login')) {
        localStorage.removeItem('userRole');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');
        window.location.replace('/auth');
      }
    }
    return Promise.reject(error);
  }
);

// ---------- API FUNCTIONS ----------

// Fetch articles (public)
export const fetchArticles = async (options = {}) => {
  const { page = 1, limit = 20, search = '', sort = 'desc' } = options;
  const response = await apiClient.get('/posts', {
    params: { page, limit, search, sort },
  });
  return response.data.posts || response.data;
};

// Post a new article (public – but will be set to pending)
export const postArticle = async (data) => {
  const isFormData = data instanceof FormData;
  const response = await apiClient.post('/posts', data, {
    headers: isFormData ? {} : { 'Content-Type': 'application/json' },
  });
  return response.data;
};

// Admin: approve a post
export const approvePost = async (postId) => {
  const response = await apiClient.post(`/posts/${postId}/approve`);
  return response.data;
};

// Admin: update a post (can send FormData with image or JSON)
export const updatePost = async (postId, updateData) => {
  const config = updateData instanceof FormData
    ? {}
    : { headers: { 'Content-Type': 'application/json' } };
  const response = await apiClient.patch(`/posts/${postId}`, updateData, config);
  return response.data;
};

// Admin: fetch all posts (including unpublished)
export const fetchAllPosts = async () => {
  const response = await apiClient.get('/posts/all-posts');
  return response.data;
};

// Admin: delete a post
export const deletePost = async (postId) => {
  const response = await apiClient.delete(`/posts/${postId}`);
  return response.data;
};

// OTP for article verification (public)
export const sendArticleOtp = async (email) => {
  const response = await apiClient.post('/posts/send-otp', { email });
  return response.data;
};

export const verifyArticleOtp = async ({ email, otp }) => {
  const response = await apiClient.post('/posts/verify-otp', { email, otp });
  return response.data;
};

// Check if email is already verified
export const checkEmailVerified = async (email) => {
  const response = await apiClient.post('/posts/check-email', { email });
  return response.data;
};

// Auth endpoints
export const loginUser = async (credentials) => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
};

export const logoutUser = async () => {
  const response = await apiClient.post('/auth/logout');
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (data) => {
  const response = await apiClient.post('/auth/reset-password', data);
  return response.data;
};

export const sendContactMessage = async (data) => {
  const response = await apiClient.post('/contact', data);
  return response.data;
};

export default apiClient;
