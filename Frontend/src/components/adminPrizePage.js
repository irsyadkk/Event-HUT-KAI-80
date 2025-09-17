import React, { useEffect, useMemo, useState } from "react";
import axios from "../api";
import { useNavigate } from "react-router-dom";

const useAuthHeaders = () =>
  useMemo(() => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  }, []);

export default function AdminPrizePage() {
  const headers = useAuthHeaders();
  const navigate = useNavigate();

  // form tambah hadiah
  const [newId, setNewId] = useState("");
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
  }, []); // eslint-disable-line

  const handleAddPrize = async (e) => {
    e.preventDefault();
    if (!newId || !newPrize) return alert("ID dan Nama Hadiah wajib diisi.");
    setLoading(true);
    try {
      await axios.post("/addprize", { id: newId, prize: newPrize }, { headers });
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
        {prize: editInput.trim() },
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

  const filtered = list.filter(
    (x) =>
      String(x.id).toLowerCase().includes(q.toLowerCase()) ||
      (x.prize || "").toLowerCase().includes(q.toLowerCase()) ||
      (x.pemenang || "").toLowerCase().includes(q.toLowerCase()) ||
      (x.status || "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="p-4 space-y-8">
      <h1 className="text-2xl font-bold">Admin Hadiah (Admin 1)</h1>

      <div className="flex gap-2">
        <button
          onClick={() => navigate("/prizelist")}
          className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-700 hover:from-yellow-700 hover:to-orange-800 text-white rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 text-sm md:text-base font-medium"
        >
          list prize
        </button>
        <button
          onClick={() => navigate("/verification")}
          className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-700 hover:from-yellow-700 hover:to-orange-800 text-white rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 text-sm md:text-base font-medium"
        >
          verifikasi
        </button>
      </div>

      {/* Tambah Hadiah */}
      <form onSubmit={handleAddPrize} className="space-y-2 border p-4 rounded">
        <h2 className="font-semibold">Tambah Hadiah</h2>
        <div className="grid gap-2 md:grid-cols-3">
          <input
            className="border p-2 rounded"
            placeholder="ID (unik)"
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
          />
          <input
            className="border p-2 rounded"
            placeholder="Nama Hadiah"
            value={newPrize}
            onChange={(e) => setNewPrize(e.target.value)}
          />
          <button
            disabled={loading}
            className="bg-blue-600 text-white rounded px-3 py-2"
          >
            {loading ? "Menyimpan..." : "Tambah"}
          </button>
        </div>
      </form>

      {/* List Hadiah */}
      <div className="space-y-2 border p-4 rounded">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Daftar Hadiah</h2>
          <input
            className="border p-2 rounded"
            placeholder="Cari…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">ID</th>
                <th className="p-2">Nama Hadiah</th>
                <th className="p-2">Pemenang (NIPP)</th>
                <th className="p-2">Status</th>
                <th className="p-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{row.id}</td>
                  <td className="p-2">{row.prize}</td>
                  <td className="p-2">{row.pemenang || "-"}</td>
                  <td className="p-2">{row.status || "-"}</td>
                  <td className="p-2 space-x-2">
                    <button
                      onClick={() => openWinnerModal(row)}
                      className="px-2 py-1 rounded bg-green-600 text-white"
                      disabled={loading}
                      title={row.pemenang ? "Ubah Pemenang" : "Set Pemenang"}
                    >
                      {row.pemenang ? "Ubah Pemenang" : "Set Pemenang"}
                    </button>
                    <button
                      onClick={() => openEditModal(row)}
                      className="px-2 py-1 rounded bg-indigo-600 text-white"
                      disabled={loading}
                      title="Edit nama hadiah"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => clearWinner(row.id)}
                      className="px-2 py-1 rounded bg-amber-600 text-white"
                      disabled={loading}
                      title="Kosongkan pemenang (winnergugur)"
                    >
                      Kosongkan
                    </button>
                    <button
                      onClick={() => handleDelete(row.id)}
                      className="px-2 py-1 rounded bg-red-600 text-white"
                      disabled={loading}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan="5" className="p-3 text-center text-gray-500">
                    Tidak ada data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Modal Set/Ubah Pemenang --- */}
      {showWinnerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeWinnerModal}
          />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md z-10">
            <h3 className="text-lg font-semibold mb-2">
              {activePrize?.pemenang ? "Ubah Pemenang" : "Set Pemenang"}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Hadiah: <b>{activePrize?.prize}</b> (ID: {activePrize?.id})
            </p>

            <label className="block text-sm mb-1">NIPP Pemenang</label>
            <input
              className="border rounded w-full p-2 mb-4"
              placeholder="Masukkan NIPP"
              value={nippInput}
              onChange={(e) => setNippInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitWinner()}
              autoFocus
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={closeWinnerModal}
                className="px-3 py-2 rounded border"
                disabled={savingWinner}
              >
                Batal
              </button>
              <button
                onClick={submitWinner}
                className="px-3 py-2 rounded bg-green-600 text-white"
                disabled={savingWinner}
              >
                {savingWinner ? "Menyimpan…" : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Modal Edit Hadiah --- */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeEditModal}
          />
          <div className="relative bg-white rounded-xl shadow-xl p-6 w-full max-w-md z-10">
            <h3 className="text-lg font-semibold mb-2">Edit Nama Hadiah</h3>
            <p className="text-sm text-gray-600 mb-4">
              ID: {editTarget?.id}
            </p>

            <label className="block text-sm mb-1">Nama Hadiah Baru</label>
            <input
              className="border rounded w-full p-2 mb-4"
              placeholder="Masukkan nama hadiah baru"
              value={editInput}
              onChange={(e) => setEditInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitEdit()}
              autoFocus
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={closeEditModal}
                className="px-3 py-2 rounded border"
                disabled={savingEdit}
              >
                Batal
              </button>
              <button
                onClick={submitEdit}
                className="px-3 py-2 rounded bg-indigo-600 text-white"
                disabled={savingEdit}
              >
                {savingEdit ? "Menyimpan…" : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
