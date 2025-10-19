import Order from "../models/orderModel.js";
import Pickups from "../models/pickupModel.js";
import Prize from "../models/prizeModel.js";
import User from "../models/userModel.js";
import Winner from "../models/winnersModel.js";
import db from "../config/Database.js";
import Admin from "../models/adminModel.js";
import Quota from "../models/quotaModel.js";

const allowedTables = {
  orders: Order,
  pickups: Pickups,
  prizes: Prize,
  users: User,
  winners: Winner,
  admins: Admin,
};

export const resetSingleTable = async (req, res) => {
  const { tableName } = req.params;

  const ModelToTruncate = allowedTables[tableName];

  if (!ModelToTruncate) {
    return res.status(400).json({
      status: "Error",
      message: `Tabel '${tableName}' tidak ditemukan atau tidak diizinkan untuk di-reset.`,
    });
  }

  const t = await db.transaction();
  try {
    await db.query(
      `TRUNCATE TABLE "${ModelToTruncate.tableName}" RESTART IDENTITY CASCADE;`,
      { transaction: t }
    );

    if (tableName === 'orders') {
      console.log("Tabel 'orders' di-reset, memulihkan quota...");
      
      // Langkah 2: Update tabel quota. Set kolom 'quota' sama dengan nilai dari kolom 'total_quota'
      await Quota.update(
        { quota: db.col('total_quota') }, // <-- Ini bagian pentingnya
        {
          where: { id: 1 }, // Asumsi data quota selalu ada di id: 1
          transaction: t
        }
      );
      
      console.log("Quota berhasil dipulihkan.");
    }

    await t.commit();
    res.status(200).json({
      status: "Success",
      message: `Semua data dari tabel '${tableName}' berhasil dihapus.`,
    });
  } catch (error) {
    if (!t.finished) {
      await t.rollback();
    }
    res.status(500).json({
      status: "Error",
      message: `Gagal me-reset tabel '${tableName}'.`,
      error: error.message,
    });
  }
};
