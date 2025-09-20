import React, { useEffect, useMemo, useState } from "react";
import axios from "../api";
import { useNavigate } from "react-router-dom";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { io } from "socket.io-client";
import { ADMIN_NIPP, BASE_URL } from "../utils";

// =================================================================
// --- [BAGIAN BARU] Komponen Notifikasi & Konfirmasi Kustom ---
// =================================================================
const NotificationPopup = ({ show, message, type, onConfirm, onClose }) => {
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (show && (type === "success" || type === "error")) {
      const timer = setTimeout(() => {
        handleClose();
      }, 3000); // Otomatis hilang setelah 3 detik
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, type]);

  if (!show) return null;

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose();
      setClosing(false);
    }, 300); // Durasi animasi fade-out
  };

  const colors = {
    success: "from-green-500 to-emerald-600",
    error: "from-red-500 to-rose-600",
    confirm: "from-gray-700 to-gray-800",
  };

  const icons = {
    success: "✅",
    error: "❌",
    confirm: "🤔",
  };

  const animationClass = closing
    ? "opacity-0 scale-95"
    : "opacity-100 scale-100";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 overflow-hidden transform transition-all duration-300 ${animationClass}`}
      >
        <div
          className={`bg-gradient-to-r ${
            colors[type] || colors.confirm
          } px-6 py-4`}
        >
          <h3 className="text-xl font-bold text-white flex items-center gap-3">
            <span>{icons[type] || ""}</span>
            {type === "success" && "Berhasil"}
            {type === "error" && "Terjadi Kesalahan"}
            {type === "confirm" && "Konfirmasi Aksi"}
          </h3>
        </div>
        <div className="p-6">
          <p className="text-gray-700 text-center text-lg mb-6">{message}</p>
          <div className="flex justify-center gap-4">
            {type === "confirm" ? (
              <>
                <button
                  onClick={() => {
                    if (onConfirm) onConfirm();
                    handleClose();
                  }}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold shadow-md hover:scale-105 transition-transform"
                >
                  Ya, Lanjutkan
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-2 rounded-xl border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
                >
                  Batal
                </button>
              </>
            ) : (
              <button
                onClick={handleClose}
                className="px-8 py-2 rounded-xl bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold shadow-md hover:scale-105 transition-transform"
              >
                Tutup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// =================================================================
// --- Komponen Utama Anda ---
// =================================================================
const useAuthHeaders = () =>
  useMemo(() => {
    const token = localStorage.getItem("token");
    return { Authorization: `Bearer ${token}` };
  }, []);

const ADMIN_PASS = process.env.REACT_APP_ADMIN_PASSWORD; // kai123admin (di .env)

export default function AdminPrizePage() {
  const headers = useAuthHeaders();
  const navigate = useNavigate();

  // form tambah hadiah
  const [newId, setNewId] = useState("");
  const [newPrize, setNewPrize] = useState("");
  const [newKategori, setNewKategori] = useState("");

  const [loading, setLoading] = useState(false);
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  // data realtime via socket

  // --- Modal Set Pemenang
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [activePrize, setActivePrize] = useState(null); // {id, prize, ...}
  const [nippInput, setNippInput] = useState("");
  const [savingWinner, setSavingWinner] = useState(false);

  // --- Modal Edit Hadiah
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // row
  const [editInput, setEditInput] = useState("");
  const [editKategori, setEditKategori] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // --- Modal Admin Password (untuk hapus / kosongkan)
  const [adminModal, setAdminModal] = useState({
    open: false,
    action: null,
    id: null,
  });
  const [adminInput, setAdminInput] = useState("");
  const [adminError, setAdminError] = useState("");

  // --- [BAGIAN BARU] State & Helper untuk Notifikasi Kustom ---
  const [notification, setNotification] = useState({
    show: false,
    message: "",
    type: "success",
    onConfirm: null,
  });

  // --- Winner list (hanya yg sudah terdaftar di tabel winner)
  const [winnerList, setWinnerList] = useState([]);
  const [winnerLoading, setWinnerLoading] = useState(false);

  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("token");
    const nipp = localStorage.getItem("nipp");
    if (!token || !nipp) {
      navigate("/");
      return;
    }
    try {
      if (nipp !== ADMIN_NIPP) navigate("/");
      else setAllowed(true);
    } catch {
      navigate("/");
    }
  }, [navigate]);

  // mapping cepat: nipp -> status
  const winnerStatusMap = useMemo(() => {
    const map = new Map();
    for (const w of winnerList) {
      const nipp = String(w.winner || w.nipp || "").trim();
      const status = String(w.status || "").trim();
      if (nipp) map.set(nipp, status);
    }
    return map;
  }, [winnerList]);

  const fetchWinnerList = async () => {
    try {
      setWinnerLoading(true);
      const res = await axios.get("/winner", { headers });
      setWinnerList(res?.data?.data || []);
    } catch (e) {
      showError(e?.response?.data?.message || e.message);
    } finally {
      setWinnerLoading(false);
    }
  };

  const showSuccess = (message) =>
    setNotification({ show: true, message, type: "success" });
  const showError = (message) =>
    setNotification({ show: true, message, type: "error" });
  const showConfirm = (message, onConfirmCallback) =>
    setNotification({
      show: true,
      message,
      type: "confirm",
      onConfirm: onConfirmCallback,
    });
  const closeNotification = () =>
    setNotification({
      show: false,
      message: "",
      type: "success",
      onConfirm: null,
    });

  const exportExcelPrize = () => {
    if (!list || list.length === 0) return;

    const data = list.map((prize, index) => ({
      Id: prize.id,
      "Nama Hadiah": prize.prize,
      Kategori: prize.kategori,
      Pemenang: prize.pemenang,
      Status: prize.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Prize");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, "DataPrize.xlsx");
  };

  const fetchList = async () => {
    try {
      const res = await axios.get("/prize", { headers });
      setList(res?.data?.data || []);
    } catch (e) {
      showError(e?.response?.data?.message || e.message);
    }
  };

  useEffect(() => {
    const socket = io(BASE_URL);
    socket.on("PRIZE_UPDATE", (rows) => {
      setList(rows || []);
      setLoading(false);
    });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    fetchList();
    fetchWinnerList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddPrize = async (e) => {
    e.preventDefault();

    if (!newId?.trim() || !newPrize?.trim() || !newKategori?.trim()) {
      return showError("ID, Nama Hadiah, dan Kategori wajib diisi.");
    }

    // pastikan angka positif
    const idNum = Number(newId);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      return showError("ID harus berupa angka bulat positif.");
    }

    // cek duplikasi ID di list saat ini (cegah error BE)
    const duplicate = (list || []).some((x) => Number(x?.id) === idNum);
    if (duplicate) {
      return showError(`ID #${idNum} sudah ada. Gunakan ID lain.`);
    }

    setLoading(true);
    try {
      await axios.post(
        "/addprize",
        { id: idNum, prize: newPrize.trim(), kategori: newKategori.trim() }, // ⬅️ kirim id
        { headers }
      );
      setNewId("");
      setNewPrize("");
      setNewKategori("");
      await fetchList();
      showSuccess("Hadiah berhasil ditambahkan.");
    } catch (e) {
      showError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  // === Admin modal helpers ===
  const openAdminModal = (action, id) => {
    setAdminModal({ open: true, action, id });
    setAdminInput("");
    setAdminError("");
  };
  const closeAdminModal = () => {
    setAdminModal({ open: false, action: null, id: null });
    setAdminInput("");
    setAdminError("");
  };
  const submitAdminModal = async () => {
    if (!ADMIN_PASS) {
      showError("ENV REACT_APP_ADMIN_NIPP belum di-set.");
      return;
    }
    if (adminInput !== ADMIN_PASS) {
      setAdminError("Password admin salah.");
      return;
    }
    const { action, id } = adminModal;
    closeAdminModal();
    if (action === "delete") await performDelete(id);
    if (action === "clear") await performClearWinner(id);
  };

  const handleDelete = (id) => {
    showConfirm(
      `Yakin ingin menghapus hadiah ID #${id}? Aksi ini tidak dapat dibatalkan.`,
      () => openAdminModal("delete", id)
    );
  };
  const clearWinner = (id) => {
    showConfirm(
      `Yakin ingin mengosongkan pemenang untuk hadiah ID #${id}?`,
      () => openAdminModal("clear", id)
    );
  };

  // aksi asli setelah password benar
  const performDelete = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`/prize/${id}`, { headers });
      await fetchList();
      showSuccess("Hadiah dihapus.");
    } catch (e) {
      showError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  };

  const performClearWinner = async (id) => {
    setLoading(true);
    try {
      await axios.patch(`/winnergugur/${id}`, {}, { headers });
      await fetchList();
      showSuccess("Pemenang dikosongkan.");
    } catch (e) {
      showError(e?.response?.data?.message || e.message);
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
    const nipp = String(nippInput || "").trim();
    if (!nipp) return showError("NIPP pemenang wajib diisi.");

    // validasi: nipp harus ada di tabel winner
    const inWinner = winnerList.find(
      (w) => String(w.winner || w.nipp || "").trim() === nipp
    );
    if (!inWinner) {
      return showError(
        "NIPP tidak terdaftar di tabel winner. Tambahkan di halaman Input Pemenang terlebih dahulu."
      );
    }

    const statusFromWinner = String(inWinner.status || "Belum Verifikasi");

    setSavingWinner(true);
    try {
      // 1) set pemenang ke hadiah
      await axios.patch(
        `/addwinner/${activePrize.id}`,
        { winner: nipp },
        { headers }
      );

      // 2) sinkron status hadiah ke status winner -> SEKARANG HARUS sertakan nipp
      await axios.patch(
        `/changestatus/${activePrize.id}`,
        { status: statusFromWinner, nipp }, // <— tambah nipp di sini
        { headers }
      );

      await fetchList();
      showSuccess(`Pemenang diset ke ${nipp} (status: ${statusFromWinner}).`);
      closeWinnerModal();
    } catch (e) {
      showError(e?.response?.data?.message || e.message);
    } finally {
      setSavingWinner(false);
    }
  };

  // --- Aksi Edit via Modal
  const openEditModal = (row) => {
    setEditTarget(row);
    setEditInput(row.prize || "");
    setEditKategori(row.kategori || "");
    setShowEditModal(true);
  };
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditTarget(null);
    setEditInput("");
    setEditKategori("");
  };
  const submitEdit = async () => {
    if (!editTarget?.id) return;
    if (!editInput?.trim() || !editKategori?.trim())
      return showError("Nama hadiah dan kategori wajib diisi.");
    if (
      editInput.trim() === (editTarget.prize || "") &&
      editKategori.trim() === (editTarget.kategori || "")
    ) {
      return closeEditModal();
    }
    setSavingEdit(true);
    try {
      await axios.patch(
        `/prize/${editTarget.id}`,
        { prize: editInput.trim(), kategori: editKategori.trim() },
        { headers }
      );
      await fetchList();
      showSuccess("Hadiah berhasil diubah.");
      closeEditModal();
    } catch (e) {
      showError(e?.response?.data?.message || e.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // Filter pencarian
  const filtered = list.filter(
    (x) =>
      String(x.id).toLowerCase().includes(q.toLowerCase()) ||
      (x.prize || "").toLowerCase().includes(q.toLowerCase()) ||
      (x.kategori || "").toLowerCase().includes(q.toLowerCase()) ||
      (x.pemenang || "").toLowerCase().includes(q.toLowerCase()) ||
      (x.status || "").toLowerCase().includes(q.toLowerCase())
  );

  // Urutkan berdasarkan ID
  const ordered = [...filtered].sort((a, b) => {
    const aid = Number(a?.id) || 0;
    const bid = Number(b?.id) || 0;
    return aid - bid;
  });

  // Stats
  const winnersCount = filtered.filter((x) => x.pemenang).length;
  const totalPrizes = filtered.length;

  const statusBadge = (sRaw) => {
    const s = String(sRaw || "").toLowerCase();
    if (s.includes("verifikasi"))
      return "bg-gradient-to-r from-yellow-500 to-amber-500 text-white";
    if (s === "gugur")
      return "bg-gradient-to-r from-red-500 to-red-600 text-white";
    if (s.includes("diambil"))
      return "bg-gradient-to-r from-green-500 to-emerald-500 text-white";
    return "bg-gray-300 text-gray-700";
  };

  if (!allowed) return null;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-green-700 via-green-800 to-green-900"
      style={{ backgroundColor: "#406017" }}
    >
      <NotificationPopup
        show={notification.show}
        message={notification.message}
        type={notification.type}
        onConfirm={notification.onConfirm}
        onClose={closeNotification}
      />

      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center py-8">
          <div className="mb-4 inline-flex items-center justify-center w-20 h-20">
            <img
              src={LogoKAI}
              alt="Logo HUT KAI 80"
              className="h-16 md:h-20 w-auto drop-shadow-lg"
            />
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
            Admin Hadiah
          </h1>
        </div>

        {/* Nav */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <button
            onClick={() => navigate("/winnerinput")}
            className="px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl shadow-xl transition-all duration-300 hover:shadow-2xl transform hover:scale-105 text-lg font-semibold border-2 border-white/20 backdrop-blur-sm"
          >
            Input Pemenang Undian
          </button>
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-2xl border border-white/20">
            <p className="text-blue-100 text-sm font-medium">Total Hadiah</p>
            <p className="text-3xl font-bold text-white">{totalPrizes}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 shadow-2xl border border-white/20">
            <p className="text-green-100 text-sm font-medium">Sudah Terpilih</p>
            <p className="text-3xl font-bold text-white">{winnersCount}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 shadow-2xl border border-white/20">
            <p className="text-orange-100 text-sm font-medium">Menunggu</p>
            <p className="text-3xl font-bold text-white">
              {totalPrizes - winnersCount}
            </p>
          </div>
        </div>

        {/* Tambah Hadiah */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Tambah Hadiah Baru
            </h2>
          </div>
          <form onSubmit={handleAddPrize} className="p-6">
            {/* ubah ke 4 kolom di layar md ke atas */}
            <div className="grid gap-4 md:grid-cols-4 items-end">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ID Hadiah
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  className="w-full border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 p-3 rounded-xl"
                  placeholder="Masukkan ID, contoh: 101"
                  value={newId}
                  onChange={(e) => {
                    // opsional: hanya digit
                    const val = e.target.value.replace(/[^\d]/g, "");
                    setNewId(val);
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Hadiah
                </label>
                <input
                  className="w-full border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 p-3 rounded-xl"
                  placeholder="Masukkan nama hadiah..."
                  value={newPrize}
                  onChange={(e) => setNewPrize(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kategori Hadiah
                </label>
                <input
                  className="w-full border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 p-3 rounded-xl"
                  placeholder="Masukkan kategori hadiah..."
                  value={newKategori}
                  onChange={(e) => setNewKategori(e.target.value)}
                />
              </div>

              <button
                disabled={loading}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl px-6 py-3 font-semibold shadow-lg disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : "➕ Tambah Hadiah"}
              </button>
            </div>
          </form>
        </div>

        {/* Search */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-xl font-bold text-white">Pencarian & Filter</h2>
            <input
              className="border-2 border-white/30 focus:border-white focus:ring-2 focus:ring-white/50 p-3 rounded-xl bg-white/90 min-w-[300px] text-sm"
              placeholder="🔍 Cari.."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>

        {/* List Hadiah */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <h2 className="text-2xl font-bold text-white">
              Daftar Lengkap Hadiah ({ordered.length} dari {list.length})
            </h2>
            <button
              onClick={exportExcelPrize}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 text-sm font-semibold flex items-center gap-2"
            >
              Export Data Hadiah ke Excel (.xlsx)
            </button>
          </div>

          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto rounded-b-2xl">
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
                    Kategori
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
                    className={`transition-all duration-300 hover:bg-green-50/70 ${
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
                      <p className="text-gray-900 font-semibold text-lg">
                        {row.prize}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                        {row.kategori || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {row.pemenang ? (
                        <span className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                          {row.pemenang}
                        </span>
                      ) : (
                        <span className="bg-gray-300 text-gray-600 px-4 py-2 rounded-full text-sm font-medium">
                          Menunggu Undian
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg ${statusBadge(
                          row.status
                        )}`}
                      >
                        {row.status || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openWinnerModal(row)}
                          className="px-3 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-semibold shadow-md"
                          disabled={loading}
                          title={
                            row.pemenang ? "Ubah Pemenang" : "Set Pemenang"
                          }
                        >
                          {row.pemenang ? "Ubah" : "Set"}
                        </button>
                        <button
                          onClick={() => openEditModal(row)}
                          className="px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-semibold shadow-md"
                          disabled={loading}
                          title="Edit hadiah & kategori"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => clearWinner(row.id)}
                          className="px-3 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-semibold shadow-md"
                          disabled={loading}
                          title="Kosongkan pemenang"
                        >
                          Clear
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          className="px-3 py-1 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-semibold shadow-md"
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
                    <td
                      colSpan="6"
                      className="px-6 py-16 text-center text-gray-500"
                    >
                      Tidak ada data ditemukan.
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
                <h3 className="text-xl font-bold text-white">
                  {activePrize?.pemenang
                    ? "✏️ Ubah Pemenang"
                    : "👤 Set Pemenang"}
                </h3>
              </div>
              <div className="p-6">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-700 mb-1">
                    <b>Hadiah:</b> {activePrize?.prize}
                  </p>
                  <p className="text-sm text-gray-600">
                    <b>ID:</b> #{activePrize?.id}
                  </p>
                </div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pilih NIPP Pemenang (dari tabel winner)
                </label>

                {/* input pencarian */}
                <input
                  className="w-full border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 p-3 rounded-xl mb-2"
                  placeholder="Ketik untuk mencari NIPP…"
                  value={nippInput}
                  onChange={(e) => setNippInput(e.target.value)}
                  autoFocus
                />

                {/* preview status dari winner terpilih */}
                {nippInput?.trim() && (
                  <div className="mb-4 text-sm text-gray-700">
                    Status di tabel winner:{" "}
                    <b>
                      {winnerStatusMap.get(nippInput.trim()) ||
                        "Belum Verifikasi"}
                    </b>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    onClick={closeWinnerModal}
                    className="px-6 py-2 rounded-xl border-2 border-gray-300 font-semibold"
                  >
                    ❌ Batal
                  </button>
                  <button
                    onClick={submitWinner}
                    disabled={savingWinner}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold disabled:opacity-50"
                  >
                    {savingWinner ? "Menyimpan..." : "💾 Simpan"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- Modal Edit Hadiah & Kategori --- */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeEditModal}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden border border-white/30">
              <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-6 py-4">
                <h3 className="text-xl font-bold text-white">📝 Edit Hadiah</h3>
              </div>
              <div className="p-6">
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-700">
                    <b>ID Hadiah:</b> #{editTarget?.id}
                  </p>
                </div>

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Hadiah Baru
                </label>
                <input
                  className="w-full border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-3 rounded-xl mb-4"
                  placeholder="Masukkan nama hadiah baru..."
                  value={editInput}
                  onChange={(e) => setEditInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitEdit()}
                  autoFocus
                />

                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Kategori Hadiah Baru
                </label>
                <input
                  className="w-full border-2 border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 p-3 rounded-xl mb-6"
                  placeholder="Masukkan kategori baru..."
                  value={editKategori}
                  onChange={(e) => setEditKategori(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitEdit()}
                />

                <div className="flex justify-end gap-3">
                  <button
                    onClick={closeEditModal}
                    className="px-6 py-2 rounded-xl border-2 border-gray-300 font-semibold"
                  >
                    ❌ Batal
                  </button>
                  <button
                    onClick={submitEdit}
                    disabled={savingEdit}
                    className="px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 text-white font-semibold disabled:opacity-50"
                  >
                    {savingEdit ? "Menyimpan..." : "💾 Simpan"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- Modal Password Admin (hapus/kosongkan) --- */}
        {adminModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeAdminModal}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm z-10 overflow-hidden border border-white/30">
              <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
                <h3 className="text-lg font-bold text-white">
                  Konfirmasi Admin (
                  {adminModal.action === "delete"
                    ? "Hapus Hadiah"
                    : "Kosongkan Pemenang"}
                  )
                </h3>
              </div>
              <div className="p-6 space-y-3">
                <p className="text-sm text-gray-700">
                  Masukkan password admin untuk melanjutkan aksi{" "}
                  <b>{adminModal.action}</b>.
                </p>
                <input
                  type="password"
                  className="w-full border-2 border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 p-3 rounded-xl"
                  placeholder="Password admin"
                  value={adminInput}
                  onChange={(e) => {
                    setAdminInput(e.target.value);
                    setAdminError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && submitAdminModal()}
                  autoFocus
                />
                {adminError && (
                  <p className="text-sm text-red-600">{adminError}</p>
                )}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={closeAdminModal}
                    className="px-4 py-2 rounded-xl border-2 border-gray-300 font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    onClick={submitAdminModal}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold"
                  >
                    Lanjutkan
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
