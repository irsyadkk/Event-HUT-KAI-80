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
  const [time, setTime] = useState(new Date());

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

  // Update jam realtime
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
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
        </div>

        {/* Legend */}
        <div className="bg-white/95 rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="px-6 py-3 bg-white/60 text-sm text-gray-700 flex items-center justify-between">
            {/* Keterangan Legend */}
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-green-600" /> Diambil
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-amber-500" /> Belum
                Verifikasi
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-600" /> Gugur
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-gray-400" /> Lainnya
              </span>
            </div>

            {/* Jam realtime */}
            <div className="text-xl font-bold text-gray-800">
              {time.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
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
