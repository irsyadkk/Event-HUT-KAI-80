import { io } from "socket.io-client";
import React, { useEffect, useMemo, useState } from "react";
import axios from "../api";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";
import { BASE_URL, ADMIN_NIPP } from "../utils";
import { useNavigate } from "react-router-dom";

const useAuthHeaders = () =>
  useMemo(() => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  }, []);

// helper: kelas warna chip berdasarkan status
const badgeClassesByStatus = (statusRaw) => {
  const s = String(statusRaw || "").toLowerCase();
  if (s === "diambil di tempat" || s === "diambil di daop")
    return "bg-green-600 text-white";
  if (s === "gugur") return "bg-red-600 text-white";
  if (s.includes("verifikasi")) return "bg-amber-500 text-white";
  return "bg-gray-400 text-white";
};

export default function PrizeListPage() {
  const navigate = useNavigate();
  const headers = useAuthHeaders();
  const [data, setData] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const nipp = localStorage.getItem("nipp");
    if (!token || !nipp) {
      navigate("/");
      return;
    }
    try {
      if (nipp !== ADMIN_NIPP) navigate("/");
      else setAllowed(true);
    } catch {
      navigate("/");
    }
  }, [navigate]);

  // --- Socket realtime update
  useEffect(() => {
    const socket = io(BASE_URL);
    socket.on("PRIZE_UPDATE", (rows) => {
      setData(rows || []);
      setLoading(false);
    });
    return () => socket.disconnect();
  }, []);

  // --- Initial fetch (fallback)
  const fetchData = async () => {
    try {
      const res = await axios.get("/prize", { headers }); // pakai headers
      setData(res?.data?.data || []);
    } catch (e) {
      console.log(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Group: 1 baris per kategori (SEMUA kategori muncul), winners = [{nipp, status}]
  const groupedRows = useMemo(() => {
    const catMap = new Map(); // kategori -> winners[]

    // 1) Pastikan semua kategori terdaftar (termasuk yang belum ada pemenang)
    for (const row of data) {
      const kategoriRaw = (row?.kategori ?? "").trim();
      const kategori = kategoriRaw || "Tanpa Kategori";
      if (!catMap.has(kategori)) catMap.set(kategori, []);
    }

    // 2) Isi pemenang (jika ada)
    for (const row of data) {
      const kategoriRaw = (row?.kategori ?? "").trim();
      const kategori = kategoriRaw || "Tanpa Kategori";
      const nipp = (row?.pemenang || "").trim();
      const status = (row?.status || "").trim();
      if (nipp) {
        catMap.get(kategori).push({ nipp, status });
      }
    }

    // 3) ke array
    let arr = Array.from(catMap.entries()).map(([kategori, winners]) => ({
      kategori,
      winners,
    }));

    // 4) search: cocokkan kategori / nipp / status
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

    // 5) urut kategori A-Z
    arr.sort((a, b) => a.kategori.localeCompare(b.kategori, "id"));
    return arr;
  }, [data, q]);

  // Split data menjadi 3 kolom
  const splitData = useMemo(() => {
    const itemsPerColumn = Math.ceil(groupedRows.length / 3);
    return {
      leftColumn: groupedRows.slice(0, itemsPerColumn),
      middleColumn: groupedRows.slice(itemsPerColumn, itemsPerColumn * 2),
      rightColumn: groupedRows.slice(itemsPerColumn * 2),
    };
  }, [groupedRows]);

  // --- Stats
  const totalPrizes = data.length;
  const totalWinners = data.filter((x) => (x?.pemenang || "").trim()).length;
  const totalCategoriesWithWinners = groupedRows.filter(
    (g) => g.winners.length > 0
  ).length;

  // Component untuk render tabel
  const TableComponent = ({ dataRows, title }) => (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/30 overflow-hidden flex-1">
      <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 py-3">
        <h3 className="text-lg font-bold text-white">
          {title} ({dataRows.length})
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50/90 backdrop-blur-sm">
            <tr>
              <th className="px-3 py-2 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                Kategori Hadiah
              </th>
              <th className="px-3 py-2 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                NIPP Pemenang
              </th>
            </tr>
          </thead>
          <tbody className="bg-white/60 backdrop-blur-sm divide-y divide-gray-200">
            {dataRows.length ? (
              dataRows.map((row, idx) => (
                <tr
                  key={row.kategori + idx}
                  className={`transition-all duration-200 ${
                    idx % 2 === 0 ? "bg-white/40" : "bg-gray-50/40"
                  }`}
                >
                  <td className="px-3 py-3 align-top">
                    <span className="inline-block bg-green-100 text-green-800 px-3 py-2 rounded-full text-lg font-semibold">
                      {row.kategori}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {row.winners.length ? (
                      <div className="flex flex-wrap gap-2">
                        {row.winners.map((w, i) => (
                          <span
                            key={`${row.kategori}-${w.nipp}-${i}`}
                            className={`px-3 py-2 rounded-full text-base font-bold shadow ${badgeClassesByStatus(
                              w.status
                            )}`}
                            title={w.status || "status tidak tersedia"}
                          >
                            {w.nipp}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-lg">
                        Belum ada pemenang
                      </span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="2" className="px-3 py-6 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="text-3xl">📭</div>
                    <p className="text-gray-500 text-lg font-medium">
                      Tidak ada data
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (!allowed) return null;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-green-700 via-green-800 to-green-900"
      style={{ backgroundColor: "#406017" }}
    >
      <div className="p-4 space-y-4 max-w-full mx-auto">
        {/* Header - Compact */}
        <div className="text-center py-4">
          <div className="mb-2 inline-flex items-center justify-center w-16 h-16">
            <img
              src={LogoKAI}
              alt="Logo HUT KAI 80"
              className="h-12 w-auto drop-shadow-lg"
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 drop-shadow-lg">
            Daftar Pemenang per Kategori
          </h1>
        </div>

        {/* Stats - Compact */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3 shadow-lg border border-white/20">
            <p className="text-blue-100 text-xs font-medium">Total Hadiah</p>
            <p className="text-lg md:text-xl font-bold text-white">
              {totalPrizes}
            </p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg p-3 shadow-lg border border-white/20">
            <p className="text-green-100 text-xs font-medium">Total Pemenang</p>
            <p className="text-lg md:text-xl font-bold text-white">
              {totalWinners}
            </p>
          </div>
        </div>

        {/* Search - Compact */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-white/30 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 py-2 flex items-center justify-between flex-wrap gap-2">
            <h2 className="text-base font-bold text-white">Pencarian</h2>
            <input
              className="border-2 border-white/30 focus:border-white focus:ring-2 focus:ring-white/50 p-2 rounded-lg bg-white/90 backdrop-blur-sm placeholder-gray-600 min-w-[200px] text-sm"
              placeholder="🔍 Cari.."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="px-4 py-2 bg-white/60 text-xs text-gray-700 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-600" />
              Diambil
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Belum Verifikasi
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-600" />
              Gugur
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              Lainnya
            </span>
          </div>
        </div>

        {/* Triple Column Tables */}
        {loading ? (
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-white/30 p-8">
            <div className="text-center">
              <div className="inline-flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg">🏆</span>
                  </div>
                </div>
                <p className="text-gray-600 text-base font-medium">
                  Memuat data…
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col xl:flex-row gap-4">
            {/* Kolom Kiri */}
            <TableComponent dataRows={splitData.leftColumn} title="Tabel 1" />

            {/* Kolom Tengah */}
            <TableComponent dataRows={splitData.middleColumn} title="Tabel 2" />

            {/* Kolom Kanan */}
            <TableComponent dataRows={splitData.rightColumn} title="Tabel 3" />
          </div>
        )}

        {/* Summary info */}
        {!loading && groupedRows.length === 0 && (
          <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-white/30 p-8">
            <div className="text-center">
              <div className="text-4xl mb-3">📭</div>
              <p className="text-gray-500 text-lg font-medium">
                Tidak ada kategori untuk ditampilkan.
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Data akan muncul ketika kategori dan pemenang sudah ditetapkan.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
