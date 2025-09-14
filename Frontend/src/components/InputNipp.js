import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { BASE_URL, ADMIN_NIPP } from "../utils";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";
import api from "../api";

const InputNipp = () => {
  const navigate = useNavigate();
  const [nipp, setNipp] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [allowed, setAllowed] = useState(false);

  // CHANGE THIS AND targetTime IN landingPage.js TO SYNC
  const targetTime = new Date("2025-09-14T15:00:00+07:00");
//
  useEffect(() => {
    const now = new Date();
    if (now < targetTime) {
      navigate("/");
    } else {
      setAllowed(true);
    }
  }, [navigate]);

  if (!allowed) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!nipp) {
      setMessage({ text: "NIPP tidak boleh kosong!", type: "error" });
      setIsLoading(false);
      return;
    } else if (nipp.length < 5) {
      setMessage({ text: "NIPP minimal 5 karakter!", type: "error" });
      setIsLoading(false);
      return;
    }

    try {
      // Login request
      const response = await axios.post(`${BASE_URL}/login`, { nipp });

      console.log("Login success:", response.data);
      localStorage.setItem("token", response.data.accessToken);
      localStorage.setItem("nipp", response.data.user.nipp);
      localStorage.setItem("nama", response.data.user.nama);

      setMessage({ text: "Selamat Datang", type: "success" });
      // Check if order exists (handle 404 as normal)
      let orderExists = false;
      try {
        const ifOrderExist = await api.get(`${BASE_URL}/order/${nipp}`);
        if (ifOrderExist.data) {
          orderExists = true;
        }
      } catch (err) {
        if (err.response?.status === 404) {
          // Order not found is okay, just continue
          orderExists = false;
        } else {
          // Other errors should be thrown
          throw err;
        }
      }

      if (orderExists) {
        navigate(`/qrresult`, { state: { nipp } });
        setIsLoading(false);
        return;
      }

      if (response.data.user.nipp === ADMIN_NIPP) {
        navigate("/admindesk");
      } else {
        navigate("/addmembers", { state: { nipp } });
      }
    } catch (error) {
      console.error("Login failed:", error);
      let errorMessage = "Login gagal. Periksa NIPP anda";
      if (error.response?.data?.msg) {
        errorMessage = error.response.data.msg;
      }
      setMessage({ text: errorMessage, type: "error" });
    }

    setIsLoading(false);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{
        backgroundColor: "#406017",
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img
              src={LogoKAI}
              alt="Logo HUT KAI 80"
              className="h-40 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Registrasi Gathering
          </h1>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                NIPP / NIPKWT
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nipp}
                  onChange={(e) => setNipp(e.target.value)}
                  placeholder="Masukkan NIPP Anda"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={isLoading}
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`flex items-center space-x-3 p-4 rounded-xl ${
                  message.type === "success"
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                {message.type === "success" ? (
                  <svg
                    className="h-5 w-5 text-green-600 flex-shrink-0"
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
                ) : (
                  <svg
                    className="h-5 w-5 text-red-600 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                )}
                <span className="text-sm font-medium">{message.text}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              style={{
                backgroundColor: "#406017",
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.target.style.backgroundImage =
                    "linear-gradient(to right, #527020, #5a7a23)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.target.style.backgroundImage =
                    "linear-gradient(to right, #406017, #527020)";
                }
              }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Memproses...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>Lanjutkan</span>
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InputNipp;
