import { io } from "socket.io-client";
import React, { useEffect, useMemo, useState } from "react";
import axios from "../api";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";


const useAuthHeaders = () =>
  
  useMemo(() => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  }, []);

export default function PrizeListPage() {
  const headers = useAuthHeaders();
  const [data, setData] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const socket = io("http://localhost:5000"); // atau alamat VM/LoadBalancer

  socket.on("PRIZE_UPDATE", (rows) => {
    setData(rows);
    setLoading(false);
  });

  return () => socket.disconnect();
}, []);

  const fetchData = async () => {
    try {
      const res = await axios.get("/prize", { headers });
      setData(res?.data?.data || []);
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = data.filter(
    (x) =>
      String(x.id).toLowerCase().includes(q.toLowerCase()) ||
      (x.prize || "").toLowerCase().includes(q.toLowerCase()) ||
      (x.pemenang || "").toLowerCase().includes(q.toLowerCase()) ||
      (x.status || "").toLowerCase().includes(q.toLowerCase())
  );

  // Urutkan: SUDAH ada pemenang dulu → lalu yang belum; masing-masing ID ASC
const ordered = [...filtered].sort((a, b) => {
  const aHasWinner = String(a?.pemenang || "").trim() !== "";
  const bHasWinner = String(b?.pemenang || "").trim() !== "";

  // Pemenang dulu (true > false → -1 supaya ke atas)
  if (aHasWinner !== bHasWinner) return aHasWinner ? -1 : 1;

  // Jika sama-sama statusnya, urut ID ASC
  const aid = Number(a?.id) || 0;
  const bid = Number(b?.id) || 0;
  return aid - bid;
});


  const winnersCount = filtered.filter((x) => x.pemenang).length;
  const totalPrizes = filtered.length;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-green-700 via-green-800 to-green-900"
      style={{ backgroundColor: "#406017" }}
    >
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center py-8">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-20 h-20">
              <img
                src={LogoKAI}
                alt="Logo HUT KAI 80"
                className="h-16 md:h-20 w-auto drop-shadow-lg"
              />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
            Daftar Hadiah & Pemenang
          </h1>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Hadiah</p>
                <p className="text-3xl font-bold text-white">{totalPrizes}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">🎁</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">
                  Sudah Terpilih
                </p>
                <p className="text-3xl font-bold text-white">{winnersCount}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">👑</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Menunggu</p>
                <p className="text-3xl font-bold text-white">
                  {totalPrizes - winnersCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Section */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Pencarian & Filter
            </h2>
            <div className="relative">
              <input
                className="border-2 border-white/30 focus:border-white focus:ring-2 focus:ring-white/50 p-3 rounded-xl bg-white/90 backdrop-blur-sm placeholder-gray-600 pr-4 min-w-[300px] text-sm"
                placeholder="🔍 Cari berdasarkan ID, hadiah, atau pemenang..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Main Table Section */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              🏆 Daftar Lengkap Hadiah ({ordered.length} dari {totalPrizes})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">🏆</span>
                  </div>
                </div>
                <p className="text-gray-600 text-lg font-medium">
                  Memuat data hadiah...
                </p>
                <p className="text-gray-400 text-sm">Mohon tunggu sebentar</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/90 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                      ID
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                      Nama Hadiah
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                      Pemenang (NIPP)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/60 backdrop-blur-sm divide-y divide-gray-200">
                  {ordered.length ? (
                    ordered.map((x, index) => (
                      <tr
                        key={x.id}
                        className={`transition-all duration-300 hover:bg-green-50/70 hover:scale-[1.01] ${
                          index % 2 === 0 ? "bg-white/40" : "bg-gray-50/40"
                        } ${
                          x.pemenang
                            ? "border-l-4 border-green-500"
                            : "border-l-4 border-gray-300"
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                            #{x.id}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="text-gray-900 font-semibold text-lg">
                                {x.prize}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {x.pemenang ? (
                            <div className="flex items-center gap-3">
                              <div>
                                <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                                  {x.pemenang}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div>
                                <span className="bg-gray-300 text-gray-600 px-4 py-2 rounded-full text-sm font-medium">
                                  Menunggu Undian
                                </span>
                              </div>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-6">
                          <div className="w-24 h-24 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center shadow-xl">
                            <span className="text-4xl">📭</span>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xl font-semibold mb-2">
                              Tidak ada data ditemukan
                            </p>
                            <p className="text-gray-400 text-sm">
                              {q
                                ? `Tidak ada hasil untuk pencarian "${q}"`
                                : "Belum ada hadiah yang terdaftar"}
                            </p>
                          </div>
                          {q && (
                            <button
                              onClick={() => setQ("")}
                              className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                            >
                              🔄 Reset Pencarian
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
