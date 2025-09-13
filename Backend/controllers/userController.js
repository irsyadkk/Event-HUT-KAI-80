import { Error } from "sequelize";
import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import db from "../config/Database.js";

const makeError = (msg, code = 400) => {
  const error = new Error(msg);
  error.statusCode = code;
  return error;
};

// GET USER
export const getUser = async (req, res) => {
  try {
    const users = await User.findAll();
    res.status(200).json({
      status: "Success",
      message: "Users Retrieved",
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
        ? "Nama field cannot be empty !"
        : !nama
        ? "Status field cannot be empty !"
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

// LOGIN HANDLER
export async function loginHandler(req, res) {
  try {
    const { nipp } = req.body;

    const user = await User.findOne({ where: { nipp } });

    if (!user) {
      throw makeError("User Not Found !", 404);
    }

    const userPlain = user.toJSON();
    const { refresh_token: __, ...safeUserData } = userPlain;

    const accessToken = jwt.sign(
      safeUserData,
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
      safeUserData,
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "7d" }
    );

    await User.update(
      { refresh_token: refreshToken },
      { where: { nipp: user.nipp } }
    );

    res.cookie("refreshToken", refreshToken, {
      httpOnly: false,
      sameSite: "Strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      secure: true, // kalau pakai HTTPS
    });

    res.status(200).json({
      status: "Success",
      message: "Login Berhasil",
      user: safeUserData,
      accessToken,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error",
      message: error.message,
    });
  }
}

// LOGOUT
export async function logout(req, res) {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.sendStatus(204);
  const user = await User.findOne({
    where: {
      refresh_token: refreshToken,
    },
  });
  if (!user.refresh_token) return res.sendStatus(204);
  const userNIPP = user.nipp;
  await User.update(
    { refresh_token: null },
    {
      where: {
        nipp: userNIPP,
      },
    }
  );
  res.clearCookie("refreshToken");
  return res.sendStatus(200);
}
