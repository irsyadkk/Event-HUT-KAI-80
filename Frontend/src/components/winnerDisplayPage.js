import React, { useEffect, useMemo, useState } from "react";
import axios from "../api";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";
import { BASE_URL } from "../utils";
import { io } from "socket.io-client";

const useAuthHeaders = () =>
  useMemo(() => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  }, []);

// warna chip
const badgeClass = (raw) => {
  const s = String(raw || "").toLowerCase();
  if (s === "diambil di tempat" || s === "diambil di daop")
    return "bg-green-600 text-white";
  if (s === "gugur") return "bg-red-600 text-white";
  if (s.includes("verifikasi")) return "bg-amber-500 text-white"; // Belum Verifikasi
  return "bg-gray-400 text-white";
};

export default function WinnerDisplayPage() {
  const headers = useAuthHeaders();
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchWinners = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/winner", { headers });
      setList(res?.data?.data || []);
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const socket = io(BASE_URL);
    socket.on("WINNER_UPDATE", (rows) => {
      setList(rows || []);
      setLoading(false);
    });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    fetchWinners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = list.filter((w) => {
    const s = q.toLowerCase();
    return (
      String(w.winner || w.nipp || "")
        .toLowerCase()
        .includes(s) ||
      String(w.status || "")
        .toLowerCase()
        .includes(s)
    );
  });

  const stats = useMemo(() => {
    const diambil = filtered.filter((x) => {
      const s = String(x.status || "").toLowerCase();
      return s === "diambil di tempat" || s === "diambil di daop";
    }).length;
    const gugur = filtered.filter(
      (x) => String(x.status || "").toLowerCase() === "gugur"
    ).length;
    const belum = filtered.filter((x) =>
      String(x.status || "")
        .toLowerCase()
        .includes("verifikasi")
    ).length;
    return { total: filtered.length, diambil, gugur, belum };
  }, [filtered]);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-green-700 via-green-800 to-green-900"
      style={{ backgroundColor: "#406017" }}
    >
      <div className="p-6 space-y-8 max-w-6xl mx-auto">
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
            Pemenang Terpilih
          </h1>
          <p className="text-green-100">
            Hanya menampilkan NIPP pemenang, warna sesuai status.
          </p>
        </div>

        {/* Pencarian & Statistik */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 bg-white/95 rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
              <h2 className="text-lg font-bold text-white">Pencarian</h2>
            </div>
            <div className="p-4">
              <input
                className="w-full border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 p-3 rounded-xl bg-white/90"
                placeholder="🔍 Cari NIPP / status…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 shadow-2xl border border-white/20">
            <p className="text-green-100 text-sm font-medium">Total</p>
            <p className="text-3xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 shadow-2xl border border-white/20">
            <p className="text-orange-100 text-sm font-medium">
              Belum Verifikasi
            </p>
            <p className="text-3xl font-bold text-white">{stats.belum}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-700 rounded-2xl p-6 shadow-2xl border border-white/20">
            <p className="text-green-100 text-sm font-medium">Diambil</p>
            <p className="text-3xl font-bold text-white">{stats.diambil}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 shadow-2xl border border-white/20">
            <p className="text-red-100 text-sm font-medium">Gugur</p>
            <p className="text-3xl font-bold text-white">{stats.gugur}</p>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white/95 rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="px-6 py-3 bg-white/60 text-sm text-gray-700 flex flex-wrap gap-4">
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-600" /> Diambil
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" /> Belum
              Verifikasi
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600" /> Gugur
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-400" /> Lainnya
            </span>
          </div>
        </div>

        {/* Grid NIPP */}
        <div className="bg-white/95 rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <h2 className="text-2xl font-bold text-white">Daftar NIPP</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
                <p className="text-gray-600">Memuat data…</p>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {filtered.length ? (
                <div className="flex flex-wrap gap-2">
                  {filtered.map((w, i) => (
                    <span
                      key={(w.winner || w.nipp || "") + i}
                      className={`px-4 py-2 rounded-full text-sm font-bold shadow ${badgeClass(
                        w.status
                      )}`}
                      title={w.status || "-"}
                    >
                      {w.winner || w.nipp}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-gray-500">
                  Belum ada pemenang.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
