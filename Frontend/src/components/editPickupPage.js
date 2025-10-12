import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";
import api from "../api";
import { getUserRole } from "../getUserRole";

const JENIS_OPTIONS = ["INDIVIDU", "KOLEKTIF"];
const POS_OPTIONS = ["POS 1", "POS 2", "POS 3", "POS 4"];

// ===== Modal konfirmasi hapus (simple, in-file) =====
const DeleteConfirm = ({ open, onClose, onConfirm, loading }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full mx-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-100">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Hapus Data Pickup?
        </h3>
        <p className="text-gray-600 mb-6">
          Tindakan ini akan menghapus data pickup untuk NIPP ini. Lanjutkan?
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="w-full px-5 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl"
            disabled={loading}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="w-full px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl"
            disabled={loading}
          >
            {loading ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
};

const EditPickupPage = () => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const nippAwal = state?.nipp;
  const role = getUserRole();

  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false); // NEW
  const [showDelete, setShowDelete] = useState(false); // NEW
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
    const nipp = localStorage.getItem("nipp");
    if (!token || !nipp) {
      navigate("/");
      return;
    }
    try {
      if (!role === "superadmin" || !role === "admin") navigate("/");
      if (!nippAwal) navigate("/admindesk");
      else setAllowed(true);
    } catch {
      navigate("/");
    }
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
        // nipp, nama, jumlah_kuota tidak ikut diubah (readOnly)
        jenis_pengambilan: jenisPengambilan,
        pos_pengambilan: posPengambilan,
        nipp_pj: jenisPengambilan === "KOLEKTIF" ? nippPj : "",
        nama_pj: jenisPengambilan === "KOLEKTIF" ? namaPj : "",
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

  // NEW: handler hapus
  const onDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      await api.delete(`/pickup/${nippAwal}`);
      navigate("/admindesk", { state: { focus: "pickup" } });
    } catch (e) {
      console.error(e);
      // anggap 404 sebagai sukses (data sudah tidak ada)
      if (e?.response?.status === 404) {
        navigate("/admindesk", { state: { focus: "pickup" } });
      } else {
        setError(e?.response?.data?.message || "Gagal menghapus data pickup.");
      }
    } finally {
      setDeleting(false);
      setShowDelete(false);
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* NIPP */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NIPP
                </label>
                <input
                  type="text"
                  value={nipp}
                  readOnly
                  className="w-full border-2 border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed rounded-xl px-4 py-2"
                />
              </div>

              {/* Nama */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama
                </label>
                <input
                  type="text"
                  value={nama}
                  readOnly
                  className="w-full border-2 border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed rounded-xl px-4 py-2"
                />
              </div>

              {/* Jumlah Kuota */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah Kuota
                </label>
                <input
                  type="number"
                  value={jumlahKuota}
                  readOnly
                  className="w-full border-2 border-gray-200 bg-gray-100 text-gray-600 cursor-not-allowed rounded-xl px-4 py-2"
                />
              </div>

              {/* Jenis Pengambilan */}
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

              {/* Pos Pengambilan */}
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

              {/* PJ (hanya KOLEKTIF) */}
              {jenisPengambilan === "KOLEKTIF" && (
                <>
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
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-5 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl"
                disabled={saving || deleting}
              >
                Batal
              </button>

              {/* NEW: tombol hapus */}
              <button
                type="button"
                onClick={() => setShowDelete(true)}
                className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl"
                disabled={saving || deleting}
              >
                {deleting ? "Menghapus..." : "Hapus"}
              </button>

              <button
                type="submit"
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl"
                disabled={saving || deleting}
              >
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* NEW: modal konfirmasi hapus */}
      <DeleteConfirm
        open={showDelete}
        onClose={() => setShowDelete(false)}
        onConfirm={onDelete}
        loading={deleting}
      />
    </div>
  );
};

export default EditPickupPage;
