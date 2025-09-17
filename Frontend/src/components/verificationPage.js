import React, { useEffect, useMemo, useState } from "react";
import axios from "../api";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";

const useAuthHeaders = () =>
  useMemo(() => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  }, []);

export default function VerificationPage() {
  const headers = useAuthHeaders();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/prize", { headers });
      const all = res?.data?.data || [];
      // hanya tampilkan yang statusnya terisi (truthy string)
      const withStatus = all.filter((x) => (x.status || "").trim().length > 0);
      setList(withStatus);
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []); // eslint-disable-line

  const changeStatus = async (id, status) => {
    if (!id) return;
    if (
      status === "gugur" &&
      !window.confirm("Tandai pemenang GAGAL? (status akan 'gugur')")
    )
      return;
    try {
      setLoading(true);
      await axios.patch(`/changestatus/${id}`, { status }, { headers });
      await fetchList();
      alert(`Status diubah ke '${status}'.`);
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const clearWinner = async (id) => {
    if (!id) return;
    if (!window.confirm("Kosongkan pemenang (gugur total)?")) return;
    try {
      setLoading(true);
      await axios.patch(`/winnergugur/${id}`, {}, { headers });
      await fetchList();
      alert("Pemenang dikosongkan.");
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const filtered = list.filter((x) => {
    const s = q.toLowerCase();
    return (
      String(x.id).toLowerCase().includes(s) ||
      (x.prize || "").toLowerCase().includes(s) ||
      (x.pemenang || "").toLowerCase().includes(s) ||
      (x.status || "").toLowerCase().includes(s)
    );
  });

  // Statistics
  const diambilCount = filtered.filter(x => x.status === "diambil").length;
  const gugurCount = filtered.filter(x => x.status === "gugur").length;
  const belumVerifikasiCount = filtered.filter(x => x.status && x.status !== "diambil" && x.status !== "gugur").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 via-green-800 to-green-900" style={{backgroundColor: '#406017'}}>
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
            Pos Verifikasi
          </h1>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Proses</p>
                <p className="text-3xl font-bold text-white">{filtered.length}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Berhasil Diambil</p>
                <p className="text-3xl font-bold text-white">{diambilCount}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Gugur</p>
                <p className="text-3xl font-bold text-white">{gugurCount}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">❌</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Belum Verifikasi</p>
                <p className="text-3xl font-bold text-white">{belumVerifikasiCount}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              🎯 Daftar Hadiah Siap Diproses ({filtered.length})
            </h2>
            <div className="flex gap-3">
              <input
                className="border-2 border-white/30 focus:border-white focus:ring-2 focus:ring-white/50 p-3 rounded-xl bg-white/90 backdrop-blur-sm placeholder-gray-600 min-w-[300px]"
                placeholder="🔍 Cari ID, nama, pemenang, atau status..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button
                onClick={fetchList}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 min-w-[120px]"
                title="Refresh data"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Loading...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    🔄 Refresh
                  </span>
                )}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl">✅</span>
                  </div>
                </div>
                <p className="text-gray-600 text-lg font-medium">Memuat data verifikasi...</p>
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
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider border-b-2 border-gray-200">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/60 backdrop-blur-sm divide-y divide-gray-200">
                  {filtered.length ? (
                    filtered.map((row, index) => (
                      <tr 
                        key={row.id} 
                        className={`transition-all duration-300 hover:bg-green-50/70 hover:scale-[1.01] ${
                          index % 2 === 0 ? 'bg-white/40' : 'bg-gray-50/40'
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                            #{row.id}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="text-gray-900 font-semibold text-base">{row.prize}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {row.pemenang ? (
                            <div className="flex items-center gap-2">
                              <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                                {row.pemenang}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic flex items-center gap-2">
                              <span className="text-xl">❓</span>
                              Tidak ada
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold shadow-lg ${
                            row.status === "diambil"
                              ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white"
                              : row.status === "gugur"
                              ? "bg-gradient-to-r from-red-500 to-red-600 text-white"
                              : "bg-gradient-to-r from-amber-500 to-orange-500 text-white"
                          }`}>
                            <span className="text-lg">
                              {row.status === "diambil" ? "" : row.status === "gugur" ? "" : ""}
                            </span>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => changeStatus(row.id, "diambil")}
                              disabled={loading}
                              className="px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                              title="Verifikasi Berhasil (Diambil)"
                            >
                              Verifikasi
                            </button>
                            <button
                              onClick={() => changeStatus(row.id, "gugur")}
                              disabled={loading}
                              className="px-3 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                              title="Gagal (Gugur)"
                            >
                              Gugur
                            </button>
                            <button
                              onClick={() => clearWinner(row.id)}
                              disabled={loading}
                              className="px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                              title="Kosongkan pemenang (winnergugur)"
                            >
                              Kosongkan
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-16 text-center">
                        <div className="flex flex-col items-center gap-6">
                          <div className="w-24 h-24 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center shadow-xl">
                            <span className="text-4xl">📭</span>
                          </div>
                          <div>
                            <p className="text-gray-500 text-xl font-semibold mb-2">Tidak ada data untuk diproses</p>
                            <p className="text-gray-400 text-sm">
                              {q ? `Tidak ada hasil untuk pencarian "${q}"` : "Belum ada hadiah dengan status yang perlu verifikasi"}
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

        {/* Footer Info */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              💡 Petunjuk Verifikasi
            </h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">✅</span>
                  <h4 className="font-semibold text-green-800">Verifikasi</h4>
                </div>
                <p className="text-green-700 text-sm">
                  Gunakan tombol ini ketika pemenang berhasil memverifikasi identitas dan mengambil hadiah.
                </p>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">❌</span>
                  <h4 className="font-semibold text-red-800">Gugur</h4>
                </div>
                <p className="text-red-700 text-sm">
                  Tandai sebagai gugur jika pemenang tidak dapat memverifikasi atau tidak memenuhi syarat.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🗑️</span>
                  <h4 className="font-semibold text-amber-800">Kosongkan</h4>
                </div>
                <p className="text-amber-700 text-sm">
                  Menghapus pemenang dan mengosongkan status. Hadiah kembali ke status awal untuk diundi ulang.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}