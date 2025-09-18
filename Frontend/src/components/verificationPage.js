import React, { useEffect, useMemo, useState } from "react";
import axios from "../api";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";

const useAuthHeaders = () =>
  useMemo(() => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  }, []);

const ADMIN_PASS = process.env.REACT_APP_ADMIN_PASSWORD; // kai123admin (di .env)

const statusBadgeClass = (raw) => {
  const s = String(raw || "").toLowerCase();
  if (s.includes("diambil")) return "bg-gradient-to-r from-emerald-500 to-green-600 text-white";
  if (s === "gugur") return "bg-gradient-to-r from-red-500 to-red-600 text-white";
  return "bg-gradient-to-r from-amber-500 to-orange-500 text-white";
};

export default function VerificationPage() {
  const headers = useAuthHeaders();

  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");

  // modal verifikasi (pilih jenis diambil)
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [targetRow, setTargetRow] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // modal admin password (untuk kosongkan)
  const [adminModal, setAdminModal] = useState({ open: false, id: null });
  const [adminInput, setAdminInput] = useState("");
  const [adminError, setAdminError] = useState("");

  const fetchList = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/prize", { headers });
      const all = res?.data?.data || [];
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
      alert(`Status diubah ke '${status}'.`);
      closeVerifyModal();
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setVerifying(false);
    }
  };

  const changeStatusGugur = async (id) => {
    if (!id) return;
    if (!window.confirm("Tandai pemenang GAGAL? (status akan 'gugur')")) return;
    try {
      setLoading(true);
      await axios.patch(`/changestatus/${id}`, { status: "gugur" }, { headers });
      await fetchList();
      alert("Status diubah ke 'gugur'.");
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  // === Admin modal: kosongkan pemenang ===
  const openAdminModal = (id) => {
    setAdminModal({ open: true, id });
    setAdminInput("");
    setAdminError("");
  };
  const closeAdminModal = () => {
    setAdminModal({ open: false, id: null });
    setAdminInput("");
    setAdminError("");
  };
  const submitAdminModal = async () => {
    if (!ADMIN_PASS) {
      alert("ENV REACT_APP_ADMIN_NIPP belum di-set.");
      return;
    }
    if (adminInput !== ADMIN_PASS) {
      setAdminError("Password admin salah.");
      return;
    }
    const id = adminModal.id;
    closeAdminModal();
    await performClearWinner(id);
  };

  const performClearWinner = async (id) => {
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

  const diambilCount = filtered.filter((x) => String(x.status).toLowerCase().includes("diambil")).length;
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
          <div className="mb-4 inline-flex items-center justify-center w-20 h-20">
            <img src={LogoKAI} alt="Logo HUT KAI 80" className="h-16 md:h-20 w-auto drop-shadow-lg" />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">Pos Verifikasi</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-2xl border border-white/20">
            <p className="text-blue-100 text-sm font-medium">Total Proses</p>
            <p className="text-3xl font-bold text-white">{filtered.length}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 shadow-2xl border border-white/20">
            <p className="text-green-100 text-sm font-medium">Berhasil Diambil</p>
            <p className="text-3xl font-bold text-white">{diambilCount}</p>
          </div>
          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 shadow-2xl border border-white/20">
            <p className="text-red-100 text-sm font-medium">Gugur</p>
            <p className="text-3xl font-bold text-white">{gugurCount}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 shadow-2xl border border-white/20">
            <p className="text-orange-100 text-sm font-medium">Belum Verifikasi</p>
            <p className="text-3xl font-bold text-white">{belumVerifikasiCount}</p>
          </div>
        </div>

        {/* Main */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-xl font-bold text-white">🎯 Daftar Hadiah Siap Diproses ({filtered.length})</h2>
            <div className="flex gap-3">
              <input
                className="border-2 border-white/30 focus:border-white focus:ring-2 p-3 rounded-xl bg-white/90 min-w-[300px]"
                placeholder="🔍 Cari ID, nama, pemenang, atau status..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button
                onClick={fetchList}
                disabled={loading}
                className="px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl"
                title="Refresh data"
              >
                {loading ? "Loading..." : "🔄 Refresh"}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center">Memuat data verifikasi...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/90 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase border-b-2">ID</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase border-b-2">Nama Hadiah</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase border-b-2">Pemenang (NIPP)</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase border-b-2">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase border-b-2">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white/60 backdrop-blur-sm divide-y divide-gray-200">
                  {filtered.length ? (
                    filtered.map((row, index) => (
                      <tr
                        key={row.id}
                        className={`transition-all duration-300 hover:bg-green-50/70 ${
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
                            <span className="text-gray-400 italic">Tidak ada</span>
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
                              className="px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white text-sm font-semibold shadow-md"
                            >
                              Verifikasi
                            </button>
                            <button
                              onClick={() => changeStatusGugur(row.id)}
                              disabled={loading}
                              className="px-3 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-semibold shadow-md"
                            >
                              Gugur
                            </button>
                            <button
                              onClick={() => openAdminModal(row.id)}
                              disabled={loading}
                              className="px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white text-sm font-semibold shadow-md"
                            >
                              Kosongkan
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-16 text-center text-gray-500">
                        Tidak ada data untuk diproses.
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
                  Hadiah: <b>{targetRow?.prize}</b> (ID: #{targetRow?.id})<br />
                  Pemenang (NIPP): <b>{targetRow?.pemenang || "-"}</b>
                </p>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => submitVerify("diambil di tempat")}
                    disabled={verifying}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold shadow-lg"
                  >
                    {verifying ? "Memproses..." : "✅ Diambil di Tempat"}
                  </button>
                  <button
                    onClick={() => submitVerify("diambil di daop")}
                    disabled={verifying}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 text-white font-semibold shadow-lg"
                  >
                    {verifying ? "Memproses..." : "🚚 Diambil di Daop"}
                  </button>
                </div>
                <div className="flex justify-end">
                  <button onClick={closeVerifyModal} disabled={verifying} className="mt-2 px-4 py-2 rounded-xl border-2 border-gray-300">
                    Batal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Password Admin (Kosongkan) */}
        {adminModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeAdminModal} />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 overflow-hidden border border-white/30">
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
                <h3 className="text-lg font-bold text-white">Konfirmasi Admin (Kosongkan)</h3>
              </div>
              <div className="p-6 space-y-3">
                <p className="text-sm text-gray-700">Masukkan password admin untuk mengosongkan pemenang.</p>
                <input
                  type="password"
                  className="w-full border-2 border-gray-300 focus:border-red-500 focus:ring-2 p-3 rounded-xl"
                  placeholder="Password admin"
                  value={adminInput}
                  onChange={(e) => { setAdminInput(e.target.value); setAdminError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && submitAdminModal()}
                  autoFocus
                />
                {adminError && <p className="text-sm text-red-600">{adminError}</p>}
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={closeAdminModal} className="px-4 py-2 rounded-xl border-2 border-gray-300">Batal</button>
                  <button onClick={submitAdminModal} className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white">
                    Lanjutkan
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
