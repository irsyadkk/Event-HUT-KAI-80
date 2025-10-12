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

    if (status === undefined) {
      throw makeError("status field cannot be empty !", 400);
    }
    if (ended === undefined) {
      throw makeError("ended field cannot be empty !", 400);
    }

    const inputDate = new Date(date);
    const now = new Date();

    if (inputDate <= now) {
      throw makeError("date must be grater than current date !");
    }

    let timer = await Timer.findOne({ where: { id: 1 }, transaction: t });

    const timerData = {
      id: 1,
      date: inputDate, // <-- PERUBAHAN UTAMA: Gunakan objek Date, bukan string mentah
      active: status,
      ended: ended,
    };

    if (!timer) {
      await Timer.create(
        timerData,
        { transaction: t }
      );
    } else {
      await Timer.update(
        timerData,
        { where: { id: 1 }, transaction: t }
      );
    }
    // Ambil data terbaru setelah update/create
    const updatedTimer = await Timer.findOne({ where: { id: 1 }, transaction: t });

    await t.commit();

    res.status(200).json({
      status: "Success",
      message: `Timer set to ${date} with active status ${status} and ended ${ended} !`,
      data: updatedTimer,
    });
  } catch (error) {
    if (!t.finished) {
      await t.rollback();
    }
    console.error(error);
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
};
