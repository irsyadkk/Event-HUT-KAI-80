import { Error } from "sequelize";
import Admin from "../models/adminModel.js";
import jwt from "jsonwebtoken";
import db from "../config/Database.js";

const makeError = (msg, code = 400) => {
  const error = new Error(msg);
  error.statusCode = code;
  return error;
};

// GET ADMIN
export const getAdmin = async (req, res) => {
  try {
    const admins = await Admin.findAll();
    res.status(200).json({
      status: "Success",
      message: "admins Retrieved",
      data: admins,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error...",
      message: error.message,
    });
  }
};

// GET ADMIN BY NIPP
export const getAdminByNIPP = async (req, res) => {
  try {
    const admin = await Admin.findOne({
      where: {
        nipp: req.params.nipp,
      },
    });
    if (!admin) {
      throw makeError("Admin Not Found !", 404);
    }
    res.status(200).json({
      status: "Success",
      message: "Admin Retrieved",
      data: admin,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error...",
      message: error.message,
    });
  }
};

// ADD ADMIN
export const addAdmin = async (req, res) => {
  const t = await db.transaction();
  try {
    const { nipp, password } = req.body;
    if (!nipp || !password) {
      const msg = !nipp
        ? "nipp field cannot be empty !"
        : "password field cannot be empty !";
      throw makeError(msg, 400);
    }

    const ifAdminExist = await Admin.findOne({
      where: { nipp: nipp },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (ifAdminExist) {
      throw makeError("Admin Already Exist !", 400);
    }

    await Admin.create(
      { nipp: nipp, password: password },
      {
        transaction: t,
      }
    );

    await t.commit();
    res.status(200).json({
      status: "Success",
      message: `Added ${nipp} to Admin !`,
      data: { nipp, password },
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

// DELETE ADMIN
export const deleteAdmin = async (req, res) => {
  const t = await db.transaction();
  try {
    const nipp = req.params.nipp;
    const ifAdminExist = await Admin.findOne({
      where: { nipp: nipp },
      transaction: t,
    });
    if (!ifAdminExist) {
      throw makeError("Admin Not Found !", 404);
    }

    await Admin.destroy({ where: { nipp: nipp }, transaction: t });

    await t.commit();
    res.status(200).json({
      status: "Success",
      message: "Admin Deleted",
    });
  } catch (error) {
    await t.rollback();
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
};
