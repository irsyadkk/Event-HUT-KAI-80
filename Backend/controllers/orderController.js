import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import Quota from "../models/quotaModel.js";
import QRCode from "qrcode";
import db from "../config/Database.js";
import Pickups from "../models/pickupModel.js";

const makeError = (msg, code = 400) => {
  const error = new Error(msg);
  error.statusCode = code;
  return error;
};

// ADD ORDER BY ADMIN
export const addOrderByAdmin = async (req, res) => {
  const t = await db.transaction();
  try {
    const { nipp, nama, status, transportasi, keberangkatan } = req.body;

    // INPUT VALIDATION
    if (
      !nipp ||
      !nama ||
      !status ||
      !transportasi ||
      !keberangkatan ||
      !Array.isArray(nama) ||
      nama.some((n) => typeof n !== "string" || !n.trim())
    ) {
      const msg = !nipp
        ? "NIPP field cannot be empty !"
        : !nama
        ? "Nama field cannot be empty !"
        : !status
        ? "Status field cannot be empty !"
        : !transportasi
        ? "Transportasi field cannot be empty !"
        : !keberangkatan
        ? "Keberangkatan field cannot be empty !"
        : !Array.isArray(nama)
        ? "Nama must be an array !"
        : "Each Element in Nama Must be String & Cannot be Empty !";
      throw makeError(msg, 400);
    }

    const jumlahPeserta = nama.length;

    // ORDER CHECK
    const order = await Order.findOne({ where: { nipp }, transaction: t });
    if (!order) throw makeError(`Order dengan NIPP ${nipp} sudah ada !`, 400);

    // QUOTA CHECK
    const quota = await Quota.findOne({ where: { id: 1 }, transaction: t });
    const currentTotalQuota = quota.total_quota;

    if (status.toLowerCase() === "tidak hadir") {
      jumlahPeserta -= 1;
    } else if (status.toLowerCase() === "hadir") {
      jumlahPeserta;
    } else {
      throw makeError(
        "Status tidak valid (gunakan 'hadir' atau 'tidak hadir')",
        400
      );
    }

    const qrData = JSON.stringify({ nipp, nama, status });
    const qrCode = await QRCode.toDataURL(qrData);

    await Order.create(
      {
        nipp,
        nama,
        status,
        qr: qrCode,
        transportasi: transportasi,
        keberangkatan: keberangkatan,
      },
      { transaction: t }
    );

    const updatedQuota = currentQuota + jumlahPeserta;

    await Quota.update(
      { quota: updatedQuota },
      { where: { id: 1 }, transaction: t }
    );

    await t.commit();
    res.status(201).json({
      status: "Success",
      message: "Order Created",
      data: {
        nipp,
        nama,
        status,
        updatedPenetapan,
        updatedQuota,
        transportasi,
        keberangkatan,
      },
    });
  } catch (error) {
    await t.rollback();
    res.status(error.statusCode || 500).json({
      status: "Error...",
      message: error.message,
    });
  }
};

