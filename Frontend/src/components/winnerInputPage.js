import React, { useEffect, useMemo, useState } from "react";
import axios from "../api";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";
import { useNavigate } from "react-router-dom";
import { ADMIN_NIPP } from "../utils";

const useAuthHeaders = () =>
  useMemo(() => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  }, []);

// === Password admin dari env
const ADMIN_PASS = process.env.REACT_APP_ADMIN_PASSWORD;

// helper warna badge status
const badgeClass = (raw) => {
  const s = String(raw || "").toLowerCase();
  if (s === "diambil di tempat" || s === "diambil di daop")
    return "bg-green-600 text-white";
  if (s === "gugur") return "bg-red-600 text-white";
  if (s.includes("verifikasi")) return "bg-amber-500 text-white"; // Belum Verifikasi
  return "bg-gray-400 text-white";
};

/** Popup sederhana (OK) */
function Popup({ show, onClose, title, message, type = "success" }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden border border-white/30">
        <div
          className={`px-6 py-4 ${
            type === "error"
              ? "bg-gradient-to-r from-red-600 to-red-700"
              : "bg-gradient-to-r from-emerald-600 to-green-700"
          }`}
        >
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">{type === "error" ? "❌" : "✅"}</span>
            {title}
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <p className="text-gray-700 text-base leading-relaxed">{message}</p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className={`px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-white ${
                type === "error"
                  ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                  : "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700"
              }`}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Modal Edit Winner — HANYA NIPP */
function EditWinnerModal({
  show,
  onClose,
  onSubmit,
  initialNipp = "",
  saving = false,
}) {
  const [nipp, setNipp] = useState(initialNipp);

  useEffect(() => {
    setNipp(initialNipp);
  }, [initialNipp]);

  if (!show) return null;

  const newNipp = String(nipp || "").trim();
  const canSave = newNipp.length > 0 && newNipp !== String(initialNipp || "").trim();

  const submit = () => {
    if (!canSave) return;
    onSubmit({ nipp: newNipp });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden border border-white/30">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-4">
          <h3 className="text-xl font-bold text-white">✏️ Edit NIPP Pemenang</h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              NIPP Baru
            </label>
            <input
              className="w-full border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-3 rounded-xl"
              placeholder="Masukkan NIPP baru…"
              value={nipp}
              onChange={(e) => setNipp(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-500">
              Sistem akan memeriksa apakah NIPP baru ada di tabel orders dan belum dipakai di winners.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl border-2 border-gray-300 font-semibold"
            >
              ❌ Batal
            </button>
            <button
              onClick={submit}
              disabled={saving || !canSave}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-semibold disabled:opacity-50"
            >
              {saving ? "Menyimpan..." : "💾 Simpan"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Modal Password Admin */
function AdminPasswordModal({ show, actionLabel = "Aksi", onClose, onVerified }) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (show) {
      setVal("");
      setErr("");
    }
  }, [show]);

  if (!show) return null;

  const submit = () => {
    if (!ADMIN_PASS) {
      setErr("ENV REACT_APP_ADMIN_PASSWORD belum di-set.");
      return;
    }
    if (val !== ADMIN_PASS) {
      setErr("Password admin salah.");
      return;
    }
    onVerified?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 overflow-hidden border border-white/30">
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
          <h3 className="text-lg font-bold text-white">Konfirmasi Admin ({actionLabel})</h3>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-sm text-gray-700">
            Masukkan password admin untuk melanjutkan <b>{actionLabel}</b>.
          </p>
          <input
            type="password"
            className="w-full border-2 border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 p-3 rounded-xl"
            placeholder="Password admin"
            value={val}
            onChange={(e) => {
              setVal(e.target.value);
              setErr("");
            }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            autoFocus
          />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border-2 border-gray-300 font-semibold"
            >
              Batal
            </button>
            <button
              onClick={submit}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold"
            >
              Lanjutkan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WinnerInputPage() {
  const navigate = useNavigate();
  const headers = useAuthHeaders();

  const [nipp, setNipp] = useState("");
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const [allowed, setAllowed] = useState(false);

  // popup
  const [popup, setPopup] = useState({
    show: false,
    title: "",
    message: "",
    type: "success",
  });
  const showPopup = (title, message, type = "success") =>
    setPopup({ show: true, title, message, type });

  // modal edit
  const [showEdit, setShowEdit] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editOriginalNipp, setEditOriginalNipp] = useState("");

  // modal password admin
  const [adminModal, setAdminModal] = useState({
    open: false,
    action: null,      // 'edit' | 'delete'
    payload: null,     // row (untuk edit) atau nipp (untuk delete)
  });

  // Auth guard (ADMIN_NIPP)
  useEffect(() => {
    const token = localStorage.getItem("token");
    const nippLocal = localStorage.getItem("nipp");
    if (!token || !nippLocal) {
      navigate("/");
      return;
    }
    try {
      if (nippLocal !== ADMIN_NIPP) navigate("/");
      else setAllowed(true);
    } catch {
      navigate("/");
    }
  }, [navigate]);

  const fetchWinners = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/winner", { headers });
      setList(res?.data?.data || []);
    } catch (e) {
      showPopup(
        "Terjadi Kesalahan",
        e?.response?.data?.message || e.message,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWinners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tambah winner
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!nipp?.trim())
      return showPopup("Peringatan", "Masukkan NIPP pemenang.", "error");
    try {
      setLoading(true);
      await axios.post("/winner", { winner: nipp.trim() }, { headers }); // BE set status default
      setNipp("");
      await fetchWinners();
      showPopup(
        "Berhasil",
        "Pemenang berhasil ditambahkan (status: Belum Verifikasi).",
        "success"
      );
    } catch (e) {
      showPopup(
        "Terjadi Kesalahan",
        e?.response?.data?.message || e.message,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // ==== Admin password flow
  const requireAdmin = (action, payload) => {
    setAdminModal({ open: true, action, payload });
  };
  const closeAdminModal = () => {
    setAdminModal({ open: false, action: null, payload: null });
  };
  const onAdminVerified = () => {
    const { action, payload } = adminModal;
    closeAdminModal();
    if (action === "edit") {
      // buka modal edit setelah password benar
      const currentNipp = String(payload?.nipp ?? payload?.winner ?? "");
      setEditOriginalNipp(currentNipp);
      setShowEdit(true);
    }
    if (action === "delete") {
      performDelete(String(payload));
    }
  };

  // Submit edit -> PUT /winner/:nipp { nippchange }
  const submitEdit = async ({ nipp: newNipp }) => {
    if (!editOriginalNipp) return;
    const trimmed = String(newNipp || "").trim();
    if (!trimmed) return showPopup("Peringatan", "NIPP baru tidak boleh kosong.", "error");
    if (trimmed === String(editOriginalNipp || "").trim()) {
      setShowEdit(false);
      return;
    }
    try {
      setSavingEdit(true);
      await axios.put(
        `/winner/${encodeURIComponent(editOriginalNipp)}`,
        { nippchange: trimmed },
        { headers }
      );
      await fetchWinners();
      showPopup(
        "Berhasil",
        `NIPP ${editOriginalNipp} diperbarui menjadi ${trimmed}.`,
        "success"
      );
      setShowEdit(false);
    } catch (e) {
      // BE kirim error kalau NIPP baru tidak ada di orders / sudah dipakai di winners
      showPopup(
        "Terjadi Kesalahan",
        e?.response?.data?.message || e.message,
        "error"
      );
    } finally {
      setSavingEdit(false);
    }
  };

  // Hapus winner -> DELETE /winner/:nipp (dipanggil setelah password benar)
  const performDelete = async (nippToDelete) => {
    const ok = window.confirm(`Hapus pemenang dengan NIPP ${nippToDelete}?`);
    if (!ok) return;
    try {
      setLoading(true);
      await axios.delete(`/winner/${encodeURIComponent(nippToDelete)}`, {
        headers,
      });
      await fetchWinners();
      showPopup(
        "Berhasil",
        `Pemenang ${nippToDelete} telah dihapus.`,
        "success"
      );
    } catch (e) {
      showPopup(
        "Terjadi Kesalahan",
        e?.response?.data?.message || e.message,
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // jumlah unik NIPP
  const totalNipp = useMemo(() => {
    const set = new Set();
    for (const w of list) {
      const id = String(w.nipp ?? w.winner ?? "").trim();
      if (id) set.add(id);
    }
    return set.size;
  }, [list]);

  // filter table
  const filtered = list.filter((w) => {
    const s = q.toLowerCase();
    return (
      String(w.nipp || w.winner || "").toLowerCase().includes(s) ||
      String(w.status || "").toLowerCase().includes(s)
    );
  });

  if (!allowed) return null;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-green-700 via-green-800 to-green-900"
      style={{ backgroundColor: "#406017" }}
    >
      <div className="p-6 space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center py-8">
          <div className="mb-4 inline-flex items-center justify-center w-20 h-20">
            <img
              src={LogoKAI}
              alt="Logo HUT KAI 80"
              className="h-16 md:h-20 w-auto drop-shadow-lg"
            />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
            Input Pemenang Undian
          </h1>

          <button
            onClick={() => navigate("/winnerdisplay")}
            className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-700 hover:from-yellow-700 hover:to-orange-800 text-white rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 text-sm md:text-base font-medium"
          >
            Lihat Pemenang Undian
          </button>
        </div>

        {/* Form Tambah */}
        <div className="bg-white/95 rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <h2 className="text-xl font-bold text-white">Tambah Pemenang</h2>
          </div>
          <form
            onSubmit={handleAdd}
            className="p-6 grid md:grid-cols-[1fr_auto] gap-3"
          >
            <input
              className="border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 p-3 rounded-xl bg-white/80"
              placeholder="Masukkan NIPP pemenang…"
              value={nipp}
              onChange={(e) => setNipp(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd(e)}
            />
            <button
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {loading ? "Menyimpan…" : "➕ Tambah"}
            </button>
          </form>
        </div>

        {/* Pencarian & Tabel Winners */}
        <div className="bg-white/95 rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
            <h2 className="text-xl font-bold text-white uppercase">
              DAFTAR PEMENANG ({totalNipp})
            </h2>
            <input
              className="border-2 border-white/30 focus:border-white focus:ring-2 focus:ring-white/50 p-3 rounded-xl bg-white/90 min-w-[280px]"
              placeholder="🔍 Cari NIPP / status…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <div className="max-h-[60vh] overflow-y-auto rounded-b-2xl">
              <table className="w-full">
                <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-sm z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b">
                      NIPP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/60 divide-y divide-gray-200">
                  {filtered.length ? (
                    filtered.map((w, i) => {
                      const nippVal = w.nipp ?? w.winner;
                      return (
                        <tr
                          key={String(nippVal) + i}
                          className={i % 2 ? "bg-gray-50/40" : "bg-white/40"}
                        >
                          <td className="px-6 py-3 font-semibold">{nippVal}</td>
                          <td className="px-6 py-3">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${badgeClass(
                                w.status
                              )}`}
                            >
                              {w.status || "-"}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => requireAdmin("edit", w)}
                                className="px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold shadow-md"
                                title="Edit NIPP"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => requireAdmin("delete", String(nippVal))}
                                className="px-3 py-1 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-semibold shadow-md"
                                title="Hapus pemenang"
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="3"
                        className="px-6 py-10 text-center text-gray-500"
                      >
                        Belum ada data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Popup */}
      <Popup
        show={popup.show}
        onClose={() => setPopup({ ...popup, show: false })}
        title={popup.title}
        message={popup.message}
        type={popup.type}
      />

      {/* Modal Edit NIPP */}
      <EditWinnerModal
        show={showEdit}
        onClose={() => setShowEdit(false)}
        onSubmit={submitEdit}
        initialNipp={editOriginalNipp}
        saving={savingEdit}
      />

      {/* Modal Password Admin */}
      <AdminPasswordModal
        show={adminModal.open}
        actionLabel={adminModal.action === "edit" ? "Edit Pemenang" : "Hapus Pemenang"}
        onClose={closeAdminModal}
        onVerified={onAdminVerified}
      />
    </div>
  );
}
