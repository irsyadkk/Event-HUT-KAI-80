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
    const { date } = req.body;

    if (!date) {
      throw makeError("Date field cannot be empty!", 400);
    }

    // Cari timer id=1
    let timer = await Timer.findOne({ where: { id: 1 }, transaction: t });

    if (!timer) {
      // Insert baru
      timer = await Timer.create({ id: 1, date }, { transaction: t });
    } else {
      // Update existing
      await Timer.update({ date }, { where: { id: 1 }, transaction: t });
      // Ambil ulang hasil update
      timer = await Timer.findOne({ where: { id: 1 }, transaction: t });
    }

    await t.commit();

    res.status(200).json({
      status: "Success",
      message: `Timer set to ${date}`,
      data: timer,
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
