import React, { useEffect, useMemo, useState } from "react";
import axios from "../api";
import { useNavigate } from "react-router-dom";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";

const useAuthHeaders = () =>
  useMemo(() => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  }, []);

export default function AdminPrizePage() {
  const headers = useAuthHeaders();
  const navigate = useNavigate();

  // form tambah hadiah
  const [newId, setNewId] = useState(""); // (opsional, belum dipakai)
  const [newPrize, setNewPrize] = useState("");

  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");

  // --- Modal Set Pemenang
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [activePrize, setActivePrize] = useState(null); // {id, prize, ...}
  const [nippInput, setNippInput] = useState("");
  const [savingWinner, setSavingWinner] = useState(false);

  // --- Modal Edit Hadiah
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // row
  const [editInput, setEditInput] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchList = async () => {
    try {
      const res = await axios.get("/prize", { headers });
      setList(res?.data?.data || []);
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    }
  };

  useEffect(() => {
    fetchList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddPrize = async (e) => {
    e.preventDefault();
    if (!newPrize) return alert("Nama Hadiah wajib diisi.");
    setLoading(true);
    try {
      await axios.post("/addprize", { prize: newPrize }, { headers });
      setNewId("");
      setNewPrize("");
      await fetchList();
      alert("Hadiah berhasil ditambahkan.");
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Hapus hadiah ID ${id}?`)) return;
    setLoading(true);
    try {
      await axios.delete(`/prize/${id}`, { headers });
      await fetchList();
      alert("Hadiah dihapus.");
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Aksi Pemenang via Modal
  const openWinnerModal = (row) => {
    setActivePrize(row);
    setNippInput(row.pemenang ? row.pemenang : "");
    setShowWinnerModal(true);
  };
  const closeWinnerModal = () => {
    setShowWinnerModal(false);
    setActivePrize(null);
    setNippInput("");
  };
  const submitWinner = async () => {
    if (!activePrize?.id) return;
    if (!nippInput) return alert("NIPP pemenang wajib diisi.");
    setSavingWinner(true);
    try {
      await axios.patch(
        `/addwinner/${activePrize.id}`,
        { winner: nippInput },
        { headers }
      );
      await fetchList();
      alert("Pemenang berhasil diset (status: Belum Verifikasi).");
      closeWinnerModal();
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setSavingWinner(false);
    }
  };

  const clearWinner = async (id) => {
    if (!window.confirm("Kosongkan pemenang untuk hadiah ini?")) return;
    setLoading(true);
    try {
      await axios.patch(`/winnergugur/${id}`, {}, { headers });
      await fetchList();
      alert("Pemenang dikosongkan.");
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Aksi Edit via Modal
  const openEditModal = (row) => {
    setEditTarget(row);
    setEditInput(row.prize || "");
    setShowEditModal(true);
  };
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditTarget(null);
    setEditInput("");
  };
  const submitEdit = async () => {
    if (!editTarget?.id) return;
    if (!editInput?.trim()) return alert("Nama hadiah baru wajib diisi.");
    if (editInput === editTarget.prize) {
      return alert("Nama hadiah tidak berubah.");
    }
    setSavingEdit(true);
    try {
      await axios.patch(
        `/prize/${editTarget.id}`,
        { prize: editInput.trim() },
        { headers }
      );
      await fetchList();
      alert("Nama hadiah berhasil diubah.");
      closeEditModal();
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // Filter pencarian
  const filtered = list.filter(
    (x) =>
      String(x.id).toLowerCase().includes(q.toLowerCase()) ||
      (x.prize || "").toLowerCase().includes(q.toLowerCase()) ||
      (x.pemenang || "").toLowerCase().includes(q.toLowerCase()) ||
      (x.status || "").toLowerCase().includes(q.toLowerCase())
  );

  // Urutkan: belum ada pemenang dulu → lalu sudah ada pemenang; masing-masing ID ASC
  const ordered = [...filtered].sort((a, b) => {
    const aHasWinner = String(a?.pemenang || "").trim() !== "";
    const bHasWinner = String(b?.pemenang || "").trim() !== "";

    // Belum ada pemenang dulu (false < true → -1)
    if (aHasWinner !== bHasWinner) return aHasWinner ? 1 : -1;

    // Kalau sama-sama statusnya, urut ID numeric ASC
    const aid = Number(a?.id) || 0;
    const bid = Number(b?.id) || 0;
    return aid - bid;
  });

  // Stats calculation
  const winnersCount = filtered.filter((x) => x.pemenang).length;
  const totalPrizes = filtered.length;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-green-700 via-green-800 to-green-900"
      style={{ backgroundColor: "#406017" }}
    >
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
            Admin Hadiah
          </h1>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={() => navigate("/prizelist")}
            className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl transform hover:scale-105 text-lg font-semibold border-2 border-white/20 backdrop-blur-sm"
          >
            📋 List Prize
          </button>
          <button
            onClick={() => navigate("/verification")}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl transform hover:scale-105 text-lg font-semibold border-2 border-white/20 backdrop-blur-sm"
          >
            ✅ Verifikasi
          </button>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Hadiah</p>
                <p className="text-3xl font-bold text-white">{totalPrizes}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">🎁</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">
                  Sudah Terpilih
                </p>
                <p className="text-3xl font-bold text-white">{winnersCount}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">👑</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 shadow-2xl border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Menunggu</p>
                <p className="text-3xl font-bold text-white">
                  {totalPrizes - winnersCount}
                </p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tambah Hadiah */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              🎁 Tambah Hadiah Baru
            </h2>
          </div>
          <form onSubmit={handleAddPrize} className="p-6">
            <div className="grid gap-4 md:grid-cols-2 items-end">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Hadiah
                </label>
                <input
                  className="w-full border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 p-3 rounded-xl transition-all duration-200 bg-white/80 backdrop-blur-sm"
                  placeholder="Masukkan nama hadiah..."
                  value={newPrize}
                  onChange={(e) => setNewPrize(e.target.value)}
                />
              </div>
              <button
                disabled={loading}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl px-6 py-3 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Menyimpan...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 justify-center">
                    ➕ Tambah Hadiah
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Search & Filter Section */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Pencarian & Filter
            </h2>
            <div className="relative">
              <input
                className="border-2 border-white/30 focus:border-white focus:ring-2 focus:ring-white/50 p-3 rounded-xl bg-white/90 backdrop-blur-sm placeholder-gray-600 pr-4 min-w-[300px] text-sm"
                placeholder="🔍 Cari berdasarkan ID, hadiah, pemenang, atau status..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* List Hadiah */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              🏆 Daftar Lengkap Hadiah ({ordered.length} dari {list.length})
            </h2>
          </div>

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
                {ordered.map((row, index) => (
                  <tr
                    key={row.id}
                    className={`transition-all duration-300 hover:bg-green-50/70 hover:scale-[1.01] ${
                      index % 2 === 0 ? "bg-white/40" : "bg-gray-50/40"
                    } ${
                      row.pemenang
                        ? "border-l-4 border-green-500"
                        : "border-l-4 border-gray-300"
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
                          <p className="text-gray-900 font-semibold text-lg">
                            {row.prize}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {row.pemenang ? (
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                              {row.pemenang}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div>
                            <span className="bg-gray-300 text-gray-600 px-4 py-2 rounded-full text-sm font-medium">
                              Menunggu Undian
                            </span>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {row.status ? (
                        <span
                          className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
                            row.status.toLowerCase().includes("verifikasi")
                              ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-white"
                              : "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                          }`}
                        >
                          {row.status}
                        </span>
                      ) : (
                        <span className="bg-gray-300 text-gray-600 px-4 py-2 rounded-full text-sm font-medium">
                          -
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openWinnerModal(row)}
                          className="px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-xs font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                          disabled={loading}
                          title={row.pemenang ? "Ubah Pemenang" : "Set Pemenang"}
                        >
                          {row.pemenang ? "Ubah" : "Set"}
                        </button>
                        <button
                          onClick={() => openEditModal(row)}
                          className="px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white text-xs font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                          disabled={loading}
                          title="Edit nama hadiah"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => clearWinner(row.id)}
                          className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                          disabled={loading}
                          title="Kosongkan pemenang"
                        >
                          Clear
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="px-3 py-1 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white text-xs font-semibold shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                          disabled={loading}
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!ordered.length && (
                  <tr>
                    <td colSpan="5" className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-6">
                        <div className="w-24 h-24 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center shadow-xl">
                          <span className="text-4xl">📭</span>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xl font-semibold mb-2">
                            Tidak ada data ditemukan
                          </p>
                          <p className="text-gray-400 text-sm">
                            {q
                              ? `Tidak ada hasil untuk pencarian "${q}"`
                              : "Belum ada hadiah yang terdaftar"}
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
        </div>

        {/* --- Modal Set/Ubah Pemenang --- */}
        {showWinnerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeWinnerModal}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden border border-white/30">
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {activePrize?.pemenang ? "✏️ Ubah Pemenang" : "👤 Set Pemenang"}
                </h3>
              </div>
              <div className="p-6">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-700 mb-1">
                    <span className="font-semibold">Hadiah:</span>{" "}
                    {activePrize?.prize}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">ID:</span> #{activePrize?.id}
                  </p>
                </div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  NIPP Pemenang
                </label>
                <input
                  className="w-full border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 p-3 rounded-xl transition-all duration-200 bg-white/80 backdrop-blur-sm mb-6"
                  placeholder="Masukkan NIPP pemenang..."
                  value={nippInput}
                  onChange={(e) => setNippInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitWinner()}
                  autoFocus
                />

                <div className="flex justify-end gap-3">
                  <button
                    onClick={closeWinnerModal}
                    className="px-6 py-2 rounded-xl border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold transition-all duration-200 hover:bg-gray-50"
                    disabled={savingWinner}
                  >
                    ❌ Batal
                  </button>
                  <button
                    onClick={submitWinner}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                    disabled={savingWinner}
                  >
                    {savingWinner ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Menyimpan…
                      </span>
                    ) : (
                      "💾 Simpan"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- Modal Edit Hadiah --- */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeEditModal}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden border border-white/30">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  📝 Edit Nama Hadiah
                </h3>
              </div>
              <div className="p-6">
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold">ID Hadiah:</span> #
                    {editTarget?.id}
                  </p>
                </div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Hadiah Baru
                </label>
                <input
                  className="w-full border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-3 rounded-xl transition-all duration-200 bg-white/80 backdrop-blur-sm mb-6"
                  placeholder="Masukkan nama hadiah baru..."
                  value={editInput}
                  onChange={(e) => setEditInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitEdit()}
                  autoFocus
                />

                <div className="flex justify-end gap-3">
                  <button
                    onClick={closeEditModal}
                    className="px-6 py-2 rounded-xl border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold transition-all duration-200 hover:bg-gray-50"
                    disabled={savingEdit}
                  >
                    ❌ Batal
                  </button>
                  <button
                    onClick={submitEdit}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                    disabled={savingEdit}
                  >
                    {savingEdit ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Menyimpan…
                      </span>
                    ) : (
                      "💾 Simpan"
                    )}
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