import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import { BASE_URL } from "../utils";

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
  const nippParam = location.state?.nipp; // nipp dari halaman sebelumnya
  const navigate = useNavigate();

  // === state ===
  const [members, setMembers] = useState([]);
  const [userFromUsers, setUserFromUsers] = useState(null);
  const [maxMembers, setMaxMembers] = useState(0);
  const [remainingQuota, setRemainingQuota] = useState(0);
  const [hasExistingOrder, setHasExistingOrder] = useState(false);
  const [statusHadir, setStatusHadir] = useState(STATUS_HADIR);
  const [lokasi, setLokasi] = useState("");
  const [transportasi, setTransportasi] = useState("");
  const [allowed, setAllowed] = useState(false);

  // ================= TOKEN & AUTH =================
  useEffect(() => {
    const token = localStorage.getItem("token");
    const nippLocal = localStorage.getItem("nipp");

    if (!token || !nippLocal) {
      navigate("/");
      return;
    }
    try {
      const decoded = jwtDecode(token);
      // opsional: bisa cek expired di sini
      setAllowed(true);
    } catch {
      navigate("/");
    }
  }, [navigate]);

  // ================= API CALLS =================
  const loadData = async () => {
    try {
      // user info
      const userRes = await api.get(`/users/${nippParam}`);
      const userData = userRes.data.data;
      setUserFromUsers({
        id: "user-main",
        name: userData.nama,
        fromUser: true,
      });

      // order info
      const orderRes = await api.get(`/order/${nippParam}`);
      const orderData = orderRes.data.data || {};
      const orderNames = Array.isArray(orderData.nama) ? orderData.nama : [];
      setLokasi(orderData.lokasi || "");
      setTransportasi(orderData.transportasi || "");

      const orderMembersList = orderNames.map((nm, i) => ({
        id: `order-${i}`,
        name: nm,
        fromOrder: true,
      }));
      setHasExistingOrder(orderMembersList.length > 0);

      // hitung quota
      const remaining = Number(userData.penetapan ?? 0);
      const initialTotal = remaining + orderMembersList.length;
      setRemainingQuota(remaining);
      setMaxMembers(initialTotal);

      // gabungkan user + order
      const first = {
        id: "user-main",
        name: userData.nama,
        fromUser: true,
      };
      const merged = [
        first,
        ...orderMembersList.filter(
          (o) =>
            o.name.trim().toLowerCase() !== userData.nama.trim().toLowerCase()
        ),
      ];
      setMembers(merged);
    } catch (err) {
      console.error("Gagal memuat data:", err);
    }
  };

  useEffect(() => {
    if (allowed && nippParam) loadData();
  }, [allowed, nippParam]);

  // ================= HANDLERS =================
  const handleAddMember = () => {
    if (members.length >= maxMembers) {
      alert(`Kuota maksimal ${maxMembers}`);
      return;
    }
    setMembers((prev) => [
      ...prev,
      { id: Date.now(), name: "", fromOrder: false, fromUser: false },
    ]);
  };

  const handleMemberNameChange = (id, newName) =>
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, name: newName } : m))
    );

  const handleRemoveMember = (id) =>
    setMembers((prev) =>
      prev.filter((m) => m.id !== id || m.fromOrder || m.fromUser)
    );

  const submitOrder = async (e) => {
    e.preventDefault();
    if (!lokasi || !transportasi) {
      alert("Pilih lokasi dan transportasi");
      return;
    }

    let finalNames = [];
    const userName = userFromUsers?.name?.trim();
    if (statusHadir === STATUS_HADIR && userName) finalNames.push(userName);

    members
      .filter((m) => m.fromOrder)
      .forEach((m) => {
        if (m.name.trim().toLowerCase() !== userName?.toLowerCase())
          finalNames.push(m.name.trim());
      });

    members
      .filter((m) => !m.fromOrder && !m.fromUser)
      .forEach((m) => m.name && finalNames.push(m.name.trim()));

    finalNames = [...new Set(finalNames.map((n) => n.toLowerCase()))].map(
      (lower) => finalNames.find((n) => n.toLowerCase() === lower)
    );

    if (finalNames.length === 0) {
      alert("Masukkan setidaknya satu nama");
      return;
    }
    if (finalNames.length > maxMembers) {
      alert(`Melebihi kuota (${maxMembers})`);
      return;
    }

    try {
      const method = hasExistingOrder ? "put" : "post";
      await api[method](`/order${hasExistingOrder ? `/${nippParam}` : ""}`, {
        nipp: nippParam,
        nama: finalNames,
        status: statusHadir,
        lokasi,
        transportasi,
      });
      alert("Tiket berhasil didaftarkan!");
      navigate("/qrresult", { state: { nipp: nippParam } });
    } catch (err) {
      console.error(err);
      alert("Gagal mendaftar");
    }
  };

  if (!allowed) return null;

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
