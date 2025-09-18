import { io } from "socket.io-client";
import React, { useEffect, useMemo, useState } from "react";
import axios from "../api";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";

const useAuthHeaders = () =>
  useMemo(() => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  }, []);

// helper: kelas warna chip berdasarkan status
const badgeClassesByStatus = (statusRaw) => {
  const s = String(statusRaw || "").toLowerCase();
  if (s === "diambil") {
    return "bg-green-600 text-white"; // hijau
  }
  if (s === "gugur") {
    return "bg-red-600 text-white"; // merah
  }
  if (s.includes("verifikasi")) {
    return "bg-amber-500 text-white"; // kuning utk 'Belum Verifikasi'
  }
  return "bg-gray-400 text-white"; // default
};

export default function PrizeListPage() {
  const headers = useAuthHeaders();
  const [data, setData] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  // --- Socket realtime update
  useEffect(() => {
    const socket = io("http://localhost:5000"); // sesuaikan URL backendmu
    socket.on("PRIZE_UPDATE", (rows) => {
      setData(rows || []);
      setLoading(false);
    });
    return () => socket.disconnect();
  }, []);

  // --- Initial fetch (fallback)
  const fetchData = async () => {
    try {
      const res = await axios.get("/prize");
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

  // --- Group: 1 baris per kategori, winners = [{nipp, status}]
  const groupedRows = useMemo(() => {
    const groups = new Map(); // kategori -> [{nipp, status}, ...]
    for (const row of data) {
      const kategori = (row?.kategori || "").trim();
      const nipp = (row?.pemenang || "").trim();
      const status = (row?.status || "").trim();
      if (!kategori || !nipp) continue; // tampilkan hanya yg punya pemenang & kategori
      if (!groups.has(kategori)) groups.set(kategori, []);
      groups.get(kategori).push({ nipp, status });
    }

    // ke array
    let arr = Array.from(groups.entries()).map(([kategori, winners]) => ({
      kategori,
      winners,
    }));

    // search: kategori / nipp / status
    const s = q.toLowerCase();
    if (s) {
      arr = arr.filter(
        (r) =>
          r.kategori.toLowerCase().includes(s) ||
          r.winners.some(
            (w) =>
              String(w.nipp).toLowerCase().includes(s) ||
              String(w.status).toLowerCase().includes(s)
          )
      );
    }

    // urut kategori A-Z
    arr.sort((a, b) => a.kategori.localeCompare(b.kategori, "id"));
    return arr;
  }, [data, q]);

  // --- Stats
  const totalPrizes = data.length;
  const totalWinners = data.filter((x) => (x?.pemenang || "").trim()).length;
  const totalCategoriesWithWinners = groupedRows.length;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-green-700 via-green-800 to-green-900"
      style={{ backgroundColor: "#406017" }}
    >
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center py-8">
          <div className="mb-4 inline-flex items-center justify-center w-20 h-20">
            <img
              src={LogoKAI}
              alt="Logo HUT KAI 80"
              className="h-16 md:h-20 w-auto drop-shadow-lg"
            />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
            Daftar Pemenang per Kategori
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-2xl border border-white/20">
            <p className="text-blue-100 text-sm font-medium">Total Hadiah</p>
            <p className="text-3xl font-bold text-white">{totalPrizes}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 shadow-2xl border border-white/20">
            <p className="text-green-100 text-sm font-medium">Total Pemenang</p>
            <p className="text-3xl font-bold text-white">{totalWinners}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 shadow-2xl border border-white/20">
            <p className="text-orange-100 text-sm font-medium">
              Kategori dengan Pemenang
            </p>
            <p className="text-3xl font-bold text-white">
              {totalCategoriesWithWinners}
            </p>
          </div>
        </div>

        {/* Search + Legend */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-xl font-bold text-white">Pencarian</h2>
            <input
              className="border-2 border-white/30 focus:border-white focus:ring-2 focus:ring-white/50 p-3 rounded-xl bg-white/90 backdrop-blur-sm placeholder-gray-600 pr-4 min-w-[300px] text-sm"
              placeholder="🔍 Cari kategori, NIPP, atau status…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="px-6 py-3 bg-white/60 text-sm text-gray-700 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-600" />
              Diambil
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              Belum Verifikasi
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600" />
              Gugur
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-400" />
              Lainnya
            </span>
          </div>
        </div>

        {/* Tabel per Kategori */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <h2 className="text-2xl font-bold text-white">
              🏆 Pemenang Berdasarkan Kategori ({groupedRows.length})
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
                  Memuat data…
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* batasi tinggi tabel + scroll; header sticky */}
              <div className="max-h-[60vh] overflow-y-auto rounded-b-2xl">
                <table className="w-full">
                  <thead className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200 w-1/3">
                        Kategori Hadiah
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                        NIPP Pemenang
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/60 backdrop-blur-sm divide-y divide-gray-200">
                    {groupedRows.length ? (
                      groupedRows.map((row, idx) => (
                        <tr
                          key={row.kategori + idx}
                          className={`transition-all duration-200 ${
                            idx % 2 === 0 ? "bg-white/40" : "bg-gray-50/40"
                          }`}
                        >
                          <td className="px-6 py-4 align-top">
                            <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                              {row.kategori}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {/* chip NIPP berwarna berdasarkan status */}
                            <div className="flex flex-wrap gap-2">
                              {row.winners.map((w, i) => (
                                <span
                                  key={`${row.kategori}-${w.nipp}-${i}`}
                                  className={`px-3 py-1 rounded-full text-xs font-bold shadow ${badgeClassesByStatus(
                                    w.status
                                  )}`}
                                  title={w.status || "status tidak tersedia"}
                                >
                                  {w.nipp}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="2" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="text-5xl">📭</div>
                            <p className="text-gray-500 text-lg font-medium">
                              Belum ada pemenang yang tercatat.
                            </p>
                            <p className="text-gray-400 text-sm">
                              Pemenang akan muncul per kategori setelah admin
                              menetapkan pemenang.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
