import React, { useEffect, useMemo, useState } from "react";
import axios from "../api";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";
import { useNavigate } from "react-router-dom";

const useAuthHeaders = () =>
  useMemo(() => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  }, []);

// helper warna badge status
const badgeClass = (raw) => {
  const s = String(raw || "").toLowerCase();
  if (s === "diambil di tempat" || s === "diambil di daop")
    return "bg-green-600 text-white";
  if (s === "gugur") return "bg-red-600 text-white";
  if (s.includes("verifikasi")) return "bg-amber-500 text-white"; // Belum Verifikasi
  return "bg-gray-400 text-white";
};

export default function WinnerInputPage() {
  const navigate = useNavigate();
  const headers = useAuthHeaders();
  const [nipp, setNipp] = useState("");
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");

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
    fetchWinners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!nipp?.trim()) return alert("Masukkan NIPP pemenang.");
    try {
      setLoading(true);
      // backend akan set status "Belum Verifikasi" otomatis
      await axios.post("/winner", { winner: nipp.trim() }, { headers });
      setNipp("");
      await fetchWinners();
      alert("Pemenang ditambahkan (status: Belum Verifikasi).");
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

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
            Input Pemenang Undian
          </h1>
          <p className="text-green-100">
            Tambah NIPP pemenang ke tabel <b>winner</b> (status otomatis{" "}
            <i>Belum Verifikasi</i>).
          </p>
          <button
            onClick={() => navigate("/winnerdisplay")}
            className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-700 hover:from-yellow-700 hover:to-orange-800 text-white rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 text-sm md:text-base font-medium"
          >
            Lihat Pemenang Undian
          </button>
        </div>

        {/* Form Tambah */}
        <div className="bg-white/95 rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <h2 className="text-xl font-bold text-white">Tambah Pemenang</h2>
          </div>
          <form
            onSubmit={handleAdd}
            className="p-6 grid md:grid-cols-[1fr_auto] gap-3"
          >
            <input
              className="border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 p-3 rounded-xl bg-white/80"
              placeholder="Masukkan NIPP pemenang…"
              value={nipp}
              onChange={(e) => setNipp(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd(e)}
            />
            <button
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {loading ? "Menyimpan…" : "➕ Tambah"}
            </button>
          </form>
        </div>

        {/* Pencarian & Tabel Winners */}
        <div className="bg-white/95 rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-xl font-bold text-white">Daftar Pemenang</h2>
            <input
              className="border-2 border-white/30 focus:border-white focus:ring-2 focus:ring-white/50 p-3 rounded-xl bg-white/90 min-w-[280px]"
              placeholder="🔍 Cari NIPP / status…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <div className="max-h-[60vh] overflow-y-auto rounded-b-2xl">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b">
                      NIPP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/60 divide-y divide-gray-200">
                  {filtered.length ? (
                    filtered.map((w, i) => (
                      <tr
                        key={(w.winner || w.nipp || "") + i}
                        className={i % 2 ? "bg-gray-50/40" : "bg-white/40"}
                      >
                        <td className="px-6 py-3 font-semibold">
                          {w.winner || w.nipp}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${badgeClass(
                              w.status
                            )}`}
                          >
                            {w.status || "-"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="2"
                        className="px-6 py-10 text-center text-gray-500"
                      >
                        Belum ada data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
