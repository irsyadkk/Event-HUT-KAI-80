import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, UserPlus } from "lucide-react";
import * as XLSX from "xlsx";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";
import api from "../api.js";
import { getUserRole } from "../getUserRole.js";

const AdminManagePage = () => {
  const role = getUserRole();
  const navigate = useNavigate();

  // akses & data
  const [allowed, setAllowed] = useState(false);
  const [adminList, setAdminList] = useState([]);
  const [SuperAdminList, setSuperAdminList] = useState([]);

  // loading states
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [isSuperAdminLoading, setIsSuperAdminLoading] = useState(false);
  const [isLoadingDeleteAdmin, setIsLoadingDeleteAdmin] = useState(false);
  const [isLoadingDeleteSuperAdmin, setIsLoadingDeleteSuperAdmin] =
    useState(false);
  const [isLoadingResetAdminPass, setIsLoadingResetAdminPass] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // UI & form states
  const [selectedTable, setSelectedTable] = useState("admin");
  const [newPassword, setNewPassword] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedNippReset, setSelectedNippReset] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [nipp, setNipp] = useState("");
  const [password, setPassword] = useState("");
  const [roleInput, setRoleInput] = useState("admin");
  const [message, setMessage] = useState(null);

  const [totalAdmin, setTotalAdmin] = useState(0);
  const [totalSuperAdmin, setTotalSuperAdmin] = useState(0);

  // search
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchMessage, setSearchMessage] = useState(null);
  const [searchResult, setSearchResult] = useState(null);
  const [searchNipp, setSearchNipp] = useState("");

  // Import / Reset / Export states
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const [exporting, setExporting] = useState(false);

  // ===== Guard =====
  useEffect(() => {
    const token = localStorage.getItem("token");
    const nippLocal = localStorage.getItem("nipp");
    if (!token || !nippLocal) {
      navigate("/");
      return;
    }
    try {
      if (role !== "superadmin") navigate("/");
      else setAllowed(true);
    } catch {
      navigate("/");
    }
  }, [navigate, role]);

  // ===== API =====
  const getAdmin = useCallback(async () => {
    try {
      setIsAdminLoading(true);
      const res = await api.get("/admin");
      const data = res?.data?.data || [];
      setAdminList(data);
      setTotalAdmin(data.length);
    } catch (err) {
      console.error("Gagal mengambil data admin :", err);
    } finally {
      setIsAdminLoading(false);
    }
  }, []);

  const getSuperAdmin = useCallback(async () => {
    try {
      setIsSuperAdminLoading(true);
      const res = await api.get("/superadmin");
      const data = res?.data?.data || [];
      setSuperAdminList(data);
      setTotalSuperAdmin(data.length);
    } catch (err) {
      console.error("Gagal mengambil data super admin :", err);
    } finally {
      setIsSuperAdminLoading(false);
    }
  }, []);

  useEffect(() => {
    getAdmin();
    getSuperAdmin();
  }, [getAdmin, getSuperAdmin]);

  // ===== Create admin/superadmin =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    if (!nipp || !password) {
      setMessage({ type: "error", text: "NIPP dan Password wajib diisi!" });
      setIsLoading(false);
      return;
    }

    try {
      const endpoint = roleInput === "admin" ? `/admin` : `/superadmin`;
      await api.post(endpoint, { nipp, password });
      setMessage({
        type: "success",
        text: `Berhasil menambahkan NIPP ${nipp} sebagai ${
          roleInput === "admin" ? "admin" : "super admin"
        } !`,
      });
      setNipp("");
      setPassword("");
      roleInput === "admin" ? getAdmin() : getSuperAdmin();
    } catch (error) {
      console.error("Error:", error);
      let errorMessage = `Gagal menambahkan ${nipp} !`;
      if (error.response?.data?.message)
        errorMessage = error.response.data.message;
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  // ===== Search =====
  const handleSearch = async (e) => {
    e.preventDefault();
    setIsSearchLoading(true);
    setSearchMessage(null);
    setSearchResult(null);

    if (!searchNipp.trim()) {
      setSearchMessage({
        type: "error",
        text: "Masukan NIPP yang ingin dicari !",
      });
      setIsSearchLoading(false);
      return;
    }

    try {
      const adminRes = await api.get(`/admin/${searchNipp}`).catch(() => null);
      if (adminRes && adminRes.data?.data) {
        const data = adminRes.data.data;
        setSearchResult({ nipp: data.nipp, role: "admin" });
        setSearchMessage({
          type: "success",
          text: `NIPP ${data.nipp} ditemukan sebagai Admin.`,
        });
        setIsSearchLoading(false);
        return;
      }

      const superAdminRes = await api
        .get(`/superadmin/${searchNipp}`)
        .catch(() => null);
      if (superAdminRes && superAdminRes.data?.data) {
        const data = superAdminRes.data.data;
        setSearchResult({ nipp: data.nipp, role: "superadmin" });
        setSearchMessage({
          type: "success",
          text: `NIPP ${data.nipp} ditemukan sebagai Super Admin.`,
        });
        setIsSearchLoading(false);
        return;
      }

      setSearchMessage({
        type: "error",
        text: `NIPP ${searchNipp} tidak ditemukan di data Admin maupun Super Admin !`,
      });
    } catch (error) {
      console.error("Error saat mencari data:", error);
      let errorMessage = `Gagal mengambil data ${searchNipp}!`;
      if (error.response?.data?.message)
        errorMessage = error.response.data.message;
      setSearchMessage({ type: "error", text: errorMessage });
    } finally {
      setIsSearchLoading(false);
    }
  };

  // ===== Delete =====
  const handleDeleteAdmin = async (nipp) => {
    if (!nipp) return;
    setIsLoadingDeleteAdmin(true);
    try {
      await api.delete(`/admin/${nipp}`);
      await getAdmin();
    } catch (e) {
      console.log("Gagal delete admin:", e);
      alert(
        e?.response?.data?.message || e.message || "Gagal menghapus admin."
      );
    } finally {
      setIsLoadingDeleteAdmin(false);
    }
  };

  const handleDeleteSuperAdmin = async (nipp) => {
    if (!nipp) return;
    setIsLoadingDeleteSuperAdmin(true);
    try {
      await api.delete(`/superadmin/${nipp}`);
      await getSuperAdmin();
    } catch (e) {
      console.log("Gagal delete super admin:", e);
      alert(
        e?.response?.data?.message ||
          e.message ||
          "Gagal menghapus super admin."
      );
    } finally {
      setIsLoadingDeleteSuperAdmin(false);
    }
  };

  // ===== Reset password admin =====
  const handleResetPassAdmin = async (nipp, newPassword) => {
    if (!nipp || !newPassword) return;
    setIsLoadingResetAdminPass(true);
    try {
      await api.patch(`/adminresetpass/${nipp}`, { newpassword: newPassword });
      alert(`Password admin ${nipp} berhasil direset!`);
    } catch (e) {
      console.log("Gagal reset pass admin:", e);
      alert(e?.response?.data?.message || "Gagal mereset password!");
    } finally {
      setIsLoadingResetAdminPass(false);
    }
  };

  // ===== IMPORT Admins =====
  const openImportModal = () => {
    setImportFile(null);
    setShowImportModal(true);
  };

  const handleUploadImport = async () => {
    if (!importFile)
      return alert("Pilih file .csv atau .xlsx terlebih dahulu.");
    try {
      setImporting(true);
      const form = new FormData();
      // field name HARUS 'file' agar sesuai multer upload.single("file")
      form.append("file", importFile);

      await api.post("/import/admins", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setShowImportModal(false);
      setImportFile(null);
      await getAdmin();
      alert("Import admin berhasil.");
    } catch (e) {
      alert(e?.response?.data?.message || e.message || "Gagal import.");
    } finally {
      setImporting(false);
    }
  };

  // ===== RESET Tabel Admins =====
  const openResetModalForAdmin = () => setShowResetConfirm(true);

  const confirmResetAdminTable = async () => {
    try {
      setResetting(true);
      await api.delete("/reset/admins"); // sesuai route: router.delete("/reset/:tableName", ...)
      await getAdmin();
      alert("Tabel admins berhasil di-reset (kosong).");
    } catch (e) {
      alert(
        e?.response?.data?.message || e.message || "Gagal reset tabel admins."
      );
    } finally {
      setShowResetConfirm(false);
      setResetting(false);
    }
  };

  // ===== EXPORT Admins ke XLSX =====
  const exportExcelAdmin = async () => {
    try {
      setExporting(true);
      const rows = (adminList || []).map((a, i) => ({
        No: i + 1,
        NIPP: a.nipp,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Admins");
      XLSX.writeFile(wb, "data_admins.xlsx");
    } catch (e) {
      alert(e?.message || "Gagal export.");
    } finally {
      setExporting(false);
    }
  };

  if (!allowed) return null;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-green-700 via-green-800 to-green-900"
      style={{ backgroundColor: "#406017" }}
    >
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
            Kelola Admin
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-2xl border border-white/20">
            <p className="text-blue-100 text-sm font-medium">Total Admin</p>
            <p className="text-3xl font-bold text-white">{totalAdmin}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 shadow-2xl border border-white/20">
            <p className="text-green-100 text-sm font-medium">
              Total Super Admin
            </p>
            <p className="text-3xl font-bold text-white">{totalSuperAdmin}</p>
          </div>
        </div>

        {/* Tambah Admin */}
        <div className="flex justify-center">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8 w-full max-w-lg">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 mb-6">
              <UserPlus
                className={`${
                  role === "superadmin" ? "text-blue-700" : "text-green-700"
                }`}
              />
              Tambah Admin / Super Admin
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* NIPP */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  NIPP / NIPKWT
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={nipp}
                    onChange={(e) => setNipp(e.target.value)}
                    placeholder="Masukkan NIPP..."
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    disabled={isLoading}
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan Password..."
                    className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    disabled={isLoading}
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Pilihan Role */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pilih Role
                </label>
                <select
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={isLoading}
                >
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>

              {/* Pesan */}
              {message && (
                <div
                  className={`p-3 rounded-xl text-sm font-medium ${
                    message.type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {message.text}
                </div>
              )}

              {/* Tombol Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full text-white rounded-xl py-3 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 ${
                  role === "superadmin"
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                    : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                }`}
              >
                {isLoading ? "Menyimpan..." : "Tambah"}
              </button>
            </form>
          </div>
        </div>

        {/* Search Section */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            Pencarian Admin & Super Admin
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
              disabled={isSearchLoading}
            />
            <button
              type="submit"
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 font-medium"
              disabled={isSearchLoading}
            >
              {isSearchLoading ? "Mencari..." : "Cari Data"}
            </button>
          </form>
          {searchMessage && (
            <div
              className={`mb-4 p-4 rounded-xl ${
                searchMessage.type === "success"
                  ? "bg-green-50 border border-green-200 text-green-700"
                  : "bg-red-50 border border-red-200 text-red-700"
              }`}
            >
              <p className="font-medium">{searchMessage.text}</p>
            </div>
          )}

          {/* Search Result */}
          {searchResult && (
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                Detail Pengguna
              </h3>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 font-medium">NIPP</p>
                  <p className="text-lg font-bold text-gray-800">
                    {searchResult.nipp}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-600 font-medium">Role</p>
                  <p
                    className={`text-lg font-bold ${
                      searchResult.role === "admin"
                        ? "text-blue-600"
                        : "text-green-600"
                    }`}
                  >
                    {searchResult.role === "admin" ? "Admin" : "Super Admin"}
                  </p>
                </div>
              </div>

              {/* Tombol Aksi */}
              <div className="flex gap-4 justify-end">
                {searchResult.role === "admin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNippReset(searchResult.nipp);
                      setShowResetModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white text-sm font-medium rounded-lg shadow transition-all"
                  >
                    Reset Password
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (searchResult.role === "admin") {
                      handleDeleteAdmin(searchResult.nipp);
                    } else {
                      handleDeleteSuperAdmin(searchResult.nipp);
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-sm font-medium rounded-lg shadow transition-all"
                >
                  {searchResult.role === "admin"
                    ? isLoadingDeleteAdmin
                      ? "Menghapus..."
                      : "Delete"
                    : isLoadingDeleteSuperAdmin
                    ? "Menghapus..."
                    : "Delete"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* TABLE */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              {selectedTable === "admin" ? "Data Admin" : "Data Super Admin"}
            </h2>

            {/* Aksi global */}
            {/* Aksi global */}
            <div className="flex flex-wrap gap-3">
              {/* TOMBOL HANYA MUNCUL SAAT TAB ADMIN */}
              {selectedTable === "admin" && (
                <>
                  <button
                    onClick={openImportModal}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 text-sm md:text-base font-medium"
                    title="Import Admin (.csv/.xlsx)"
                    disabled={importing}
                  >
                    {importing ? "Mengunggah..." : "Import Admin (.csv/.xlsx)"}
                  </button>

                  <button
                    onClick={openResetModalForAdmin}
                    className="px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow disabled:opacity-50"
                    title="Reset semua data di tabel admins"
                    disabled={resetting}
                  >
                    {resetting ? "Mereset..." : "Reset Tabel"}
                  </button>
                </>
              )}

              {/* Switch tab — selalu ada */}
              <button
                onClick={() => setSelectedTable("admin")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedTable === "admin"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Admin
              </button>
              <button
                onClick={() => setSelectedTable("superadmin")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  selectedTable === "superadmin"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Super Admin
              </button>
            </div>
          </div>

          {selectedTable === "admin" ? (
            <div
              key="admin-table"
              className="overflow-x-auto max-h-[500px] overflow-y-auto"
            >
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      No
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      NIPP
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isAdminLoading ? (
                    <tr>
                      <td
                        colSpan="3"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        Memuat data admin...
                      </td>
                    </tr>
                  ) : adminList.length === 0 ? (
                    <tr>
                      <td
                        colSpan="3"
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
                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-6m-5 0h-6m6 0a2 2 0 100-4 2 2 0 000 4zm-6 0a 2 2 0 100-4 2 2 0 000 4z"
                              ></path>
                            </svg>
                          </div>
                          <p className="font-medium">Belum ada data admin !</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    adminList.map((admin, index) => (
                      <tr
                        key={`admin-${index}`}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                            {admin.nipp}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-4">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedNippReset(admin.nipp);
                                setShowResetModal(true);
                              }}
                              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white text-sm font-medium rounded-lg shadow transition-all"
                            >
                              Reset Password
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteAdmin(admin.nipp)}
                              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-sm font-medium rounded-lg shadow transition-all"
                            >
                              {isLoadingDeleteAdmin ? "Menghapus..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div
              key="superadmin-table"
              className="overflow-x-auto max-h-[500px] overflow-y-auto"
            >
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      No
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                      NIPP
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {isSuperAdminLoading ? (
                    <tr>
                      <td
                        colSpan="3"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        Memuat data super admin...
                      </td>
                    </tr>
                  ) : SuperAdminList.length === 0 ? (
                    <tr>
                      <td
                        colSpan="3"
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
                                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-6m-5 0h-6m6 0a2 2 0 100-4 2 2 0 000 4zm-6 0a 2 2 0 100-4 2 2 0 000 4z"
                              ></path>
                            </svg>
                          </div>
                          <p className="font-medium">
                            Belum ada data super admin!
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    SuperAdminList.map((superadmin, index) => (
                      <tr
                        key={`superadmin-${index}`}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-gray-700">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                            {superadmin.nipp}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteSuperAdmin(superadmin.nipp)
                            }
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-sm font-medium rounded-lg shadow transition-all"
                          >
                            {isLoadingDeleteSuperAdmin
                              ? "Menghapus..."
                              : "Delete"}
                          </button>
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

      {/* MODAL: Reset Password Admin */}
      {showResetModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-96 p-6 animate-fadeIn">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">
              Reset Password Admin
            </h2>
            <p className="text-sm text-gray-600 mb-4 text-center">
              NIPP: <span className="font-semibold">{selectedNippReset}</span>
            </p>

            <div className="relative mb-4">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password baru..."
                className="w-full border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 p-3 rounded-xl pr-10"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowResetModal(false);
                  setNewPassword("");
                }}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium transition"
              >
                Batal
              </button>

              <button
                disabled={isLoadingResetAdminPass}
                onClick={async () => {
                  if (!newPassword.trim())
                    return alert("Password baru wajib diisi!");
                  await handleResetPassAdmin(selectedNippReset, newPassword);
                  setNewPassword("");
                  setShowResetModal(false);
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50 transition"
              >
                {isLoadingResetAdminPass ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Import Admin */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-4">
              Import Admin (.csv / .xlsx)
            </h3>
            <div className="space-y-3">
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="w-full border rounded-lg p-2"
                disabled={importing}
              />
              <p className="text-sm text-gray-500">
                Kolom minimal: <code>nipp</code> dan <code>password</code>. Jika
                kolom <code>password</code> kosong, data tetap terbuat tanpa
                password (tidak disarankan).
              </p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                onClick={() => setShowImportModal(false)}
                disabled={importing}
              >
                Batal
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
                onClick={handleUploadImport}
                disabled={importing || !importFile}
              >
                {importing ? "Mengunggah..." : "Import"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Reset Tabel Admins */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold mb-2 text-red-600">
              Reset Tabel Admins
            </h3>
            <p className="text-gray-700">
              Tindakan ini akan <b>menghapus semua data</b> pada tabel{" "}
              <code>admins</code>. Lanjutkan?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
                onClick={() => setShowResetConfirm(false)}
                disabled={resetting}
              >
                Batal
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                onClick={confirmResetAdminTable}
                disabled={resetting}
              >
                {resetting ? "Mereset..." : "Ya, Hapus Semua"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagePage;
