import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  UserPlus,
  Trash2,
  RefreshCcw,
  Shield,
  Users,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  X,
} from "lucide-react";
import * as XLSX from "xlsx";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";
import api from "../api.js";
import { getUserRole } from "../getUserRole.js";

/* ---------- UI Utils ---------- */
const Button = ({
  children,
  onClick,
  type = "button",
  disabled = false,
  variant = "primary",
  className = "",
}) => {
  const base =
    "inline-flex items-center justify-center px-4 py-2 rounded-lg font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm";
  const styles = {
    primary:
      "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white",
    blue: "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white",
    warning:
      "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white",
    danger:
      "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white",
    ghost: "bg-gray-200 text-gray-700 hover:bg-gray-300",
    light: "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Badge = ({ children, tone = "blue" }) => {
  const tones = {
    blue: "bg-blue-100 text-blue-800",
    green: "bg-green-100 text-green-800",
    gray: "bg-gray-100 text-gray-800",
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
};

const Card = ({ children, className = "" }) => (
  <div
    className={`bg-white rounded-2xl shadow-2xl border border-gray-100 ${className}`}
  >
    {children}
  </div>
);

/* ---------- Modal Fancy ---------- */
const Modal = ({
  title,
  onClose,
  children,
  footer,
  tone = "info", // "info" | "warning" | "danger" | "success"
  icon = null,
}) => {
  const tones = {
    info: "from-blue-500 to-indigo-600",
    warning: "from-yellow-500 to-orange-600",
    danger: "from-rose-600 to-red-700",
    success: "from-emerald-500 to-green-700",
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg">
        <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden animate-[modalIn_.18s_ease-out]">
          {/* header */}
          <div
            className={`relative h-28 bg-gradient-to-r ${tones[tone]} text-white`}
          >
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
            <button
              onClick={onClose}
              className="absolute right-3 top-3 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-white" />
            </button>
            <div className="h-full flex items-center gap-3 px-6">
              {icon && <div className="bg-white/20 rounded-xl p-2">{icon}</div>}
              <h3 className="text-xl md:text-2xl font-bold drop-shadow-sm">
                {title}
              </h3>
            </div>
          </div>

          {/* body */}
          <div className="p-6">{children}</div>

          {/* footer */}
          <div className="px-6 pb-6 flex items-center justify-end gap-3">
            {footer}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes modalIn { 
          from { opacity:.5; transform: translateY(8px) scale(.98) } 
          to { opacity:1; transform: translateY(0) scale(1) } 
        }
      `}</style>
    </div>
  );
};

const RowSkeleton = () => (
  <tr className="animate-pulse">
    <td className="px-6 py-4">
      <div className="h-4 w-10 bg-gray-200 rounded" />
    </td>
    <td className="px-6 py-4">
      <div className="h-6 w-40 bg-gray-200 rounded-full" />
    </td>
    <td className="px-6 py-4">
      <div className="h-8 w-40 bg-gray-200 rounded" />
    </td>
  </tr>
);

/* ---------- Toasts ---------- */
const Toast = ({ id, type = "success", title, desc, onClose }) => {
  const icons = {
    success: <CheckCircle2 className="w-5 h-5" />,
    error: <AlertTriangle className="w-5 h-5" />,
    info: <KeyRound className="w-5 h-5" />,
  };
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-rose-200 bg-rose-50 text-rose-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  };

  return (
    <div
      className={`w-80 rounded-xl border shadow-lg p-4 flex gap-3 ${styles[type]} animate-[toastIn_.18s_ease-out]`}
    >
      <div className="mt-0.5">{icons[type]}</div>
      <div className="flex-1">
        <p className="font-semibold">{title}</p>
        {desc && <p className="text-sm opacity-90">{desc}</p>}
      </div>
      <button
        onClick={() => onClose(id)}
        className="opacity-60 hover:opacity-100"
      >
        ×
      </button>
      <style>{`
        @keyframes toastIn {
          from { opacity:.2; transform: translateY(6px) }
          to { opacity:1; transform: translateY(0) }
        }
      `}</style>
    </div>
  );
};

/* ============== MAIN ============== */
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

  const totalAdmin = useMemo(() => adminList.length, [adminList]);
  const totalSuperAdmin = useMemo(
    () => SuperAdminList.length,
    [SuperAdminList]
  );

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

  // Modal state tambahan
  const [confirmDelete, setConfirmDelete] = useState({
    open: false,
    nipp: "",
    role: "",
  });
  const [showResetPassword, setShowResetPassword] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState([]);
  const pushToast = (payload) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, ...payload }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3500);
  };
  const closeToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  // ===== Guard (khusus superadmin sesuai kodenmu) =====
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
      pushToast({
        type: "success",
        title: "Akun dibuat",
        desc: `NIPP ${nipp}`,
      });
    } catch (error) {
      console.error("Error:", error);
      let errorMessage =
        error?.response?.data?.message || `Gagal menambahkan ${nipp} !`;
      setMessage({ type: "error", text: errorMessage });
      pushToast({
        type: "error",
        title: "Gagal membuat akun",
        desc: errorMessage,
      });
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
      } else {
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
        } else {
          setSearchMessage({
            type: "error",
            text: `NIPP ${searchNipp} tidak ditemukan di data Admin maupun Super Admin !`,
          });
        }
      }
    } catch (error) {
      console.error("Error saat mencari data:", error);
      let errorMessage =
        error?.response?.data?.message || `Gagal mengambil data ${searchNipp}!`;
      setSearchMessage({ type: "error", text: errorMessage });
    } finally {
      setIsSearchLoading(false);
    }
  };

  // ===== Delete =====
  const handleDeleteAdmin = async (targetNipp) => {
    if (!targetNipp) return;
    setIsLoadingDeleteAdmin(true);
    try {
      await api.delete(`/admin/${targetNipp}`);
      await getAdmin();
      pushToast({
        type: "success",
        title: "Berhasil dihapus",
        desc: `NIPP ${targetNipp}`,
      });
    } catch (e) {
      console.log("Gagal delete admin:", e);
      pushToast({
        type: "error",
        title: "Gagal menghapus",
        desc: e?.response?.data?.message || e.message,
      });
    } finally {
      setIsLoadingDeleteAdmin(false);
    }
  };

  const handleDeleteSuperAdmin = async (targetNipp) => {
    if (!targetNipp) return;
    setIsLoadingDeleteSuperAdmin(true);
    try {
      await api.delete(`/superadmin/${targetNipp}`);
      await getSuperAdmin();
      pushToast({
        type: "success",
        title: "Berhasil dihapus",
        desc: `NIPP ${targetNipp}`,
      });
    } catch (e) {
      console.log("Gagal delete super admin:", e);
      pushToast({
        type: "error",
        title: "Gagal menghapus",
        desc: e?.response?.data?.message || e.message,
      });
    } finally {
      setIsLoadingDeleteSuperAdmin(false);
    }
  };

  // ===== Reset password admin =====
  const handleResetPassAdmin = async (targetNipp, newPass) => {
    if (!targetNipp || !newPass) return;
    setIsLoadingResetAdminPass(true);
    try {
      await api.patch(`/adminresetpass/${targetNipp}`, {
        newpassword: newPass,
      });
      pushToast({
        type: "success",
        title: "Password direset",
        desc: `Admin ${targetNipp}`,
      });
    } catch (e) {
      console.log("Gagal reset pass admin:", e);
      pushToast({
        type: "error",
        title: "Gagal reset password",
        desc: e?.response?.data?.message || "Terjadi kesalahan.",
      });
    } finally {
      setIsLoadingResetAdminPass(false);
    }
  };

  // ===== IMPORT / RESET / EXPORT Admins =====
  const openImportModal = () => {
    setImportFile(null);
    setShowImportModal(true);
  };

  const handleUploadImport = async () => {
    if (!importFile) {
      pushToast({
        type: "error",
        title: "File belum dipilih",
        desc: "Pilih .csv/.xlsx terlebih dahulu.",
      });
      return;
    }
    try {
      setImporting(true);
      const form = new FormData();
      form.append("file", importFile);
      await api.post("/import/admins", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setShowImportModal(false);
      setImportFile(null);
      await getAdmin();
      pushToast({
        type: "success",
        title: "Import berhasil",
        desc: "Data admin diperbarui.",
      });
    } catch (e) {
      pushToast({
        type: "error",
        title: "Gagal import",
        desc: e?.response?.data?.message || e.message,
      });
    } finally {
      setImporting(false);
    }
  };

  const openResetModalForAdmin = () => setShowResetConfirm(true);

  const confirmResetAdminTable = async () => {
    try {
      setResetting(true);
      await api.delete("/reset/admins");
      await getAdmin();
      pushToast({
        type: "success",
        title: "Tabel direset",
        desc: "Semua admin telah dihapus.",
      });
    } catch (e) {
      pushToast({
        type: "error",
        title: "Gagal reset",
        desc: e?.response?.data?.message || e.message,
      });
    } finally {
      setShowResetConfirm(false);
      setResetting(false);
    }
  };

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
      pushToast({
        type: "success",
        title: "Export selesai",
        desc: "File data_admins.xlsx dibuat.",
      });
    } catch (e) {
      pushToast({
        type: "error",
        title: "Gagal export",
        desc: e?.message || "Terjadi kesalahan.",
      });
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
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="text-center py-4">
          <div className="mb-4 inline-flex items-center justify-center w-20 h-20">
            <img
              src={LogoKAI}
              alt="Logo HUT KAI 80"
              className="h-16 md:h-20 w-auto drop-shadow-lg"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow">
            Kelola Admin
          </h1>
        </header>

        {/* Stats */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-5 bg-gradient-to-br from-blue-500 to-blue-600 border-white/20">
            <div className="flex items-center gap-3 text-blue-50">
              <Users className="opacity-90" />
              <p className="text-sm font-medium">Total Admin</p>
            </div>
            <p className="text-3xl font-extrabold text-white mt-2">
              {totalAdmin}
            </p>
          </Card>
          <Card className="p-5 bg-gradient-to-br from-emerald-500 to-green-600 border-white/20">
            <div className="flex items-center gap-3 text-green-50">
              <Shield className="opacity-90" />
              <p className="text-sm font-medium">Total Super Admin</p>
            </div>
            <p className="text-3xl font-extrabold text-white mt-2">
              {totalSuperAdmin}
            </p>
          </Card>
        </section>

        {/* GRID: Kiri = Pencarian + Tabel, Kanan = Form Tambah */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Kiri */}
          <div className="lg:col-span-8 space-y-6">
            {/* Pencarian */}
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
                <Button
                  type="submit"
                  variant="blue"
                  disabled={isSearchLoading}
                  className="px-8 py-3"
                >
                  {isSearchLoading ? "Mencari..." : "Cari Data"}
                </Button>
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

              {searchResult && (
                <Card className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    Detail Pengguna
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-600 font-medium">NIPP</p>
                      <p className="text-lg font-bold text-gray-900">
                        {searchResult.nipp}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-600 font-medium">Role</p>
                      <p className="mt-1">
                        <Badge
                          tone={
                            searchResult.role === "admin" ? "blue" : "green"
                          }
                        >
                          {searchResult.role === "admin"
                            ? "Admin"
                            : "Super Admin"}
                        </Badge>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 justify-end">
                    {searchResult.role === "admin" && (
                      <Button
                        variant="warning"
                        onClick={() => {
                          setSelectedNippReset(searchResult.nipp);
                          setShowResetModal(true);
                        }}
                      >
                        <RefreshCcw size={16} className="mr-2" />
                        Reset Password
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      onClick={() =>
                        setConfirmDelete({
                          open: true,
                          nipp: searchResult.nipp,
                          role: searchResult.role,
                        })
                      }
                    >
                      <Trash2 size={16} className="mr-2" />
                      Delete
                    </Button>
                  </div>
                </Card>
              )}
            </div>

            {/* TABLES */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  {selectedTable === "admin"
                    ? "Data Admin"
                    : "Data Super Admin"}
                </h2>

                {/* Aksi global */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Switch Tab */}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setSelectedTable("admin")}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        selectedTable === "admin"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      Admin
                    </button>
                    <button
                      onClick={() => setSelectedTable("superadmin")}
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        selectedTable === "superadmin"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      Super Admin
                    </button>
                  </div>

                  {/* Hanya muncul di tab Admin */}
                  {selectedTable === "admin" && (
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={openImportModal}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl shadow-md text-sm md:text-base font-medium"
                        disabled={importing}
                      >
                        {importing
                          ? "Mengunggah..."
                          : "Import Admin (.csv/.xlsx)"}
                      </button>

                     

                      <button
                        onClick={openResetModalForAdmin}
                        className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl shadow-md text-sm md:text-base font-medium"
                        disabled={resetting}
                      >
                        {resetting ? "Mereset..." : "Reset Tabel"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Table */}
              {selectedTable === "admin" ? (
                <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0 z-10">
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
                        <>
                          <RowSkeleton />
                          <RowSkeleton />
                          <RowSkeleton />
                        </>
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
                                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4"
                                  />
                                </svg>
                              </div>
                              <p className="font-medium">
                                Belum ada data admin!
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        adminList.map((admin, index) => (
                          <tr
                            key={`admin-${admin.nipp}-${index}`}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4">
                              <Badge tone="blue">{admin.nipp}</Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-center gap-3">
                                <Button
                                  variant="warning"
                                  onClick={() => {
                                    setSelectedNippReset(admin.nipp);
                                    setShowResetModal(true);
                                  }}
                                >
                                  <RefreshCcw size={16} className="mr-2" />
                                  Reset Password
                                </Button>
                                <Button
                                  variant="danger"
                                  onClick={() =>
                                    setConfirmDelete({
                                      open: true,
                                      nipp: admin.nipp,
                                      role: "admin",
                                    })
                                  }
                                >
                                  <Trash2 size={16} className="mr-2" />
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                // Super Admin Table
                <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0 z-10">
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
                        <>
                          <RowSkeleton />
                          <RowSkeleton />
                          <RowSkeleton />
                        </>
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
                                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4"
                                  />
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
                            key={`superadmin-${superadmin.nipp}-${index}`}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4">
                              <Badge tone="green">{superadmin.nipp}</Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex justify-center">
                                <Button
                                  variant="danger"
                                  onClick={() =>
                                    setConfirmDelete({
                                      open: true,
                                      nipp: superadmin.nipp,
                                      role: "superadmin",
                                    })
                                  }
                                >
                                  <Trash2 size={16} className="mr-2" />
                                  Delete
                                </Button>
                              </div>
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

          {/* Kanan: Form Tambah */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="p-6 lg:sticky lg:top-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-6">
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
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <svg
                        className="h-5 w-5"
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

                {/* Role */}
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

                {/* Message */}
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

                <Button
                  type="submit"
                  variant={role === "superadmin" ? "blue" : "primary"}
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Menyimpan..." : "Tambah"}
                </Button>
              </form>
            </Card>
          </div>
        </section>
      </div>

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[120] space-y-3">
        {toasts.map((t) => (
          <Toast key={t.id} {...t} onClose={closeToast} />
        ))}
      </div>

      {/* MODAL: Reset Password Admin */}
      {showResetModal && (
        <Modal
          title="Reset Password Admin"
          tone="warning"
          icon={<KeyRound className="w-6 h-6 text-white" />}
          onClose={() => {
            setShowResetModal(false);
            setNewPassword("");
            setShowResetPassword(false);
          }}
          footer={
            <>
              <Button
                variant="light"
                onClick={() => {
                  setShowResetModal(false);
                  setNewPassword("");
                  setShowResetPassword(false);
                }}
              >
                Batal
              </Button>
              <Button
                variant="warning"
                disabled={isLoadingResetAdminPass}
                onClick={async () => {
                  if (!newPassword.trim()) {
                    pushToast({
                      type: "error",
                      title: "Password kosong",
                      desc: "Isi password baru dahulu.",
                    });
                    return;
                  }
                  await handleResetPassAdmin(selectedNippReset, newPassword);
                  setNewPassword("");
                  setShowResetModal(false);
                  setShowResetPassword(false);
                }}
              >
                {isLoadingResetAdminPass ? "Menyimpan..." : "Simpan"}
              </Button>
            </>
          }
        >
          <div className="text-center mb-4">
            <p className="text-sm text-gray-600">
              NIPP: <span className="font-semibold">{selectedNippReset}</span>
            </p>
          </div>
          <div className="relative">
            <input
              type={showResetPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Masukkan password baru..."
              className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock size={18} />
            </div>
            <button
              type="button"
              onClick={() => setShowResetPassword((s) => !s)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
            >
              {showResetPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </Modal>
      )}

      {/* MODAL: Import Admin */}
      {showImportModal && (
        <Modal
          title="Import Admin (.csv / .xlsx)"
          tone="info"
          icon={<Users className="w-6 h-6 text-white" />}
          onClose={() => setShowImportModal(false)}
          footer={
            <>
              <Button
                variant="light"
                onClick={() => setShowImportModal(false)}
                disabled={importing}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                onClick={handleUploadImport}
                disabled={importing || !importFile}
              >
                {importing ? "Mengunggah..." : "Import"}
              </Button>
            </>
          }
        >
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
        </Modal>
      )}

      {/* MODAL: Konfirmasi Reset Tabel Admins */}
      {showResetConfirm && (
        <Modal
          title="Reset Tabel Admins"
          tone="danger"
          icon={<AlertTriangle className="w-6 h-6 text-white" />}
          onClose={() => setShowResetConfirm(false)}
          footer={
            <>
              <Button
                variant="light"
                onClick={() => setShowResetConfirm(false)}
                disabled={resetting}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                onClick={confirmResetAdminTable}
                disabled={resetting}
              >
                {resetting ? "Mereset..." : "Ya, Hapus Semua"}
              </Button>
            </>
          }
        >
          <p className="text-gray-700 text-center">
            Tindakan ini akan <b>menghapus semua data</b> pada tabel{" "}
            <code>admins</code>. Lanjutkan?
          </p>
        </Modal>
      )}

      {/* MODAL: Konfirmasi Delete */}
      {confirmDelete.open && (
        <Modal
          title="Hapus Pengguna?"
          tone="danger"
          icon={<Trash2 className="w-6 h-6 text-white" />}
          onClose={() => setConfirmDelete({ open: false, nipp: "", role: "" })}
          footer={
            <>
              <Button
                variant="light"
                onClick={() =>
                  setConfirmDelete({ open: false, nipp: "", role: "" })
                }
              >
                Batal
              </Button>
              <Button
                variant="danger"
                onClick={async () => {
                  const { nipp: target, role: r } = confirmDelete;
                  try {
                    if (r === "admin") {
                      await handleDeleteAdmin(target);
                    } else {
                      await handleDeleteSuperAdmin(target);
                    }
                    // toast sudah dipanggil di masing-masing handler
                  } finally {
                    setConfirmDelete({ open: false, nipp: "", role: "" });
                  }
                }}
                disabled={isLoadingDeleteAdmin || isLoadingDeleteSuperAdmin}
              >
                {isLoadingDeleteAdmin || isLoadingDeleteSuperAdmin
                  ? "Menghapus..."
                  : "Hapus"}
              </Button>
            </>
          }
        >
          <div className="text-center space-y-2">
            <p className="text-gray-700">
              Kamu yakin ingin menghapus{" "}
              <span className="font-semibold">{confirmDelete.nipp}</span> dari{" "}
              <span className="font-semibold">
                {confirmDelete.role === "admin" ? "Admin" : "Super Admin"}
              </span>
              ?
            </p>
            <p className="text-xs text-rose-500">
              Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminManagePage;
