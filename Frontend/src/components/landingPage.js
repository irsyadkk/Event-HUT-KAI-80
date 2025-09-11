import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";

function LandingPage() {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState(0);

  // CHANGE THIS AND targetTime IN InputNipp.js TO SYNC
  const targetTime = new Date("2025-09-12T09:00:00+07:00");

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

      <div className="relative z-10 min-h-screen flex items-center justify-center px-6 py-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-8 items-start">
          {/* Left Column - Header & Logo */}
          <div className="text-center md:text-left space-y-5">
            <img
              src={LogoKAI}
              alt="Logo HUT KAI 80"
              className="h-60 w-auto mx-auto md:mx-0 mb-4 object-contain drop-shadow-2xl"
            />

            <div className="space-y-3">
              <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                Gathering
                <span className="block text-yellow-300">HUT KAI 80</span>
              </h1>
              <p className="text-lg text-blue-200 font-medium">
                📍 Puncak Sosok, Bantul, DIY
              </p>
              <p className="text-base text-green-200">
                🗓️ 20 September 2025 | ⏰ 15:00-21:00 WIB
              </p>
            </div>

            {/* Countdown Card */}
            {timeLeft > 0 ? (
              <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl p-5 border border-white/20">
                <div className="text-center">
                  <p className="text-gray-600 font-medium mb-2 text-sm">
                    🔥 WAR TICKET TAHAP 1
                  </p>
                  <div className="text-2xl md:text-3xl font-bold text-green-700 mb-2">
                    {formatTime(timeLeft)}
                  </div>
                  <p className="text-xs text-gray-500">
                    12 September 2025 - 09:00 WIB
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-xl shadow-xl p-5 text-white">
                <p className="text-lg font-bold text-center">
                  REGISTRASI TELAH DIBUKA!
                </p>
              </div>
            )}

            {/* Action Button */}
            {timeLeft > 0 ? (
              <button
                disabled
                className="w-full py-3 px-6 rounded-xl font-bold text-base shadow-xl 
                           bg-gray-400 text-gray-600 cursor-not-allowed"
              >
                ⏳ Menunggu Registrasi...
              </button>
            ) : (
              <button
                onClick={() => navigate("/inputnipp")}
                className="w-full py-3 px-6 rounded-xl font-bold text-lg shadow-xl 
                           bg-gradient-to-r from-yellow-400 to-yellow-500 
                           hover:from-yellow-500 hover:to-yellow-600 text-gray-800 
                           transition-all duration-300 transform 
                           animate-bounce hover:scale-105 hover:shadow-2xl"
              >
                KLIK DISINI UNTUK REGISTRASI
              </button>
            )}
          </div>

          {/* Right Column - Info Cards */}
          <div className="space-y-4">
            <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl p-5 border border-white/20">
              <h2 className="text-xl font-bold text-green-700 mb-4 text-center">
                🎫 WAR TICKET INFO
              </h2>

              <div className="space-y-3">
                {/* War Ticket Schedule */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
                  <h3 className="font-bold text-blue-700 mb-2 text-sm flex items-center">
                    ⚡ Jadwal War Ticket
                  </h3>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex justify-between items-center bg-white rounded-lg p-2 shadow-sm">
                      <span className="font-medium">Tahap 1</span>
                      <span className="text-blue-600 font-bold">
                        12 September 2025 • 09:00 WIB
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-white rounded-lg p-2 shadow-sm">
                      <span className="font-medium">Tahap 2</span>
                      <span className="text-blue-600 font-bold">
                        13 September 2025 • 15:00 WIB
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quota Info */}
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-3">
                  <h3 className="font-bold text-orange-700 mb-2 text-sm flex items-center">
                    👨‍👩‍👧‍👦 Kuota Keluarga
                  </h3>
                  <p className="text-xs text-gray-700">
                    Kuota per NIPP sesuai data terdaftar di HRIS
                  </p>
                </div>
              </div>
            </div>

            {/* Instructions Card */}
            <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl p-5 border border-white/20">
              <h2 className="text-lg font-bold mb-3 text-red-600 text-center">
                PERHATIAN !!!
              </h2>
              <ol className="list-decimal list-inside space-y-2 text-sm text-justify leading-relaxed">
                <li>
                  Jumlah kuota keluarga per NIPP yang ditetapkan merupakan yang
                  telah terdaftar di HRIS;
                </li>
                <li>
                  Klik tombol <b>MULAI</b>, masukkan NIPP / NIPKWT lalu klik
                  tombol <b>LANJUTKAN</b>.
                </li>
                <li>
                  Cek kesesuaian nama pegawai, jika sudah sesuai, masukkan:
                  <ul className="list-disc list-inside ml-3 mt-1">
                    <li>Nama anggota keluarga yang akan hadir</li>
                    <li>Pilih lokasi keberangkatan terdekat dari domisili</li>
                    <li>Pilih transportasi yang akan digunakan</li>
                  </ul>
                </li>
                <li>
                  Apabila data sudah sesuai, klik tombol <b>DAFTAR SEKARANG</b>
                </li>
                <li>
                  Simpan bukti registrasi (screenshot) untuk penukaran gelang &
                  kupon
                </li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
