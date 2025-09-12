import React, { useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";

// ====================================================================
// KOMPONEN MODAL NOTIFIKASI (UNTUK SUKSES/ERROR/PERINGATAN)
// ====================================================================
const ModalIcon = ({ type }) => {
  const baseClasses =
    "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4";

  switch (type) {
    case "success":
      return (
        <div className={`${baseClasses} bg-green-100`}>
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
    case "error":
      return (
        <div className={`${baseClasses} bg-red-100`}>
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
    case "warning":
      return (
        <div className={`${baseClasses} bg-yellow-100`}>
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
    default:
      return null;
  }
};

const Modal = ({ isOpen, onClose, title, message, type = "info" }) => {
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.keyCode === 27) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);

    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  if (!isOpen) return null;

  const buttonClasses = {
    success: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
    error: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
    warning: "bg-yellow-500 hover:bg-yellow-600 focus:ring-yellow-500",
    info: "bg-gray-600 hover:bg-gray-700 focus:ring-gray-500",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl transform transition-all duration-300 ease-in-out scale-95 hover:scale-100 p-8 text-center max-w-sm w-full mx-4">
        <ModalIcon type={type} />

        <h3 className="text-2xl font-bold text-gray-900 mb-2" id="modal-title">
          {title}
        </h3>

        <p className="text-gray-600 mb-6">{message}</p>

        <button
          onClick={onClose}
          type="button"
          className={`w-full inline-flex justify-center rounded-xl border border-transparent px-6 py-3 text-base font-semibold text-white shadow-md ${buttonClasses[type]} focus:outline-none focus:ring-2 focus:ring-offset-2 transition-transform transform hover:scale-105`}
        >
          Mengerti
        </button>
      </div>
    </div>
  );
};

// ====================================================================
// KOMPONEN MODAL KONFIRMASI (UNTUK YAKIN/BATAL)
// ====================================================================
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
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

// ====================================================================
// KOMPONEN UTAMA ADD MEMBER PAGE
// ====================================================================
const STATUS_HADIR = "hadir";
const STATUS_TIDAK = "tidak hadir";
const LOKASI_OPTIONS = [
  "purworejo",
  "DIY Yogyakarta",
  "klaten",
  "surakarta",
  "sragen",
  "wonogiri",
];
const TRANSPORTASI_OPTIONS = ["kendaraan pribadi", "kendaraan umum"];

const AddMemberPage = () => {
  const location = useLocation();
  const nipp = location.state?.nipp;
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [userFromUsers, setUserFromUsers] = useState(null);
  const [maxMembers, setMaxMembers] = useState(0);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [statusHadir, setStatusHadir] = useState(STATUS_HADIR);
  const [hasExistingOrder, setHasExistingOrder] = useState(false);
  const [lokasi, setLokasi] = useState("");
  const [transportasi, setTransportasi] = useState("");
  const [quotaValue, setQuotaValue] = useState("");
  const [quota, setQuota] = useState(0);
  const [quotaTotal, setQuotaTotal] = useState(0);

  const [modalInfo, setModalInfo] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

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

  useEffect(() => {
    if (!isDataLoaded || !nipp) return;
    const loadData = async () => {
      try {
        const userRes = await api.get(`/users/${nipp}`);
        const userData = userRes.data.data;

        setUserFromUsers({
          id: "user-main",
          name: userData.nama,
          fromUser: true,
        });

        let orderData = {};
        try {
          const orderRes = await api.get(`/order/${nipp}`);
          orderData = orderRes.data.data || {};
        } catch (err) {
          if (err.response && err.response.status === 404) {
            orderData = {};
          } else {
            throw err;
          }
        }

        const orderNames = Array.isArray(orderData.nama) ? orderData.nama : [];
        setLokasi(orderData.keberangkatan);
        setTransportasi(orderData.transportasi);
        if (orderNames.length > 0) {
          if (
            orderNames[0].trim().toLowerCase() ===
            userData.nama.trim().toLowerCase()
          ) {
            setStatusHadir(STATUS_HADIR);
          } else {
            setStatusHadir(STATUS_TIDAK);
          }
        } else {
          // kalau belum ada data order → default hadir
          setStatusHadir(STATUS_HADIR);
        }

        const orderMembersList = orderNames.map((nm, i) => ({
          id: `order-${i}`,
          name: nm,
          fromOrder: true,
        }));
        setHasExistingOrder(orderMembersList.length > 0);

        const remaining = Number(userData.penetapan ?? 0);
        setMaxMembers(remaining + orderMembersList.length);

        const merged = [
          { id: "user-main", name: userData.nama, fromUser: true },
          ...orderMembersList.filter(
            (o) =>
              o.name.trim().toLowerCase() !== userData.nama.trim().toLowerCase()
          ),
        ];
        setMembers(merged);
      } catch (err) {
        console.error("Gagal memuat data:", err);
        setModalInfo({
          isOpen: true,
          title: "Gagal Memuat Data",
          message:
            "Tidak dapat mengambil data pendaftaran. Silakan coba muat ulang halaman.",
          type: "error",
        });
      }
    };

    loadData();
  }, [isDataLoaded, nipp]);

  useEffect(() => {
    getQuota(); // ambil kuota global
  }, []);

  const getCounts = () => {
    const orderCount = members.filter((m) => m.fromOrder).length;
    const newCount = members.filter((m) => !m.fromOrder && !m.fromUser).length;
    return { orderCount, newCount };
  };

  const getQuota = useCallback(async () => {
    try {
      const res = await api.get("/quota");
      setQuota(res.data.data.quota);
      setQuotaTotal(res.data.data.total_quota);
    } catch (err) {
      console.error("Gagal mengambil data quota :", err);
    }
  }, []);

  const canAddMember = () => {
    const { orderCount, newCount } = getCounts();
    let willSendToBackend = 0;
    if (statusHadir === STATUS_HADIR) {
      willSendToBackend += 1;
    }
    willSendToBackend += orderCount;
    willSendToBackend += newCount;
    return willSendToBackend < maxMembers;
  };

  const handleMemberNameChange = (id, newName) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, name: newName } : m))
    );
  };

  const handleRemoveMember = (id) => {
    const target = members.find((m) => m.id === id);
    if (target?.fromOrder || target?.fromUser) return;
    setMembers((prev) => prev.filter((member) => member.id !== id));
  };

  const handleAddMember = () => {
    if (!canAddMember()) {
      setModalInfo({
        isOpen: true,
        title: "Kuota Penuh",
        message: `Anda tidak dapat menambahkan anggota lagi. Kuota maksimal adalah ${maxMembers} orang.`,
        type: "warning",
      });
      return;
    }
    const newId = Date.now();
    setMembers((prev) => [
      ...prev,
      { id: newId, name: "", fromOrder: false, fromUser: false },
    ]);
  };

  const handleCloseModal = () => {
    if (modalInfo.type === "success") {
      navigate("/qrresult", { state: { nipp } });
    }
    setModalInfo({ isOpen: false, title: "", message: "", type: "info" });
  };

  const submitOrder = async () => {
    try {
      const method = hasExistingOrder ? "put" : "post";
      await api[method](`/order${hasExistingOrder ? `/${nipp}` : ""}`, {
        nipp,
        nama: members
          .filter((m) => (m.fromUser ? statusHadir === STATUS_HADIR : true))
          .map((m) => m.name.trim())
          .filter((name) => name),
        status: statusHadir,
        keberangkatan: lokasi,
        transportasi: transportasi,
      });
      setModalInfo({
        isOpen: true,
        title: "Pendaftaran Berhasil!",
        message:
          "Data Anda telah berhasil didaftarkan. Anda akan diarahkan ke halaman tiket.",
        type: "success",
      });
    } catch (error) {
      console.error(error);
      const errorMessage =
        error.response?.data?.msg ||
        error.response?.data?.message ||
        "Gagal mendaftar. Silakan coba lagi.";
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
        message:
          "Mohon pilih lokasi keberangkatan dan jenis transportasi Anda.",
        type: "warning",
      });
      return;
    }
    const hasEmptyName = members.some(
      (m) => !m.fromUser && !m.fromOrder && m.name.trim() === ""
    );
    if (hasEmptyName) {
      setModalInfo({
        isOpen: true,
        title: "Nama Anggota Kosong",
        message: "Pastikan semua kolom nama anggota tambahan telah diisi.",
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

  const { orderCount, newCount } = getCounts();
  let currentUsed = 0;

  currentUsed += 1;

  currentUsed += orderCount;
  currentUsed += newCount;

  const getMemberLabel = (member, index) => {
    if (member.fromUser) {
      return hasExistingOrder
        ? "Data Pegawai (Status Otomatis)"
        : "Data Pegawai";
    }
    if (member.fromOrder) {
      return `Anggota Terdaftar ${index}`;
    }
    return "Anggota Tambahan";
  };

  const getMemberPlaceholder = (member) => {
    if (member.fromUser) return "Nama pegawai";
    if (member.fromOrder) return "Nama sudah terdaftar";
    return "Masukkan nama anggota";
  };

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
          {userFromUsers && (
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 md:p-8 text-center border border-white/20">
              <div className="flex flex-col items-center gap-4">
                <div className="flex justify-center mb-6">
                  <img
                    src={LogoKAI}
                    alt="Logo HUT KAI 80"
                    className="h-20 w-auto object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    Selamat Datang, {userFromUsers.name}!
                  </h1>
                  <p className="text-white/90 text-lg">
                    Mari lengkapi data anggota keluarga untuk acara HUT KAI
                    ke-80
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Kuota Keluarga */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-2xl p-6 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-green-800 font-semibold mb-1">
                  Kuota Keluarga
                </p>
                <p className="text-green-700 text-sm">
                  Anda memiliki <strong>{maxMembers}</strong> kuota untuk
                  mendaftarkan anggota keluarga.
                </p>
              </div>
            </div>
          </div>

          {/* Kuota Keseluruhan */}
          {isDataLoaded && (
            <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M11 17a1 1 0 01-1 1H6a1 1 0 110-2h4a1 1 0 011 1zM6 9a1 1 0 100 2h8a1 1 0 100-2H6zm-1 6a1 1 0 100 2h10a1 1 0 100-2H5z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-purple-800 font-semibold mb-1">
                    Kuota Keseluruhan
                  </p>
                  <p className="text-purple-700 text-sm">
                    Tersisa <strong>{quota}</strong> dari total{" "}
                    <strong>{quotaTotal}</strong> kuota.
                  </p>
                </div>
              </div>
            </div>
          )}

          {hasExistingOrder && (
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-blue-800 font-semibold mb-1">
                    Pendaftaran Sudah Ada
                  </p>
                  <p className="text-blue-700 text-sm">
                    Anda sudah memiliki pendaftaran sebelumnya. Data yang sudah
                    tersimpan tidak dapat diubah lagi.
                  </p>
                </div>
              </div>
            </div>
          )}

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
                Lengkapi informasi keberangkatan dan anggota keluarga yang akan
                mengikuti acara.
              </p>
            </div>

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
                    Lokasi Keberangkatan
                  </label>
                  <select
                    id="lokasi"
                    value={lokasi}
                    onChange={(e) => setLokasi(e.target.value)}
                    disabled={hasExistingOrder}
                    className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                      hasExistingOrder
                        ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                        : "bg-white hover:border-gray-300"
                    }`}
                  >
                    <option value="" disabled>
                      Pilih Lokasi Keberangkatan
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
                    Jenis Transportasi
                  </label>
                  <select
                    id="transportasi"
                    value={transportasi}
                    onChange={(e) => setTransportasi(e.target.value)}
                    disabled={hasExistingOrder}
                    className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                      hasExistingOrder
                        ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                        : "bg-white hover:border-gray-300"
                    }`}
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
                            readOnly={member.fromOrder || member.fromUser}
                            placeholder={getMemberPlaceholder(member)}
                            className={`w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                              member.fromOrder || member.fromUser
                                ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                                : "bg-white text-gray-900 hover:border-gray-300"
                            }`}
                          />
                        </div>

                        {member.fromUser && (
                          <div className="lg:w-48">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                              Status Kehadiran
                            </label>
                            {hasExistingOrder ? (
                              <div className="px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-100 text-gray-600 font-medium">
                                {statusHadir === STATUS_HADIR
                                  ? "✅ Hadir"
                                  : "❌ Tidak Hadir"}
                              </div>
                            ) : (
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
                            )}
                          </div>
                        )}

                        {!member.fromOrder && !member.fromUser && (
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

            {isDataLoaded && !hasExistingOrder && currentUsed < maxMembers && (
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

            {isDataLoaded && (
              <div className="pt-6 border-t-2 border-gray-100">
                {hasExistingOrder ? (
                  <button
                    type="button"
                    onClick={() => navigate("/qrresult", { state: { nipp } })}
                    className="w-full py-4 px-8 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center gap-3"
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                    Lihat Tiket Saya
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenConfirmModal}
                    disabled={currentUsed === 0}
                    className={`w-full py-4 px-8 rounded-2xl font-bold text-lg transition-all duration-200 transform hover:scale-105 shadow-xl hover:shadow-2xl flex items-center justify-center gap-3 ${
                      currentUsed === 0
                        ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                        : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
                    }`}
                    style={{
                      background:
                        "linear-gradient(to bottom right, #406017, #527020, #334d12)",
                    }}
                  >
                    {currentUsed === 0 ? (
                      <>
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
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z"
                          />
                        </svg>
                        Tidak ada anggota untuk didaftarkan
                      </>
                    ) : (
                      <>
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
                        Daftar Sekarang ({currentUsed} anggota)
                      </>
                    )}
                  </button>
                )}
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
          Apakah Anda yakin dengan data yang dimasukkan? Pendaftaran hanya dapat
          dilakukan sekali dan data tidak bisa diubah kembali.
        </p>
      </ConfirmationModal>
    </>
  );
};

export default AddMemberPage;
