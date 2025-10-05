import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import Admin from "../models/adminModel.js";
import SuperAdmin from "../models/superAdminModel.js";

export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.sendStatus(401);

    // Cari di 3 tabel
    let entity =
      (await SuperAdmin.findOne({ where: { refresh_token: refreshToken } })) ||
      (await Admin.findOne({ where: { refresh_token: refreshToken } })) ||
      (await User.findOne({ where: { refresh_token: refreshToken } }));

    if (!entity) return res.sendStatus(403);

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded) => {
        if (err) return res.sendStatus(403);

        const safeData = {
          nipp: entity.nipp,
          nama: entity.nama,
          role: decoded.role, // ambil dari payload lama
        };

        const accessToken = jwt.sign(
          safeData,
          process.env.ACCESS_TOKEN_SECRET,
          { expiresIn: "15m" }
        );

        res.json({ accessToken });
      }
    );
  } catch (error) {
    res.status(500).json({
      status: "Error",
      message: error.message,
    });
  }
};
