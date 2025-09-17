import React, { useMemo, useState } from "react";
import axios from "../api";

const useAuthHeaders = () =>
  useMemo(() => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  }, []);

export default function VerificationPage() {
  const headers = useAuthHeaders();
  const [id, setId] = useState("");
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadPrize = async () => {
    if (!id) return alert("Masukkan ID hadiah.");
    setLoading(true);
    try {
      const res = await axios.get(`/prize/${id}`, { headers });
      setDetail(res?.data?.data || null);
    } catch (e) {
      setDetail(null);
      alert(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (status) => {
    if (!detail?.id) return alert("Muat data hadiah dulu.");
    if (
      status === "gugur" &&
      !window.confirm("Tandai pemenang GAGAL? (status akan 'gugur')")
    )
      return;

    setLoading(true);
    try {
      await axios.patch(
        `/changestatus/${detail.id}`,
        { status },
        { headers }
      );
      await loadPrize();
      alert(`Status diubah ke '${status}'.`);
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const clearWinner = async () => {
    if (!detail?.id) return alert("Muat data hadiah dulu.");
    if (!window.confirm("Kosongkan pemenang (gugur total)?")) return;
    setLoading(true);
    try {
      await axios.patch(`/winnergugur/${detail.id}`, {}, { headers });
      await loadPrize();
      alert("Pemenang dikosongkan.");
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Pos Verifikasi (Admin 2)</h1>
      <p className="text-sm text-gray-600">
        KMF diverifikasi <b>manual</b> oleh petugas. Setelah validasi manual,
        gunakan tombol di bawah untuk mengubah status.
      </p>

      <div className="border p-4 rounded space-y-3">
        <div className="flex gap-2">
          <input
            className="border p-2 rounded flex-1"
            placeholder="Masukkan ID Hadiah"
            value={id}
            onChange={(e) => setId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadPrize()}
          />
          <button
            onClick={loadPrize}
            disabled={loading}
            className="bg-gray-800 text-white rounded px-3 py-2"
          >
            {loading ? "Memuat…" : "Cari"}
          </button>
        </div>

        {detail && (
          <div className="border rounded p-3 bg-gray-50">
            <div className="grid md:grid-cols-2 gap-2 text-sm">
              <div><b>ID</b>: {detail.id}</div>
              <div><b>Nama Hadiah</b>: {detail.prize}</div>
              <div><b>Pemenang (NIPP)</b>: {detail.pemenang || "-"}</div>
              <div><b>Status</b>: {detail.status || "-"}</div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => changeStatus("diambil")}
                disabled={loading}
                className="bg-green-600 text-white rounded px-3 py-2"
              >
                Verifikasi Berhasil (Diambil)
              </button>
              <button
                onClick={() => changeStatus("gugur")}
                disabled={loading}
                className="bg-red-600 text-white rounded px-3 py-2"
              >
                Gagal (Gugur)
              </button>
              <button
                onClick={clearWinner}
                disabled={loading}
                className="bg-amber-600 text-white rounded px-3 py-2"
              >
                Kosongkan Pemenang
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
