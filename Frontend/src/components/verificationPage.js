import React, { useEffect, useMemo, useState } from "react";
import axios from "../api";

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

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Pos Verifikasi (Admin 2)</h1>
      <p className="text-sm text-gray-600">
        KMF diverifikasi <b>manual</b> oleh petugas. Gunakan tabel berikut untuk
        memproses hadiah yang sudah memiliki status (Belum Verifikasi/diambil/gugur).
      </p>

      <div className="space-y-2 border p-4 rounded">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Daftar Hadiah Siap Diproses</h2>
          <div className="flex gap-2">
            <input
              className="border p-2 rounded"
              placeholder="Cari ID/Nama/Pemenang/Status…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button
              onClick={fetchList}
              disabled={loading}
              className="bg-gray-800 text-white rounded px-3 py-2"
              title="Refresh"
            >
              {loading ? "Memuat…" : "Refresh"}
            </button>
          </div>
        </div>

        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b bg-gray-50">
                <th className="p-2">ID</th>
                <th className="p-2">Nama Hadiah</th>
                <th className="p-2">Pemenang (NIPP)</th>
                <th className="p-2">Status</th>
                <th className="p-2">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-3 text-center">
                    Memuat…
                  </td>
                </tr>
              ) : filtered.length ? (
                filtered.map((row) => (
                  <tr key={row.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{row.id}</td>
                    <td className="p-2">{row.prize}</td>
                    <td className="p-2">{row.pemenang || "-"}</td>
                    <td className="p-2">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs ${
                          row.status === "diambil"
                            ? "bg-green-100 text-green-700"
                            : row.status === "gugur"
                            ? "bg-red-100 text-red-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="p-2 space-x-2">
                      <button
                        onClick={() => changeStatus(row.id, "diambil")}
                        disabled={loading}
                        className="px-2 py-1 rounded bg-green-600 text-white"
                        title="Verifikasi Berhasil (Diambil)"
                      >
                        Verifikasi
                      </button>
                      <button
                        onClick={() => changeStatus(row.id, "gugur")}
                        disabled={loading}
                        className="px-2 py-1 rounded bg-red-600 text-white"
                        title="Gagal (Gugur)"
                      >
                        Gugur
                      </button>
                      <button
                        onClick={() => clearWinner(row.id)}
                        disabled={loading}
                        className="px-2 py-1 rounded bg-amber-600 text-white"
                        title="Kosongkan pemenang (winnergugur)"
                      >
                        Kosongkan
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="p-3 text-center text-gray-500">
                    Tidak ada data dengan status terisi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-500">
          Catatan: tombol <b>Kosongkan</b> akan menghapus pemenang dan mengosongkan status.
        </p>
      </div>
    </div>
  );
}
