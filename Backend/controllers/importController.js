import fs from "fs";
import csv from "csv-parser";
import XLSX from "xlsx";
import User from "../models/userModel.js";
import Order from "../models/orderModel.js";
import Prize from "../models/prizeModel.js";
import db from "../config/Database.js";

const makeError = (msg, code = 400) => {
  const error = new Error(msg);
  error.statusCode = code;
  return error;
};

const models = {
  users: User,
  orders: Order,
  prizes: Prize,
};

export const importFile = async (req, res) => {
  const { table } = req.params;
  const file = req.file;

  if (!file) {
    return makeError("No file uploaded !", 400);
  }

  if (!models[table]) {
    return makeError("Invalid table name !", 400);
  }

  const t = await db.transaction();

  try {
    let data = [];

    if (file.mimetype === "text/csv") {
      // Parse CSV
      data = await new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(file.path)
          .pipe(csv())
          .on("data", (row) => results.push(row))
          .on("end", () => resolve(results))
          .on("error", reject);
      });
    } else {
      // Parse Excel
      const workbook = XLSX.readFile(file.path);
      const sheetName = workbook.SheetNames[0];
      data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    }

    // INSERT DB
    await models[table].bulkCreate(data, { t, ignoreDuplicates: true });

    // DELETE FILE AFTER OPERATION
    fs.unlinkSync(file.path);

    res.status(200).json({
      status: "success",
      message: `Imported ${data.length} rows into ${table}`,
    });
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: "Import failed", error: error.message });
  }
};
