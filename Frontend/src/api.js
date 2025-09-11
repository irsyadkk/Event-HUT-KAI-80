import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { BASE_URL} from "utils.js" // Pastikan path ke utils.js sudah benar

// Buat satu instance Axios terpusat
const api = axios.create({
  baseURL: BASE_URL,
});

// Gunakan 'request interceptor' untuk mengatur semua permintaan keluar
api.interceptors.request.use(
  async (config) => {
    // 1. Ambil token dari local storage sebagai sumber utama
    let token = localStorage.getItem("token");

    // Hanya lanjutkan jika token ada
    if (token) {
      const decoded = jwtDecode(token);
      const currentDate = new Date();

      // 2. Cek apakah token sudah kedaluwarsa
      if (decoded.exp * 1000 < currentDate.getTime()) {
        console.log("Access token kedaluwarsa, mencoba refresh...");
        try {
          // 3. Jika kedaluwarsa, minta token baru menggunakan refreshToken di cookie
          const response = await axios.get(`${BASE_URL}/token`, {
            withCredentials: true, // Ini penting agar cookie terkirim
          });
          token = response.data.accessToken; // Gunakan token yang baru
          localStorage.setItem("token", token); // Simpan token baru ke local storage
          console.log("Token berhasil di-refresh.");
        } catch (error) {
          console.error("Gagal refresh token:", error);
          // Jika refresh gagal, hapus token lama dan arahkan ke halaman login
          localStorage.removeItem("token");
          window.location.href = '/'; 
          return Promise.reject(error);
        }
      }
      
      // 4. Selalu lampirkan token yang valid ke header Authorization
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;