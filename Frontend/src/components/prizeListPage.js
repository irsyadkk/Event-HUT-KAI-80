import React, { useEffect, useMemo, useState } from "react";
import axios from "../api";

const useAuthHeaders = () =>
  useMemo(() => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  }, []);

export default function PrizeListPage() {
  const headers = useAuthHeaders();
  const [data, setData] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await axios.get("/prize", { headers });
      setData(res?.data?.data || []);
    } catch (e) {
      alert(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line

  const filtered = data.filter(
    (x) =>
      String(x.id).toLowerCase().includes(q.toLowerCase()) ||
      (x.prize || "").toLowerCase().includes(q.toLowerCase()) ||
      (x.pemenang || "").toLowerCase().includes(q.toLowerCase()) ||
      (x.status || "").toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-2xl font-bold">Daftar Hadiah & Pemenang</h1>
      
      <p className="text-sm text-gray-600">
        Halaman ini dapat ditampilkan publik saat acara.
      </p>

      <div className="flex justify-end">
        <input
          className="border p-2 rounded"
          placeholder="Cari…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="overflow-auto border rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b bg-gray-50">
              <th className="p-2">ID</th>
              <th className="p-2">Nama Hadiah</th>
              <th className="p-2">Pemenang (NIPP)</th>
              
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" className="p-3 text-center">
                  Memuat…
                </td>
              </tr>
            ) : filtered.length ? (
              filtered.map((x) => (
                <tr key={x.id} className="border-b">
                  <td className="p-2">{x.id}</td>
                  <td className="p-2">{x.prize}</td>
                  <td className="p-2">{x.pemenang || "-"}</td>
                  
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-3 text-center text-gray-500">
                  Tidak ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
