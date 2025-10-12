import React, { useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";

// ====================================================================
// KOMPONEN MODAL NOTIFIKASI (SUKSES/ERROR/PERINGATAN/INFO)
// ====================================================================
const ModalIcon = ({ type }) => {
  const base =
    "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4";
  if (type === "success")
    return (
      <div className={`${base} bg-green-100`}>
        <svg
          className="w-8 h-8 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
    );
  if (type === "error")
    return (
      <div className={`${base} bg-red-100`}>
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
    );
  if (type === "warning")
    return (
      <div className={`${base} bg-yellow-100`}>
        <svg
          className="w-8 h-8 text-yellow-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
    );
  return null;
};

const Modal = ({ isOpen, onClose, title, message, type = "info" }) => {
  useEffect(() => {
    const onEsc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  if (!isOpen) return null;

  const btn =
    type === "success"
      ? "bg-green-600 hover:bg-green-700 focus:ring-green-500"
      : type === "error"
      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
      : type === "warning"
      ? "bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500"
      : "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full mx-4">
        <ModalIcon type={type} />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <button
          onClick={onClose}
          className={`w-full inline-flex justify-center rounded-xl px-6 py-3 text-base font-semibold text-white shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-transform hover:scale-105 ${btn}`}
        >
          Mengerti
        </button>
      </div>
    </div>
  );
};

// ====================================================================
// KOMPONEN MODAL KONFIRMASI
// ====================================================================
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full mx-4">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 bg-blue-100">
          <svg
            className="w-8 h-8 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
        <div className="text-gray-600 mb-8">{children}</div>
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-200 text-gray-800 font-semibold rounded-xl hover:bg-gray-300 transition-all"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all"
          >
            Ya, Yakin
          </button>
        </div>
      </div>
    </div>
  );
};

// ===== Konstanta =====
const STATUS_HADIR = "hadir";
const STATUS_TIDAK = "tidak hadir";
const LOKASI_OPTIONS = [
  "purworejo",
  "DI Yogyakarta",
  "klaten",
  "surakarta",
  "sragen",
  "wonogiri",
  "magelang",
];
const TRANSPORTASI_OPTIONS = ["kendaraan pribadi", "kendaraan umum / online"];

