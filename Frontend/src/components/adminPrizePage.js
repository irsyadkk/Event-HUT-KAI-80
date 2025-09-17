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

  // form edit hadiah
  const [editId, setEditId] = useState("");
  const [editName, setEditName] = useState("");

  // form set pemenang
  const [winnerPrizeId, setWinnerPrizeId] = useState("");
  const [winnerNipp, setWinnerNipp] = useState("");

  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");

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
      await axios.post(
        "/addprize",
        { id: newId, prize: newPrize },
        { headers }
      );
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

  const handleEditPrize = async (e) => {
    e.preventDefault();
    if (!editId || !editName) return alert("ID dan Nama baru wajib diisi.");
    setLoading(true);
    try {
      await axios.patch("/prize", { id: editId, prize: editName }, { headers });
      setEditId("");
      setEditName("");
      await fetchList();
      alert("Nama hadiah berhasil diubah.");
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

  const handleSetWinner = async (e) => {
    e.preventDefault();
    if (!winnerPrizeId || !winnerNipp)
      return alert("ID hadiah dan NIPP pemenang wajib diisi.");
    setLoading(true);
    try {
      await axios.patch(
        `/addwinner/${winnerPrizeId}`,
        { winner: winnerNipp },
        { headers }
      );
      setWinnerPrizeId("");
      setWinnerNipp("");
      await fetchList();
      alert("Pemenang berhasil diset (status: Belum Verifikasi).");
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
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

      {/* Edit Hadiah */}
      <form onSubmit={handleEditPrize} className="space-y-2 border p-4 rounded">
        <h2 className="font-semibold">Edit Nama Hadiah</h2>
        <div className="grid gap-2 md:grid-cols-3">
          <input
            className="border p-2 rounded"
            placeholder="ID Hadiah"
            value={editId}
            onChange={(e) => setEditId(e.target.value)}
          />
          <input
            className="border p-2 rounded"
            placeholder="Nama Hadiah Baru"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />
          <button
            disabled={loading}
            className="bg-amber-600 text-white rounded px-3 py-2"
          >
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>

      {/* Set Pemenang */}
      <form onSubmit={handleSetWinner} className="space-y-2 border p-4 rounded">
        <h2 className="font-semibold">Set Pemenang</h2>
        <div className="grid gap-2 md:grid-cols-3">
          <input
            className="border p-2 rounded"
            placeholder="ID Hadiah"
            value={winnerPrizeId}
            onChange={(e) => setWinnerPrizeId(e.target.value)}
          />
          <input
            className="border p-2 rounded"
            placeholder="NIPP Pemenang"
            value={winnerNipp}
            onChange={(e) => setWinnerNipp(e.target.value)}
          />
          <button
            disabled={loading}
            className="bg-green-600 text-white rounded px-3 py-2"
          >
            {loading ? "Memproses..." : "Tetapkan Pemenang"}
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Setelah ditetapkan, status otomatis <b>Belum Verifikasi</b>.
        </p>
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
                  <td className="p-2">
                    <button
                      onClick={() => handleDelete(row.id)}
                      className="text-red-600 hover:underline"
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
    </div>
  );
}
