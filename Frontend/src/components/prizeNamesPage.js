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

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-green-700 via-green-800 to-green-900"
      style={{ backgroundColor: "#406017" }}
    >
      <div className="p-6 space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center py-8">
          <div className="mb-4 inline-flex items-center justify-center w-20 h-20">
            <img
              src={LogoKAI}
              alt="Logo HUT KAI 80"
              className="h-16 md:h-20 w-auto drop-shadow-lg"
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
            Daftar Hadiah
          </h1>
          
        </div>

        {/* Search */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-xl font-bold text-white">Pencarian</h2>
            <input
              className="border-2 border-white/30 focus:border-white focus:ring-2 focus:ring-white/50 p-3 rounded-xl bg-white/90 min-w-[280px] text-sm"
              placeholder="🔍 Cari nama hadiah…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <h2 className="text-2xl font-bold text-white">
              Hadiah ({list.length})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
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
            <div className="overflow-x-auto">
              {/* batasi tinggi + header sticky */}
              <div className="max-h-[60vh] overflow-y-auto rounded-b-2xl">
                <table className="w-full">
                  <thead className="sticky top-0 z-10 bg-gray-50/90 backdrop-blur-sm">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                        Hadiah
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white/60 backdrop-blur-sm divide-y divide-gray-200">
                    {list.length ? (
                      list.map((row, idx) => (
                        <tr
                          key={`${row.id}-${idx}`}
                          className={`transition-all duration-200 ${
                            idx % 2 === 0 ? "bg-white/40" : "bg-gray-50/40"
                          }`}
                        >
                          <td className="px-6 py-4">
                            <span className="text-gray-900 font-semibold">
                              {row.prize}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-6 py-12 text-center">
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
