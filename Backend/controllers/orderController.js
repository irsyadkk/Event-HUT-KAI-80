import Order from "../models/orderModel.js";
import User from "../models/userModel.js";
import Quota from "../models/quotaModel.js";
import QRCode from "qrcode";
import db from "../config/Database.js";

const makeError = (msg, code = 400) => {
  const error = new Error(msg);
  error.statusCode = code;
  return error;
};

// ADD ORDER
export const addOrder = async (req, res) => {
  const t = await db.transaction();
  try {
    const { nipp, nama, status } = req.body;

    // INPUT VALIDATION
    if (
      !nipp ||
      !nama ||
      !status ||
      !Array.isArray(nama) ||
      nama.some((n) => typeof n !== "string" || !n.trim())
    ) {
      const msg = !nipp
        ? "NIPP field cannot be empty !"
        : !nama
        ? "Nama field cannot be empty !"
        : !status
        ? "Status field cannot be empty !"
        : !Array.isArray(nama)
        ? "Nama must be an array !"
        : "Each Element in Nama Must be String & Cannot be Empty !";
      throw makeError(msg, 400);
    }

    const jumlahPeserta = nama.length;

    // USER CHECK
    const user = await User.findOne({ where: { nipp }, transaction: t });
    if (!user) throw makeError("User Tidak Ditemukan !", 404);

    const currentPenetapan = user.penetapan;

    // QUOTA CHECK
    const quota = await Quota.findOne({ where: { id: 1 }, transaction: t });
    const currentQuota = quota.quota;

    // HITUNG PENGURANGAN SESUAI STATUS
    let penguranganPenetapan;
    let penguranganQuota;

    if (status.toLowerCase() === "tidak hadir") {
      penguranganPenetapan = jumlahPeserta + 1;
      penguranganQuota = jumlahPeserta;
    } else if (status.toLowerCase() === "hadir") {
      penguranganPenetapan = jumlahPeserta;
      penguranganQuota = jumlahPeserta;
    } else {
      throw makeError(
        "Status tidak valid (gunakan 'hadir' atau 'tidak hadir')",
        400
      );
    }

    // VALIDASI
    if (currentPenetapan < penguranganPenetapan) {
      throw makeError(
        `Jatah Kamu Tidak Mencukupi. Jatah Tersisa ${currentPenetapan} !`,
        400
      );
    }
    if (currentQuota < penguranganQuota) {
      throw makeError(
        `Quota Tidak Mencukupi. Quota Tersisa ${currentQuota} !`,
        400
      );
    }

    // CEK ORDER EXIST
    const existingOrder = await Order.findOne({
      where: { nipp },
      transaction: t,
    });

    // UPDATE / CREATE ORDER
    if (existingOrder) {
      const updatedNama = [...existingOrder.nama, ...nama];
      const qrData = JSON.stringify({ nipp, nama: updatedNama, status });
      const qrCode = await QRCode.toDataURL(qrData);

      await existingOrder.update(
        { nama: updatedNama, qr: qrCode, status },
        { transaction: t }
      );
    } else {
      const qrData = JSON.stringify({ nipp, nama, status });
      const qrCode = await QRCode.toDataURL(qrData);

      await Order.create(
        { nipp, nama, status, qr: qrCode },
        { transaction: t }
      );
    }

    // UPDATE PENETAPAN & QUOTA
    const updatedPenetapan = currentPenetapan - penguranganPenetapan;
    const updatedQuota = currentQuota - penguranganQuota;

    await User.update(
      { penetapan: updatedPenetapan },
      { where: { nipp }, transaction: t }
    );
    await Quota.update(
      { quota: updatedQuota },
      { where: { id: 1 }, transaction: t }
    );

    await t.commit();
    res.status(201).json({
      status: "Success",
      message: "Order Created",
      data: { nipp, nama, status, updatedPenetapan, updatedQuota },
    });
  } catch (error) {
    await t.rollback();
    res.status(error.statusCode || 500).json({
      status: "Error...",
      message: error.message,
    });
  }
};

// GET ORDERS
export const getOrder = async (req, res) => {
  try {
    const orders = await Order.findAll();
    res.status(200).json({
      status: "Success",
      message: "Orders Retrieved",
      data: orders,
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
    const { nama, status } = req.body;

    // VALIDASI INPUT
    if (
      !nama ||
      !status ||
      !Array.isArray(nama) ||
      nama.some((n) => typeof n !== "string" || !n.trim())
    ) {
      const msg = !nama
        ? "Nama field cannot be empty !"
        : !status
        ? "Status field cannot be empty !"
        : !Array.isArray(nama)
        ? "Nama must be an array !"
        : "Each Element in Nama Must be String & Cannot be Empty !";
      throw makeError(msg, 400);
    }

    const order = await Order.findOne({ where: { nipp }, transaction: t });
    if (!order) throw makeError("Order Not Found !", 404);

    const oldCount = order.nama.length;
    const newCount = nama.length;
    const diff = newCount - oldCount;

    const user = await User.findOne({ where: { nipp }, transaction: t });
    const quota = await Quota.findOne({ where: { id: 1 }, transaction: t });

    let penguranganPenetapan = 0;
    let penguranganQuota = 0;

    if (status.toLowerCase() === "tidak hadir") {
      if (diff > 0) {
        penguranganPenetapan = diff + 1;
        penguranganQuota = diff;
      } else if (diff < 0) {
        penguranganPenetapan = diff - 1; // balikkan (hapus peserta + bonus 1)
        penguranganQuota = diff;
      }
    } else if (status.toLowerCase() === "hadir") {
      penguranganPenetapan = diff;
      penguranganQuota = diff;
    } else {
      throw makeError(
        "Status tidak valid (gunakan 'hadir' atau 'tidak hadir')",
        400
      );
    }

    // VALIDASI
    if (user.penetapan < penguranganPenetapan) {
      throw makeError(
        `Jatah Kamu Tidak Mencukupi. Tersisa ${user.penetapan}`,
        400
      );
    }
    if (quota.quota < penguranganQuota) {
      throw makeError(`Quota Tidak Mencukupi. Tersisa ${quota.quota}`, 400);
    }

    // UPDATE DB
    const updatedPenetapan = user.penetapan - penguranganPenetapan;
    const updatedQuota = quota.quota - penguranganQuota;

    await User.update(
      { penetapan: updatedPenetapan },
      { where: { nipp }, transaction: t }
    );
    await Quota.update(
      { quota: updatedQuota },
      { where: { id: 1 }, transaction: t }
    );

    const qrData = JSON.stringify({ nipp, nama, status });
    const qrCode = await QRCode.toDataURL(qrData);

    await order.update({ nama, status, qr: qrCode }, { transaction: t });

    await t.commit();
    res.status(200).json({
      status: "Success",
      message: `Order ${nipp} Updated`,
      data: { nipp, nama, status, updatedPenetapan, updatedQuota },
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
