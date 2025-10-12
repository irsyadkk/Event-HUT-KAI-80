import { Error } from "sequelize";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import db from "../config/Database.js";

const makeError = (msg, code = 400) => {
  const error = new Error(msg);
  error.statusCode = code;
  return error;
};

// GET USER PER PAGE
export const getUserPerPage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { rows: users, count: totalItems } = await User.findAndCountAll({
      limit,
      offset,
      order: ["nipp"],
    });

    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      status: "success",
      message: "Users retrieved successfully",
      data: users,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        perPage: limit,
      },
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error...",
      message: error.message,
    });
  }
};

// GET USER
export const getUser = async (req, res) => {
  try {
    const users = await User.findAll();

    res.status(200).json({
      status: "success",
      message: "Users retrieved successfully",
      data: users,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error...",
      message: error.message,
    });
  }
};

// GET USER BY NIPP
export const getUserByNIPP = async (req, res) => {
  try {
    const user = await User.findOne({
      where: {
        nipp: req.params.nipp,
      },
    });
    if (!user) {
      throw makeError("User Not Found !", 404);
    }
    res.status(200).json({
      status: "Success",
      message: "User Retrieved",
      data: user,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error...",
      message: error.message,
    });
  }
};

// ADD USER
export const addUser = async (req, res) => {
  const t = await db.transaction();
  try {
    const { nipp, nama, penetapan } = req.body;
    if (!nipp || !nama || !penetapan) {
      const msg = !nipp
        ? "nipp field cannot be empty !"
        : !nama
        ? "nama field cannot be empty !"
        : "Penetapan field cannot be empty !";
      throw makeError(msg, 400);
    }

    const ifUserExist = await User.findOne({
      where: { nipp: nipp },
      transaction: t,
    });
    if (ifUserExist) {
      throw makeError("User Already Exist !", 400);
    }

    await User.create(
      { nipp: nipp, nama: nama, penetapan: penetapan },
      {
        transaction: t,
      }
    );

    await t.commit();
    res.status(200).json({
      status: "Success",
      message: `Added ${nama} With ${nipp} and ${penetapan} Penetapan to Database !`,
      data: { nipp, nama, penetapan },
    });
  } catch (error) {
    await t.rollback();
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
};

// ADD USER PENETAPAN/JATAH BY NIPP
export const addPenetapanByNIPP = async (req, res) => {
  const t = await db.transaction();
  try {
    const { add } = req.body;
    const nipp = req.params.nipp;
    if (!add) {
      throw makeError("Add Field Cannot be Empty !", 400);
    }

    const ifUserExist = await User.findOne({
      where: { nipp: nipp },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!ifUserExist) {
      throw makeError("User Not Found !", 404);
    }

    const updatedPenetapan = ifUserExist.penetapan + add;

    await User.update(
      { penetapan: updatedPenetapan },
      {
        where: { nipp: nipp },
        transaction: t,
      }
    );

    await t.commit();
    res.status(200).json({
      status: "Success",
      message: `${nipp} Penetapan Added By ${add}`,
      data: { nipp, updatedPenetapan },
    });
  } catch (error) {
    await t.rollback();
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
};

// SUB USER PENETAPAN/JATAH BY NIPP
export const subPenetapanByNIPP = async (req, res) => {
  const t = await db.transaction();
  try {
    const { sub } = req.body;
    const nipp = req.params.nipp;
    if (!sub) {
      throw makeError("Sub Field Cannot be Empty !", 400);
    }

    const ifUserExist = await User.findOne({
      where: { nipp: nipp },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!ifUserExist) {
      throw makeError("User Not Found !", 404);
    }
    if (sub > ifUserExist.penetapan) {
      throw makeError(
        "Sub Value Can't Be Higher Than Current Penetapan !",
        400
      );
    }

    const updatedPenetapan = ifUserExist.penetapan - sub;

    await User.update(
      { penetapan: updatedPenetapan },
      {
        where: { nipp: nipp },
        transaction: t,
      }
    );

    await t.commit();
    res.status(200).json({
      status: "Success",
      message: `${nipp} Penetapan Subbed By ${sub}`,
      data: { nipp, updatedPenetapan },
    });
  } catch (error) {
    await t.rollback();
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
};

// DELETE USER
export const deleteUser = async (req, res) => {
  const t = await db.transaction();
  try {
    const nipp = req.params.nipp;
    const ifUserExist = await User.findOne({
      where: { nipp: nipp },
      transaction: t,
    });
    if (!ifUserExist) {
      throw makeError("User Not Found !", 404);
    }

    await User.destroy({ where: { nipp: nipp }, transaction: t });

    await t.commit();
    res.status(200).json({
      status: "Success",
      message: "User Deleted",
    });
  } catch (error) {
    await t.rollback();
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
};

// UPDATE USER
export const updateUser = async (req, res) => {
  const t = await db.transaction();
  try {
    const { nipp, nama, penetapan } = req.body;
    const nippParam = req.params.nipp;

    // Cari user lama
    const userOld = await User.findOne({
      where: { nipp: nippParam },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!userOld) {
      throw makeError("User Not Found !", 404);
    }

    const namaOld = userOld.nama;

    // Update user
    await User.update(
      { nipp: nipp, nama: nama, penetapan: penetapan },
      { where: { nipp: nippParam }, transaction: t }
    );

    // Kalau nama berubah, update di tabel lain
    if (nama && nama !== namaOld) {
      // Update pickup langsung
      await db.models.pickups.update(
        { nama: nama },
        { where: { nipp: nipp }, transaction: t }
      );

      // Update nama[1] di orders dengan raw query
      await db.query(
        `
        UPDATE orders
        SET nama[1] = :nama
        WHERE nipp = :nipp
          AND nama[1] = :namaOld
        `,
        {
          replacements: { nama, nipp, namaOld },
          transaction: t,
        }
      );
    }

    await t.commit();
    res.status(200).json({
      status: "Success",
      message: `User ${nippParam} updated successfully`,
      data: { nipp, nama, penetapan },
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
};
