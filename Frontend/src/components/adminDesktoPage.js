import React, { useState, useEffect, useCallback } from "react";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { ADMIN_NIPP } from "../utils";
import api from "../api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const AdminDesktopPage = () => {
  const navigate = useNavigate();

  const [searchNipp, setSearchNipp] = useState("");
  const [searchNippPegawai, setSearchNippPegawai] = useState("");
  const [searchResult, setSearchResult] = useState(null);
  const [searchPegawaiResult, setSearchPegawaiResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTambah, setIsLoadingTambah] = useState(false);
  const [isLoadingTambahPenetapan, setIsLoadingTambahPenetapan] =
    useState(false);
  const [isLoadingKurangPenetapan, setIsLoadingKurangPenetapan] =
    useState(false);
  const [isLoadingPegawai, setIsLoadingPegawai] = useState(false);
  const [messageCari, setMessageCari] = useState("");
  const [messageCariPegawai, setMessageCariPegawai] = useState("");
  const [messageTambah, setMessageTambah] = useState("");
  const [orderList, setOrderList] = useState([]);
  const [pickupList, setPickupList] = useState([]);
  const [quotaValue, setQuotaValue] = useState("");
  const [penetapanValueAdd, setPenetapanValueAdd] = useState("");
  const [quota, setQuota] = useState(0);
  const [quotaTotal, setQuotaTotal] = useState(0);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubOpen, setIsSubOpen] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [nippAdd, setNippAdd] = useState("");
  const [namaAdd, setNamaAdd] = useState("");
  const [penetapanAdd, setPenetapanAdd] = useState("");
  const [selectedTable, setSelectedTable] = useState("order");

  // ✅ cek token & role admin
  useEffect(() => {
    const token = localStorage.getItem("token");
    const nipp = localStorage.getItem("nipp");
    if (!token || !nipp) {
      navigate("/");
      return;
    }
    try {
      const decoded = jwtDecode(token);
      if (nipp !== ADMIN_NIPP) navigate("/");
      else setAllowed(true);
    } catch {
      navigate("/");
    }
  }, [navigate]);

  // ===================== API CALLS =====================
  const getAllOrders = useCallback(async () => {
    try {
      const res = await api.get("/order");
      setOrderList(res.data.data || []);
    } catch (err) {
      console.error("Gagal mengambil data order :", err);
    }
  }, []);

  const getAllPickups = useCallback(async () => {
    try {
      const res = await api.get("/pickup");
      setPickupList(res.data.data || []);
    } catch (err) {
      console.error("Gagal mengambil data pickup :", err);
    }
  }, []);

  const getQuota = useCallback(async () => {
    try {
      const res = await api.get("/quota");
      setQuota(res.data.data.quota);
      setQuotaTotal(res.data.data.total_quota);
    } catch (err) {
      console.error("Gagal mengambil data quota :", err);
    }
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchNipp.trim()) {
      setMessageCari({ text: "NIPP tidak boleh kosong!", type: "error" });
      return;
    }
    setIsLoading(true);
    try {
      const [orderRes, userRes] = await Promise.all([
        api.get(`/order/${searchNipp}`),
        api.get(`/users/${searchNipp}`),
      ]);
      const orderData = orderRes.data.data;
      const userData = userRes.data.data;

      setSearchResult({
        nipp: orderData.nipp,
        nama: userData.nama,
        penetapan: userData.penetapan,
        anggota: orderData.nama,
        qr: orderData.qr,
        transportasi: orderData.transportasi,
        keberangkatan: orderData.keberangkatan,
      });
      setMessageCari({ text: "Data ditemukan !", type: "success" });
    } catch (err) {
      console.error("Gagal mengambil data:", err);
      setMessageCari({
        text: "NIPP tidak ditemukan / belum mendaftar",
        type: "error",
      });
      setSearchResult(null);
    }
    setIsLoading(false);
  };

  const handleSearchPegawai = async (e) => {
    e.preventDefault();
    if (!searchNippPegawai.trim()) {
      setMessageCari({ text: "NIPP tidak boleh kosong!", type: "error" });
      return;
    }
    setIsLoadingPegawai(true);
    try {
      const res = await api.get(`/users/${searchNippPegawai}`);
      const userData = res.data.data;

      setSearchPegawaiResult({
        nipp: userData.nipp,
        nama: userData.nama,
        penetapan: userData.penetapan,
      });
      setMessageCariPegawai({ text: "Data ditemukan !", type: "success" });
    } catch (err) {
      console.error("Gagal mengambil data:", err);
      setMessageCariPegawai({
        text: "NIPP tidak ditemukan",
        type: "error",
      });
      setSearchPegawaiResult(null);
    }
    setIsLoadingPegawai(false);
  };

  // NOT FINISHED
  const handleAddPeserta = async (e) => {
    e.preventDefault();
    if (!searchNippPegawai.trim()) {
      //setMessageTambahPeserta({ text: "NIPP tidak boleh kosong!", type: "error" });
      return;
    }
    //setIsLoadingPeserta(true);
    try {
      const res = await api.post(`/addorderbyadmin`);
      //setMessageTambahPeserta({ text: "Data ditambahkan !", type: "success" });
    } catch (err) {
      console.error("Gagal menambahkan data:", err);
      setMessageCariPegawai({
        text: "NIPP tidak ditemukan",
        type: "error",
      });
    }
    //setIsLoadingTambahPeserta(false);
  };

  const exportExcelOrder = () => {
    if (!orderList || orderList.length === 0) return;

    const data = orderList.map((order, index) => ({
      No: index + 1,
      NIPP: order.nipp,
      "Anggota Keluarga": order.nama.join(", "),
      "Jumlah Anggota": order.nama.length,
      Transportasi: order.transportasi,
      Keberangkatan: order.keberangkatan,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Peserta");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, "DataPeserta.xlsx");
  };

  const exportExcelPickup = () => {
    if (!pickupList || pickupList.length === 0) return;

    const data = pickupList.map((pickup, index) => ({
      No: index + 1,
      Timestamp: pickup.timestamp,
      NIPP: pickup.nipp,
      Nama: pickup.nama,
      "Jumlah Kuota": pickup.jumlah_kuota,
      "Jenis Pengambilan": pickup.jenis_pengambilan,
      "Pos Pengambilan": pickup.pos_pengambilan,
      "NIPP Penanggung Jawab": pickup.nipp_pj,
      "Nama Penanggung Jawab": pickup.nama_pj,
      Status: pickup.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Pickup");

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    saveAs(blob, "DataPickup.xlsx");
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!nippAdd.trim() || !namaAdd.trim() || !penetapanAdd.trim()) {
      setMessageTambah({
        text: "NIPP, Nama, dan Jatah wajib diisi!",
        type: "error",
      });
      return;
    }
    setIsLoadingTambah(true);
    try {
      await api.post("/users", {
        nipp: nippAdd,
        nama: namaAdd,
        penetapan: Number(penetapanAdd),
      });
      setMessageTambah({
        text: `Berhasil menambahkan ${namaAdd} (${nippAdd})`,
        type: "success",
      });
      setNippAdd("");
      setNamaAdd("");
      setPenetapanAdd("");
      getAllOrders();
    } catch (err) {
      console.error("Gagal menambah user:", err);
      setMessageTambah({
        text: `Gagal menambahkan ${namaAdd}`,
        type: "error",
      });
    }
    setIsLoadingTambah(false);
  };

  const handleAddPenetapan = async (e) => {
    e.preventDefault();
    const value = Number(penetapanValueAdd);
    if (isNaN(value) || value <= 0) {
      alert("Jumlah Penetapan yang ditambahkan harus lebih dari 0!");
      return;
    }
    setIsLoadingTambahPenetapan(true);
    try {
      await api.patch(`/usersadd/${searchNippPegawai}`, { add: value });
      setPenetapanValueAdd("");
      setSearchPegawaiResult((prev) =>
        prev ? { ...prev, penetapan: prev.penetapan + value } : prev
      );
      alert(`Penetapan sebanyak ${value} berhasil ditambahkan !`);
    } catch (err) {
      console.error("Gagal menambah Penetapan:", err);
    }
    setIsLoadingTambahPenetapan(false);
  };

  const handleSubPenetapan = async (e) => {
    e.preventDefault();
    const value = Number(penetapanValueAdd);
    if (isNaN(value) || value > searchPegawaiResult.penetapan) {
      alert(
        "Jumlah Penetapan yang dikurangi harus lebih dari 0 & lebih banyak daripada penetapan !"
      );
      return;
    }
    setIsLoadingKurangPenetapan(true);
    try {
      await api.patch(`/userssub/${searchNippPegawai}`, { sub: value });
      setPenetapanValueAdd("");
      setSearchPegawaiResult((prev) =>
        prev ? { ...prev, penetapan: prev.penetapan - value } : prev
      );
      alert(`Penetapan sebanyak ${value} berhasil dikurangi !`);
    } catch (err) {
      console.error("Gagal menambah Penetapan:", err);
    }
    setIsLoadingKurangPenetapan(false);
  };

  const handleAddQuota = async () => {
    const value = Number(quotaValue);
    if (isNaN(value) || value <= 0) {
      alert("Jumlah kuota yang ditambahkan harus lebih dari 0!");
      return;
    }
    try {
      await api.patch("/addquota", { add: value });
      setIsAddOpen(false);
      setQuotaValue("");
      getQuota();
      alert(`Kuota sebanyak ${value} berhasil ditambahkan !`);
    } catch (err) {
      console.error("Gagal menambah kuota:", err);
    }
  };

  const handleSubQuota = async () => {
    const value = Number(quotaValue);
    if (isNaN(value) || value <= 0) {
      alert("Jumlah kuota yang dikurangi harus lebih dari 0!");
      return;
    }
    if (value > quota) {
      alert("Tidak bisa mengurangi kuota melebihi sisa kuota!");
      return;
    }
    try {
      await api.patch("/subquota", { sub: value });
      setIsSubOpen(false);
      setQuotaValue("");
      getQuota();
      alert(`Kuota sebanyak ${value} berhasil dikurangi !`);
    } catch (err) {
      console.error("Gagal mengurangi kuota:", err);
    }
  };

  const logout = async () => {
    try {
      await api.delete("/logout", { withCredentials: true });
    } catch (err) {
      console.error("Gagal logout:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("nipp");
      navigate("/");
    }
  };

  // initial load
  useEffect(() => {
    if (allowed) {
      getAllOrders();
      getAllPickups();
      getQuota();
    }
  }, [allowed, getAllOrders, getQuota]);

  // Download QR
  const downloadQRCode = () => {
    if (!searchResult || !searchResult.qr) return;

    const link = document.createElement("a");
    link.href = searchResult.qr;
    link.download = `QR-${searchResult.nipp}.png`;
    link.click();
  };

  if (!allowed) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 via-green-700 to-green-600 px-4 py-6 md:py-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 md:p-8 text-center border border-white/20">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={LogoKAI}
                alt="Logo HUT KAI 80"
                className="h-16 md:h-20 w-auto drop-shadow-lg"
              />
              <div className="text-left">
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Admin Panel
                </h1>
                <p className="text-white/80 text-sm md:text-base">
                  Manajemen Peserta & Kuota
                </p>
              </div>
            </div>
            <div className="flex gap-3">
            <button
                onClick={() => navigate("/qrpickup")}
                className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-700 hover:from-yellow-700 hover:to-orange-800 text-white rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 text-sm md:text-base font-medium"
              >
                Scan QR
              </button>
              <button
                onClick={logout}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 text-sm md:text-base font-medium"
              >
                Logout
              </button>
              </div>
          </div>
        </div>

        {/* Quota Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quota Stats */}
          <div className="lg:col-span-2 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              Status Kuota
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl">
                <p className="text-sm text-blue-600 font-medium">Sisa Kuota</p>
                <p className="text-2xl font-bold text-blue-800">{quota}</p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl">
                <p className="text-sm text-green-600 font-medium">
                  Total Kuota
                </p>
                <p className="text-2xl font-bold text-green-800">
                  {quotaTotal}
                </p>
              </div>
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl">
                <p className="text-sm text-orange-600 font-medium">Terdaftar</p>
                <p className="text-2xl font-bold text-orange-800">
                  {quotaTotal - quota}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Progress Pendaftaran
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round(((quotaTotal - quota) / quotaTotal) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${((quotaTotal - quota) / quotaTotal) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Quota Management */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Kelola Kuota
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => setIsAddOpen(true)}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 font-medium"
              >
                + Tambah Kuota
              </button>
              <button
                onClick={() => setIsSubOpen(true)}
                className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 font-medium"
              >
                - Kurangi Kuota
              </button>
            </div>
          </div>
        </div>

        {/* Modal Components */}
        {isAddOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 transform transition-all">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Tambah Kuota
              </h2>
              <input
                type="number"
                value={quotaValue}
                onChange={(e) => setQuotaValue(e.target.value)}
                placeholder="Masukkan jumlah kuota"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-6 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-all font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleAddQuota}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl transition-all font-medium"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}

        {isSubOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 transform transition-all">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Kurangi Kuota
              </h2>
              <input
                type="number"
                value={quotaValue}
                onChange={(e) => setQuotaValue(e.target.value)}
                placeholder="Masukkan jumlah kuota"
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-6 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setIsSubOpen(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-all font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubQuota}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all font-medium"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add User Section */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            Tambah Pegawai Baru
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              value={nippAdd}
              onChange={(e) => setNippAdd(e.target.value)}
              placeholder="Masukkan NIPP"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              disabled={isLoadingTambah}
            />
            <input
              type="text"
              value={namaAdd}
              onChange={(e) => setNamaAdd(e.target.value)}
              placeholder="Masukkan Nama"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              disabled={isLoadingTambah}
            />
            <input
              type="number"
              value={penetapanAdd}
              onChange={(e) => setPenetapanAdd(e.target.value)}
              placeholder="Masukkan Jatah"
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              disabled={isLoadingTambah}
            />
          </div>
          <button
            onClick={handleAddUser}
            className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 font-medium"
            disabled={isLoadingTambah}
          >
            {isLoadingTambah ? "Menambahkan..." : "Tambah Pegawai"}
          </button>
          {messageTambah && (
            <div
              className={`mt-4 p-4 rounded-xl ${
                messageTambah.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              <p className="font-medium">{messageTambah.text}</p>
            </div>
          )}
        </div>

        {/* Search Pegawai Section */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            Pencarian Pegawai
          </h2>
          <form
            onSubmit={handleSearchPegawai}
            className="flex flex-col sm:flex-row gap-4 mb-4"
          >
            <input
              type="text"
              value={searchNippPegawai}
              onChange={(e) => setSearchNippPegawai(e.target.value)}
              placeholder="Masukkan NIPP / NIPKWT"
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              disabled={isLoadingPegawai}
            />
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 font-medium"
              disabled={isLoadingPegawai}
            >
              {isLoadingPegawai ? "Mencari..." : "Cari Data"}
            </button>
          </form>
          {messageCariPegawai && (
            <div
              className={`mb-4 p-4 rounded-xl ${
                messageCariPegawai.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              <p className="font-medium">{messageCariPegawai.text}</p>
            </div>
          )}
        </div>

        {/* Search Pegawai Result */}
        {searchPegawaiResult && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              Detail Pegawai
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 font-medium">NIPP</p>
                  <p className="text-lg font-bold text-gray-800">
                    {searchPegawaiResult.nipp}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 font-medium">Nama</p>
                  <p className="text-lg font-bold text-gray-800">
                    {searchPegawaiResult.nama}
                  </p>
                </div>

                {/* Penetapan + input + 2 tombol */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 font-medium mb-2">
                    Penetapan
                  </p>
                  <div className="flex items-center gap-4">
                    <p className="text-lg font-bold text-gray-800">
                      {searchPegawaiResult.penetapan}
                    </p>

                    <form
                      onSubmit={(e) => e.preventDefault()}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="number"
                        value={penetapanValueAdd}
                        onChange={(e) => setPenetapanValueAdd(e.target.value)}
                        placeholder="Jumlah..."
                        className="w-28 border-2 border-gray-200 rounded-xl px-3 py-1
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        disabled={isLoading}
                      />
                      {/* Tombol Tambah */}
                      <button
                        type="button"
                        onClick={handleAddPenetapan}
                        className="px-4 py-1 bg-gradient-to-r from-blue-600 to-blue-700
                           hover:from-blue-700 hover:to-blue-800 text-white rounded-xl
                           shadow transition-all font-medium"
                        disabled={isLoadingTambahPenetapan}
                      >
                        {isLoadingTambahPenetapan
                          ? "Menambahkan..."
                          : "Tambah Penetapan"}
                      </button>

                      {/* Tombol Kurang */}
                      <button
                        type="button"
                        onClick={handleSubPenetapan}
                        className="px-4 py-1 bg-gradient-to-r from-red-600 to-red-700
                           hover:from-red-700 hover:to-red-800 text-white rounded-xl
                           shadow transition-all font-medium"
                        disabled={isLoadingKurangPenetapan}
                      >
                        {isLoadingKurangPenetapan
                          ? "Mengurangi..."
                          : "Kurangi Penetapan"}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            Pencarian Peserta
          </h2>
          <form
            onSubmit={handleSearch}
            className="flex flex-col sm:flex-row gap-4 mb-4"
          >
            <input
              type="text"
              value={searchNipp}
              onChange={(e) => setSearchNipp(e.target.value)}
              placeholder="Masukkan NIPP / NIPKWT"
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 font-medium"
              disabled={isLoading}
            >
              {isLoading ? "Mencari..." : "Cari Data"}
            </button>
          </form>
          {messageCari && (
            <div
              className={`mb-4 p-4 rounded-xl ${
                messageCari.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              <p className="font-medium">{messageCari.text}</p>
            </div>
          )}
        </div>

        {/* Search Result */}
        {searchResult && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              Detail Registrasi
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 font-medium">NIPP</p>
                  <p className="text-lg font-bold text-gray-800">
                    {searchResult.nipp}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 font-medium">Nama</p>
                  <p className="text-lg font-bold text-gray-800">
                    {searchResult.nama}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 font-medium">Penetapan</p>
                  <p className="text-lg font-bold text-gray-800">
                    {searchResult.penetapan}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 font-medium mb-2">
                    Anggota Terdaftar
                  </p>
                  {searchResult.anggota && searchResult.anggota.length > 0 ? (
                    <ol className="list-decimal list-inside space-y-1">
                      {searchResult.anggota.map((item, index) => (
                        <li key={index} className="text-gray-700">
                          {item}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-gray-500">Belum ada anggota terdaftar</p>
                  )}
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 font-medium">
                    Transportasi
                  </p>
                  <p className="text-lg text-gray-800">
                    {searchResult.transportasi}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 font-medium">
                    Keberangkatan
                  </p>
                  <p className="text-lg text-gray-800">
                    {searchResult.keberangkatan}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center">
                <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-gray-100">
                  <img
                    src={searchResult.qr}
                    alt="QR Code"
                    className="w-48 h-48 object-contain"
                  />
                </div>
                <button
                  onClick={downloadQRCode}
                  className="mt-6 px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 font-medium"
                >
                  Download QR Code
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              {selectedTable === "order"
                ? "Data Peserta Terdaftar"
                : "Data Pickup"}
            </h2>
            {selectedTable === "order" ? (
              <button
                onClick={exportExcelOrder}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 text-sm md:text-base font-medium"
              >
                Export Data Peserta Terdaftar ke Excel (.xlsx)
              </button>
            ) : (
              <button
                onClick={exportExcelPickup}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 text-sm md:text-base font-medium"
              >
                Export Data Pickup ke Excel (.xlsx)
              </button>
            )}
            {/* tombol switch table */}
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedTable("order")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedTable === "order"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Order
              </button>
              <button
                onClick={() => setSelectedTable("pickup")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedTable === "pickup"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Pickup
              </button>
            </div>
          </div>

          {selectedTable === "order" ? (
            /* ---------- TABEL ORDER ---------- */
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      No
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      NIPP
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Anggota Keluarga
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Jumlah Anggota
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Transportasi
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Keberangkatan
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orderList.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
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
                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-6m-5 0h-6m6 0a2 2 0 100-4 2 2 0 000 4zm-6 0a2 2 0 100-4 2 2 0 000 4z"
                              ></path>
                            </svg>
                          </div>
                          <p className="font-medium">
                            Belum ada data peserta !
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    orderList.map((order, index) => (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                            {order.nipp}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            {order.nama.map((n, nameIndex) => (
                              <div
                                key={nameIndex}
                                className="flex items-center gap-2"
                              >
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                <span className="text-sm text-gray-700">
                                  {n}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {order.nama.length ?? "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {order.transportasi ?? "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {order.keberangkatan ?? "-"}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => {
                              navigate("/detailregister", {
                                state: { nipp: order.nipp },
                              });
                            }}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white text-sm font-medium rounded-lg shadow transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* ---------- TABEL PICKUP ---------- */
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      No
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Timestamp
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      NIPP
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Nama
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Jumlah Kuota
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      Jenis Pengambilan
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                      Pos Pengambilan
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                      NIPP Penanggung Jawab
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                      Nama Penanggung Jawab
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pickupList.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
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
                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-6m-5 0h-6m6 0a2 2 0 100-4 2 2 0 000 4zm-6 0a2 2 0 100-4 2 2 0 000 4z"
                              ></path>
                            </svg>
                          </div>
                          <p className="font-medium">Belum ada data pickup !</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    pickupList.map((pickup, index) => (
                      <tr
                        key={pickup.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {pickup.timestamp ?? "-"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                            {pickup.nipp}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {pickup.nama ?? "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {pickup.jumlah_kuota ?? "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {pickup.jenis_pengambilan ?? "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {pickup.pos_pengambilan ?? "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {pickup.nipp_pj ?? "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {pickup.nama_pj ?? "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {pickup.status ?? "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDesktopPage;
