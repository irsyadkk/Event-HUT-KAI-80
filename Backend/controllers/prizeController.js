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
    const { id, prize } = req.body;
    if (!id || !prize) {
      const msg = !id
        ? "id field cannot be empty !"
        : "prize field cannot be empty !";
      throw makeError(msg, 400);
    }

    const ifPrizeExist = await Prize.findOne({
      where: { id: id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (ifPrizeExist) {
      throw makeError(
        `Prize With ID ${id} Already Exist with Prize ${ifPrizeExist.prize} !`,
        400
      );
    }

    await Prize.create(
      {
        id: id,
        prize: prize,
      },
      { transaction: t }
    );

    await t.commit();
    res.status(200).json({
      status: "Success",
      message: `Prize ${prize} With ID ${id} Added !`,
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
      message: `Success Delete Prize ${prize.prize} With ID ${id} !`,
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
      throw makeError("Prize Field Can't be Empty !", 400);
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
