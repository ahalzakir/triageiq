import axios from 'axios';

// Strict adherence to Correction 1: Vite prefix VITE_API_BASE_URL via import.meta.env
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});
