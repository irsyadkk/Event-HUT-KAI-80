import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api"; // Menggunakan modul API terpusat

const STATUS_HADIR = "hadir";
const STATUS_TIDAK = "tidak hadir";

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

  // --------------------
  // API Calls (using api.js and useCallback)
  // --------------------
  const getOrderByNipp = useCallback(async () => {
    if (!nipp) return [];
    try {
      const response = await api.get(`/order/${nipp}`);
      const orderData = response.data.data;
      const namesFromOrders = Array.isArray(orderData?.nama) ? orderData.nama : [];
      return namesFromOrders.map((nm, idx) => ({
        id: `order-${idx}`, name: nm, fromOrder: true,
      }));
    } catch (error) {
      console.error("Gagal mengambil data order:", error);
      return [];
    }
  }, [nipp]);

  const getUserByNipp = useCallback(async () => {
    if (!nipp) return null;
    try {
      const response = await api.get(`/users/${nipp}`);
      return response.data.data;
    } catch (error) {
      console.error("Gagal mengambil data pengguna:", error);
      return null;
    }
  }, [nipp]);

  // --------------------
  // Initial Data Loading Effect
  // --------------------
  useEffect(() => {
    const initData = async () => {
      const userData = await getUserByNipp();
      if (!userData) {
        setIsDataLoaded(true);
        return;
      }

      const orderMembersList = await getOrderByNipp();
      
      setUserFromUsers({ id: "user-main", name: userData.nama, fromUser: true });
      
      const remainingFromUser = Number(userData.penetapan ?? 0);
      const orderCountFromServer = orderMembersList.length;
      setMaxMembers(remainingFromUser + orderCountFromServer);

      let finalMembers = [];
      finalMembers.push({ id: "user-main", name: userData.nama, fromUser: true });

      if (orderMembersList.length > 0) {
        setHasExistingOrder(true);
        const firstOrderName = (orderMembersList[0]?.name ?? "").trim().toLowerCase();
        const userName = (userData.nama ?? "").trim().toLowerCase();
        
        if (firstOrderName === userName) {
            setStatusHadir(STATUS_HADIR);
            // Hapus nama pegawai dari daftar order agar tidak duplikat
            finalMembers.push(...orderMembersList.slice(1));
        } else {
            setStatusHadir(STATUS_TIDAK);
            finalMembers.push(...orderMembersList);
        }
      }
      setMembers(finalMembers);
      setIsDataLoaded(true);
    };
    initData();
  }, [nipp, getUserByNipp, getOrderByNipp]);
  
  // --------------------
  // Submit Logic
  // --------------------
  const submitOrder = async (e) => {
    e.preventDefault();
    let finalNames = [];
    const userName = userFromUsers?.name?.trim();

    if (statusHadir === STATUS_HADIR && userName) {
      finalNames.push(userName);
    }
    
    const otherMembers = members
      .filter(m => !m.fromUser)
      .map(m => m.name.trim())
      .filter(Boolean);
    
    finalNames = [...finalNames, ...otherMembers];
    const uniqueNames = [...new Set(finalNames)];
    
    if (uniqueNames.length === 0 && statusHadir === STATUS_TIDAK) {
      alert("Harap masukkan setidaknya satu nama anggota atau ubah status pegawai menjadi Hadir.");
      return;
    }

    try {
      const method = hasExistingOrder ? "put" : "post";
      const url = hasExistingOrder ? `/order/${nipp}` : "/order";
      
      await api[method](url, { nipp, nama: uniqueNames });

      alert("Tiket berhasil didaftarkan!");
      navigate("/qrresult", { state: { nipp } });
    } catch (error) {
      console.error("Error saat mendaftarkan tiket:", error);
      const errorMessage = error.response?.data?.message || "Gagal mencetak tiket.";
      alert(`Error: ${errorMessage}`);
    }
  };

  // --------------------
  // UI Handlers
  // --------------------
  const handleMemberNameChange = (id, newName) => {
    setMembers(prev => prev.map(m => (m.id === id ? { ...m, name: newName } : m)));
  };

  const handleRemoveMember = (id) => {
    const target = members.find((m) => m.id === id);
    if (target?.fromOrder || target?.fromUser) return;
    setMembers(prev => prev.filter(member => member.id !== id));
  };

  const handleAddMember = () => {
    const currentCount = members.filter(m => !m.fromUser).length;
    // Max members dikurangi 1 (untuk pegawai itu sendiri)
    if (currentCount < (maxMembers > 0 ? maxMembers - 1 : 0)) {
        const newId = Date.now();
        setMembers(prev => [...prev, { id: newId, name: "", fromOrder: false, fromUser: false }]);
    } else {
        alert(`Anda tidak bisa menambahkan lebih dari ${maxMembers - 1} anggota keluarga.`);
    }
  };

  // --------------------
  // Derived state for UI
  // --------------------
  const newCount = members.filter(m => !m.fromUser && !m.fromOrder).length;
  let currentUsed = members.filter(m => !m.fromUser).length;
  if(statusHadir === STATUS_HADIR) {
    currentUsed += 1;
  }
  
  // Render JSX from version (B)
  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4"
      style={{ backgroundColor: "#406017" }}
    >
      <div className="max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Ubah Pendaftaran Anggota
          </h1>
          <p className="text-gray-600">
            Perbarui data anggota keluarga untuk pendaftaran tiket.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-4">
            {!isDataLoaded ? (
                <div className="text-center py-8 text-gray-500">Memuat data...</div>
            ) : members.map((member, index) => (
              <div key={member.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {member.fromUser ? 'Pegawai' : `Anggota Keluarga ${index}`}
                  </label>
                  <input
                    type="text"
                    value={member.name || ""}
                    onChange={(e) => handleMemberNameChange(member.id, e.target.value)}
                    readOnly={member.fromUser}
                    placeholder={member.fromUser ? "Nama pegawai" : "Masukkan nama anggota"}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                      member.fromUser
                        ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                        : "bg-white text-gray-900"
                    }`}
                  />
                </div>
                {member.fromUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status Kehadiran
                    </label>
                    <select
                      value={statusHadir}
                      onChange={(e) => setStatusHadir(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value={STATUS_HADIR}>Hadir</option>
                      <option value={STATUS_TIDAK}>Tidak Hadir</option>
                    </select>
                  </div>
                )}
                {!member.fromOrder && !member.fromUser && (
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(member.id)}
                    className="mt-6 px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    Hapus
                  </button>
                )}
              </div>
            ))}
          </div>
          
          {/* Add member button and quota info */}
          <div className="flex justify-between items-center mt-4">
            {isDataLoaded && (
              <div className="text-sm text-gray-600">
                  <strong>Kuota Terpakai:</strong> {currentUsed} / {maxMembers}
              </div>
            )}
            {isDataLoaded && currentUsed < maxMembers && (
              <button
                type="button"
                onClick={handleAddMember}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-md text-sm font-medium"
              >
                + Tambah Anggota
              </button>
            )}
          </div>

          {/* Submit Button */}
          {isDataLoaded && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={submitOrder}
                className="w-full text-white py-3 px-6 rounded-md font-medium"
                style={{ backgroundColor: "#406017" }}
              >
                {hasExistingOrder ? "Update Pendaftaran" : "Daftarkan Anggota"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddMemberPage;