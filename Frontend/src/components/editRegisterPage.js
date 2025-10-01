import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ADMIN_NIPP } from "../utils";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";
import api from "../api";

const TRANSPORTASI_OPTIONS = ["kendaraan pribadi", "kendaraan umum / online"];
const LOKASI_OPTIONS = [
  "purworejo",
  "DI Yogyakarta",
  "klaten",
  "surakarta",
  "sragen",
  "wonogiri",
  "magelang",
];

export default function EditRegisterPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const nippParam = state?.nipp;

  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // form state
  const [anggota, setAnggota] = useState([]);
  const [transportasi, setTransportasi] = useState("");
  const [keberangkatan, setKeberangkatan] = useState("");

  // guard admin
  useEffect(() => {
    const token = localStorage.getItem("token");
    const nippLogin = localStorage.getItem("nipp");
    if (!token || !nippLogin) return navigate("/");
    if (nippLogin !== ADMIN_NIPP) return navigate("/");
    if (!nippParam) return navigate("/admindesk");
    setAllowed(true);
  }, [navigate, nippParam]);

  // load data awal
  useEffect(() => {
    if (!allowed || !nippParam) return;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`/order/${nippParam}`);
        const data = res?.data?.data;
        setAnggota(Array.isArray(data?.nama) ? data.nama : []);
        setTransportasi(data?.transportasi ?? "");
        setKeberangkatan(data?.keberangkatan ?? "");
      } catch (e) {
        console.error(e);
        setError("Gagal memuat data order.");
      } finally {
        setLoading(false);
      }
    })();
  }, [allowed, nippParam]);

  // edit inline nama anggota
  const updateAnggota = (idx, val) =>
    setAnggota((prev) => prev.map((v, i) => (i === idx ? val : v)));

  const onSubmit = async (e) => {
    e.preventDefault();
    const cleaned = anggota.map((x) => x.trim()).filter((x) => x.length > 0);
    if (cleaned.length === 0) return setError("Minimal 1 anggota harus diisi.");
    if (!transportasi) return setError("Transportasi wajib dipilih.");
    if (!keberangkatan) return setError("Keberangkatan wajib dipilih.");

    setSaving(true);
    setError("");
    try {
      // PUT /order/:nipp
      await api.put(`/order/${nippParam}`, {
        nama: cleaned,
        transportasi,
        keberangkatan,
      });
      navigate("/detailregister", { state: { nipp: nippParam } });
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  if (!allowed) return null;

  return (
    <div
      className="min-h-screen px-4 py-8"
      style={{
        background:
          "linear-gradient(to bottom right, #406017, #527020, #334d12)",
      }}
    >
      <div className="max-w-3xl mx-auto">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src={LogoKAI}
            alt="Logo HUT KAI 80"
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
              Edit Registrasi
            </h1>
            <span className="text-sm text-gray-500">
              NIPP: <b>{nippParam}</b>
            </span>
          </div>

          {loading ? (
            <p className="text-gray-500">Memuat data...</p>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
                  {error}
                </div>
              )}

              {/* NIPP (readonly) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  NIPP
                </label>
                <input
                  type="text"
                  value={nippParam}
                  readOnly
                  className="w-full border-2 border-gray-200 bg-gray-100 rounded-xl px-4 py-2 text-gray-600 cursor-not-allowed"
                />
              </div>

              {/* Anggota */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anggota Keluarga
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {anggota.map((nm, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={nm}
                      onChange={(e) => {
                        if (idx !== 0) updateAnggota(idx, e.target.value); // hanya bisa edit selain index 0
                      }}
                      readOnly={idx === 0} // anggota pertama tidak bisa diubah
                      className={`w-full border-2 rounded-xl px-4 py-2 focus:ring-2 ${
                        idx === 0
                          ? "bg-gray-100 border-gray-200 text-gray-600 cursor-not-allowed"
                          : "border-gray-200 focus:ring-green-500 focus:border-green-500"
                      }`}
                      placeholder={`Nama anggota #${idx + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Transportasi & Keberangkatan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transportasi
                  </label>
                  <select
                    value={transportasi}
                    onChange={(e) => setTransportasi(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">-- Pilih --</option>
                    {TRANSPORTASI_OPTIONS.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Keberangkatan
                  </label>
                  <select
                    value={keberangkatan}
                    onChange={(e) => setKeberangkatan(e.target.value)}
                    className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">-- Pilih --</option>
                    {LOKASI_OPTIONS.map((x) => (
                      <option key={x} value={x}>
                        {x}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Actions */}
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
    </div>
  );
}
