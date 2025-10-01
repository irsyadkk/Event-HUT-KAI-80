import Order from "../models/orderModel.js";
import Pickups from "../models/pickupModel.js";
import Prize from "../models/prizeModel.js";
import User from "../models/userModel.js";
import Winner from "../models/winnersModel.js";
import db from "../config/Database.js";

const allowedTables = {
    orders: Order,
    pickups: Pickups,
    prizes: Prize,
    users: User,
    winners: Winner
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
        await ModelToTruncate.destroy({
            truncate: true,
            cascade: true,
            transaction: t,
        });

        await t.commit();
        res.status(200).json({
            status: "Success",
            message: `Semua data dari tabel '${tableName}' berhasil dihapus.`,
        });
    } catch (error) {
        await t.rollback();
        res.status(500).json({
            status: "Error",
            message: `Gagal me-reset tabel '${tableName}'.`,
            error: error.message,
        });
    }
}