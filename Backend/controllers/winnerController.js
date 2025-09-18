import db from "../config/Database.js";
import Order from "../models/orderModel.js";
import Pickups from "../models/pickupModel.js";
import Winner from "../models/winnersModel.js";

const makeError = (msg, code = 400) => {
  const error = new Error(msg);
  error.statusCode = code;
  return error;
};

// ADD WINNER
export const addWinner = async (req, res) => {
  const t = await db.transaction();
  try {
    const { winner } = req.body;
    if (!winner) {
      throw makeError("winner field cannot be empty", 400);
    }

    const ifOrderExist = await Order.findOne({
      where: { nipp: winner },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!ifOrderExist) {
      throw makeError(`NIPP ${winner} Doesn't Exist in orders Table !`);
    }

    await Winner.create(
      {
        winner: winner,
        status: "Belum Verifikasi",
      },
      { transaction: t }
    );

    await t.commit();
    res.status(200).json({
      status: "Success",
      message: `${winner} Added to Winners Table Successfully !`,
    });
  } catch (error) {
    if (!t.finished) {
      await t.rollback();
    }
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
};

// GET WINNER
export const getWinner = async (req, res) => {
  try {
    const winners = await Winner.findAll();
    res.status(200).json({
      status: "Success",
      message: "Winners Retrieved",
      data: winners,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error...",
      message: error.message,
    });
  }
};

// GET WINNER BY NIPP
export const getWinnerByNipp = async (req, res) => {
  try {
    const nipp = req.params.nipp;
    const winner = await Winner.findOne({
      where: {
        nipp: nipp,
      },
    });
    if (!winner) {
      throw makeError(`Winner With NIPP ${nipp} Not Found !`, 404);
    }
    res.status(200).json({
      status: "Success",
      message: "Winner Retrieved",
      data: prize,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error...",
      message: error.message,
    });
  }
};

// DELETE WINNER BY NIPP
export const deleteWinnerByNipp = async (req, res) => {
  const t = await db.transaction();
  try {
    const nipp = req.params.nipp;
    const winner = await Winner.findOne({
      where: {
        nipp: nipp,
        transaction: t,
        lock: t.LOCK.UPDATE,
      },
    });
    if (!winner) {
      throw makeError(`Winner With NIPP ${nipp} Not Found !`, 404);
    }

    await Winner.destroy({ where: { nipp: nipp }, transaction: t });

    res.status(200).json({
      status: "Success",
      message: "Winner Deleted",
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error...",
      message: error.message,
    });
  }
};
