import React, { useState, useEffect } from "react";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL } from "../utils";
import { jwtDecode } from "jwt-decode";
import { ADMIN_NIPP } from "../utils";

const AdminDesktopPage = () => {
  const [searchNipp, setSearchNipp] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageCari, setMessageCari] = useState("");
  const [messageTambah, setMessageTambah] = useState("");
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [orderList, setOrderList] = useState("");
  let [quotaValue, setQuotaValue] = useState("");
  let [quota, setQuota] = useState("");
  let [quotaTotal, setQuotaTotal] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubOpen, setIsSubOpen] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [nippAdd, setNippAdd] = useState("");
  const [namaAdd, setNamaAdd] = useState("");
  const [penetapanAdd, setPenetapanAdd] = useState("");

  const axiosJWT = axios.create();
  const navigate = useNavigate();

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

  const logout = async () => {
    try {
      await axios.delete(`${BASE_URL}/logout`, {
        withCredentials: true,
      });
    } catch (error) {
      console.error("Gagal logout:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("nipp");
      navigate("/");
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
      if (!response) {
        setQuota(0);
        setQuotaTotal(0);
      }
      const quotaData = response.data.data;
      setQuota(quotaData.quota);
      setQuotaTotal(quotaData.total_quota);
    } catch (error) {
      console.error("Gagal mengambil data quota :", error);
      setMessage({
        text: "Gagal mendapatkan data quota !",
        type: "error",
      });
    }
  };

  // ADD USER
  const handleAddUser = async () => {
    try {
      if (!nippAdd.trim() || !namaAdd.trim() || !penetapanAdd.trim()) {
        const msg = !nippAdd.trim()
          ? "NIPP tidak boleh kosong !"
          : !namaAdd.trim()
          ? "Nama tidak boleh kosong !"
          : "Jatah tidak boleh kosong & harus angka !";
        setMessageTambah({ text: msg, type: "error" });
        setIsLoading(false);
        return;
      }
      const response = await axiosJWT.post(
        `${BASE_URL}/users`,
        {
          nipp: nippAdd,
          nama: namaAdd,
          penetapan: Number(penetapanAdd),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response) {
        throw console.error();
      }
      console.log(`Berhasil menambahkan ${quotaValue} kuota !`);
      setMessageTambah({
        text: `Berhasil menambahkan ${namaAdd} dengan ${nippAdd} dan jatah ${penetapanAdd} !`,
        type: "success",
      });
      setNippAdd("");
      setNamaAdd("");
      setPenetapanAdd("");
    } catch (error) {
      console.error("Gagal menambahkan orang :", error);
      setNippAdd("");
      setNamaAdd("");
      setPenetapanAdd("");
      setMessageTambah({
        text: `Gagal menambahkan ${namaAdd} dengan NIPP ${nippAdd}`,
        type: "error",
      });
    }
  };

  const handleAddQuota = async () => {
    try {
      const response = await axiosJWT.patch(
        `${BASE_URL}/addquota`,
        {
          add: Number(quotaValue),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response) {
        throw console.error();
      }
      getQuota();
      setIsAddOpen(false);
      setQuotaValue(0);
      alert(`Kuota sebanyak ${quotaValue} berhasil ditambahkan !`);
      console.log(`Berhasil menambahkan ${quotaValue} kuota !`);
    } catch (error) {
      setQuotaValue = 0;
      console.error("Gagal menambahkan quota :", error);
      setMessage({
        text: `Gagal menambahkan kuota sebanyak ${quotaValue} !`,
        type: "error",
      });
    }
  };

  const handleSubQuota = async () => {
    try {
      const response = await axiosJWT.patch(
        `${BASE_URL}/subquota`,
        {
          sub: Number(quotaValue),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response) {
        throw console.error();
      }
      getQuota();
      setIsSubOpen(false);
      setQuotaValue = 0;
      alert(`Kuota sebanyak ${quotaValue} berhasil dikurangi !`);
      console.log(`Berhasil mengurangi ${quotaValue} kuota !`);
    } catch (error) {
      setQuotaValue = 0;
      console.error("Gagal mengurangi quota :", error);
      setMessage({
        text: `Gagal mengurangi kuota sebanyak ${quotaValue} !`,
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
    setMessageCari("");
    setSearchResult(null);

    if (!searchNipp.trim()) {
      setMessageCari({ text: "NIPP tidak boleh kosong!", type: "error" });
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

      setMessageCari({ text: "Data ditemukan !", type: "success" });
    } catch (error) {
      console.error("Gagal mengambil data:", error);
      setMessageCari({
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
    getQuota();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const nipp = localStorage.getItem("nipp");

    if (!token || !nipp) {
      navigate("/");
      return;
    }
    if (nipp !== ADMIN_NIPP) {
      navigate("/");
    } else {
      setAllowed(true);
    }
  }, [navigate]);

  if (!allowed) return null;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ backgroundColor: "#406017" }}
    >
      <div className="max-w-5xl w-full space-y-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src={LogoKAI}
              alt="Logo HUT KAI 80"
              className="h-24 w-auto drop-shadow-lg"
            />
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow"
          >
            Logout
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-white mt-2">Pencarian & Manajemen Kuota Peserta</p>
        </div>

        {/* Quota Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold text-gray-700">
              Sisa Kuota: <span className="text-green-700">{quota}</span>
            </p>
            <p className="text-sm text-gray-500">
              Total Kuota: {quotaTotal} | Terdaftar: {quotaTotal - quota}
            </p>
          </div>
          <div className="space-x-2">
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow"
            >
              Tambah Kuota
            </button>
            <button
              onClick={() => setIsSubOpen(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow"
            >
              Kurangi Kuota
            </button>
          </div>
        </div>

        {/* Modal Tambah Kuota */}
        {isAddOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-96 p-6">
              <h2 className="text-lg font-semibold mb-4">Tambah Kuota</h2>
              <input
                type="number"
                onChange={(e) => setQuotaValue(e.target.value)}
                placeholder="Masukkan jumlah kuota"
                className="w-full border rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddQuota}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Kurangi Kuota */}
        {isSubOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-lg w-96 p-6">
              <h2 className="text-lg font-semibold mb-4">Kurangi Kuota</h2>
              <input
                type="number"
                onChange={(e) => setQuotaValue(e.target.value)}
                placeholder="Masukkan jumlah kuota"
                className="w-full border rounded-lg px-3 py-2 mb-4 focus:ring-2 focus:ring-red-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsSubOpen(false)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubQuota}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAMBAH USER */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <p className="text-lg font-semibold text-gray-700">
            Tambah Pegawai <span className="text-green-700"></span>
          </p>
          <div className="flex space-x-4">
            <input
              type="text"
              value={nippAdd}
              onChange={(e) => setNippAdd(e.target.value)}
              placeholder="Masukkan NIPP"
              className="flex-1 border rounded-xl px-4 py-2"
              disabled={isLoading}
            />
            <input
              type="text"
              value={namaAdd}
              onChange={(e) => setNamaAdd(e.target.value)}
              placeholder="Masukkan Nama"
              className="flex-1 border rounded-xl px-4 py-2"
              disabled={isLoading}
            />
            <input
              type="number"
              value={penetapanAdd}
              onChange={(e) => setPenetapanAdd(e.target.value)}
              placeholder="Masukkan Jatah"
              className="flex-1 border rounded-xl px-4 py-2"
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleAddUser}
            className="px-6 py-2 bg-green-700 text-white rounded-xl"
            disabled={isLoading}
          >
            {isLoading ? "Menambahkan..." : "Tambah"}
          </button>
          {messageTambah && (
            <p
              className={`mt-3 text-sm ${
                messageTambah.type === "success"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {messageTambah.text}
            </p>
          )}
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <p className="text-lg font-semibold text-gray-700">
            Cari NIPP / NIPKWT <span className="text-green-700"></span>
          </p>
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
          {messageCari && (
            <p
              className={`mt-3 text-sm ${
                messageCari.type === "success"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {messageCari.text}
            </p>
          )}
        </div>

        {/* Result */}
        {searchResult && (
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
        )}

        {/* Table Orders */}
        <div className="bg-white rounded-2xl shadow-lg p-6 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700">
                <th className="px-4 py-2 text-left">NIPP</th>
                <th className="px-4 py-2 text-left">Nama</th>
                <th className="px-4 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {orderList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center text-gray-500 py-4">
                    Tidak ada data order !
                  </td>
                </tr>
              ) : (
                orderList.map((order) => (
                  <tr key={order.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2">{order.nipp}</td>
                    <td className="px-4 py-2 space-y-1">
                      {order.nama.map((n, index) => (
                        <div key={index}>{n}</div>
                      ))}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => {
                          navigate("/detailregister", {
                            state: { nipp: order.nipp },
                          });
                        }}
                        className="px-3 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded-lg"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDesktopPage;
