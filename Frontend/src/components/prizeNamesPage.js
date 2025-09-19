import React, { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import axios from "../api";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";
import { BASE_URL } from "../utils";

export default function PrizeNamesPage() {
  const [data, setData] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  // Realtime updates
  useEffect(() => {
    const socket = io(BASE_URL);
    socket.on("PRIZE_UPDATE", (rows) => {
      setData(rows || []);
      setLoading(false);
    });
    return () => socket.disconnect();
  }, []);

  // Initial fetch (fallback)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("/prizename");
        setData(res?.data?.data || []);
      } catch (e) {
        alert(e?.response?.data?.message || e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter + sort (A-Z)
  const list = useMemo(() => {
    const s = q.toLowerCase();
    const filtered = (data || []).filter((x) =>
      String(x?.prize || "").toLowerCase().includes(s)
    );
    return filtered.sort((a, b) =>
      String(a?.prize || "").localeCompare(String(b?.prize || ""), "id")
    );
  }, [data, q]);

  // Hitung kolom dan baris berdasarkan ukuran layar
  const { gridData, columns, rows } = useMemo(() => {
    const totalItems = list.length;
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
          rowData.push(list[index]);
        } else {
          rowData.push(null); // empty cell
        }
      }
      gridData.push(rowData);
    }

    return { gridData, columns: cols, rows };
  }, [list]);

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
              Daftar Hadiah ({list.length})
            </h1>
          </div>
          <input
            className="border border-white/30 focus:border-white focus:ring-1 focus:ring-white/50 px-3 py-1 rounded-lg bg-white/90 w-60 text-sm"
            placeholder="🔍 Cari hadiah..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {/* Grid Display - Mengisi hampir seluruh layar */}
        <div className="flex-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-white/30 overflow-hidden">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="inline-flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    
                  </div>
                </div>
                <p className="text-gray-600 text-lg font-medium">Memuat data…</p>
              </div>
            </div>
          ) : (
            <div className="h-full p-2">
              {list.length ? (
                <div className="h-full">
                  {/* Grid Table */}
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
                              ${item ? 
                                (rowIndex % 2 === 0 ? 
                                  colIndex % 2 === 0 ? 'bg-white/80' : 'bg-gray-50/80'
                                  : colIndex % 2 === 0 ? 'bg-gray-50/80' : 'bg-white/80'
                                ) 
                                : 'bg-transparent border-transparent'
                              }
                              ${item ? 'hover:bg-green-50/90 hover:shadow-md cursor-pointer' : ''}
                            `}
                          >
                            {item && (
                              <span className="text-gray-900 font-semibold text-base leading-tight break-words">
                                {item.prize}
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
                    <div className="text-5xl">📭</div>
                    <p className="text-gray-500 text-lg font-medium">
                      Tidak ada hadiah ditemukan
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