const EditRegisterPage = () => {
  const location = useLocation();
  const nipp = location.state?.nipp;
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [userFromUsers, setUserFromUsers] = useState(null);

  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [statusHadir, setStatusHadir] = useState(STATUS_HADIR);

  const [lokasi, setLokasi] = useState("");
  const [transportasi, setTransportasi] = useState("");

  const [quota, setQuota] = useState(0);
  const [quotaTotal, setQuotaTotal] = useState(0);
  const [sisaPenetapan, setSisaPenetapan] = useState(0);
  const [sisaPenetapanTemp, setSisaPenetapanTemp] = useState(0);
  const [basePrefillCount, setBasePrefillCount] = useState(0);

  const [modalInfo, setModalInfo] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    try {
      jwtDecode(token);
      setIsDataLoaded(true);
    } catch {
      localStorage.removeItem("token");
      navigate("/");
    }
  }, [navigate]);

  // Ambil user + prefill order (tanpa mengunci UI)
  useEffect(() => {
    if (!isDataLoaded || !nipp) return;
    const loadData = async () => {
      try {
        // 1) Ambil data user pegawai
        const userRes = await api.get(`/users/${nipp}`);
        const userData = userRes.data.data;
        const pegawaiName = userData.nama?.trim() || "";
        const sisa = Number(userData.penetapan ?? 0);
        setSisaPenetapan(sisa);

        // 2) Ambil order untuk PREFILL (jika ada)
        let orderData = {};
        try {
          const orderRes = await api.get(`/order/${nipp}`);
          orderData = orderRes.data.data || {};
        } catch (err) {
          if (!(err.response && err.response.status === 404)) throw err;
        }

        const orderNames = Array.isArray(orderData.nama) ? orderData.nama : [];

        // Status hadir default: jika nama pertama = pegawai → hadir
        if (
          orderNames.length > 0 &&
          orderNames[0]?.trim()?.toLowerCase() === pegawaiName.toLowerCase()
        ) {
          setStatusHadir(STATUS_HADIR);
        } else {
          setStatusHadir(STATUS_TIDAK);
        }

        setLokasi(orderData.keberangkatan || "");
        setTransportasi(orderData.transportasi || "");

        // 3) Susun daftar anggota
        const prefills = orderNames
          .filter(
            (nm) => nm && nm.trim().toLowerCase() !== pegawaiName.toLowerCase()
          )
          .map((nm, i) => ({
            id: `prefill-${i}`,
            name: nm,
            fromUser: false,
            source: "prefill",
          }));

        setMembers([
          { id: "user-main", name: pegawaiName, fromUser: true },
          ...prefills,
        ]);
        setUserFromUsers({
          id: "user-main",
          name: pegawaiName,
          fromUser: true,
        });

        // 4) Inisialisasi sisaPenetapanTemp = penetapan - jumlah prefills
        setSisaPenetapanTemp(sisa);
        setBasePrefillCount(prefills.length);
      } catch (err) {
        console.error("Gagal memuat data:", err);
        setModalInfo({
          isOpen: true,
          title: "Gagal Memuat Data",
          message: "Tidak dapat mengambil data pendaftaran. Silakan coba lagi.",
          type: "error",
        });
      }
    };
    loadData();
  }, [isDataLoaded, nipp]);

  // Kuota global (opsional, info)
  const getQuota = useCallback(async () => {
    try {
      const res = await api.get("/quota");
      setQuota(res.data.data.quota);
      setQuotaTotal(res.data.data.total_quota);
    } catch (err) {
      console.error("Gagal mengambil data quota :", err);
    }
  }, []);
  useEffect(() => {
    getQuota();
  }, [getQuota]);

  // ===== Helpers =====
  const familyFilledCount = () =>
    members.filter((m) => !m.fromUser && (m.name || "").trim() !== "").length;
  const canAddMember = () => sisaPenetapanTemp > 0;

  const handleMemberNameChange = (id, newName) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, name: newName } : m))
    );
  };

  const handleRemoveMember = (id) => {
    const target = members.find((m) => m.id === id);
    if (target?.fromUser) return; // pegawai tidak bisa dihapus

    // hapus anggota
    setMembers((prev) => prev.filter((m) => m.id !== id));

    // sesuai niat: apapun sumbernya (prefill/added), hapus keluarga → +1 slot
    setSisaPenetapanTemp((prev) => prev + 1);
  };

  const handleAddMember = () => {
    if (!canAddMember()) {
      setModalInfo({
        isOpen: true,
        title: "Kuota Tambah Habis",
        message: `Sisa penetapan Anda ${sisaPenetapan}.`,
        type: "warning",
      });
      return;
    }
    setSisaPenetapanTemp((prev) => Math.max(0, prev - 1)); // decrement aman
    const newId = `new-${Date.now()}`;
    setMembers((prev) => [
      ...prev,
      { id: newId, name: "", fromUser: false, source: "added" },
    ]);
  };

  const handleCloseModal = () => {
    if (modalInfo.type === "success") {
      navigate("/admindesk", { state: { nipp } });
    }
    setModalInfo({ isOpen: false, title: "", message: "", type: "info" });
  };

  // Submit: selalu PUT (upsert)
  const submitOrder = async () => {
    try {
      // Validasi: total keluarga terisi tidak boleh > sisa penetapan
      const totalKeluarga = familyFilledCount();
      const maxAllowed = basePrefillCount + sisaPenetapan;
      if (totalKeluarga > maxAllowed) {
        setModalInfo({
          isOpen: true,
          title: "Melebihi Batas",
          message: `Anggota keluarga (${totalKeluarga}) melebihi batas (${maxAllowed}).`,
          type: "warning",
        });
        return;
      }

      await api.put(`/order/${nipp}`, {
        nipp,
        nama: members
          .filter((m) => (m.fromUser ? statusHadir === STATUS_HADIR : true))
          .map((m) => (m.name || "").trim())
          .filter(Boolean),
        status: statusHadir,
        keberangkatan: lokasi,
        transportasi: transportasi,
      });
      setModalInfo({
        isOpen: true,
        title: "Pendaftaran Disimpan!",
        message:
          "Data Anda berhasil disimpan dan bisa diubah kembali bila diperlukan.",
        type: "success",
      });
    } catch (error) {
      console.error(error);
      const errorMessage =
        error.response?.data?.msg ||
        error.response?.data?.message ||
        "Gagal menyimpan. Silakan coba lagi.";
      setModalInfo({
        isOpen: true,
        title: "Terjadi Kesalahan",
        message: errorMessage,
        type: "error",
      });
    }
  };

  const handleOpenConfirmModal = (e) => {
    e.preventDefault();

    if (!lokasi || !transportasi) {
      setModalInfo({
        isOpen: true,
        title: "Data Belum Lengkap",
        message: "Mohon pilih lokasi keberangkatan dan jenis transportasi.",
        type: "warning",
      });
      return;
    }

    const totalKeluarga = familyFilledCount();
    const maxAllowed = basePrefillCount + sisaPenetapan;
    if (totalKeluarga > maxAllowed) {
      setModalInfo({
        isOpen: true,
        title: "Melebihi Sisa Penetapan",
        message: `Anggota keluarga (${totalKeluarga}) melebihi sisa penetapan (${sisaPenetapan}).`,
        type: "warning",
      });
      return;
    }

    // Jika pegawai "tidak hadir", wajib minimal satu anggota lain
    const anggotaLain = members.filter(
      (m) => !m.fromUser && (m.name || "").trim() !== ""
    );
    if (statusHadir === STATUS_TIDAK && anggotaLain.length === 0) {
      setModalInfo({
        isOpen: true,
        title: "Tidak Bisa Mendaftar",
        message:
          "Anda memilih 'Tidak Hadir'. Tambahkan minimal satu anggota keluarga.",
        type: "warning",
      });
      return;
    }

    setIsConfirmModalOpen(true);
  };

  const handleConfirmSubmit = () => {
    setIsConfirmModalOpen(false);
    submitOrder();
  };

  const currentUsed =
    familyFilledCount() + (statusHadir === STATUS_HADIR ? 1 : 0);

  const getMemberLabel = (member, index) => {
    if (member.fromUser) return "Data Pegawai";
    return `Anggota Keluarga ${index}`;
  };

  const getMemberPlaceholder = (member) =>
    member.fromUser ? "Nama pegawai" : "Masukkan nama anggota";

  // ===== Render =====
  return (
    <>
      <div
        className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-600 py-6 px-4"
        style={{
          background:
            "linear-gradient(to bottom right, #406017, #527020, #334d12)",
        }}
      >
        <div className="max-w-4xl mx-auto w-full space-y-6">
          {/* Form utama */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Data Pendaftaran
              </h2>
              <p className="text-gray-600">
                Perbarui data keberangkatan & daftar anggota keluarga untuk
                peserta ini.
              </p>
            </div>

            {/* Informasi Keberangkatan */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Informasi Keberangkatan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="lokasi"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Lokasi Keberangkatan Terdekat
                  </label>
                  <select
                    id="lokasi"
                    value={lokasi}
                    onChange={(e) => setLokasi(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white hover:border-gray-300"
                  >
                    <option value="" disabled>
                      Pilih Lokasi Keberangkatan Terdekat
                    </option>
                    {LOKASI_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="transportasi"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Jenis Transportasi Menuju Puncak Sosok
                  </label>
                  <select
                    id="transportasi"
                    value={transportasi}
                    onChange={(e) => setTransportasi(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white hover:border-gray-300"
                  >
                    <option value="" disabled>
                      Pilih Jenis Transportasi
                    </option>
                    {TRANSPORTASI_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt.charAt(0).toUpperCase() + opt.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Daftar Anggota */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Daftar Anggota Keluarga
              </h3>
              <div className="space-y-6">
                {members.length > 0 ? (
                  members.map((member, index) => (
                    <div
                      key={member.id}
                      className="bg-gray-50 rounded-2xl p-6 border border-gray-200"
                    >
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {getMemberLabel(member, index)}
                          </label>
                          <input
                            type="text"
                            value={member.name || ""}
                            onChange={(e) =>
                              handleMemberNameChange(member.id, e.target.value)
                            }
                            readOnly={member.fromUser}
                            placeholder={getMemberPlaceholder(member)}
                            className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                              member.fromUser
                                ? "bg-gray-100 text-gray-600 cursor-not-allowed border-gray-200"
                                : "bg-white text-gray-900 border-gray-200 hover:border-gray-300"
                            }`}
                          />
                        </div>

                        {member.fromUser && (
                          <div className="lg:w-48">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Status Kehadiran
                            </label>
                            <select
                              value={statusHadir}
                              onChange={(e) => setStatusHadir(e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white hover:border-gray-300"
                            >
                              <option value={STATUS_HADIR}>✅ Hadir</option>
                              <option value={STATUS_TIDAK}>
                                ❌ Tidak Hadir
                              </option>
                            </select>
                          </div>
                        )}

                        {!member.fromUser && (
                          <div className="lg:w-24 flex items-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member.id)}
                              className="w-full lg:w-auto px-4 py-3 text-red-600 hover:bg-red-50 border-2 border-red-300 hover:border-red-400 rounded-xl transition-all duration-200 font-semibold flex items-center justify-center gap-2"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              <span className="hidden lg:inline">Hapus</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                        />
                      </svg>
                    </div>
                    <p className="font-medium">
                      Memuat data anggota keluarga...
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Tombol tambah anggota */}
            {isDataLoaded && canAddMember() && (
              <div className="flex justify-center mb-8">
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="inline-flex items-center gap-3 px-8 py-4 text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 border-2 border-green-300 hover:border-green-400 rounded-2xl transition-all duration-200 font-semibold text-lg transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Tambah Anggota Keluarga
                </button>
              </div>
            )}

            {/* Submit */}
            {isDataLoaded && (
              <div className="pt-6 border-t-2 border-gray-100">
                <button
                  type="button"
                  onClick={handleOpenConfirmModal}
                  className="w-full py-4 px-8 rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 text-white"
                  style={{
                    background:
                      "linear-gradient(to bottom right, #406017, #527020, #334d12)",
                  }}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  EDIT
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={modalInfo.isOpen}
        onClose={handleCloseModal}
        title={modalInfo.title}
        message={modalInfo.message}
        type={modalInfo.type}
      />

      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmSubmit}
        title="Konfirmasi Pendaftaran"
      >
        <p>
          Anda akan mendaftarkan total <strong>{currentUsed} anggota</strong>.
          (pegawai {statusHadir === "hadir" ? "ikut" : "tidak ikut"}, keluarga
          terisi: {familyFilledCount()}).
        </p>
      </ConfirmationModal>
    </>
  );
};

export default EditRegisterPage;
