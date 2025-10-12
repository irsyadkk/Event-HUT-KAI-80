import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../models/userModel.js";
import Admin from "../models/adminModel.js";
import SuperAdmin from "../models/superAdminModel.js";

// LOGIN
export async function login(req, res) {
  try {
    const { nipp, password } = req.body;

    // NO PASS = SKIP
    if (password) {
      // SUPER ADMIN
      const superadmin = await SuperAdmin.findOne({ where: { nipp } });
      if (superadmin) {
        const match = await bcrypt.compare(password, superadmin.password);
        if (!match)
          return res.status(401).json({ msg: "NIPP atau Password salah !" });
        return issueTokens(res, superadmin, "superadmin");
      }

      // ADMIN
      const admin = await Admin.findOne({ where: { nipp } });
      if (admin) {
        const match = await bcrypt.compare(password, admin.password);
        if (!match)
          return res.status(401).json({ msg: "NIPP atau Password salah !" });
        return issueTokens(res, admin, "admin");
      }
    }

    // USER
    const user = await User.findOne({ where: { nipp } });
    if (!user) {
      return res.status(404).json({ msg: "User tidak ditemukan" });
    }

    return issueTokens(res, user, "user");
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Login error", error: error.message });
  }
}

async function issueTokens(res, entity, role) {
  const safeData = { nipp: entity.nipp, nama: entity.nama, role };

  const accessToken = jwt.sign(safeData, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });
  const refreshToken = jwt.sign(safeData, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

  // simpan refresh token di DB sesuai role
  await entity.update({ refresh_token: refreshToken });

  // set cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "Strict",
    secure: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    status: "Success",
    message: `Login ${role} berhasil`,
    user: safeData,
    accessToken,
  });
}

// ========== LOGOUT ==========
export async function logout(req, res) {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.sendStatus(204);

    // cari di superadmins
    let entity = await SuperAdmin.findOne({
      where: { refresh_token: refreshToken },
    });
    if (!entity)
      entity = await Admin.findOne({ where: { refresh_token: refreshToken } });
    if (!entity)
      entity = await User.findOne({ where: { refresh_token: refreshToken } });

    if (!entity) return res.sendStatus(204);

    await entity.update({ refresh_token: null });

    res.clearCookie("refreshToken");
    return res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Logout Error" });
  }
}
