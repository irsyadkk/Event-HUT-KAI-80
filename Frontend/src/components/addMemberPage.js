import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api"; // Pastikan path ini benar

const AddMemberPage = () => {
  const location = useLocation();
  const nipp = location.state?.nipp;
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [maxMembers, setMaxMembers] = useState(0);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

// Perbaikan #3: Bungkus fungsi dengan useCallback
  const getOrderByNipp = useCallback(async () => {
    if (!nipp) return;
    try {
      const response = await api.get(`/order/${nipp}`);
      const orderData = response.data.data;
      const namesFromOrders = Array.isArray(orderData?.nama) ? orderData.nama : [];
      const orderMembersList = namesFromOrders.map((nm, idx) => ({
        id: `order-${idx}`, name: nm, fromOrder: true,
      }));
      // setOrderMembers(orderMembersList); // Dihapus - Perbaikan #2
      setMembers(orderMembersList);
    } catch (error) {
      console.error("Gagal mengambil data order:", error);
      // Jika tidak ada order, set member menjadi array kosong
      setMembers([]);
    }
  }, [nipp]);

  const getUserByNipp = useCallback(async () => {
    if (!nipp) return;
    try {
      const response = await api.get(`/users/${nipp}`);
      const userData = response.data.data;
      setMaxMembers(userData.penetapan);
    } catch (error) {
      console.error("Gagal mengambil data pengguna:", error);
    }
  }, [nipp]);

  const submitOrder = async (e) => {
    e.preventDefault();
    const memberNames = members.filter((m) => !m.fromOrder).map((m) => m.name).filter((n) => n.trim() !== "");

    if (memberNames.length === 0) {
      alert("Harap masukkan setidaknya satu nama anggota tambahan.");
      return;
    }

    try {
      await api.post(`/order`, { nipp, nama: memberNames });
      alert("Tiket berhasil didaftarkan!");
      navigate("/qrresult", { state: { nipp } });
    } catch (error)  {
      const errorMessage = error.response?.data?.message || "Gagal mencetak tiket.";
      alert(errorMessage);
    }
  };

  useEffect(() => {
    const initData = async () => {
        try {
          await getUserByNipp();
          await getOrderByNipp();
          setIsDataLoaded(true);
        } catch (error) {
          console.error("Gagal memuat data awal:", error);
        }
    };
    initData();
  }, [nipp, getUserByNipp, getOrderByNipp]);

  const handleMemberNameChange = (id, newName) => {
    setMembers((prevMembers) =>
      prevMembers.map((member) =>
        member.id === id ? { ...member, name: newName } : member
      )
    );
  };

  const handleRemoveMember = (id) => {
    const target = members.find((m) => m.id === id);
    if (target?.fromOrder) return; // tidak bisa hapus yg dari order
    setMembers((prevMembers) =>
      prevMembers.filter((member) => member.id !== id)
    );
  };

  const handleAddMember = () => {
    const manualMembersCount = members.filter((m) => !m.fromOrder).length;
    if (manualMembersCount < maxMembers) {
      const newId = Date.now(); // unique id
      const newMember = { id: newId, name: "", fromOrder: false };
      setMembers((prevMembers) => [...prevMembers, newMember]);
    } else {
      alert(
        `Anda tidak bisa menambahkan lebih dari ${maxMembers} anggota tambahan.`
      );
    }
  };

  // jumlah penetapan hanya dihitung untuk manual, bukan yg dari order
  const manualCount = members.filter((m) => !m.fromOrder).length;

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4"
      style={{
        backgroundColor: "#406017",
      }}
    >
      <div className="max-w-2xl mx-auto w-full">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-semibold text-gray-800 mb-2">
            Tambah Anggota Keluarga
          </h1>
          <p className="text-gray-600">
            Masukkan data anggota keluarga untuk mendaftarkan tiket.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="space-y-4">
            {members.length > 0 ? (
              members.map((member, index) => (
                <div key={member.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {member.fromOrder
                        ? `Data Order ${index + 1}`
                        : `Anggota Tambahan ${index + 1}`}
                    </label>
                    <input
                      type="text"
                      value={member.name}
                      onChange={(e) =>
                        handleMemberNameChange(member.id, e.target.value)
                      }
                      readOnly={member.fromOrder}
                      placeholder={
                        member.fromOrder
                          ? "Nama dari order"
                          : "Masukkan nama anggota"
                      }
                      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${member.fromOrder
                          ? "bg-gray-100 text-gray-600 cursor-not-allowed"
                          : "bg-white text-gray-900"
                        }`}
                    />
                  </div>
                  {!member.fromOrder && (
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
                <p>Silakan Tambahkan Anggota Yang Ingin Didaftarkan.</p>
              </div>
            )}
          </div>

          <div className="flex justify-end mt-4">
            {isDataLoaded && manualCount < maxMembers && (
              <button
                type="button"
                onClick={handleAddMember}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 border border-blue-300 rounded-md transition-colors duration-200 text-sm font-medium"
              >
                Tambah Anggota
              </button>
            )}
          </div>

          {members.length > 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={submitOrder}
                className="w-full text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                style={{
                  backgroundColor: "#406017",
                }}
              >
                Daftarkan Anggota ({manualCount} dari {maxMembers} orang
                tambahan)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddMemberPage;
