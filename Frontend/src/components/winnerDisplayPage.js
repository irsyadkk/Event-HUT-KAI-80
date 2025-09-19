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

  // Hitung grid untuk NIPP
  const { gridData, columns, rows } = useMemo(() => {
    const totalItems = filtered.length;
    if (totalItems === 0) return { gridData: [], columns: 0, rows: 0 };

    // Tetap menggunakan 10 kolom
    let cols = 10;
    const rows = Math.ceil(totalItems / cols);

    // Susun data dalam format grid
    const gridData = [];
    for (let row = 0; row < rows; row++) {
      const rowData = [];
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col;
        if (index < totalItems) {
          rowData.push(filtered[index]);
        } else {
          rowData.push(null); // empty cell
        }
      }
      gridData.push(rowData);
    }

    return { gridData, columns: cols, rows };
  }, [filtered]);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-green-700 via-green-800 to-green-900 overflow-hidden"
      style={{ backgroundColor: "#406017" }}
    >
      <div className="h-screen flex flex-col p-2 space-y-2">
        {/* Header - Minimal */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <img
              src={LogoKAI}
              alt="Logo HUT KAI 80"
              className="h-8 w-auto"
            />
            <h1 className="text-xl font-bold text-white">
              Pemenang Terpilih ({filtered.length})
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <input
              className="border border-white/30 focus:border-white focus:ring-1 focus:ring-white/50 px-3 py-1 rounded-lg bg-white/90 w-60 text-sm"
              placeholder="🔍 Cari NIPP atau status..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <div className="text-lg font-bold text-white bg-black/20 px-3 py-1 rounded-lg">
              {time.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
          </div>
        </div>

        {/* Legend - Minimal */}
        <div className="bg-white/95 backdrop-blur-sm rounded-lg border border-white/30 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-green-600" /> Diambil ({stats.diambil})
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-amber-500" /> Belum Verifikasi ({stats.belum})
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-red-600" /> Gugur ({stats.gugur})
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-gray-400" /> Lainnya
              </span>
            </div>
          </div>
        </div>

        {/* Grid Display - Mengisi hampir seluruh layar */}
        <div className="flex-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-white/30 overflow-hidden">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="inline-flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
                <p className="text-gray-600 text-lg font-medium">Memuat data…</p>
              </div>
            </div>
          ) : (
            <div className="h-full p-2">
              {filtered.length ? (
                <div className="h-full">
                  {/* Grid NIPP */}
                  <div className="grid gap-1 h-full" style={{ gridTemplateRows: `repeat(${rows}, 1fr)` }}>
                    {gridData.map((rowData, rowIndex) => (
                      <div 
                        key={rowIndex}
                        className="grid gap-1"
                        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
                      >
                        {rowData.map((item, colIndex) => (
                          <div
                            key={`${rowIndex}-${colIndex}`}
                            className={`
                              border border-gray-200 rounded p-2 text-center
                              transition-all duration-200 flex items-center justify-center
                              ${item ? 'hover:shadow-md cursor-pointer' : 'bg-transparent border-transparent'}
                            `}
                            title={item?.status || "-"}
                          >
                            {item && (
                              <span className={`px-3 py-1 rounded-full text-base font-bold shadow ${badgeClass(item.status)}`}>
                                {item.winner || item.nipp}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="text-5xl">🎉</div>
                    <p className="text-gray-500 text-lg font-medium">
                      {q ? "Tidak ada pemenang ditemukan" : "Belum ada pemenang"}
                    </p>
                    {q && (
                      <button
                        onClick={() => setQ("")}
                        className="mt-2 px-5 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-medium shadow-lg transition-all"
                      >
                        🔄 Reset Pencarian
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}