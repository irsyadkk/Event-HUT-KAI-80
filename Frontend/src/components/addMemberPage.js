import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { BASE_URL } from "../utils";
import { useLocation, useNavigate } from "react-router-dom";

const STATUS_HADIR = "hadir";
const STATUS_TIDAK = "tidak hadir";

// --- NEW: Options for the dropdowns ---
const LOKASI_OPTIONS = [
  "purworejo",
  "DIY Yogyakarta",
  "klaten",
  "surakarta",
  "sragen",
  "wonogiri",
];
const TRANSPORTASI_OPTIONS = ["kendaraan pribadi", "kendaraan umum"];
// ------------------------------------

const AddMemberPage = () => {
  const location = useLocation();
  const nipp = location.state?.nipp;
  const navigate = useNavigate();

  const [members, setMembers] = useState([]); // mix of fromOrder/fromUser/new
  const [userFromUsers, setUserFromUsers] = useState(null);
  const [maxMembers, setMaxMembers] = useState(0); // total quota (reconstructed)
  const [remainingQuota, setRemainingQuota] = useState(0); // what DB currently reports (likely remaining)

  const [token, setToken] = useState("");
  const [expire, setExpire] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [statusHadir, setStatusHadir] = useState(STATUS_HADIR);
  const [hasExistingOrder, setHasExistingOrder] = useState(false);
  const [autoDetectedStatus, setAutoDetectedStatus] = useState(null);

  // --- NEW: State for dropdowns ---
  const [lokasi, setLokasi] = useState("");
  const [transportasi, setTransportasi] = useState("");
  // ---------------------------------

  // --------------------
  // Token helpers
  // --------------------
  const fetchAndSetToken = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/token`);
      const accessToken = response.data.accessToken;
      const decoded = jwtDecode(accessToken);

      setToken(accessToken);
      setExpire(decoded.exp);
      return accessToken;
    } catch (error) {
      console.error("Gagal mengambil token:", error);
      return null;
    }
  };

  const ensureToken = async () => {
    const now = Date.now();
    if (!token || (expire && expire * 1000 < now)) {
      const t = await fetchAndSetToken();
      return t;
    }
    return token;
  };

  // --------------------
  // API
  // --------------------
  const getOrderByNipp = async (tokenToUse) => {
    try {
      const response = await axios.get(`${BASE_URL}/order/${nipp}`, {
        headers: { Authorization: `Bearer ${tokenToUse}` },
      });

      const orderData = response.data.data;
      const namesFromOrders = Array.isArray(orderData?.nama)
        ? orderData.nama
        : [];

      // --- MODIFIED: Set location and transport if order exists ---
      if (orderData) {
        setLokasi(orderData.lokasi || "");
        setTransportasi(orderData.transportasi || "");
      }
      // -----------------------------------------------------------

      const orderMembersList = namesFromOrders.map((nm, idx) => ({
        id: `order-${idx}`,
        name: nm,
        fromOrder: true,
      }));

      setHasExistingOrder(orderMembersList.length > 0);
      return orderMembersList;
    } catch (error) {
      console.error("Gagal mengambil data order:", error);
      return [];
    }
  };

  const getUserByNipp = async (tokenToUse) => {
    try {
      const response = await axios.get(`${BASE_URL}/users/${nipp}`, {
        headers: { Authorization: `Bearer ${tokenToUse}` },
      });

      const userData = response.data.data;
      setUserFromUsers({
        id: "user-main",
        name: userData.nama,
        fromUser: true,
      });

      return userData;
    } catch (error) {
      console.error("Gagal mengambil data pengguna:", error);
      return null;
    }
  };

  // Deteksi status berdasarkan order (bandingkan nama pertama dengan nama user)
  const detectStatusFromOrder = (orderMembersList, userData) => {
    if (orderMembersList && orderMembersList.length > 0 && userData) {
      const firstOrderName = String(orderMembersList[0]?.name ?? "")
        .trim()
        .toLowerCase();
      const userName = String(userData.nama ?? "")
        .trim()
        .toLowerCase();

      if (firstOrderName && userName && firstOrderName === userName) {
        setAutoDetectedStatus(STATUS_HADIR);
        setStatusHadir(STATUS_HADIR);
        return STATUS_HADIR;
      } else {
        setAutoDetectedStatus(STATUS_TIDAK);
        setStatusHadir(STATUS_TIDAK);
        return STATUS_TIDAK;
      }
    }
    return null;
  };

  const setupMembers = (orderData, userData) => {
    if (!userData) {
      setMembers([]);
      return;
    }

    let finalMembers = [];

    if (orderData && orderData.length > 0) {
      // Ada existing order
      setHasExistingOrder(true);

      // Deteksi status berdasarkan apakah nama pegawai ada di index[0] order
      const detectedStatus = detectStatusFromOrder(orderData, userData);

      // SELALU tampilkan nama pegawai di posisi pertama
      finalMembers.push({
        id: "user-main",
        name: userData.nama,
        fromUser: true,
      });

      // Kemudian tambahkan anggota dari order (kecuali jika nama sama dengan pegawai)
      orderData.forEach((orderMember, idx) => {
        const orderNameLower = String(orderMember.name ?? "")
          .trim()
          .toLowerCase();
        const userNameLower = String(userData.nama ?? "")
          .trim()
          .toLowerCase();

        // Skip jika nama order sama dengan nama pegawai (avoid duplicate)
        if (orderNameLower !== userNameLower) {
          finalMembers.push({
            ...orderMember,
            id: `order-${idx}`, // Keep unique ID
          });
        }
      });
    } else {
      // Belum ada order, first time
      setHasExistingOrder(false);
      finalMembers.push({
        id: "user-main",
        name: userData.nama,
        fromUser: true,
      });
      setStatusHadir(STATUS_HADIR);
    }

    setMembers(finalMembers);
  };

  // --------------------
  // Effects (init)
  // --------------------
  useEffect(() => {
    const initData = async () => {
      if (!nipp) return;
      const t = await fetchAndSetToken();
      setIsDataLoaded(!!t);
    };
    initData();
  }, [nipp]);

  useEffect(() => {
    const loadData = async () => {
      if (!isDataLoaded) return;
      const tokenToUse = await ensureToken();
      if (!tokenToUse) return;

      const userData = await getUserByNipp(tokenToUse);
      const orderData = await getOrderByNipp(tokenToUse);

      // Reconstruct total quota
      if (userData) {
        const remainingFromUser = Number(userData.penetapan ?? 0);
        const orderCountFromServer = Array.isArray(orderData)
          ? orderData.length
          : 0;
        const initialTotalQuota = remainingFromUser + orderCountFromServer;

        setRemainingQuota(remainingFromUser);
        setMaxMembers(initialTotalQuota);
      }

      setupMembers(orderData, userData);
    };
    loadData();
  }, [isDataLoaded]);

  // --------------------
  // Utility helpers for counts & validation
  // --------------------
  const getCounts = () => {
    const orderCount = members.filter((m) => m.fromOrder).length;
    const newCount = members.filter((m) => !m.fromOrder && !m.fromUser).length;
    const userCount = members.filter((m) => m.fromUser).length;

    return { orderCount, newCount, userCount };
  };

  const canAddMember = () => {
    const { orderCount, newCount } = getCounts();

    // PERBAIKAN: Hitung berapa yang akan dikirim ke backend
    let willSendToBackend = 0;

    // HANYA jika pegawai hadir, tambah 1
    if (statusHadir === STATUS_HADIR) {
      willSendToBackend += 1;
    }

    // Tambah anggota dari order (yang bukan nama pegawai)
    willSendToBackend += orderCount;

    // Tambah anggota baru
    willSendToBackend += newCount;

    // PERBAIKAN: Bandingkan dengan maxMembers (penetapan total)
    return willSendToBackend < maxMembers;
  };

  // --------------------
  // Handlers
  // --------------------
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
      alert(`Tidak bisa menambahkan anggota. Kuota maksimal: ${maxMembers}.`);
      return;
    }
    const newId = Date.now();
    setMembers((prev) => [
      ...prev,
      { id: newId, name: "", fromOrder: false, fromUser: false },
    ]);
  };

  // --------------------
  // Submit order
  // --------------------
  const submitOrder = async (e) => {
    e.preventDefault();
    const tokenToUse = await ensureToken();
    if (!tokenToUse) {
      alert("Token tidak tersedia. Silakan login ulang.");
      return;
    }

    // --- NEW: Validate dropdowns before submission ---
    if (!lokasi || !transportasi) {
      alert(
        "Harap pilih lokasi keberangkatan dan jenis transportasi terlebih dahulu."
      );
      return;
    }
    // ------------------------------------------------

    // Prepare final names array
    let finalNames = [];

    // 1. Jika pegawai hadir, tambahkan nama pegawai di awal
    const userName = userFromUsers?.name?.trim();
    if (statusHadir === STATUS_HADIR && userName) {
      finalNames.push(userName);
    }

    // 2. Tambahkan anggota dari order existing (skip jika sama dengan nama pegawai)
    const existingOrderNames = members
      .filter((m) => m.fromOrder)
      .map((m) => (m.name ?? "").trim())
      .filter(Boolean);

    existingOrderNames.forEach((nm) => {
      const orderNameLower = nm.trim().toLowerCase();
      const userNameLower = (userName ?? "").trim().toLowerCase();

      // Skip jika nama order sama dengan nama pegawai
      if (orderNameLower !== userNameLower) {
        finalNames.push(nm);
      }
    });

    // 3. Tambahkan anggota baru
    const newNames = members
      .filter((m) => !m.fromOrder && !m.fromUser)
      .map((m) => (m.name ?? "").trim())
      .filter((n) => n && n !== "");

    finalNames = [...finalNames, ...newNames];

    // Remove duplicates (case insensitive)
    const uniqueNames = [];
    finalNames.forEach((name) => {
      const nameLower = name.trim().toLowerCase();
      if (
        !uniqueNames.find(
          (existing) => existing.trim().toLowerCase() === nameLower
        )
      ) {
        uniqueNames.push(name);
      }
    });

    if (uniqueNames.length === 0) {
      alert(
        "Harap masukkan setidaknya satu nama anggota atau pastikan pegawai hadir."
      );
      return;
    }

    // Validate against total quota
    if (uniqueNames.length > maxMembers) {
      alert(
        `Jumlah anggota melebihi kuota (${maxMembers}). Hapus beberapa anggota terlebih dahulu.`
      );
      return;
    }

    try {
      // Gunakan PUT untuk update existing order, bukan POST
      const method = hasExistingOrder ? "put" : "post";
      const response = await axios[method](
        `${BASE_URL}/order${hasExistingOrder ? `/${nipp}` : ""}`,
        // --- MODIFIED: Add lokasi and transportasi to payload ---
        {
          nipp,
          nama: uniqueNames,
          status: statusHadir,
          lokasi,
          transportasi,
        },
        // --------------------------------------------------------
        {
          headers: {
            Authorization: `Bearer ${tokenToUse}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert("Tiket berhasil didaftarkan!");
      navigate("/qrresult", { state: { nipp } });
    } catch (error) {
      console.error("Error saat mendaftarkan tiket:", error);

      // Log detail error untuk debugging
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
      }

      const errorMessage =
        error.response?.data?.msg ||
        error.response?.data?.message ||
        "Gagal mencetak tiket.";
      alert(`Error: ${errorMessage}`);
    }
  };

  // --------------------
  // Derived UI values
  // --------------------
  const { orderCount, newCount } = getCounts();

  // Hitung yang akan dikirim ke backend untuk display
  // PENTING: Jika pegawai tidak hadir, dia tidak dihitung dalam quota
  let currentUsed = 0;

  // Hanya tambahkan pegawai jika status hadir
  if (statusHadir === STATUS_HADIR) {
    currentUsed += 1;
  }

  // Tambahkan anggota existing (dari order sebelumnya)
  currentUsed += orderCount;

  // Tambahkan anggota baru yang sedang ditambahkan
  currentUsed += newCount;

  const availableSlots = Math.max(0, maxMembers - currentUsed);

  // --------------------
  // Render helpers
  // --------------------
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

  // --------------------
  // Render
  // --------------------
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4"
      style={{ backgroundColor: "#406017" }}
    >
      <div className="max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Tambah Anggota Keluarga
          </h1>
          <p className="text-gray-600">
            Masukkan data anggota keluarga untuk mendaftarkan tiket.
          </p>
          {isDataLoaded && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 text-sm">
                <strong>Info:</strong> Anda memiliki {maxMembers} kuota untuk
                mendaftar.
              </p>
            </div>
          )}
          {hasExistingOrder && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-blue-800 text-sm">
                <strong>Info:</strong> Anda sudah memiliki pendaftaran
                sebelumnya. Data di bawah ini tidak dapat diubah.
              </p>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* --- NEW: Location and Transportation Dropdowns --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label
                htmlFor="lokasi"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Lokasi Keberangkatan
              </label>
              <select
                id="lokasi"
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                disabled={hasExistingOrder}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  hasExistingOrder
                    ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                    : "bg-white"
                }`}
              >
                <option value="" disabled>
                  Pilih Lokasi
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
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Transportasi
              </label>
              <select
                id="transportasi"
                value={transportasi}
                onChange={(e) => setTransportasi(e.target.value)}
                disabled={hasExistingOrder}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  hasExistingOrder
                    ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                    : "bg-white"
                }`}
              >
                <option value="" disabled>
                  Pilih Transportasi
                </option>
                {TRANSPORTASI_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt.charAt(0).toUpperCase() + opt.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* --------------------------------------------------- */}

          <div className="space-y-4">
            {members.length > 0 ? (
              members.map((member, index) => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        member.fromOrder || member.fromUser
                          ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                          : "bg-white text-gray-900"
                      }`}
                    />
                  </div>

                  {/* Status - hanya untuk data pegawai */}
                  {member.fromUser && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      {hasExistingOrder ? (
                        <div className="px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600">
                          {statusHadir === STATUS_HADIR
                            ? "Hadir"
                            : "Tidak Hadir"}
                        </div>
                      ) : (
                        <select
                          value={statusHadir}
                          onChange={(e) => setStatusHadir(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={STATUS_HADIR}>Hadir</option>
                          <option value={STATUS_TIDAK}>Tidak Hadir</option>
                        </select>
                      )}
                    </div>
                  )}

                  {/* Tombol hapus hanya untuk anggota tambahan */}
                  {!member.fromOrder && !member.fromUser && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.id)}
                      className="mt-6 px-3 py-2 text-red-600 hover:bg-red-50 border border-red-300 rounded-md transition-colors duration-200 text-sm font-medium"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Memuat data...</p>
              </div>
            )}
          </div>

          {/* Tambah anggota */}
          <div className="flex justify-end mt-4">
            {isDataLoaded && !hasExistingOrder && availableSlots > 0 && (
              <button
                type="button"
                onClick={handleAddMember}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 border border-blue-300 rounded-md transition-colors duration-200 text-sm font-medium"
              >
                Tambah Anggota
              </button>
            )}
          </div>

          {/* Submit / Lihat Tiket */}
          {isDataLoaded && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              {hasExistingOrder ? (
                <button
                  type="button"
                  onClick={() => navigate("/qrresult", { state: { nipp } })}
                  className="w-full py-3 px-6 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 text-white hover:bg-blue-700"
                  style={{ backgroundColor: "#406017" }}
                >
                  Lihat Tiket
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submitOrder}
                  disabled={currentUsed === 0}
                  className={`w-full py-3 px-6 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 ${
                    currentUsed === 0
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "text-white hover:bg-blue-700"
                  }`}
                  style={{
                    backgroundColor: currentUsed === 0 ? undefined : "#406017",
                  }}
                >
                  {currentUsed === 0
                    ? "Tidak ada anggota untuk didaftarkan"
                    : "Daftar"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddMemberPage;