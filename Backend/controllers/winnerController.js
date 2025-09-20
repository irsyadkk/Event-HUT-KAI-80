import db from "../config/Database.js";
import Order from "../models/orderModel.js";
import Prize from "../models/prizeModel.js";
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

    const ifWinnerExist = await Winner.findOne({
      where: { nipp: winner },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (ifWinnerExist) {
      throw makeError(`NIPP ${winner} Already Exist in winners Table !`);
    }

    await Winner.create(
      {
        nipp: winner,
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
    const winner = await Winner.findOne({ where: { nipp } });
    if (!winner) {
      throw makeError(`Winner With NIPP ${nipp} Not Found !`, 404);
    }
    res.status(200).json({
      status: "Success",
      message: "Winner Retrieved",
      data: winner,
    });
  } catch (error) {
    res
      .status(error.statusCode || 500)
      .json({ status: "Error...", message: error.message });
  }
};

// EDIT WINNER BY NIPP (only NIPP, validate against orders)
export const editWinnerByNipp = async (req, res) => {
  const t = await db.transaction();
  try {
    const nipp = req.params.nipp;
    const { nippchange } = req.body;

    if (!nippchange) {
      throw makeError("nippchange field cannot be empty !", 400);
    }

    // Pastikan pemenang asal ada
    const winner = await Winner.findOne({
      where: { nipp },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!winner) {
      throw makeError(`Winner With NIPP ${nipp} Not Found !`, 404);
    }
    const newNipp = String(nippchange).trim();
    const oldNipp = String(nipp).trim();

    const isHasPrize = await Prize.findOne({
      where: { pemenang: oldNipp },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (isHasPrize) {
      throw makeError(`NIPP ${oldNipp} Already has a Prize !`, 400);
    }

    if (newNipp === oldNipp) {
      await t.commit();
      return res.status(200).json({
        status: "Success",
        message: "NIPP is the same, nothing to update.",
      });
    }

    const orderExists = await Order.findOne({
      where: { nipp: newNipp },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!orderExists) {
      throw makeError(`NIPP ${newNipp} doesn't exist in orders table !`, 400);
    }

    const duplicateWinner = await Winner.findOne({
      where: { nipp: newNipp },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (duplicateWinner) {
      throw makeError(`NIPP ${newNipp} already exists in winners table !`, 400);
    }

    await Winner.update(
      { nipp: newNipp, status: "Belum Verifikasi" },
      { where: { nipp: oldNipp }, transaction: t }
    );

    await t.commit();
    res.status(200).json({
      status: "Success",
      message: `Winner NIPP changed from ${oldNipp} to ${newNipp}`,
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    res.status(error.statusCode || 500).json({
      status: "Error",
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
      where: { nipp },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!winner) {
      throw makeError(`Winner With NIPP ${nipp} Not Found !`, 404);
    }

    const isHasPrize = await Prize.findOne({
      where: { pemenang: nipp },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (isHasPrize) {
      throw makeError(`NIPP ${nipp} Already has a Prize !`, 400);
    }

    await Winner.destroy({ where: { nipp }, transaction: t });

    await t.commit();
    res.status(200).json({ status: "Success", message: "Winner Deleted" });
  } catch (error) {
    if (!t.finished) await t.rollback();
    res
      .status(error.statusCode || 500)
      .json({ status: "Error...", message: error.message });
  }
};
