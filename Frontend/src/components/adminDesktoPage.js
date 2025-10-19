import React, { useState, useEffect, useCallback, useTransition } from "react";
import LogoKAI from "../assets/images/LOGO HUT KAI 80 Master White-01.png";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { getUserRole } from "../getUserRole.js";

const AdminDesktopPage = () => {
  const navigate = useNavigate();
  const role = getUserRole();

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
  // --- Reset table states
  const [resetOpen, setResetOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState(null); // 'orders' | 'pickups'
  const [resetCascade, setResetCascade] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState(null); // { text, type: 'success' | 'error' }

  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  // di paling atas bersama state lain
  const [importTarget, setImportTarget] = useState(null); // 'orders' | 'pickups' | 'users'

  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersMsg, setUsersMsg] = useState(null); // {text, type}

  // === TIMER: state ===
  const [timerDate, setTimerDate] = useState(""); // "YYYY-MM-DDTHH:mm" (datetime-local)
  const [timerActive, setTimerActive] = useState(false);
  const [timerEnded, setTimerEnded] = useState(false); // event berakhir
  const [timerSaving, setTimerSaving] = useState(false);
  const [timerMsg, setTimerMsg] = useState(null); // {text, type}
  const [timerAction, setTimerAction] = useState(""); // "" | "ACTIVATE" | "DEACTIVATE" | "END"
  const [isPendingAction, startTransition] = useTransition();

  // PAGINATION LIMIT
  const ITEMS_PER_PAGE = 10;

  // GET ALL
  const [allUsers, setAllUsers] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [allPickups, setAllPickups] = useState([]);

  // Pagination USER
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const [totalUserPages, setTotalUserPages] = useState(0);
  const [totalUserItems, setTotalUserItems] = useState(0);

  // Pagination PICKUP
  const [currentPickupPage, setCurrentPickupPage] = useState(1);
  const [totalPickupPages, setTotalPickupPages] = useState(0);
  const [totalPickupItems, setTotalPickupItems] = useState(0);

  // Pagination ORDER
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalOrderItems, setTotalOrderItems] = useState(0); // Opsional, untuk info
  const [isOrderLoading, setIsOrderLoading] = useState(false);

  // === TIMER: state konfirmasi ===
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmCfg, setConfirmCfg] = useState({
    action: null, // 'ACTIVATE' | 'DEACTIVATE' | 'END'
    title: "",
    message: "",
    proceedText: "",
    loading: false,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const nipp = localStorage.getItem("nipp");
    if (!token || !nipp) {
      navigate("/");
      return;
    }
    try {
      if (!role === "superadmin" || !role === "admin") navigate("/");
      else setAllowed(true);
    } catch {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    if (!allowed) return;
    const fetchTimer = async () => {
      try {
        const res = await api.get("/timer");
        const data = res?.data?.data || {};

        if (data.date) {
          const utcDate = new Date(data.date);

          const year = utcDate.getFullYear();
          const month = String(utcDate.getMonth() + 1).padStart(2, "0");
          const day = String(utcDate.getDate()).padStart(2, "0");
          const hours = String(utcDate.getHours()).padStart(2, "0");
          const minutes = String(utcDate.getMinutes()).padStart(2, "0");

          const localDateTimeString = `${year}-${month}-${day}T${hours}:${minutes}`;
          setTimerDate(localDateTimeString);
        } else {
          setTimerDate("");
        }
        setTimerActive(!!data.active);
        setTimerEnded(!!data.ended);
      } catch (err) {
        console.error("Gagal mengambil timer:", err);
        setTimerMsg({ text: "Gagal mengambil timer.", type: "error" });
      }
    };
    fetchTimer();
  }, [allowed]);

  // ===================== API CALLS =====================
  const openImportModalForTableUsers = () => {
    setImportTarget("users");
    setImportOpen(true);
    setImportMsg(null);
    setImportFile(null);
  };
  const openImportModalForCurrentTable = () => {
    setImportTarget("orders"); // <- PENTING
    setImportOpen(true);
    setImportMsg(null);
    setImportFile(null);
  };

  const doImport = async () => {
    if (!importFile) {
      setImportMsg({ text: "Pilih file terlebih dahulu.", type: "error" });
      return;
    }
    if (!importTarget) {
      setImportMsg({ text: "Target import tidak valid.", type: "error" });
      return;
    }

    setImportLoading(true);
    try {
      const form = new FormData();
      form.append("file", importFile);

      await api.post(`/import/${importTarget}`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // refresh sesuai target
      if (importTarget === "orders") await getOrdersPagination();
      else if (importTarget === "pickups") await getPickupsPagination();
      else if (importTarget === "users") await getUsersPagination();

      setImportOpen(false);
      setImportMsg({
        text: `Import ${importTarget} berhasil.`,
        type: "success",
      });
    } catch (err) {
      setImportMsg({
        text: err?.response?.data?.message || "Gagal import.",
        type: "error",
      });
    } finally {
      setImportLoading(false);
    }
  };

  const openResetModalForTableUsers = () => {
    const table = "users";
    setResetTarget(table);
    setResetCascade(false);
    setResetOpen(true);
  };

  const openResetModalForCurrentTable = () => {
    const table = selectedTable === "order" ? "orders" : "pickups";
    setResetTarget(table);
    setResetCascade(false);
    setResetOpen(true);
  };

  const doResetTable = async () => {
    if (!resetTarget) return;
    setIsResetting(true);
    try {
      // kalau mau cascade: /reset/orders?cascade=true
      const qs = resetCascade ? "?cascade=true" : "";
      await api.delete(`/reset/${resetTarget}${qs}`);

      if (resetTarget === "orders") await getOrdersPagination();
      else if (resetTarget === "pickups") await getPickupsPagination();
      else if (resetTarget === "users") await getUsersPagination();

      setResetOpen(false);
      setResetMsg({
        text: `Berhasil reset tabel ${resetTarget}.`,
        type: "success",
      });
    } catch (err) {
      console.error("Gagal reset:", err);
      setResetMsg({
        text: err?.response?.data?.message || "Gagal reset tabel.",
        type: "error",
      });
    } finally {
      setIsResetting(false);
    }
  };

  // --- function ambil users per page
  const getUsersPagination = useCallback(
    async (page = 1) => {
      setIsLoadingUsers(true);
      setUsersMsg(null);
      try {
        const res = await api.get(
          `/userspagination?page=${page}&limit=${ITEMS_PER_PAGE}`
        );
        const responseData = res.data.data;
        const responsePagination = res.data.pagination;
        setUsers(responseData || []);
        setTotalUserPages(responsePagination.totalPages || 0);
        setCurrentUserPage(responsePagination.currentPage || 1);
        setTotalUserItems(responsePagination.totalItems || 0);
      } catch (err) {
        console.error("Gagal mengambil data users:", err);
        setUsersMsg({
          text: err?.response?.data?.message || "Gagal mengambil data users.",
          type: "error",
        });
      } finally {
        setIsLoadingUsers(false);
      }
    },
    [ITEMS_PER_PAGE]
  );

  // --- export users ke excel (opsional)
  const exportExcelUsers = () => {
    getAllUsers();
    if (!allUsers || allUsers.length === 0) return;
    const data = allUsers.map((u, i) => ({
      No: i + 1,
      NIPP: u.nipp,
      Nama: u.nama,
      Penetapan: u.penetapan,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "DataUsers.xlsx");
  };
  // GET ALL
  const getAllUsers = async () => {
    try {
      const res = await api.get("/users");
      setAllUsers(res?.data?.data || []);
    } catch (e) {
      console.error("Gagal mengambil data users:", e);
    }
  };

  const getAllOrders = async () => {
    try {
      const res = await api.get("/order");
      setAllOrders(res?.data?.data || []);
    } catch (e) {
      console.error("Gagal mengambil data orders:", e);
    }
  };

  const getAllPickups = async () => {
    try {
      const res = await api.get("/pickup");
      setAllPickups(res?.data?.data || []);
    } catch (e) {
      console.error("Gagal mengambil data pickups:", e);
    }
  };

  // GET PER PAGE
  const getOrdersPagination = useCallback(async (page) => {
    setIsOrderLoading(true);
    try {
      const res = await api.get(
        `/orderpagination?page=${page}&limit=${ITEMS_PER_PAGE}`
      );
      const responseData = res.data.data;

      setOrderList(responseData.orders || []);
      setTotalPages(responseData.totalPages || 0);
      setTotalOrderItems(responseData.totalItems || 0);
      setCurrentPage(responseData.currentPage || 1);
    } catch (err) {
      console.error("Gagal mengambil data order :", err);
    } finally {
      setIsOrderLoading(false);
    }
  }, []);

  const getPickupsPagination = useCallback(
    async (page = 1) => {
      try {
        const res = await api.get(
          `/pickuppagination?page=${page}&limit=${ITEMS_PER_PAGE}`
        );
        const responseData = res.data.data;
        const responsePagination = res.data.pagination;
        setPickupList(responseData || []);
        setTotalPickupPages(responsePagination.totalPages || 0);
        setCurrentPickupPage(responsePagination.currentPage || 1);
        setTotalPickupItems(responsePagination.totalItems || 0);
      } catch (err) {
        console.error("Gagal mengambil data pickups:", err);
      }
    },
    [ITEMS_PER_PAGE]
  );

  const getQuota = useCallback(async () => {
    try {
      const res = await api.get("/quota");
      setQuota(res.data.data.quota);
      setQuotaTotal(res.data.data.total_quota);
    } catch (err) {
      console.error("Gagal mengambil data quota :", err);
    }
  }, []);

  // Ganti fungsi handleSearch Anda dengan yang ini

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchNipp.trim()) {
      setMessageCari({ text: "NIPP tidak boleh kosong!", type: "error" });
      return;
    }
    setIsLoading(true);
    setSearchResult(null); // Reset hasil pencarian sebelumnya
    setMessageCari(""); // Reset pesan sebelumnya

    try {
      // MODIFIKASI: Gunakan Promise.allSettled
      const results = await Promise.allSettled([
        api.get(`/order/${searchNipp}`),
        api.get(`/users/${searchNipp}`),
      ]);

      const orderResult = results[0];
      const userResult = results[1];

      // Cek apakah pencarian order berhasil
      if (orderResult.status === "rejected") {
        // Jika order saja sudah tidak ditemukan, berarti memang tidak ada data
        throw new Error("NIPP tidak ditemukan / belum mendaftar");
      }

      // Jika sampai sini, berarti order PASTI ditemukan
      const orderData = orderResult.value.data.data;

      // Cek apakah user ditemukan. Jika tidak, berikan nilai default
      const userData =
        userResult.status === "fulfilled"
          ? userResult.value.data.data
          : { nama: "(Data User Tidak Ditemukan)", penetapan: "N/A" };

      setSearchResult({
        nipp: orderData.nipp,
        nama: userData.nama, // Nama dari tabel user (atau default jika tidak ada)
        penetapan: userData.penetapan, // Penetapan dari tabel user (atau default)
        anggota: orderData.nama, // Daftar anggota keluarga dari tabel order
        qr: orderData.qr,
        transportasi: orderData.transportasi,
        keberangkatan: orderData.keberangkatan,
      });
      setMessageCari({ text: "Data ditemukan!", type: "success" });
    } catch (err) {
      console.error("Gagal mengambil data:", err);
      setMessageCari({
        text: err.message || "NIPP tidak ditemukan / belum mendaftar",
        type: "error",
      });
      setSearchResult(null);
    } finally {
      setIsLoading(false);
    }
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
    getAllOrders();
    if (!allOrders || allOrders.length === 0) return;

    const data = allOrders.map((order, index) => ({
      No: index + 1,
      NIPP: order.nipp,
      "Anggota Keluarga": order.nama.join(", "),
      "Jumlah Anggota": order.nama.length,
      Status: order.status,
      Transportasi: order.transportasi,
      Keberangkatan: order.keberangkatan,
      Qr: order.qr,
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
    getAllPickups();
    if (!allPickups || allPickups.length === 0) return;

    const data = allPickups.map((pickup, index) => ({
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
      getAllUsers();
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

  const formatWIB = (dateLike) => {
    try {
      const d = typeof dateLike === "string" ? new Date(dateLike) : dateLike;
      const optsDate = {
        timeZone: "Asia/Jakarta",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      };
      const optsTime = {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      };
      const dStr = new Intl.DateTimeFormat("id-ID", optsDate).format(d);
      const tStr = new Intl.DateTimeFormat("id-ID", optsTime)
        .format(d)
        .replace(":", ".");
      return `${dStr} pukul ${tStr}`;
    } catch {
      return "";
    }
  };

  const nowJakarta = () => new Date();

  const isTimerExpired = () => {
    if (!timerDate) return false;
    const target = new Date(timerDate);
    return nowJakarta().getTime() >= target.getTime();
  };

  const currentStatusText = () => {
    if (timerEnded) return "Event berakhir.";
    if (timerDate) {
      if (isTimerExpired()) return "Timer sudah habis.";
      const when = formatWIB(timerDate);
      return timerActive
        ? `Timer diset pada ${when}.`
        : `Timer diset pada ${when} (nonaktif).`;
    }
    return timerActive ? "Timer aktif." : "Timer nonaktif.";
  };

  // === AKTIFKAN ===
  const handleSaveTimer = async () => {
    if (!timerDate) {
      setTimerMsg({ text: "Waktu belum dipilih.", type: "error" });
      return;
    }
    setTimerSaving(true);
    setTimerMsg(null);
    try {
      const localDate = new Date(timerDate);
      await api.patch("/timer", {
        date: localDate.toISOString(),
        status: true,
        ended: false,
      });
      setTimerActive(true);
      setTimerEnded(false);
      setTimerMsg({ text: "Timer diaktifkan & disimpan.", type: "success" });
      setTimerAction(""); // reset dropdown ke placeholder
    } catch (err) {
      console.error("Gagal mengaktifkan timer:", err);
      setTimerMsg({ text: "Gagal mengaktifkan timer.", type: "error" });
    } finally {
      setTimerSaving(false);
    }
  };

  // === MATIKAN (sebelum habis) ===
  const handleDeactivateTimer = async () => {
    try {
      await api.patch("/timer", { status: false, ended: false });
      setTimerActive(false);
      setTimerMsg({ text: "Timer dimatikan.", type: "success" });
      setTimerAction(""); // reset dropdown
    } catch (err) {
      console.error("Gagal mematikan timer:", err);
      setTimerMsg({ text: "Gagal mematikan timer.", type: "error" });
    }
  };

  // === AKHIRI EVENT ===
  const handleEndEvent = async () => {
    try {
      await api.patch("/timer", { status: false, ended: true });
      setTimerActive(false);
      setTimerEnded(true);
      setTimerMsg({ text: "Event diakhiri.", type: "success" });
      setTimerAction(""); // reset dropdown
    } catch (err) {
      console.error("Gagal mengakhiri event:", err);
      setTimerMsg({ text: "Gagal mengakhiri event.", type: "error" });
    }
  };

  // === perubahan dropdown
  const handleTimerActionChange = (e) => {
    const v = e.target.value;
    // jangan panggil setTimerMsg di sini biar render ringan
    startTransition(() => {
      setTimerAction(v); // render hanya Timer Card terasa halus
    });
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

  const openConfirm = (action) => {
    // susun pesan default
    let title = "";
    let message = "";
    let proceedText = "Ya, Lanjutkan";

    if (action === "ACTIVATE") {
      title = "Aktifkan Timer?";
      message =
        "Timer akan diaktifkan sesuai waktu yang Anda pilih. Pastikan waktunya sudah benar.";
      proceedText = "Aktifkan & Simpan";
    } else if (action === "DEACTIVATE") {
      title = "Matikan Timer?";
      if (isTimerExpired() || !timerActive) {
        // Safety: tidak boleh—tapi kita jaga-jaga kalau sampai terpanggil
        message = "Timer sudah habis atau tidak aktif. Tidak dapat dimatikan.";
      } else {
        message =
          "Timer yang sedang berjalan akan dimatikan. Anda bisa mengaktifkannya lagi kapan saja.";
      }
      proceedText = "Matikan Timer";
    } else if (action === "END") {
      title = "Akhiri Event?";
      if (!isTimerExpired() && timerActive) {
        message =
          "Timer masih tersisa. Mengakhiri event akan secara otomatis mematikan timer dan menutup akses Check-in. Lanjutkan?";
      } else {
        message = "Event akan diakhiri dan akses Check-in ditutup.";
      }
      proceedText = "Akhiri Event";
    }

    setConfirmCfg({ action, title, message, proceedText, loading: false });
    setConfirmOpen(true);
  };

  const handleConfirmProceed = async () => {
    setConfirmCfg((c) => ({ ...c, loading: true }));
    try {
      if (confirmCfg.action === "ACTIVATE") {
        await handleSaveTimer();
      } else if (confirmCfg.action === "DEACTIVATE") {
        if (!isTimerExpired() && timerActive) {
          await handleDeactivateTimer();
        }
      } else if (confirmCfg.action === "END") {
        await handleEndEvent();
      }
      setConfirmOpen(false);
    } finally {
      setConfirmCfg((c) => ({ ...c, loading: false }));
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
      getQuota();
    }
  }, [allowed, getQuota]);

  // Buat useEffect baru yang khusus menangani pengambilan data order
  useEffect(() => {
    if (allowed) {
      getUsersPagination(currentUserPage);
      getOrdersPagination(currentPage);
      getPickupsPagination(currentPickupPage);
    }
  }, [
    allowed,
    currentPage,
    getOrdersPagination,
    getUsersPagination,
    currentUserPage,
    getPickupsPagination,
    currentPickupPage,
  ]);

  // ===================== FUNGSI HANDLER UNTUK PAGINATION =====================
  const handlePageChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handlePageUserChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalUserPages) {
      setCurrentUserPage(pageNumber);
    }
  };

  const handlePagePickupChange = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPickupPages) {
      setCurrentPickupPage(pageNumber);
    }
  };

  // Download QR
  const downloadQRCode = () => {
    if (!searchResult || !searchResult.qr) return;

    const link = document.createElement("a");
    link.href = searchResult.qr;
    link.download = `QR-${searchResult.nipp}.png`;
    link.click();
  };

  if (!allowed) {
    navigate("/");
  }

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
                {role === "superadmin" ? (
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    Super Admin Panel
                  </h1>
                ) : (
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    Admin Panel
                  </h1>
                )}
                <p className="text-white/80 text-sm md:text-base">
                  Manajemen Peserta & Kuota
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {role === "superadmin" && (
                <button
                  onClick={() => navigate("/adminmanage")}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 text-sm md:text-base font-medium"
                >
                  Kelola Admin
                </button>
              )}

              <button
                onClick={() => navigate("/adminprize")}
                className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-700 hover:from-yellow-700 hover:to-orange-800 text-white rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 text-sm md:text-base font-medium"
              >
                Undian
              </button>

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
          <div className="lg:col-span-1 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
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

          {/* Timer Management */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Timer Registrasi
            </h2>

            {/* Dropdown Status Timer (placeholder bukan opsi) */}
            <label className="block text-sm text-gray-600 mb-1">
              Status Timer
            </label>
            <select
              value={timerAction}
              onChange={handleTimerActionChange}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 mb-4 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white text-gray-900"
            >
              <option value="" disabled hidden>
                Pilih Status untuk Timer
              </option>
              <option value="ACTIVATE">Aktifkan Timer</option>
              <option value="DEACTIVATE">Matikan Timer</option>
              <option value="END">Akhiri Event</option>
            </select>

            {/* Status saat ini */}
            <div className="mb-4 p-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-800">
              <span className="font-semibold">Status saat ini:</span>{" "}
              <span>{currentStatusText()}</span>
            </div>

            {/* === ACTIVATE: form + konfirmasi === */}
            {timerAction === "ACTIVATE" && (
              <>
                <label className="block text-sm text-gray-600 mb-1">
                  Pilih Waktu (WIB)
                </label>
                <input
                  type="datetime-local"
                  value={timerDate}
                  onChange={(e) => setTimerDate(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-2 mb-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
                <button
                  onClick={() => openConfirm("ACTIVATE")}
                  className="w-full px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl shadow-lg transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={timerSaving || !timerDate || isPendingAction}
                >
                  {timerSaving ? "Menyimpan..." : "Simpan Timer"}
                </button>
              </>
            )}

            {/* === DEACTIVATE: tombol saja (disable jika sudah habis / tidak aktif) === */}
            {timerAction === "DEACTIVATE" && (
              <button
                onClick={() => openConfirm("DEACTIVATE")}
                className={`w-full px-4 py-3 rounded-xl shadow-lg transition-all font-medium text-white
        ${
          isTimerExpired() || !timerActive
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800"
        }`}
                disabled={isTimerExpired() || !timerActive || isPendingAction}
                title={
                  isTimerExpired()
                    ? "Timer sudah habis—tidak dapat dimatikan."
                    : !timerActive
                    ? "Timer tidak aktif."
                    : "Matikan Timer"
                }
              >
                Matikan Timer
              </button>
            )}

            {/* === END: tombol saja + konfirmasi khusus jika masih ada sisa === */}
            {timerAction === "END" && (
              <button
                onClick={() => openConfirm("END")}
                className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl shadow-lg transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={isPendingAction}
                title="Akhiri event dan tutup akses Check-in"
              >
                Akhiri Event
              </button>
            )}

            {timerMsg && (
              <div
                className={`mt-3 p-3 rounded-xl ${
                  timerMsg.type === "success"
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                <p className="text-sm font-medium">{timerMsg.text}</p>
              </div>
            )}
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
        {confirmOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {confirmCfg.title}
              </h3>
              <p className="text-gray-700 text-sm mb-6">{confirmCfg.message}</p>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmOpen(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl transition-all font-medium"
                  disabled={confirmCfg.loading}
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmProceed}
                  className={`flex-1 px-4 py-3 rounded-xl text-white transition-all font-medium
            ${
              confirmCfg.action === "END"
                ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                : confirmCfg.action === "DEACTIVATE"
                ? "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800"
                : "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
            }`}
                  disabled={
                    confirmCfg.loading ||
                    (confirmCfg.action === "DEACTIVATE" &&
                      (isTimerExpired() || !timerActive))
                  }
                  title={
                    confirmCfg.action === "DEACTIVATE" &&
                    (isTimerExpired() || !timerActive)
                      ? "Tidak dapat mematikan: timer sudah habis atau tidak aktif."
                      : ""
                  }
                >
                  {confirmCfg.loading ? "Memproses..." : confirmCfg.proceedText}
                </button>
              </div>
            </div>
          </div>
        )}
        {resetOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 transform transition-all">
              <h2 className="text-2xl font-bold mb-4 text-gray-800">
                Reset Tabel {resetTarget === "orders" ? "Order" : "Pickup"}
              </h2>
              <p className="text-sm text-gray-700 mb-4">
                Aksi ini akan <b>menghapus semua data</b> dari tabel{" "}
                <b>{resetTarget}</b>. Lanjutkan?
              </p>

              <label className="flex items-center gap-2 mb-6 select-none">
                <input
                  type="checkbox"
                  checked={resetCascade}
                  onChange={(e) => setResetCascade(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">
                  Gunakan <b>CASCADE</b> (hapus baris terkait yang punya FK).
                  Gunakan jika ada constraint yang menghalangi TRUNCATE.
                </span>
              </label>

              <div className="flex gap-3">
                <button
                  onClick={() => setResetOpen(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-all font-medium"
                  disabled={isResetting}
                >
                  Batal
                </button>
                <button
                  onClick={doResetTable}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-xl transition-all font-medium"
                  disabled={isResetting}
                >
                  {isResetting ? "Menghapus..." : "Ya, Reset"}
                </button>
              </div>
            </div>
          </div>
        )}
        {importOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 transform transition-all">
              <h2 className="text-2xl font-bold mb-2 text-gray-800">
                Import{" "}
                {importTarget === "orders"
                  ? "Data Peserta (orders)"
                  : importTarget === "pickups"
                  ? "Data Pickup (pickups)"
                  : "Data Users (users)"}
              </h2>

              <p className="text-sm text-gray-600 mb-4">
                Format file: <b>.csv</b> atau <b>.xlsx</b>. Gunakan header yang
                sesuai (lihat template di bawah).
              </p>

              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-4"
              />

              {/* Template info kecil */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-700 mb-4">
                {importTarget === "orders" ? (
                  <>
                    <p className="font-semibold mb-1">
                      Template kolom (orders):
                    </p>
                    <code>
                      nipp, Anggota Keluarga, Transportasi, Keberangkatan
                    </code>
                    <p className="mt-1">
                      Contoh Anggota Keluarga: <i>Andi,Budi,Citra</i>
                    </p>
                  </>
                ) : importTarget === "pickups" ? (
                  <>
                    <p className="font-semibold mb-1">
                      Template kolom (pickups):
                    </p>
                    <code>
                      Timestamp, NIPP, Nama, Jumlah Kuota, Jenis Pengambilan,
                      Pos Pengambilan, NIPP Penanggung Jawab, Nama Penanggung
                      Jawab, Status
                    </code>
                  </>
                ) : (
                  <>
                    <p className="font-semibold mb-1">
                      Template kolom (users):
                    </p>
                    <code>nipp, nama, penetapan</code>
                  </>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setImportOpen(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-all font-medium"
                  disabled={importLoading}
                >
                  Batal
                </button>
                <button
                  onClick={doImport}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl transition-all font-medium"
                  disabled={importLoading}
                >
                  {importLoading ? "Mengunggah..." : "Upload & Import"}
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
        </div>

        {/* ==== TABEL USERS (baru) - diletakkan tepat di bawah Pencarian Pegawai ==== */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              Data Users
            </h2>
            <div className="flex gap-3">
              <button
                onClick={openImportModalForTableUsers}
                className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 text-sm md:text-base font-medium"
                title="Import Users (.csv/.xlsx)"
              >
                Import Users (.csv/.xlsx)
              </button>
              <button
                onClick={exportExcelUsers}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 text-sm md:text-base font-medium"
                disabled={users.length === 0}
              >
                Export Data Users (.xlsx)
              </button>
              <button
                onClick={openResetModalForTableUsers}
                className="px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow"
                title={`Reset semua data di tabel`}
              >
                Reset Tabel Users
              </button>
            </div>
          </div>

          {usersMsg && (
            <div
              className={`m-4 p-4 rounded-xl ${
                usersMsg.type === "error"
                  ? "bg-red-50 border border-red-200 text-red-700"
                  : "bg-green-50 border border-green-200 text-green-700"
              }`}
            >
              <p className="font-medium">{usersMsg.text}</p>
            </div>
          )}

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
                    Nama
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Penetapan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoadingUsers ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      Memuat data users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      Belum ada data users.
                    </td>
                  </tr>
                ) : (
                  users.map((u, i) => (
                    <tr
                      key={`user-${u.id ?? u.nipp}`}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {(currentUserPage - 1) * ITEMS_PER_PAGE + i + 1}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                          {u.nipp}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {u.nama}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {u.penetapan}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {totalUserPages > 0 && (
            <div className="p-4 flex flex-col md:flex-row items-center justify-between border-t border-gray-200">
              <span className="text-sm text-gray-700 mb-2 md:mb-0">
                Menampilkan{" "}
                <span className="font-semibold">
                  {(currentUserPage - 1) * ITEMS_PER_PAGE + 1}
                </span>
                {" - "}
                <span className="font-semibold">
                  {(currentUserPage - 1) * ITEMS_PER_PAGE + users.length}
                </span>
                {" dari "}
                <span className="font-semibold">{totalUserItems}</span>
                {" data"}
              </span>
              <div className="inline-flex -space-x-px rounded-md shadow-sm">
                <button
                  onClick={() => handlePageUserChange(currentUserPage - 1)}
                  disabled={currentUserPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sebelumnya
                </button>
                {/* Logika untuk menampilkan nomor halaman bisa dibuat lebih kompleks,
                        ini versi sederhana */}
                <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300">
                  Halaman {currentUserPage} dari {totalUserPages}
                </span>
                <button
                  onClick={() => handlePageUserChange(currentUserPage + 1)}
                  disabled={currentUserPage === totalUserPages}
                  className="relative inline-flex items-center rounded-r-md px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          )}
        </div>
        {/* ==== akhir TABEL USERS ==== */}

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
          {/* Search Result */}
          {searchResult && (
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-gray-100">
              {/* Header */}
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                Detail Registrasi
              </h3>

              {/* Grid untuk detail */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Kolom kiri - data detail */}
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
                    <p className="text-sm text-gray-600 font-medium">
                      Penetapan
                    </p>
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
                      <p className="text-gray-500">
                        Belum ada anggota terdaftar
                      </p>
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

                {/* Kolom kanan - QR Code */}
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
                  <button
                    className="mt-6 px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl transform hover:scale-105 font-medium"
                    onClick={() =>
                      navigate("/detailregister/edit", {
                        state: { nipp: searchResult.nipp },
                      })
                    }
                  >
                    Edit Data
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              {selectedTable === "order"
                ? "Data Peserta Terdaftar"
                : "Data Pickup"}
            </h2>

            {/* tombol export */}
            {selectedTable === "order" && (
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
            )}

            {/* tombol switch + reset */}
            <div className="flex flex-wrap gap-3">
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

              {/* --- TOMBOL RESET TABEL (current tab) --- */}
              <button
                onClick={openResetModalForCurrentTable}
                className="px-4 py-2 rounded-lg font-medium bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow"
                title={`Reset semua data di tabel ${
                  selectedTable === "order" ? "Order" : "Pickup"
                }`}
              >
                Reset Tabel {selectedTable === "order" ? "Order" : "Pickup"}
              </button>
            </div>
          </div>

          {selectedTable === "order" ? (
            <>
              {/* ---------- TABEL ORDER ---------- */}
              <div
                key="order-table"
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
                    {isOrderLoading ? ( // Tampilkan state loading
                      <tr>
                        <td
                          colSpan="7"
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          Memuat data peserta...
                        </td>
                      </tr>
                    ) : orderList.length === 0 ? (
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
                          key={`order-${order.id ?? order.nipp}`}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {/* PERBAIKI NOMOR URUT SESUAI HALAMAN */}
                            {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
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
                            <div className="flex justify-center gap-4">
                              {/* Tombol Detail */}
                              <button
                                onClick={() =>
                                  navigate("/detailregister", {
                                    state: { nipp: order.nipp },
                                  })
                                }
                                className="inline-flex items-center px-4 py-2 
                 bg-gradient-to-r from-yellow-500 to-yellow-600 
                 hover:from-yellow-600 hover:to-yellow-700 
                 text-white text-sm font-medium rounded-lg shadow 
                 transition-all"
                              >
                                Detail
                              </button>

                              {/* Tombol Edit */}
                              <button
                                onClick={() =>
                                  navigate("/detailregister/edit", {
                                    state: { nipp: order.nipp },
                                  })
                                }
                                className="inline-flex items-center px-4 py-2 
                 bg-gradient-to-r from-blue-600 to-blue-700 
                 hover:from-blue-700 hover:to-blue-800 
                 text-white text-sm font-medium rounded-lg shadow 
                 transition-all"
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {/* ============== KOMPONEN PAGINATION ============== */}
              {totalPages > 0 && (
                <div className="p-4 flex flex-col md:flex-row items-center justify-between border-t border-gray-200">
                  <span className="text-sm text-gray-700 mb-2 md:mb-0">
                    Menampilkan{" "}
                    <span className="font-semibold">
                      {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                    </span>
                    {" - "}
                    <span className="font-semibold">
                      {(currentPage - 1) * ITEMS_PER_PAGE + orderList.length}
                    </span>
                    {" dari "}
                    <span className="font-semibold">{totalOrderItems}</span>
                    {" data"}
                  </span>
                  <div className="inline-flex -space-x-px rounded-md shadow-sm">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sebelumnya
                    </button>
                    {/* Logika untuk menampilkan nomor halaman bisa dibuat lebih kompleks,
                        ini versi sederhana */}
                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300">
                      Halaman {currentPage} dari {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center rounded-r-md px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              {/* ---------- TABEL PICKUP ---------- */}
              <div
                key="pickup-table"
                className="overflow-x-auto max-h-[500px] overflow-y-auto"
              >
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
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">
                        Aksi
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {pickupList.length === 0 ? (
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
                              Belum ada data pickup!
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pickupList.map((pickup, index) => {
                        const rowKey =
                          pickup.id ??
                          (pickup.timestamp && pickup.nipp
                            ? `${pickup.nipp}-${pickup.timestamp}`
                            : `idx-${index}`);
                        return (
                          <tr
                            key={`pickup-${rowKey}`}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {(currentPickupPage - 1) * ITEMS_PER_PAGE +
                                index +
                                1}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-700">
                              {formatWIB(pickup.timestamp) || "-"}
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
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() =>
                                  navigate("/pickup/edit", {
                                    state: {
                                      nipp: pickup.nipp,
                                      timestamp: pickup.timestamp ?? null,
                                    },
                                  })
                                }
                                className="inline-flex items-center px-4 py-2 
                      bg-gradient-to-r from-blue-600 to-blue-700 
                      hover:from-blue-700 hover:to-blue-800 
                      text-white text-sm font-medium rounded-lg shadow 
                      transition-all"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* ============== KOMPONEN PAGINATION PICKUP ============== */}
              {totalPickupPages > 0 && (
                <div className="p-4 flex flex-col md:flex-row items-center justify-between border-t border-gray-200">
                  <span className="text-sm text-gray-700 mb-2 md:mb-0">
                    Menampilkan{" "}
                    <span className="font-semibold">
                      {(currentPickupPage - 1) * ITEMS_PER_PAGE + 1}
                    </span>
                    {" - "}
                    <span className="font-semibold">
                      {(currentPickupPage - 1) * ITEMS_PER_PAGE +
                        pickupList.length}
                    </span>
                    {" dari "}
                    <span className="font-semibold">{totalPickupItems}</span>
                    {" data"}
                  </span>

                  <div className="inline-flex -space-x-px rounded-md shadow-sm">
                    <button
                      onClick={() =>
                        handlePagePickupChange(currentPickupPage - 1)
                      }
                      disabled={currentPickupPage === 1}
                      className="relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sebelumnya
                    </button>

                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300">
                      Halaman {currentPickupPage} dari {totalPickupPages}
                    </span>

                    <button
                      onClick={() =>
                        handlePagePickupChange(currentPickupPage + 1)
                      }
                      disabled={currentPickupPage === totalPickupPages}
                      className="relative inline-flex items-center rounded-r-md px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDesktopPage;
