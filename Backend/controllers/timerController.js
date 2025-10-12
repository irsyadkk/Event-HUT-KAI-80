import db from "../config/Database.js";
import Timer from "../models/timerModel.js";

const makeError = (msg, code = 400) => {
  const error = new Error(msg);
  error.statusCode = code;
  return error;
};

// GET TIMER
export const getTimer = async (req, res) => {
  try {
    const timer = await Timer.findOne({ where: { id: 1 } });

    if (!timer) {
      return res.status(404).json({
        status: "Error",
        message: "Timer not found",
      });
    }

    res.status(200).json({
      status: "Success",
      message: "Timer retrieved",
      data: timer,
    });
  } catch (error) {
    console.error(error);
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
};

// ADD/EDIT TIMER
export const addEditTimer = async (req, res) => {
  const t = await db.transaction();
  try {
    const { date, status, ended } = req.body;

    // Validasi dasar
    if (status === undefined || ended === undefined) {
      throw makeError("Field 'status' dan 'ended' tidak boleh kosong!", 400);
    }
    
    // Ambil data timer yang ada
    let timer = await Timer.findOne({ where: { id: 1 }, transaction: t });
    if (!timer) {
      // Jika timer belum ada, buat dulu
      timer = await Timer.create({ id: 1, date: null, active: false, ended: false }, { transaction: t });
    }

    const dataToUpdate = {
      active: status,
      ended: ended,
    };

    // Hanya proses 'date' jika diberikan di body request
    if (date) {
      const inputDate = new Date(date);
      const now = new Date();

      if (inputDate <= now) {
        throw makeError("Waktu yang dipilih harus lebih besar dari waktu saat ini!");
      }
      // Tambahkan 'date' ke data yang akan di-update
      dataToUpdate.date = inputDate;
    }
    
    // Lakukan update dengan data yang sudah disiapkan
    await Timer.update(dataToUpdate, { where: { id: 1 }, transaction: t });

    // Ambil data terbaru setelah update untuk dikirim kembali
    const updatedTimer = await Timer.findOne({ where: { id: 1 }, transaction: t });

    await t.commit();

    res.status(200).json({
      status: "Success",
      message: "Timer berhasil di-update.",
      data: updatedTimer,
    });

  } catch (error) {
    if (t && !t.finished) {
      await t.rollback();
    }
    console.error("Error updating timer:", error);
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
};
