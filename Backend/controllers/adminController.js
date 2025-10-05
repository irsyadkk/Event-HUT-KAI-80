import { Error } from "sequelize";
import Admin from "../models/adminModel.js";

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
