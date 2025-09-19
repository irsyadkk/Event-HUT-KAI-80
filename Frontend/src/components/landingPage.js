import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";

function LandingPage() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(0);

  // CHANGE THIS AND targetTime IN InputNipp.js TO SYNC
  const targetTime = new Date("2025-09-14T15:00:00+07:00");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((targetTime - now) / 1000);
      setTimeLeft(diff > 0 ? diff : 0);
      localStorage.removeItem("token");
      localStorage.removeItem("nipp");
      localStorage.removeItem("nama");
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const secs = seconds % 60;

    if (days > 0) {
      return `${days} hari ${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    } else {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #1a4d0f 0%, #2d5016 30%, #406017 70%, #5a7c2a 100%)",
      }}
    >
      {/* Background Animation */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-gradient-to-br from-yellow-300/20 to-orange-300/10 rounded-full animate-pulse blur-3xl"></div>
        <div
          className="absolute -bottom-32 -left-32 w-80 h-80 bg-gradient-to-tr from-white/10 to-blue-200/5 rounded-full animate-bounce blur-2xl"
          style={{ animationDuration: "4s" }}
        ></div>
        <div
          className="absolute top-1/3 right-1/3 w-48 h-48 bg-gradient-to-r from-green-300/15 to-yellow-300/10 rounded-full animate-ping blur-xl"
          style={{ animationDuration: "3s" }}
        ></div>
        <div
          className="absolute top-2/3 left-1/4 w-32 h-32 bg-gradient-to-br from-blue-300/10 to-purple-300/5 rounded-full animate-pulse blur-xl"
          style={{ animationDuration: "2.5s" }}
        ></div>

        {/* Subtle geometric patterns */}
        <div
          className="absolute top-10 left-10 w-16 h-16 border border-white/10 rotate-45 animate-spin"
          style={{ animationDuration: "20s" }}
        ></div>
        <div
          className="absolute bottom-20 right-20 w-12 h-12 border border-yellow-300/20 rotate-12 animate-bounce"
          style={{ animationDuration: "3s" }}
        ></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-6">
        <div className="max-w-7xl mx-auto w-full">
          {/* Header Section with Logo */}
          <div className="text-center mb-8 lg:mb-12">
            <div className="relative inline-block">
              <img
                src={LogoKAI}
                alt="Logo HUT KAI 80"
                className="h-40 lg:h-48 w-auto mx-auto mb-6 object-contain drop-shadow-2xl transform hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-yellow-300/20 blur-3xl rounded-full transform scale-150 -z-10"></div>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl lg:text-4xl font-black text-white leading-tight tracking-wide">
                Family Gathering
              </h1>
              <div className="text-3xl lg:text-5xl font-bold">
                <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 bg-clip-text text-transparent">
                  HUT KAI 80
                </span>
              </div>
              <div className="text-2xl lg:text-4xl font-bold text-green-400">
                DAOP 6 Yogyakarta
              </div>
            </div>
          </div>

          {/* Main Grid 3 Columns */}
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Left Column - Event Info */}
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 lg:p-8 border border-white/20 shadow-2xl">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">📍</div>
                    <div>
                      <p className="text-lg lg:text-xl font-bold text-white">
                        Lokasi
                      </p>
                      <p className="text-blue-200 text-base lg:text-lg">
                        Puncak Sosok, Bantul, DIY
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🗓️</div>
                    <div>
                      <p className="text-lg lg:text-xl font-bold text-white">
                        Tanggal
                      </p>
                      <p className="text-green-200 text-base lg:text-lg">
                        Sabtu, 20 September 2025
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">⏰</div>
                    <div>
                      <p className="text-lg lg:text-xl font-bold text-white">
                        Waktu
                      </p>
                      <p className="text-green-200 text-base lg:text-lg">
                        14:00 - 21:00 WIB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle Column - Countdown + Button */}
            <div className="space-y-6">
              {timeLeft > 0 ? (
                <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 lg:p-8 border border-white/30 transform hover:scale-105 transition-all duration-300">
                  <div className="text-center space-y-4">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <div className="text-2xl animate-bounce">🔥</div>
                      <p className="text-gray-700 font-bold text-lg lg:text-xl">
                        WAR TICKET TAHAP 2
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-2xl">
                      <div className="text-3xl lg:text-4xl font-black mb-2">
                        {formatTime(timeLeft)}
                      </div>
                      <p className="text-sm lg:text-base opacity-90">
                        14 September 2025 - 15:00 WIB
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-3xl shadow-2xl p-6 lg:p-8 text-white border-2 border-red-400">
                  <div className="text-center">
                    <p className="text-lg lg:text-xl font-bold">
                      MASA REGISTRASI TELAH USAI!
                    </p>
                  </div>
                </div>
              )}

              {/* Main Action Button */}
              <button
                onClick={() => {
                  if (timeLeft > 0) {
                    navigate("/");
                  } else {
                    navigate("/inputnipp");
                  }
                }}
                className={`w-full py-6 lg:py-8 px-8 rounded-3xl font-black text-lg lg:text-xl shadow-2xl 
                transition-all duration-500 transform relative overflow-hidden
                ${
                  timeLeft > 0
                    ? "bg-gray-500 text-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 hover:from-yellow-500 hover:via-orange-500 hover:to-red-500 text-gray-900 hover:scale-105 hover:shadow-3xl animate-pulse"
                }`}
                disabled={timeLeft > 0}
              >
                {timeLeft <= 0 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/50 to-orange-500/50 blur-xl animate-pulse"></div>
                )}
                <span className="relative z-10 flex items-center justify-center space-x-3">
                  {timeLeft > 0 ? (
                    <>
                      <span>⏳</span>
                      <span>Menunggu Registrasi...</span>
                    </>
                  ) : (
                    <>
                      <span>CHECK IN UNTUK LIHAT TIKET</span>
                    </>
                  )}
                </span>
              </button>
            </div>

            {/* Right Column - Menu Lainnya */}
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 lg:p-8 border border-white/20 shadow-2xl">
                <h3 className="text-2xl lg:text-3xl font-bold text-white mb-6 text-center">
                  Menu Lainnya
                </h3>
                <div className="space-y-4">
                  <button
                    onClick={() => navigate("/winnerdisplay")}
                    className="w-full group relative overflow-hidden py-5 lg:py-6 px-8 rounded-2xl font-bold text-lg lg:text-lg shadow-xl 
                    transition-all duration-300 transform hover:scale-105
                    bg-gradient-to-r from-pink-500 via-pink-600 to-purple-600 hover:from-pink-600 hover:via-purple-600 hover:to-indigo-600 text-white"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-400/50 to-purple-500/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative z-10 flex items-center justify-center space-x-3">
                      <span>LIHAT PEMENANG UNDIAN</span>
                    </span>
                  </button>

                  <button
                    onClick={() => navigate("/prizenames")}
                    className="w-full group relative overflow-hidden py-5 lg:py-6 px-8 rounded-2xl font-bold text-lg lg:text-lg shadow-xl 
                    transition-all duration-300 transform hover:scale-105
                    bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-600 hover:via-cyan-600 hover:to-blue-600 text-white"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/50 to-cyan-500/50 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative z-10 flex items-center justify-center space-x-3">
                      <span>LIHAT DAFTAR HADIAH</span>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* End Grid */}
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
