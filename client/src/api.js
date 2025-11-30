// In client/src/api.js
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5001/api', // Your backend server URL
});

export default api;