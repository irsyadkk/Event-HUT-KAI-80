import React, { useState, useEffect, useCallback } from "react";
import { jwtDecode } from "jwt-decode";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";

// ===== Modal util (tetap sama, dipotong untuk ringkas) =====
const ModalIcon = ({ type }) => { /* ...sama seperti punyamu... */ };
const Modal = ({ isOpen, onClose, title, message, type = "info" }) => { /* ... */ };
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => { /* ... */ };

// ===== Konstanta =====
const STATUS_HADIR = "hadir";
const STATUS_TIDAK = "tidak hadir";
const LOKASI_OPTIONS = ["purworejo", "DI Yogyakarta", "klaten", "surakarta", "sragen", "wonogiri", "magelang"];
const TRANSPORTASI_OPTIONS = ["kendaraan pribadi", "kendaraan umum / online"];

const AddMemberPage = () => {
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
  const [maxMembers, setMaxMembers] = useState(0); // CHANGED: total kuota (pegawai+keluarga)

  const [modalInfo, setModalInfo] = useState({ isOpen: false, title: "", message: "", type: "info" });
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate("/"); return; }
    try { jwtDecode(token); setIsDataLoaded(true); }
    catch { localStorage.removeItem("token"); navigate("/"); }
  }, [navigate]);

  // Ambil user + (opsional) prefill order, TAPI tidak mengunci UI lagi
  useEffect(() => {
    if (!isDataLoaded || !nipp) return;
    const loadData = async () => {
      try {
        // 1) Ambil data user pegawai
        const userRes = await api.get(`/users/${nipp}`);
        const userData = userRes.data.data;
        const pegawaiName = userData.nama?.trim() || "";

        // set data pegawai (readOnly)
        setUserFromUsers({ id: "user-main", name: pegawaiName, fromUser: true });

        // 2) Ambil order untuk PREFILL saja (bukan untuk lock)
        let orderData = {};
        try {
          const orderRes = await api.get(`/order/${nipp}`);
          orderData = orderRes.data.data || {};
        } catch (err) {
          if (!(err.response && err.response.status === 404)) throw err;
        }

        const orderNames = Array.isArray(orderData.nama) ? orderData.nama : [];
        // status hadir default berdasar prefill: jika nama pertama = pegawai → hadir
        if (orderNames.length > 0 && orderNames[0]?.trim()?.toLowerCase() === pegawaiName.toLowerCase()) {
          setStatusHadir(STATUS_HADIR);
        } else {
          setStatusHadir(STATUS_TIDAK);
        }

        setLokasi(orderData.keberangkatan || "");
        setTransportasi(orderData.transportasi || "");

        // 3) Hitung kuota total (pegawai + keluarga) → penetapan + 1
        const totalKuota = Number(userData.penetapan ?? 0) + 1; // CHANGED
        setMaxMembers(totalKuota);

        // 4) Susun daftar anggota:
        //    - Pegawai selalu first, flagged `fromUser: true` (readOnly + tidak bisa hapus)
        //    - Semua nama lain (dari order lama) dianggap editable biasa (BUKAN fromOrder)
        const prefills = orderNames
          .filter(nm => nm && nm.trim().toLowerCase() !== pegawaiName.toLowerCase())
          .map((nm, i) => ({ id: `prefill-${i}`, name: nm, fromUser: false }));

        setMembers([{ id: "user-main", name: pegawaiName, fromUser: true }, ...prefills]);
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

  // Kuota global
  const getQuota = useCallback(async () => {
    try {
      const res = await api.get("/quota");
      setQuota(res.data.data.quota);
      setQuotaTotal(res.data.data.total_quota);
    } catch (err) {
      console.error("Gagal mengambil data quota :", err);
    }
  }, []);

  useEffect(() => { getQuota(); }, [getQuota]);

  // ===== Helpers =====
  const countCurrentUsed = () => {
    // hitung yang akan dikirim sebagai peserta
    const others = members.filter(m => !m.fromUser && (m.name || "").trim() !== "").length;
    const pegawaiCount = statusHadir === STATUS_HADIR ? 1 : 0;
    return pegawaiCount + others;
  };

  const canAddMember = () => countCurrentUsed() < maxMembers;

  const handleMemberNameChange = (id, newName) => {
    setMembers(prev => prev.map(m => (m.id === id ? { ...m, name: newName } : m)));
  };

  const handleRemoveMember = (id) => {
    const target = members.find(m => m.id === id);
    if (target?.fromUser) return;              // CHANGED: pegawai tidak bisa dihapus
    setMembers(prev => prev.filter(m => m.id !== id));
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
    const newId = `new-${Date.now()}`;
    setMembers(prev => [...prev, { id: newId, name: "", fromUser: false }]);
  };

  const handleCloseModal = () => {
    if (modalInfo.type === "success") {
      navigate("/qrresult", { state: { nipp } });
    }
    setModalInfo({ isOpen: false, title: "", message: "", type: "info" });
  };

  // Submit: selalu PUT (upsert) — CHANGED
  const submitOrder = async () => {
    try {
      await api.put(`/order/${nipp}`, {
        nipp,
        nama: members
          .filter(m => (m.fromUser ? statusHadir === STATUS_HADIR : true))
          .map(m => (m.name || "").trim())
          .filter(Boolean),
        status: statusHadir,
        keberangkatan: lokasi,
        transportasi: transportasi,
      });
      setModalInfo({
        isOpen: true,
        title: "Pendaftaran Disimpan!",
        message: "Data Anda berhasil disimpan dan bisa diubah kembali bila diperlukan.",
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

    // Jika pegawai "tidak hadir", wajib ada minimal satu anggota lain
    const anggotaLain = members.filter(m => !m.fromUser && (m.name || "").trim() !== "");
    if (statusHadir === STATUS_TIDAK && anggotaLain.length === 0) {
      setModalInfo({
        isOpen: true,
        title: "Tidak Bisa Mendaftar",
        message: "Anda memilih 'Tidak Hadir'. Tambahkan minimal satu anggota keluarga.",
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

  const currentUsed = countCurrentUsed();

  const getMemberLabel = (member, index) => {
    if (member.fromUser) return "Data Pegawai";
    return `Anggota Keluarga ${index}`; // CHANGED: semuanya editable selain pegawai
  };

  const getMemberPlaceholder = (member) => member.fromUser ? "Nama pegawai" : "Masukkan nama anggota";

  // ===== Render =====
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-600 py-6 px-4"
           style={{ background:"linear-gradient(to bottom right, #406017, #527020, #334d12)" }}>
        <div className="max-w-4xl mx-auto w-full space-y-6">

          {userFromUsers && (
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 md:p-8 text-center border border-white/20">
              <div className="flex flex-col items-center gap-4">
                <div className="flex justify-center mb-6">
                  <img src={LogoKAI} alt="Logo HUT KAI 80" className="h-20 w-auto object-contain" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    Selamat Datang, {userFromUsers.name}!
                  </h1>
                  <p className="text-white/90 text-lg">Lengkapi data anggota keluarga untuk acara HUT KAI ke-80</p>
                </div>
              </div>
            </div>
          )}

          

          {/* Form utama */}
          <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-white/20">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                Data Pendaftaran
              </h2>
              <p className="text-gray-600">Lengkapi informasi keberangkatan dan anggota keluarga yang akan mengikuti acara.</p>
            </div>

            {/* Informasi Keberangkatan (SELALU editable) */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Informasi Keberangkatan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="lokasi" className="block text-sm font-semibold text-gray-700 mb-2">Lokasi Keberangkatan Terdekat</label>
                  <select
                    id="lokasi"
                    value={lokasi}
                    onChange={(e) => setLokasi(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white hover:border-gray-300"
                  >
                    <option value="" disabled>Pilih Lokasi Keberangkatan Terdekat</option>
                    {LOKASI_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="transportasi" className="block text-sm font-semibold text-gray-700 mb-2">Jenis Transportasi Menuju Puncak Sosok</label>
                  <select
                    id="transportasi"
                    value={transportasi}
                    onChange={(e) => setTransportasi(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white hover:border-gray-300"
                  >
                    <option value="" disabled>Pilih Jenis Transportasi</option>
                    {TRANSPORTASI_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Daftar Anggota */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Daftar Anggota Keluarga</h3>
              <div className="space-y-6">
                {members.length > 0 ? members.map((member, index) => (
                  <div key={member.id} className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          {getMemberLabel(member, index)}
                        </label>
                        <input
                          type="text"
                          value={member.name || ""}
                          onChange={(e) => handleMemberNameChange(member.id, e.target.value)}
                          readOnly={member.fromUser}  // CHANGED: cuma pegawai yang readOnly
                          placeholder={getMemberPlaceholder(member)}
                          className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all ${
                            member.fromUser ? "bg-gray-100 text-gray-600 cursor-not-allowed border-gray-200" :
                                              "bg-white text-gray-900 border-gray-200 hover:border-gray-300"
                          }`}
                        />
                      </div>

                      {member.fromUser && (
                        <div className="lg:w-48">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">Status Kehadiran</label>
                          <select
                            value={statusHadir}
                            onChange={(e) => setStatusHadir(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all bg-white hover:border-gray-300"
                          >
                            <option value={STATUS_HADIR}>✅ Hadir</option>
                            <option value={STATUS_TIDAK}>❌ Tidak Hadir</option>
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
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span className="hidden lg:inline">Hapus</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                      </svg>
                    </div>
                    <p className="font-medium">Memuat data anggota keluarga...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tombol tambah anggota */}
            {isDataLoaded && currentUsed < maxMembers && (
              <div className="flex justify-center mb-8">
                <button
                  type="button"
                  onClick={handleAddMember}
                  className="inline-flex items-center gap-3 px-8 py-4 text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 border-2 border-green-300 hover:border-green-400 rounded-2xl transition-all duration-200 font-semibold text-lg transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
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
                  style={{ background:"linear-gradient(to bottom right, #406017, #527020, #334d12)" }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  SIMPAN / DAFTAR
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={modalInfo.isOpen} onClose={handleCloseModal} title={modalInfo.title} message={modalInfo.message} type={modalInfo.type} />

      <ConfirmationModal isOpen={isConfirmModalOpen} onClose={() => setIsConfirmModalOpen(false)} onConfirm={handleConfirmSubmit} title="Konfirmasi Pendaftaran">
        <p>
          Anda akan mendaftarkan total <strong>{currentUsed} anggota</strong>. Pastikan data sudah benar –
          Anda tetap bisa mengedit kembali setelah ini.
        </p>
      </ConfirmationModal>
    </>
  );
};

export default AddMemberPage;
