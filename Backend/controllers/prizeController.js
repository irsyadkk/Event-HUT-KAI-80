import db from "../config/Database.js";
import Pickups from "../models/pickupModel.js";
import Prize from "../models/prizeModel.js";

const makeError = (msg, code = 400) => {
  const error = new Error(msg);
  error.statusCode = code;
  return error;
};

// ADD PRIZE
export const addPrize = async (req, res) => {
  const t = await db.transaction();
  try {
    const { prize } = req.body;
    if (!prize) {
      const msg = "prize field cannot be empty !"
        
      throw makeError(msg, 400);
    }

    const ifPrizeExist = await Prize.findOne({
      where: { prize: prize },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (ifPrizeExist) {
      throw makeError(
        `Prize With Name ${ifPrizeExist.prize} Already Exist !`,
        400
      );
    }

    await Prize.create(
      {
        prize: prize,
        
      },
      { transaction: t }
    );

    await t.commit();
    res.status(200).json({
      status: "Success",
      message: `Prize ${prize} Added Successfully !`,
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

// GET PRIZE
export const getPrize = async (req, res) => {
  try {
    const prizes = await Prize.findAll();
    res.status(200).json({
      status: "Success",
      message: "Prizes Retrieved",
      data: prizes,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error...",
      message: error.message,
    });
  }
};

// GET PRIZE BY ID
export const getPrizeById = async (req, res) => {
  try {
    const id = req.params.id;
    const prize = await Prize.findOne({
      where: {
        id: id,
      },
    });
    if (!prize) {
      throw makeError(`Prize With ID ${id} Not Found !`, 404);
    }
    res.status(200).json({
      status: "Success",
      message: "Prize Retrieved",
      data: prize,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error...",
      message: error.message,
    });
  }
};

// DELETE PRIZE BY ID
export const deletePrizeById = async (req, res) => {
  const t = await db.transaction();
  try {
    const id = req.params.id;
    const ifPrizeExist = await Prize.findOne({
      where: {
        id: id,
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!ifPrizeExist) {
      throw makeError("Prize Not Found !", 404);
    }

    await Prize.destroy({ where: { id: id }, transaction: t });

    await t.commit();
    res.status(200).json({
      status: "Success",
      message: `Success Delete Prize ${ifPrizeExist.prize} With ID ${id} !`,
    });
  } catch (error) {
    await t.rollback();
    res.status(error.statusCode || 500).json({
      status: "Error...",
      message: error.message,
    });
  }
};

// EDIT PRIZE NAME BY ID
export const editPrizeNameById = async (req, res) => {
  const t = await db.transaction();
  try {
    const id = req.params.id;
    const { prize } = req.body;
    if (!prize) {
      const msg =
         "prize field cannot be empty !"
      throw makeError(msg, 400);
    }

    const ifPrizeExist = await Prize.findOne({
      where: {
        id: id,
      },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!ifPrizeExist) {
      throw makeError(`Prize With ${id} Not Found !`, 404);
    }

    await Prize.update(
      { prize: prize },
      {
        where: { id: id },
        transaction: t,
      }
    );

    await t.commit();
    res.status(200).json({
      status: "Success",
      message: `Success Edit Prize With ID ${id} to ${prize} !`,
    });
  } catch (error) {
    await t.rollback();
    res.status(error.statusCode || 500).json({
      status: "Error...",
      message: error.message,
    });
  }
};

// ADD WINNER
export const addWinner = async (req, res) => {
  const t = await db.transaction();
  try {
    const id = req.params.id;
    const { winner } = req.body;
    if (!winner) {
      throw makeError("winner field cannot be empty !", 400);
    }

    const ifPickupExist = await Pickups.findOne({
      where: { nipp: winner },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!ifPickupExist) {
      throw makeError(`Pickup With NIPP ${winner} Doesn't Exist !`, 404);
    }

    const ifPrizeExist = await Prize.findOne({
      where: { id: id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!ifPrizeExist) {
      throw makeError(`Prize With ID ${id} Doesn't Exist !`, 400);
    }

    await Prize.update(
      { pemenang: winner, status: "Belum Verifikasi" },
      {
        where: { id: id },
        transaction: t,
      }
    );

    await t.commit();
    res.status(200).json({
      status: "Success",
      message: `Prize ${ifPrizeExist.prize} With ID ${id} Won by ${winner} !`,
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

// WINNER GUGUR
export const winnerGugur = async (req, res) => {
  const t = await db.transaction();
  try {
    const id = req.params.id;

    const ifPrizeExist = await Prize.findOne({
      where: { id: id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!ifPrizeExist) {
      throw makeError(`Prize With ID ${id} Doesn't Exist !`, 400);
    }

    await Prize.update(
      { pemenang: null, status: null },
      {
        where: { id: id },
        transaction: t,
      }
    );

    await t.commit();
    res.status(200).json({
      status: "Success",
      message: `Prize ${ifPrizeExist.prize} With ID ${id} Has no Winner !`,
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

// CHANGE WINNER STATUS
export const changeWinnerStatus = async (req, res) => {
  const t = await db.transaction();
  try {
    const id = req.params.id;
    const { status } = req.body;
    if (!status) {
      throw makeError("status field cannot be empty !", 400);
    }

    const ifPrizeExist = await Prize.findOne({
      where: { id: id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!ifPrizeExist) {
      throw makeError(`Prize With ID ${id} Doesn't Exist !`, 400);
    }
    if (!ifPrizeExist.pemenang) {
      throw makeError(
        `Prize With ${ifPrizeExist.prize} With ID ${id} Doesn't Have a Winner !`
      );
    }

    await Prize.update(
      { status: status },
      {
        where: { id: id },
        transaction: t,
      }
    );

    await t.commit();
    res.status(200).json({
      status: "Success",
      message: `Prize ${ifPrizeExist.prize} With ID ${id} Status Changed to ${status} !`,
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
