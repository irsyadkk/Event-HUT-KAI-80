import React, { useState, useEffect } from "react";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../utils";
import { jwtDecode } from "jwt-decode";

const AdminDesktopPage = () => {
  const [searchNipp, setSearchNipp] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [orderList, setOrderList] = useState("");
  const [addQuotaValue, setAddQuotaValue] = useState("");
  const [quota, setQuota] = useState("");
  const [quotaGlobal, setQuotaGlobal] = useState("");

  const axiosJWT = axios.create();

  axiosJWT.interceptors.request.use(
    async (config) => {
      const currentDate = new Date();
      if (expire * 1000 < currentDate.getTime()) {
        try {
          const response = await axios.get(`${BASE_URL}/token`);
          const newAccessToken = response.data.accessToken;
          config.headers.Authorization = `Bearer ${newAccessToken}`;
          setToken(newAccessToken);
          const decoded = jwtDecode(newAccessToken);
          setExpire(decoded.exp);
        } catch (error) {
          console.error("Gagal memperbarui token:", error);
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Refresh token
  const refreshToken = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/token`);
      const decoded = jwtDecode(response.data.accessToken);
      setToken(response.data.accessToken);
      setExpire(decoded.exp);
    } catch (error) {
      console.error("Gagal mengambil token:", error);
    }
  };

  // Ambil data order berdasarkan NIPP
  const getOrderByNipp = async () => {
    try {
      const response = await axiosJWT.get(`${BASE_URL}/order/${searchNipp}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const orderData = response.data.data;

      // Simpan hasil order ke state
      setSearchResult({
        nipp: orderData.nipp,
        nama: orderData.nama,
        qr: orderData.qr, // QR code base64
      });

      setMessage({ text: "Data ditemukan!", type: "success" });
    } catch (error) {
      console.error("Gagal mengambil data order:", error);
      setMessage({
        text: "NIPP tersebut belum mendaftar acara ini",
        type: "error",
      });
      setSearchResult(null);
    }
  };

  // GET ALL ORDERS
  const getAllOrders = async () => {
    try {
      const response = await axiosJWT.get(`${BASE_URL}/order`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const ordersData = response.data.data;
      setOrderList(ordersData || []);
    } catch (error) {
      console.error("Gagal mengambil data order :", error);
      setMessage({
        text: "Data tidak ditemukan !",
        type: "error",
      });
    }
  };

  // GET QUOTA
  const getQuota = async () => {
    try {
      const response = await axiosJWT.get(`${BASE_URL}/quota`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const quotaData = response.data.data;
      setQuota(quota || 0);
    } catch (error) {
      console.error("Gagal mengambil data quota :", error);
      setMessage({
        text: "Gagal mendapatkan data quota !",
        type: "error",
      });
    }
  };

  const addQuota = async () => {
    try {
      const response = await axiosJWT.patch(
        `${BASE_URL}/addquota`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
        {
          add: addQuotaValue,
        }
      );
      getQuota();
    } catch (error) {
      console.error("Gagal menambahkan data quota :", error);
      setMessage({
        text: "Gagal menambahkan data quota !",
        type: "error",
      });
    }
  };

  const getUserByNipp = async () => {
    try {
      const response = await axiosJWT.get(`${BASE_URL}/users/${searchNipp}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = response.data.data;
    } catch (error) {
      console.error("Gagal mengambil data pengguna:", error);
    }
  };

  // Cari data
  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setSearchResult(null);

    if (!searchNipp.trim()) {
      setMessage({ text: "NIPP tidak boleh kosong!", type: "error" });
      setIsLoading(false);
      return;
    }

    try {
      // ambil order
      const orderResponse = await axiosJWT.get(
        `${BASE_URL}/order/${searchNipp}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const orderData = orderResponse.data.data;

      // ambil user
      const userResponse = await axiosJWT.get(
        `${BASE_URL}/users/${searchNipp}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const userData = userResponse.data.data;

      // gabungkan hasil
      setSearchResult({
        nipp: orderData.nipp,
        nama: userData.nama, // dari tabel users
        penetapan: userData.penetapan, // dari tabel users
        anggota: orderData.nama, // array dari tabel orders
        qr: orderData.qr, // dari tabel orders
      });

      setMessage({ text: "Data ditemukan!", type: "success" });
    } catch (error) {
      console.error("Gagal mengambil data:", error);
      setMessage({
        text: "NIPP tersebut belum mendaftar acara ini",
        type: "error",
      });
      setSearchResult(null);
    }

    setIsLoading(false);
  };

  // Download QR
  const downloadQRCode = () => {
    if (!searchResult || !searchResult.qr) return;

    const link = document.createElement("a");
    link.href = searchResult.qr; // langsung pakai base64 dari DB
    link.download = `QR-${searchResult.nipp}.png`;
    link.click();
  };

  useEffect(() => {
    refreshToken();
    getAllOrders();
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ backgroundColor: "#406017" }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src={LogoKAI} alt="Logo HUT KAI 80" className="h-20 w-auto" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-white">Pencarian Data Registrasi Gathering</p>
        </div>

        <div className="table">
          <table className="table-auto">
            <thead>
              <tr>
                <th>NIPP</th>
                <th>Nama</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orderList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="has-text-centered has-text-grey">
                    Tidak ada data order !
                  </td>
                </tr>
              ) : (
                orderList.map((order) => (
                  <tr key={order.id}>
                    <td>{order.nipp}</td>
                    <td className="space-y-1">
                      {order.nama.map((n, index) => (
                        <div key={index}>{n}</div>
                      ))}
                    </td>

                    <td>
                      <button
                        onClick={() => {}}
                        className="button is-warning is-small"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {}}
                        className="button is-danger is-small"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Search Form */}
        {/* <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex space-x-4">
            <input
              type="text"
              value={searchNipp}
              onChange={(e) => setSearchNipp(e.target.value)}
              placeholder="Masukkan NIPP"
              className="flex-1 border rounded-xl px-4 py-2"
              disabled={isLoading}
            />
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-green-700 text-white rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? "Mencari..." : "Cari"}
            </button>
          </div>
          {message && (
            <p
              className={`mt-3 text-sm ${
                message.type === "success" ? "text-green-600" : "text-red-600"
              }`}
            >
              {message.text}
            </p>
          )}
        </div> */}

        {/* Result */}
        {/* {searchResult && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Detail Registrasi
            </h3>
            <p>
              <b>NIPP:</b> {searchResult.nipp}
            </p>
            <p>
              <b>Nama:</b> {searchResult.nama}
            </p>
            <p>
              <b>Penetapan:</b> {searchResult.penetapan}
            </p>
            <p>
              <b>Anggota Terdaftar:</b>
            </p>
            <ol className="list-decimal list-inside mt-1">
              {searchResult.anggota && searchResult.anggota.length > 0 ? (
                searchResult.anggota.map((item, index) => (
                  <li key={index} className="ml-4">
                    {item}
                  </li>
                ))
              ) : (
                <p className="ml-4">-</p>
              )}
            </ol>

            <div className="mt-4 text-center">
              <img
                src={searchResult.qr}
                alt="QR Code"
                className="mx-auto border rounded-lg p-2 bg-white"
                style={{ width: "200px", height: "200px" }}
              />
              <button
                onClick={downloadQRCode}
                className="mt-4 px-6 py-2 bg-green-700 text-white rounded-xl"
              >
                Download QR Code
              </button>
            </div>
          </div>
        )} */}
      </div>
    </div>
  );
};

export default AdminDesktopPage;
