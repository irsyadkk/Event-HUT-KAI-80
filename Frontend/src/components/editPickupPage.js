import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";
import { ADMIN_NIPP } from "../utils";
import api from "../api";

const JENIS_OPTIONS = ["INDIVIDU", "KOLEKTIF"];
const POS_OPTIONS = ["POS 1", "POS 2", "POS 3", "POS 4"];

const EditPickupPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const nippAwal = state?.nipp;

  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // form state
  const [nipp, setNipp] = useState("");
  const [nama, setNama] = useState("");
  const [jumlahKuota, setJumlahKuota] = useState("");
  const [jenisPengambilan, setJenisPengambilan] = useState("");
  const [posPengambilan, setPosPengambilan] = useState("");
  const [nippPj, setNippPj] = useState("");
  const [namaPj, setNamaPj] = useState("");

  // guard admin
  useEffect(() => {
    const token = localStorage.getItem("token");
    const nippLogin = localStorage.getItem("nipp");
    if (!token || !nippLogin) return navigate("/");
    if (nippLogin !== ADMIN_NIPP) return navigate("/");
    if (!nippAwal) return navigate("/admindesk");
    setAllowed(true);
  }, [navigate, nippAwal]);

  // load data pickup
  useEffect(() => {
    if (!allowed || !nippAwal) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/pickup/${nippAwal}`);
        const row = Array.isArray(res?.data?.data)
          ? res.data.data[0]
          : res.data.data;

        setNipp(row?.nipp ?? nippAwal);
        setNama(row?.nama ?? "");
        setJumlahKuota(row?.jumlah_kuota ?? "");
        setJenisPengambilan(row?.jenis_pengambilan ?? "");
        setPosPengambilan(row?.pos_pengambilan ?? "");
        setNippPj(row?.nipp_pj ?? "");
        setNamaPj(row?.nama_pj ?? "");
      } catch (e) {
        console.error(e);
        setError("Gagal memuat data pickup.");
      } finally {
        setLoading(false);
      }
    })();
  }, [allowed, nippAwal]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.put(`/pickup/${nippAwal}`, {
        nipp,
        nama,
        jumlah_kuota: Number(jumlahKuota),
        jenis_pengambilan: jenisPengambilan,
        pos_pengambilan: posPengambilan,
        nipp_pj: nippPj,
        nama_pj: namaPj,
      });

      navigate("/admindesk", { state: { focus: "pickup" } });
    } catch (e) {
      console.error(e);
      setError(
        e?.response?.data?.message || "Gagal menyimpan perubahan pickup."
      );
    } finally {
      setSaving(false);
    }
  };

  if (!allowed) return null;

  return (
    <div
      className="min-h-screen px-4 py-8 flex flex-col items-center"
      style={{
        background:
          "linear-gradient(to bottom right, #406017, #527020, #334d12)",
      }}
    >
      {/* LOGO HEADER */}
      <div className="flex justify-center mb-6">
        <img
          src={LogoKAI}
          alt="Logo HUT KAI 80"
          className="h-20 w-auto drop-shadow-lg"
        />
      </div>

      {/* CARD FORM */}
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-6 md:p-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Edit Data Pickup
        </h1>

        {loading ? (
          <p className="text-gray-500 text-center">Memuat data...</p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
                {error}
              </div>
            )}

            {/* grid 2 kolom supaya compact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NIPP
                </label>
                <input
                  type="text"
                  value={nipp}
                  onChange={(e) => setNipp(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah Kuota
                </label>
                <input
                  type="number"
                  value={jumlahKuota}
                  onChange={(e) => setJumlahKuota(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Pengambilan
                </label>
                <select
                  value={jenisPengambilan}
                  onChange={(e) => setJenisPengambilan(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2"
                >
                  <option value="">-- Pilih --</option>
                  {JENIS_OPTIONS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pos Pengambilan
                </label>
                <select
                  value={posPengambilan}
                  onChange={(e) => setPosPengambilan(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2"
                >
                  <option value="">-- Pilih --</option>
                  {POS_OPTIONS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NIPP Penanggung Jawab
                </label>
                <input
                  type="text"
                  value={nippPj}
                  onChange={(e) => setNippPj(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Penanggung Jawab
                </label>
                <input
                  type="text"
                  value={namaPj}
                  onChange={(e) => setNamaPj(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-5 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl"
                disabled={saving}
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl"
                disabled={saving}
              >
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditPickupPage;
