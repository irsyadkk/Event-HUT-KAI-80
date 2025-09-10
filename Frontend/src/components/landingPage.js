import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";

function LandingPage() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(0);
  // SET TIME HERE
  // target: 12 September 2025 jam 09:00 WIB
  const targetTime = new Date(2025, 8, 11, 4, 30, 0);
  // bulan 8 = September (karena index mulai dari 0)

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((targetTime - now) / 1000);
      console.log("Sekarang:", now.toString());
      console.log("Target:", targetTime.toString());
      console.log("Selisih (detik):", diff);
      setTimeLeft(diff > 0 ? diff : 0);
    }, 1000);

    return () => clearInterval(timer);
  }, [targetTime]);

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
          "linear-gradient(135deg, #2d5016 0%, #406017 50%, #5a7c2a 100%)",
      }}
    >
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-yellow-300/10 rounded-full animate-pulse"></div>
        <div
          className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-full animate-bounce"
          style={{ animationDuration: "3s" }}
        ></div>
        <div
          className="absolute top-1/4 right-1/4 w-32 h-32 bg-green-300/10 rounded-full animate-ping"
          style={{ animationDuration: "2s" }}
        ></div>
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">
          {/* Left Column - Header & Logo */}
          <div className="text-center md:text-left space-y-6">
            <img
              src={LogoKAI}
              alt="Logo HUT KAI 80"
              className="h-32 w-auto mx-auto md:mx-0 mb-6 object-contain drop-shadow-2xl"
            />

            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 leading-tight">
                Gathering
                <span className="block text-yellow-300">HUT KAI 80</span>
              </h1>
              <p className="text-xl text-blue-200 font-medium">
                📍 Puncak Sosok, Yogyakarta
              </p>
              <p className="text-lg text-green-200">
                🗓️ 20 September 2025 | ⏰ 15:00-21:00 WIB
              </p>
            </div>

            {/* Countdown Card */}
            {timeLeft > 0 ? (
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 border border-white/20">
                <div className="text-center">
                  <p className="text-gray-600 font-medium mb-2">
                    🔥 WAR TICKET TAHAP 1
                  </p>
                  <div className="text-3xl md:text-4xl font-bold text-green-700 mb-2">
                    {formatTime(timeLeft)}
                  </div>
                  <p className="text-sm text-gray-500">
                    12 September 2025 - 09:00 WIB
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-2xl shadow-2xl p-6 text-white animate-pulse">
                <p className="text-xl font-bold text-center">
                  🎯 REGISTRASI TAHAP 1 DIBUKA!
                </p>
              </div>
            )}

            {/* Action Button */}
            <button
              onClick={() => navigate("/inputnipp")}
              disabled={timeLeft > 0}
              className={`w-full py-4 px-8 rounded-2xl font-bold text-lg shadow-2xl transition-all duration-300 transform ${
                timeLeft > 0
                  ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-800 hover:scale-105 hover:shadow-3xl"
              }`}
            >
              {timeLeft > 0
                ? "⏳ Menunggu Tahap 1..."
                : "🚀 MULAI REGISTRASI TAHAP 1"}
            </button>
          </div>

          {/* Right Column - Info Cards */}

          <div className="space-y-4">
            {/* Card SELAMAT DATANG */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-2xl p-6 text-white text-center">
              <h3 className="font-bold text-lg mb-2">✨ Selamat Datang!</h3>
              <p className="text-sm opacity-90">
                Registrasi War Ticket HUT KAI Ke-80 di Daop 6
              </p>
            </div>
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-green-700 mb-4 text-center">
                🎫 WAR TICKET INFO
              </h2>

              <div className="space-y-4">
                {/* War Ticket Schedule */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
                  <h3 className="font-bold text-blue-700 mb-2 flex items-center">
                    ⚡ Jadwal War Ticket
                  </h3>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex justify-between items-center bg-white rounded-lg p-2 shadow-sm">
                      <span className="font-medium">Tahap 1</span>
                      <span className="text-blue-600 font-bold">
                        12 Sep • 09:00 WIB
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-white rounded-lg p-2 shadow-sm">
                      <span className="font-medium">Tahap 2</span>
                      <span className="text-blue-600 font-bold">
                        13 Sep • 15:00 WIB
                      </span>
                    </div>
                  </div>
                </div>

                {/* Event Info */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
                  <h3 className="font-bold text-green-700 mb-2 flex items-center">
                    🎉 Detail Acara
                  </h3>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      <span>
                        <strong>Tanggal:</strong> 20 September 2025
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      <span>
                        <strong>Waktu:</strong> 15:00 - 21:00 WIB
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      <span>
                        <strong>Lokasi:</strong> Puncak Sosok
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quota Info */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4">
                  <h3 className="font-bold text-orange-700 mb-2 flex items-center">
                    👨‍👩‍👧‍👦 Kuota Keluarga
                  </h3>
                  <p className="text-sm text-gray-700">
                    Kuota per NIPP sesuai data terdaftar di HRIS
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