// ADD ORDER
export const addOrder = async (req, res) => {
  const t = await db.transaction();
  try {
    const { nipp, nama, status, transportasi, keberangkatan } = req.body;

    // INPUT VALIDATION
    if (
      !nipp ||
      !nama ||
      !status ||
      !transportasi ||
      !keberangkatan ||
      !Array.isArray(nama) ||
      nama.some((n) => typeof n !== "string" || !n.trim())
    ) {
      const msg = !nipp
        ? "NIPP field cannot be empty !"
        : !nama
        ? "Nama field cannot be empty !"
        : !status
        ? "Status field cannot be empty !"
        : !transportasi
        ? "Transportasi field cannot be empty !"
        : !keberangkatan
        ? "Keberangkatan field cannot be empty !"
        : !Array.isArray(nama)
        ? "Nama must be an array !"
        : "Each Element in Nama Must be String & Cannot be Empty !";
      throw makeError(msg, 400);
    }

    const jumlahPeserta = nama.length;

    // AMBIL USER & QUOTA DENGAN LOCK
    const user = await User.findOne({
      where: { nipp },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!user) throw makeError("User Tidak Ditemukan !", 404);

    const quota = await Quota.findOne({
      where: { id: 1 },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    // HITUNG PENGURANGAN SESUAI STATUS
    let penguranganPenetapan = jumlahPeserta;
    let penguranganQuota = jumlahPeserta;

    if (status.toLowerCase() === "tidak hadir") {
      penguranganPenetapan = jumlahPeserta + 1; // sesuai aturan
    } else if (status.toLowerCase() !== "hadir") {
      throw makeError(
        "Status tidak valid (gunakan 'hadir' atau 'tidak hadir')",
        400
      );
    }

    // VALIDASI PENETAPAN & QUOTA
    if (user.penetapan < penguranganPenetapan) {
      throw makeError(
        `Jatah Kamu Tidak Mencukupi. Tersisa ${user.penetapan}`,
        400
      );
    }
    if (quota.quota < penguranganQuota) {
      throw makeError(`Quota Tidak Mencukupi. Tersisa ${quota.quota}`, 400);
    }

    // CEK ORDER EXIST
    const existingOrder = await Order.findOne({
      where: { nipp },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    // GENERATE QR
    const qrData = JSON.stringify({
      nipp,
      nama: existingOrder ? [...existingOrder.nama, ...nama] : nama,
      status,
    });
    const qrCode = await QRCode.toDataURL(qrData);

    // UPDATE / CREATE ORDER
    if (existingOrder) {
      await existingOrder.update(
        {
          nama: [...existingOrder.nama, ...nama],
          qr: qrCode,
          transportasi,
          keberangkatan,
        },
        { transaction: t }
      );
    } else {
      await Order.create(
        { nipp, nama, status, qr: qrCode, transportasi, keberangkatan },
        { transaction: t }
      );
    }

    // UPDATE PENETAPAN & QUOTA SECARA ATOMIK
    await User.update(
      { penetapan: db.literal(`penetapan - ${penguranganPenetapan}`) },
      { where: { nipp }, transaction: t }
    );
    await Quota.update(
      { quota: db.literal(`quota - ${penguranganQuota}`) },
      { where: { id: 1 }, transaction: t }
    );

    await t.commit();

    res.status(201).json({
      status: "Success",
      message: "Order Created",
      data: {
        nipp,
        nama,
        status,
        updatedPenetapan: user.penetapan - penguranganPenetapan,
        updatedQuota: quota.quota - penguranganQuota,
        transportasi,
        keberangkatan,
      },
    });
  } catch (error) {
    await t.rollback();
    res.status(error.statusCode || 500).json({
      status: "Error...",
      message: error.message,
    });
  }
};

// GET ORDERS (dengan Pagination)
export const getOrder = async (req, res) => {
  try {
    // 1. Ambil query parameter untuk page dan limit, berikan nilai default
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; // Default 10 item per halaman
    const offset = (page - 1) * limit;

    // 2. Gunakan findAndCountAll untuk mendapatkan data per halaman dan total data
    const { count, rows } = await Order.findAndCountAll({
      limit: limit,
      offset: offset,
      order: [
        // Opsional: urutkan data, misalnya berdasarkan ID
        ['id', 'DESC']
      ]
    });

    // 3. Hitung total halaman
    const totalPages = Math.ceil(count / limit);

    // 4. Kirim respons dengan struktur yang informatif untuk frontend
    res.status(200).json({
      status: "Success",
      message: "Orders Retrieved",
      data: {
        orders: rows,       // Data order untuk halaman saat ini
        totalItems: count,    // Total semua item di database
        totalPages: totalPages, // Total semua halaman yang ada
        currentPage: page,    // Halaman saat ini
      },
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error...",
      message: error.message,
    });
  }
};

// GET ORDER BY NIPP
export const getOrderByNIPP = async (req, res) => {
  try {
    const nipp = req.params.nipp;
    const order = await Order.findOne({ where: { nipp: nipp } });
    if (!order) {
      throw makeError("Order Not Found !", 404);
    }

    res.status(200).json({
      status: "Success",
      message: "Order Retrieved",
      data: order,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error...",
      message: error.message,
    });
  }
};

// EDIT ORDER
export const editOrder = async (req, res) => {
  const t = await db.transaction();
  try {
    const nipp = req.params.nipp;
    const { nama, status, transportasi, keberangkatan } = req.body;

    // --- Validasi dasar ---
    if (
      !Array.isArray(nama) ||
      !status ||
      !transportasi ||
      !keberangkatan ||
      nama.some((n) => typeof n !== "string" || !n.trim())
    ) {
      throw makeError("Input tidak valid", 400);
    }

    // --- Ambil data lama ---
    const order = await Order.findOne({ where: { nipp }, transaction: t });
    if (!order) throw makeError("Order Not Found !", 404);

    const user = await User.findOne({ where: { nipp }, transaction: t });
    const quota = await Quota.findOne({ where: { id: 1 }, transaction: t });
    if (!user || !quota) throw makeError("User/Quota Not Found !", 404);

    // --- Normalisasi hitung used penetapan lama & baru ---
    const oldStatus = String(order.status || "").toLowerCase();
    const newStatus = String(status || "").toLowerCase();
    const oldCountAll = Array.isArray(order.nama) ? order.nama.length : 0;
    const newCountAll = Array.isArray(nama) ? nama.length : 0;

    // Keluarga = (total - 1) jika status "hadir", else total
    const oldFamily = Math.max(
      0,
      oldStatus === "hadir" ? oldCountAll - 1 : oldCountAll
    );
    const newFamily = Math.max(
      0,
      newStatus === "hadir" ? newCountAll - 1 : newCountAll
    );

    // Penetapan dimakan = 1 (pegawai) + keluarga
    const oldUsedPenetapan = 1 + oldFamily;
    const newUsedPenetapan = 1 + newFamily;

    // Delta penetapan (positif = butuh tambahan jatah)
    let deltaPenetapan = newUsedPenetapan - oldUsedPenetapan;
    // Kebijakan: penetapan tidak pernah dikembalikan lewat edit
    if (deltaPenetapan < 0) deltaPenetapan = 0;

    // Delta quota global mengikuti jumlah real peserta di array `nama`
    // Positif = minta kursi tambahan; Negatif = mengembalikan kursi
    const deltaQuota = newCountAll - oldCountAll;

    // --- Validasi stok ---
    if (user.penetapan < deltaPenetapan) {
      throw makeError(
        `Jatah Kamu Tidak Mencukupi. Tersisa ${user.penetapan}`,
        400
      );
    }
    if (deltaQuota > 0 && quota.quota < deltaQuota) {
      throw makeError(`Quota Tidak Mencukupi. Tersisa ${quota.quota}`, 400);
    }

    // --- Hitung nilai update ---
    const updatedPenetapan = user.penetapan - deltaPenetapan; // tidak pernah naik di sini
    const updatedQuota = quota.quota - deltaQuota; // bisa naik/turun sesuai delta
    const jumlahKuota = newCountAll;

    // --- Generate QR baru ---
    const qrData = JSON.stringify({ nipp, nama, status });
    const qrCode = await QRCode.toDataURL(qrData);

    // --- Commit updates (urut: user, quota, pickups, order) ---
    await User.update(
      { penetapan: updatedPenetapan },
      { where: { nipp }, transaction: t }
    );
    await Quota.update(
      { quota: updatedQuota },
      { where: { id: 1 }, transaction: t }
    );
    await Pickups.update(
      { jumlah_kuota: jumlahKuota },
      { where: { nipp }, transaction: t }
    );
    await order.update(
      { nama, status: newStatus, qr: qrCode, transportasi, keberangkatan },
      { transaction: t }
    );

    await t.commit();
    res.status(200).json({
      status: "Success",
      message: `Order ${nipp} Updated`,
      data: {
        nipp,
        nama,
        status: newStatus,
        updatedPenetapan,
        updatedQuota,
        jumlahKuota,
      },
    });
  } catch (error) {
    await t.rollback();
    res.status(error.statusCode || 500).json({
      status: "Error...",
      message: error.message,
    });
  }
};

// DELETE ORDER
export const deleteOrder = async (req, res) => {
  const t = await db.transaction();
  try {
    const nipp = req.params.nipp;
    const order = await Order.findOne({ where: { nipp }, transaction: t });
    if (!order) throw makeError("Order not found !", 404);

    const jumlahPeserta = order.nama.length;
    const status = order.status;

    const user = await User.findOne({ where: { nipp }, transaction: t });
    const quota = await Quota.findOne({ where: { id: 1 }, transaction: t });

    let pengembalianPenetapan;
    let pengembalianQuota;

    if (status.toLowerCase() === "tidak hadir") {
      pengembalianPenetapan = jumlahPeserta + 1;
      pengembalianQuota = jumlahPeserta;
    } else {
      pengembalianPenetapan = jumlahPeserta;
      pengembalianQuota = jumlahPeserta;
    }

    const updatedPenetapan = user.penetapan + pengembalianPenetapan;
    const updatedQuota = quota.quota + pengembalianQuota;

    await User.update(
      { penetapan: updatedPenetapan },
      { where: { nipp }, transaction: t }
    );
    await Quota.update(
      { quota: updatedQuota },
      { where: { id: 1 }, transaction: t }
    );
    await Order.destroy({ where: { nipp }, transaction: t });

    await t.commit();
    res.status(200).json({
      status: "Success",
      message: "Order Deleted",
      data: { nipp, updatedPenetapan, updatedQuota },
    });
  } catch (error) {
    await t.rollback();
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
};
