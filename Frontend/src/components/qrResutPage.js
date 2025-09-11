import React, { useEffect, useState } from "react";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";
import api from "../api"; // pakai api instance yang sudah ada
import { useLocation } from "react-router-dom";

const QRResultPage = () => {
  const location = useLocation();
  const nipp = location.state?.nipp;
  const [namaPegawai, setNamaPegawai] = useState("");
  const [orderData, setOrderData] = useState(null);

  // Ambil order by NIPP
  const getOrderByNipp = async () => {
    try {
      const response = await api.get(`/order/${nipp}`);
      if (response.data && response.data.data) {
        setOrderData(response.data.data);
      }
    } catch (error) {
      console.error("Gagal mengambil data order:", error);
    }
  };

  // Load data pertama kali
  useEffect(() => {
    if (nipp) {
      getOrderByNipp();
    }
  }, [nipp]);

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
                  <p className="text-gray-800 font-medium mt-2">NIPP: {nipp}</p>
                </div>
              )}

              {/* Registration Info */}
              <div className="bg-gray-50 rounded-xl p-6 text-left">
                <h3 className="font-semibold text-lg text-gray-800 mb-4">
                  Data Peserta Terdaftar:
                </h3>
                <div className="border-t pt-4">
                  <div className="space-y-2">
                    {Array.isArray(orderData.nama) &&
                      orderData.nama.map((nm, index) => (
                        <div
                          key={index}
                          className="flex items-center py-2 border-b border-gray-200 last:border-b-0"
                        >
                          <span className="text-gray-600 mr-2">
                            {index + 1}.
                          </span>
                          <span className="text-gray-900">{nm}</span>
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

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start space-x-3">
                  <svg
                    className="h-6 w-6 text-blue-600 mt-0.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="text-left">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Langkah Selanjutnya:
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1 text-justify">
                      <li>
                        Penukaran kode registrasi dengan gelang, kupon makan,
                        dan kupon doorprize dapat dilakukan pada :
                      </li>
                      <li>• Hari Selasa-Rabu, tanggal 16-17 September 2025</li>
                      <li>
                        • Pukul 09.00-16.00 WIB di Unit Keuangan Kantor Daop 6
                        YK
                      </li>
                      <li>
                        Penukaran kode registrasi secara kolektif harus membawa
                        daftar nominatif pekerja beserta fotocopy kmf berikut
                        dengan detail masing-masing kode registrasi, dan apabila
                        peserta tidak menerima gelang, kupon makan, dan kupon
                        doorprize maka bukan menjadi tanggung jawab panitia.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Additional Actions */}
              <div className="flex space-x-4">
                <button
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition-all duration-200"
                  onClick={() => (window.location.href = "/")}
                >
                  <div className="flex items-center justify-center space-x-2">
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
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    <span>Beranda</span>
                  </div>
                </button>
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

export default QRResultPage;
