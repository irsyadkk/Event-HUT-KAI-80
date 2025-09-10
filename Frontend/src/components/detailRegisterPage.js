import React, { useEffect, useState } from "react";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { BASE_URL } from "../utils";
import { useLocation, useNavigate } from "react-router-dom";
import { ADMIN_NIPP } from "../utils";

const DetailRegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const nipp = location.state?.nipp;
  const [token, setToken] = useState("");
  const [expire, setExpire] = useState("");
  const [namaPegawai, setNamaPegawai] = useState("");
  const [orderData, setOrderData] = useState(null);
  const [allowed, setAllowed] = useState(false);

  // axios instance
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

  // refresh token pertama kali
  const refreshToken = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/token`);
      const decoded = jwtDecode(response.data.accessToken);
      setToken(response.data.accessToken);
      setNamaPegawai(decoded.nama);
      setExpire(decoded.exp);
    } catch (error) {
      console.error("Gagal mengambil token:", error);
    }
  };

  // get order
  const getOrderByNipp = async () => {
    try {
      const response = await axiosJWT.get(`${BASE_URL}/order/${nipp}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.data) {
        setOrderData(response.data.data); // simpan ke state
      }
    } catch (error) {
      console.error("Gagal mengambil data order:", error);
    }
  };

  const downloadQR = () => {
    if (!orderData?.qr) return;
    const link = document.createElement("a");
    link.href = orderData.qr; // base64 image
    link.download = `qr-${nipp}.png`; // nama file
    link.click();
  };

  // load data
  useEffect(() => {
    const initData = async () => {
      if (nipp) {
        await refreshToken();
      }
    };
    initData();
  }, [nipp]);

  useEffect(() => {
    if (token) {
      getOrderByNipp();
    }
  }, [token]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const nipp = localStorage.getItem("nipp");

    if (!token || !nipp) {
      navigate("/");
      return;
    }
    if (nipp !== ADMIN_NIPP) {
      navigate("/");
    }
    if (nipp === ADMIN_NIPP && !location.state?.nipp) {
      navigate("/admindesk");
    } else {
      setAllowed(true);
    }
  }, [navigate]);

  if (!allowed) return null;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        background:
          "linear-gradient(to bottom right, #406017, #527020, #334d12)",
      }}
    >
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img
              src={LogoKAI}
              alt="Logo HUT KAI 80"
              className="h-20 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Registrasi Berhasil!
          </h1>
          <p className="text-green-200 text-sm">PT Kereta Api Indonesia</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {orderData ? (
            <div className="text-center space-y-6">
              {/* Success Icon */}
              <div className="flex justify-center">
                <div className="bg-green-100 rounded-full p-4">
                  <svg
                    className="h-12 w-12 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* QR Code */}
              {orderData.qr && (
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-gray-200">
                    <img src={orderData.qr} alt="QR Code" />
                  </div>
                  <button
                    onClick={downloadQR}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Download QR
                  </button>
                </div>
              )}

              {/* Registration Info */}
              <div className="bg-gray-50 rounded-xl p-6 text-left">
                <h3 className="font-semibold text-lg text-gray-800 mb-4">
                  Detail Pendaftaran
                </h3>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">NIPP:</span>
                    <span className="font-medium text-gray-900">{nipp}</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-800 mb-3">
                    Anggota Keluarga yang Terdaftar:
                  </h4>
                  <div className="space-y-2">
                    {Array.isArray(orderData.nama) &&
                      orderData.nama.map((nm, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0"
                        >
                          <span className="font-medium text-gray-900">
                            {nm}
                          </span>
                        </div>
                      ))}
                  </div>
                  <div className="mt-3 pt-2 border-t">
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-800">Total Peserta:</span>
                      <span className="text-gray-900">
                        {Array.isArray(orderData.nama)
                          ? orderData.nama.length
                          : 0}{" "}
                        orang
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center text-gray-500">Memuat data...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailRegisterPage;
