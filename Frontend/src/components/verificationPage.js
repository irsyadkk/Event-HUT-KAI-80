import React, { useEffect, useMemo, useState } from "react";
import axios from "../api";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";

const useAuthHeaders = () =>
  useMemo(() => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  }, []);

// helper warna badge status
const statusBadgeClass = (raw) => {
  const s = String(raw || "").toLowerCase();
  if (s.includes("diambil")) return "bg-gradient-to-r from-emerald-500 to-green-600 text-white";
  if (s === "gugur") return "bg-gradient-to-r from-red-500 to-red-600 text-white";
  return "bg-gradient-to-r from-amber-500 to-orange-500 text-white"; // Belum Verifikasi / lainnya
};

export default function VerificationPage() {
  const headers = useAuthHeaders();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  // modal verifikasi (pilih jenis "diambil")
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [targetRow, setTargetRow] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Modal konfirmasi dan alert
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmData, setConfirmData] = useState({ message: "", onConfirm: null, type: "confirm" });
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [alertData, setAlertData] = useState({ message: "", type: "success" });

  const showConfirm = (message, onConfirm) => {
    setConfirmData({ message, onConfirm, type: "confirm" });
    setShowConfirmModal(true);
  };

  const showAlert = (message, type = "success") => {
    setAlertData({ message, type });
    setShowAlertModal(true);
  };

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/prize", { headers });
      const all = res?.data?.data || [];
      // hanya tampilkan yang statusnya terisi
      const withStatus = all.filter((x) => (x.status || "").trim().length > 0);
      setList(withStatus);
    } catch (e) {
      showAlert(e?.response?.data?.message || e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openVerifyModal = (row) => {
    setTargetRow(row);
    setShowVerifyModal(true);
  };
  const closeVerifyModal = () => {
    setShowVerifyModal(false);
    setTargetRow(null);
  };

  const submitVerify = async (status) => {
    if (!targetRow?.id) return;
    try {
      setVerifying(true);
      await axios.patch(`/changestatus/${targetRow.id}`, { status }, { headers });
      await fetchList();
      showAlert(`Status diubah ke '${status}'.`);
      closeVerifyModal();
    } catch (e) {
      showAlert(e?.response?.data?.message || e.message, "error");
    } finally {
      setVerifying(false);
    }
  };

  const changeStatusGugur = async (id) => {
    if (!id) return;
    showConfirm("Tandai pemenang GAGAL? (status akan 'gugur')", async () => {
      try {
        setLoading(true);
        await axios.patch(`/changestatus/${id}`, { status: "gugur" }, { headers });
        await fetchList();
        showAlert("Status diubah ke 'gugur'.");
      } catch (e) {
        showAlert(e?.response?.data?.message || e.message, "error");
      } finally {
        setLoading(false);
      }
    });
  };

  // RESET -> set status ke "Belum Verifikasi"
  const changeStatusReset = async (id) => {
    if (!id) return;
    showConfirm("Setel status hadiah ini menjadi 'Belum Verifikasi'?", async () => {
      try {
        setLoading(true);
        await axios.patch(`/changestatus/${id}`, { status: "Belum Verifikasi" }, { headers });
        await fetchList();
        showAlert("Status diubah ke 'Belum Verifikasi'.");
      } catch (e) {
        showAlert(e?.response?.data?.message || e.message, "error");
      } finally {
        setLoading(false);
      }
    });
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

  // Statistik (dua status "diambil di ..." dihitung sebagai diambil)
  const diambilCount = filtered.filter((x) =>
    String(x.status).toLowerCase().includes("diambil")
  ).length;
  const gugurCount = filtered.filter((x) => String(x.status).toLowerCase() === "gugur").length;
  const belumVerifikasiCount = filtered.filter((x) => {
    const s = String(x.status).toLowerCase();
    return s && !s.includes("diambil") && s !== "gugur";
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-700 via-green-800 to-green-900" style={{ backgroundColor: "#406017" }}>
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center py-8">
          <div className="mb-4">
            <div className="inline-flex items-center justify-center w-20 h-20">
              <img src={LogoKAI} alt="Logo HUT KAI 80" className="h-16 md:h-20 w-auto drop-shadow-lg" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">Pos Verifikasi</h1>
        </div>

        {/* Stats */}
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
              Daftar Hadiah Siap Diproses ({filtered.length})
            </h2>
            <div className="flex gap-3">
              <input
                className="border-2 border-white/30 focus:border-white focus:ring-2 focus:ring-white/50 p-3 rounded-xl bg-white/90 backdrop-blur-sm placeholder-gray-600 min-w-[300px]"
                placeholder="🔍 Cari.."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
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
            <div className="overflow-x-auto max-h-[60vh] overflow-y-auto rounded-b-2xl">
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
                          index % 2 === 0 ? "bg-white/40" : "bg-gray-50/40"
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                            #{row.id}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-900 font-semibold text-base">{row.prize}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {row.pemenang ? (
                            <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                              {row.pemenang}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic flex items-center gap-2">
                              <span className="text-xl">❓</span>
                              Tidak ada
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold shadow-lg ${statusBadgeClass(row.status)}`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => openVerifyModal(row)}
                              disabled={loading}
                              className="px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                              title="Verifikasi: pilih jenis diambil"
                            >
                              Verifikasi
                            </button>
                            <button
                              onClick={() => changeStatusGugur(row.id)}
                              disabled={loading}
                              className="px-3 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                              title="Gagal (Gugur)"
                            >
                              Gugur
                            </button>
                            <button
                              onClick={() => changeStatusReset(row.id)}
                              disabled={loading}
                              className="px-3 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-yellow-600 hover:from-orange-600 hover:to-yellow-700 text-white text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                              title="Setel status ke 'Belum Verifikasi'"
                            >
                              Reset
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

        {/* Modal Pilih Jenis "Diambil" */}
        {showVerifyModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeVerifyModal} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden border border-white/30">
              <div className="bg-gradient-to-r from-emerald-600 to-green-700 px-6 py-4">
                <h3 className="text-xl font-bold text-white">Pilih Metode Pengambilan</h3>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-gray-700">
                  Hadiah: <b>{targetRow?.prize}</b> &nbsp; (ID: #{targetRow?.id})<br />
                  Pemenang (NIPP): <b>{targetRow?.pemenang || "-"}</b>
                </p>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => submitVerify("diambil di tempat")}
                    disabled={verifying}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                  >
                    {verifying ? "Memproses..." : "✅ Diambil di Tempat"}
                  </button>
                  <button
                    onClick={() => submitVerify("diambil di daop")}
                    disabled={verifying}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                  >
                    {verifying ? "Memproses..." : "🚚 Diambil di Daop"}
                  </button>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={closeVerifyModal}
                    disabled={verifying}
                    className="mt-2 px-4 py-2 rounded-xl border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold transition-all duration-200"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Konfirmasi */}
        {showConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden border border-white/30">
              <div className="bg-gradient-to-r from-orange-600 to-red-700 px-6 py-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">⚠️</span>
                  Konfirmasi Tindakan
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <p className="text-gray-700 text-base leading-relaxed">{confirmData.message}</p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="px-6 py-3 rounded-xl border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold transition-all duration-200"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      confirmData.onConfirm();
                      setShowConfirmModal(false);
                    }}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    Ya, Lanjutkan
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Alert */}
        {showAlertModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAlertModal(false)} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden border border-white/30">
              <div className={`px-6 py-4 ${
                alertData.type === "error" 
                  ? "bg-gradient-to-r from-red-600 to-red-700" 
                  : "bg-gradient-to-r from-emerald-600 to-green-700"
              }`}>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="text-2xl">
                    {alertData.type === "error" ? "❌" : "✅"}
                  </span>
                  {alertData.type === "error" ? "Terjadi Kesalahan" : "Berhasil"}
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <p className="text-gray-700 text-base leading-relaxed">{alertData.message}</p>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowAlertModal(false)}
                    className={`px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-white ${
                      alertData.type === "error"
                        ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                        : "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
                    }`}
                  >
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}