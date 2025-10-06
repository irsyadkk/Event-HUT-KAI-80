import { getUserRole } from "../getUserRole.js";
import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";
import api from "../api.js";

const AdminManagePage = () => {
  const role = getUserRole();
  const navigate = useNavigate();
  const [allowed, setAllowed] = useState(false);
  const [adminList, setAdminList] = useState([]);
  const [SuperAdminList, setSuperAdminList] = useState([]);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [isSuperAdminLoading, setIsSuperAdminLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState("admin");
  const [isLoadingTambahAdmin, setIsLoadingTambahAdmin] = useState(false);
  const [isLoadingTambahSuperAdmin, setIsLoadingTambahSuperAdmin] =
    useState(false);
  const [nippAddAdmin, setNippAddAdmin] = useState("");
  const [nippAddSuperAdmin, setNippAddSuperAdmin] = useState("");
  const [passwordAddAdmin, setPasswordAddAdmin] = useState("");
  const [passwordAddSuperAdmin, setPasswordAddSuperAdmin] = useState("");
  const [messageTambahAdmin, setMessageTambahAdmin] = useState("");
  const [messageTambahSuperAdmin, setMessageTambahSuperAdmin] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const nipp = localStorage.getItem("nipp");
    if (!token || !nipp) {
      navigate("/");
      return;
    }
    try {
      if (role !== "superadmin" && role !== "admin") navigate("/");
      else setAllowed(true);
    } catch {
      navigate("/");
    }
  }, [navigate]);

  const getAdmin = useCallback(async () => {
    try {
      setIsAdminLoading(true);
      const res = await api.get("/admin");
      setAdminList(res.data.data);
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
      setSuperAdminList(res.data.data);
    } catch (err) {
      console.error("Gagal mengambil data super admin :", err);
    } finally {
      setIsSuperAdminLoading(false);
    }
  }, []);

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    if (!nippAddAdmin.trim() || !passwordAddAdmin.trim()) {
      setMessageTambahAdmin({
        text: "NIPP, dan Password wajib diisi!",
        type: "error",
      });
      return;
    }
    setIsLoadingTambahAdmin(true);
    try {
      await api.post("/admin", {
        nipp: nippAddAdmin,
        password: passwordAddAdmin,
      });
      setMessageTambahAdmin({
        text: `Berhasil menambahkan ${nippAddAdmin} sebagai admin !`,
        type: "success",
      });
      setNippAddAdmin("");
      setPasswordAddAdmin("");
      getAdmin();
    } catch (err) {
      console.error("Gagal menambah admin:", err);
      setMessageTambahAdmin({
        text: `Gagal menambahkan ${nippAddAdmin} sebagai admin !`,
        type: "error",
      });
    }
    setIsLoadingTambahAdmin(false);
  };

  const handleAddSuperAdmin = async (e) => {
    e.preventDefault();
    if (!nippAddSuperAdmin.trim() || !passwordAddSuperAdmin.trim()) {
      setMessageTambahSuperAdmin({
        text: "NIPP, dan Password wajib diisi!",
        type: "error",
      });
      return;
    }
    setIsLoadingTambahSuperAdmin(true);
    try {
      await api.post("/superadmin", {
        nipp: nippAddSuperAdmin,
        password: passwordAddSuperAdmin,
      });
      setMessageTambahSuperAdmin({
        text: `Berhasil menambahkan ${nippAddSuperAdmin} sebagai super admin !`,
        type: "success",
      });
      setNippAddSuperAdmin("");
      setPasswordAddSuperAdmin("");
      getSuperAdmin();
    } catch (err) {
      console.error("Gagal menambah super admin:", err);
      setMessageTambahSuperAdmin({
        text: `Gagal menambahkan ${nippAddSuperAdmin} sebagai super admin !`,
        type: "error",
      });
    }
    setIsLoadingTambahSuperAdmin(false);
  };

  useEffect(() => {
    getAdmin();
    getSuperAdmin();
  }, [getAdmin, getSuperAdmin]);

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
        {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-2xl border border-white/20">
            <p className="text-blue-100 text-sm font-medium">Total Super Admin</p>
            <p className="text-3xl font-bold text-white">{totalPrizes}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-6 shadow-2xl border border-white/20">
            <p className="text-green-100 text-sm font-medium">Total Admin</p>
            <p className="text-3xl font-bold text-white">{winnersCount}</p>
          </div>
        </div> */}

        {/* Tambah Admin */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Tambah Admin Baru
            </h2>
          </div>
          <form onSubmit={handleAddAdmin} className="p-6">
            <div className="grid gap-4 md:grid-cols-4 items-end">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  NIPP Admin
                </label>
                <input
                  className="w-full border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 p-3 rounded-xl"
                  placeholder="Masukkan NIPP admin..."
                  value={nippAddAdmin}
                  onChange={(e) => setNippAddAdmin(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password Admin
                </label>
                <input
                  className="w-full border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 p-3 rounded-xl"
                  placeholder="Masukkan password admin..."
                  value={passwordAddAdmin}
                  onChange={(e) => setPasswordAddAdmin(e.target.value)}
                />
              </div>

              <button
                disabled={isLoadingTambahAdmin}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl px-6 py-3 font-semibold shadow-lg disabled:opacity-50"
              >
                {isLoadingTambahAdmin ? "Menyimpan..." : "➕ Tambah Admin"}
              </button>
            </div>
          </form>
        </div>

        {/* Tambah Super Admin */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              Tambah Super Admin Baru
            </h2>
          </div>
          <form onSubmit={handleAddSuperAdmin} className="p-6">
            <div className="grid gap-4 md:grid-cols-4 items-end">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  NIPP Super Admin
                </label>
                <input
                  className="w-full border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 p-3 rounded-xl"
                  placeholder="Masukkan NIPP super admin..."
                  value={nippAddSuperAdmin}
                  onChange={(e) => setNippAddSuperAdmin(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password Super Admin
                </label>
                <input
                  className="w-full border-2 border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200 p-3 rounded-xl"
                  placeholder="Masukkan password super admin..."
                  value={passwordAddSuperAdmin}
                  onChange={(e) => setPasswordAddSuperAdmin(e.target.value)}
                />
              </div>

              <button
                disabled={isLoadingTambahSuperAdmin}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl px-6 py-3 font-semibold shadow-lg disabled:opacity-50"
              >
                {isLoadingTambahSuperAdmin
                  ? "Menyimpan..."
                  : "➕ Tambah Super Admin"}
              </button>
            </div>
          </form>
        </div>

        {/* Search */}
        {/* <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/30 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between flex-wrap gap-4">
            <h2 className="text-xl font-bold text-white">Pencarian & Filter</h2>
            <input
              className="border-2 border-white/30 focus:border-white focus:ring-2 focus:ring-white/50 p-3 rounded-xl bg-white/90 min-w-[300px] text-sm"
              placeholder="🔍 Cari.."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div> */}

        {/* TABLE */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              {selectedTable === "admin" ? "Data Admin" : "Data Super Admin"}
            </h2>

            {/* tombol export */}
            {/* {selectedTable === "order" && (
              <button
                onClick={openImportModalForCurrentTable}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 text-sm md:text-base font-medium"
                title="Import Peserta (.csv/.xlsx)"
              >
                Import Peserta (.csv/.xlsx)
              </button>
            )}

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
            )} */}

            {/* tombol switch + reset */}
            <div className="flex flex-wrap gap-3">
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

              {/* --- TOMBOL RESET TABEL (current tab) --- */}
              {/* <button
                onClick={openResetModalForCurrentTable}
                className="px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow"
                title={`Reset semua data di tabel ${
                  selectedTable === "order" ? "Order" : "Pickup"
                }`}
              >
                Reset Tabel {selectedTable === "order" ? "Order" : "Pickup"}
              </button> */}
            </div>
          </div>

          {selectedTable === "admin" ? (
            <>
              {/* ---------- TABEL ADMIN ---------- */}
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
                          colSpan="7"
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          Memuat data admin...
                        </td>
                      </tr>
                    ) : adminList.length === 0 ? (
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
                              Belum ada data admin !
                            </p>
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
                              {/* Tombol Reset Pass */}
                              <button
                                onClick={() => {}}
                                className="inline-flex items-center px-4 py-2 
                 bg-gradient-to-r from-yellow-500 to-yellow-600 
                 hover:from-yellow-600 hover:to-yellow-700 
                 text-white text-sm font-medium rounded-lg shadow 
                 transition-all"
                              >
                                Reset Password
                              </button>

                              {/* Tombol Delete */}
                              <button
                                onClick={() => {}}
                                className="inline-flex items-center px-4 py-2 
                 bg-gradient-to-r from-red-600 to-red-700 
                 hover:from-red-700 hover:to-red-800 
                 text-white text-sm font-medium rounded-lg shadow 
                 transition-all"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              {/* ---------- TABEL SUPER ADMIN ---------- */}
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
                    {SuperAdminList.length === 0 ? (
                      <tr>
                        <td
                          colSpan="11"
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
                              onClick={() => {}}
                              className="inline-flex items-center px-4 py-2 
          bg-gradient-to-r from-red-600 to-red-700 
          hover:from-red-700 hover:to-red-800 
          text-white text-sm font-medium rounded-lg shadow 
          transition-all"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminManagePage;
