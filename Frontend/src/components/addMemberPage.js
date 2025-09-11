import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";

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
  const nippParam = location.state?.nipp;
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [userFromUsers, setUserFromUsers] = useState(null);
  const [maxMembers, setMaxMembers] = useState(0);
  const [remainingQuota, setRemainingQuota] = useState(0);
  const [hasExistingOrder, setHasExistingOrder] = useState(false);
  const [statusHadir, setStatusHadir] = useState(STATUS_HADIR);
  const [lokasi, setLokasi] = useState("");
  const [transportasi, setTransportasi] = useState("");
  const [allowed, setAllowed] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // ==== auth check ====
  useEffect(() => {
    const token = localStorage.getItem("token");
    const nippLocal = localStorage.getItem("nipp");
    if (!token || !nippLocal) {
      navigate("/");
      return;
    }
    try {
      jwtDecode(token); // hanya untuk cek valid
      setAllowed(true);
    } catch {
      navigate("/");
    }
  }, [navigate]);

  // ==== fetch data ====
  useEffect(() => {
    const loadData = async () => {
      try {
        const userRes = await api.get(`/users/${nippParam}`);
        const userData = userRes.data.data;

        setUserFromUsers({
          id: "user-main",
          name: userData.nama,
          fromUser: true,
        });

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

        const remaining = Number(userData.penetapan ?? 0);
        const initialTotal = remaining + orderMembersList.length;
        setRemainingQuota(remaining);
        setMaxMembers(initialTotal);

        // gabung user + anggota order (hindari duplikat user)
        const merged = [
          { id: "user-main", name: userData.nama, fromUser: true },
          ...orderMembersList.filter(
            (o) =>
              o.name.trim().toLowerCase() !== userData.nama.trim().toLowerCase()
          ),
        ];
        setMembers(merged);
        setIsDataLoaded(true);
      } catch (err) {
        console.error("Gagal memuat data:", err);
      }
    };

    if (allowed && nippParam) loadData();
  }, [allowed, nippParam]);

  // ==== helper kuota ====
  const currentUsed = (() => {
    let count = members.filter((m) => m.fromOrder).length;
    count += members.filter((m) => !m.fromOrder && !m.fromUser).length;
    if (statusHadir === STATUS_HADIR) count += 1;
    return count;
  })();
  const availableSlots = Math.max(0, maxMembers - currentUsed);

  // ==== handlers ====
  const handleAddMember = () => {
    if (currentUsed >= maxMembers) {
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
      prev.filter((m) => !(m.id === id && !m.fromOrder && !m.fromUser))
    );

  const submitOrder = async (e) => {
    e.preventDefault();
    if (!lokasi || !transportasi) {
      alert("Pilih lokasi dan transportasi");
      return;
    }

    const userName = userFromUsers?.name?.trim();
    let finalNames = [];

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

    // hapus duplikat case-insensitive
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

  // ==== render helper ====
  const getMemberLabel = (member, index) => {
    if (member.fromUser)
      return hasExistingOrder ? "Data Pegawai (Terkunci)" : "Data Pegawai";
    if (member.fromOrder) return `Anggota Terdaftar ${index}`;
    return "Anggota Tambahan";
  };
  const getMemberPlaceholder = (member) =>
    member.fromUser
      ? "Nama pegawai"
      : member.fromOrder
      ? "Nama sudah terdaftar"
      : "Masukkan nama anggota";

  // ==== JSX ====
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4"
      style={{ backgroundColor: "#406017" }}
    >
      <div className="max-w-2xl mx-auto w-full">
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

        <div className="bg-white rounded-lg shadow-sm p-6">
          {/* Dropdown lokasi & transport */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lokasi Keberangkatan
              </label>
              <select
                value={lokasi}
                onChange={(e) => setLokasi(e.target.value)}
                disabled={hasExistingOrder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="" disabled>
                  Pilih Lokasi
                </option>
                {LOKASI_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transportasi
              </label>
              <select
                value={transportasi}
                onChange={(e) => setTransportasi(e.target.value)}
                disabled={hasExistingOrder}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="" disabled>
                  Pilih Transportasi
                </option>
                {TRANSPORTASI_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* daftar anggota */}
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
                      className={`w-full px-3 py-2 border rounded-md ${
                        member.fromOrder || member.fromUser
                          ? "bg-gray-100"
                          : "bg-white"
                      }`}
                    />
                  </div>

                  {member.fromUser && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      {hasExistingOrder ? (
                        <div className="px-3 py-2 border rounded-md bg-gray-100">
                          {statusHadir === STATUS_HADIR
                            ? "Hadir"
                            : "Tidak Hadir"}
                        </div>
                      ) : (
                        <select
                          value={statusHadir}
                          onChange={(e) => setStatusHadir(e.target.value)}
                          className="px-3 py-2 border rounded-md"
                        >
                          <option value={STATUS_HADIR}>Hadir</option>
                          <option value={STATUS_TIDAK}>Tidak Hadir</option>
                        </select>
                      )}
                    </div>
                  )}

                  {!member.fromOrder && !member.fromUser && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.id)}
                      className="mt-6 px-3 py-2 text-red-600 border border-red-300 rounded-md"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                Memuat data...
              </div>
            )}
          </div>

          {/* tombol tambah */}
          <div className="flex justify-end mt-4">
            {isDataLoaded && !hasExistingOrder && availableSlots > 0 && (
              <button
                type="button"
                onClick={handleAddMember}
                className="px-4 py-2 text-blue-600 border border-blue-300 rounded-md"
              >
                Tambah Anggota
              </button>
            )}
          </div>

          {/* submit */}
          {isDataLoaded && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              {hasExistingOrder ? (
                <button
                  type="button"
                  onClick={() =>
                    navigate("/qrresult", { state: { nipp: nippParam } })
                  }
                  className="w-full py-3 px-6 rounded-md text-white"
                  style={{ backgroundColor: "#406017" }}
                >
                  Lihat Tiket
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submitOrder}
                  disabled={currentUsed === 0}
                  className={`w-full py-3 px-6 rounded-md text-white ${
                    currentUsed === 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "hover:bg-blue-700"
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
