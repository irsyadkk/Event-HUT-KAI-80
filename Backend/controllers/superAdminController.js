import { Error } from "sequelize";
import Admin from "../models/adminModel.js";
import SuperAdmin from "../models/superAdminModel.js";
import bcrypt from "bcrypt";
import db from "../config/Database.js";

const makeError = (msg, code = 400) => {
  const error = new Error(msg);
  error.statusCode = code;
  return error;
};

// GET SUPER ADMIN
export const getSuperAdmin = async (req, res) => {
  try {
    const superadmins = await SuperAdmin.findAll();
    res.status(200).json({
      status: "Success",
      message: "superadmins Retrieved",
      data: superadmins,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error...",
      message: error.message,
    });
  }
};

// GET SUPER ADMIN BY NIPP
export const getSuperAdminByNIPP = async (req, res) => {
  try {
    const superadmin = await SuperAdmin.findOne({
      where: {
        nipp: req.params.nipp,
      },
    });
    if (!superadmin) {
      throw makeError("Super Admin Not Found !", 404);
    }
    res.status(200).json({
      status: "Success",
      message: "Super Admin Retrieved",
      data: superadmin,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error...",
      message: error.message,
    });
  }
};

// ADD SUPER ADMIN
export const addSuperAdmin = async (req, res) => {
  const t = await db.transaction();
  try {
    const { nipp, password } = req.body;
    if (!nipp || !password) {
      const msg = !nipp
        ? "nipp field cannot be empty !"
        : "password field cannot be empty !";
      throw makeError(msg, 400);
    }

    const ifSuperAdminExist = await SuperAdmin.findOne({
      where: { nipp: nipp },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (ifSuperAdminExist) {
      throw makeError("Super Admin Already Exist !", 400);
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await SuperAdmin.create(
      { nipp: nipp, password: hashedPassword },
      {
        transaction: t,
      }
    );

    await t.commit();
    res.status(200).json({
      status: "Success",
      message: `Added ${nipp} to Super Admin !`,
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

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    await Admin.create(
      { nipp: nipp, password: hashedPassword },
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
