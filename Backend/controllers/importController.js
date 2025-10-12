import fs from "fs";
import path from "path";
import csv from "csv-parser";
import XLSX from "xlsx";
import Order from "../models/orderModel.js";
import db from "../config/Database.js";
import Prize from "../models/prizeModel.js";
import User from "../models/userModel.js";
import Admin from "../models/adminModel.js";
import bcrypt from "bcrypt";
import { refreshToken } from "./refreshToken.js";

const makeError = (msg, code = 400) => {
  const err = new Error(msg);
  err.statusCode = code;
  return err;
};

// Daftar tabel yang diizinkan untuk import
const models = {
  orders: Order,
  users: User,
  prizes: Prize,
  admins: Admin,
};

// --- Helpers parsing baris dari CSV/XLSX ---
// Orders: kamu export kolom "Anggota Keluarga" (string dipisah koma), "Transportasi", "Keberangkatan"
const parseOrdersRow = (row) => {
  const nipp = String(row.nipp ?? row.NIPP ?? "").trim();
  const transportasi = row.transportasi ?? row.Transportasi ?? null;
  const keberangkatan = row.keberangkatan ?? row.Keberangkatan ?? null;

  // Sumber anggota: "Anggota Keluarga" atau "anggota"/"nama" (string koma)
  const anggotaStr = row["Anggota Keluarga"] ?? row.anggota ?? row.nama ?? "";

  const nama = Array.isArray(anggotaStr)
    ? anggotaStr
    : String(anggotaStr || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

  return {
    nipp,
    nama, // asumsi kolom di model Order bertipe ARRAY(TEXT) atau JSONB
    transportasi,
    keberangkatan,
  };
};

// PARSE USER
const parseUserRow = (row) => ({
  nipp: (row.nipp ?? row.Nipp ?? row.NIPP).trim(),
  nama: row.nama ?? row.Nama ?? row.NAMA ?? null,
  penetapan: Number(row.penetapan ?? row.Penetapan ?? row.PENETAPAN ?? null),
  refreshToken: null,
});

// PARSE ADMIN
const parseAdminRow = (row) => ({
  nipp: (row.nipp ?? row.Nipp ?? row.NIPP).trim(),
  password:
    row.password ??
    row.Password ??
    row.PASSWORD ??
    row.pass ??
    row.Pass ??
    row.PASS ??
    null,
  refreshToken: null,
});

// PARSE PRIZE
const parsePrizeRow = (row) => ({
  prize:
    row.prize ??
    row.Prize ??
    row.PRIZE ??
    row.nama ??
    row.Nama ??
    row.NAMA ??
    row["Nama Hadiah"] ??
    null,
  kategori: row.kategori ?? row.Kategori ?? row.KATEGORI ?? null,
  pemenang: row.pemenang ?? row.Pemenang ?? row.PEMENANG ?? null,
  status: row.status ?? row.Status ?? row.STATUS ?? null,
});

export const importFile = async (req, res) => {
  const { table } = req.params;
  const file = req.file;

  try {
    if (!file) throw makeError("No file uploaded!", 400);

    const Model = models[table];
    if (!Model) throw makeError("Invalid table name!", 400);

    // --- Baca file CSV/XLSX ---
    let rows = [];
    const isCsv =
      file.mimetype === "text/csv" ||
      path.extname(file.originalname).toLowerCase() === ".csv";

    if (isCsv) {
      rows = await new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(file.path)
          .pipe(
            csv({
              bom: true,
              mapHeaders: ({ header }) => header.trim(),
              separator: ";",
            })
          ) // otomatis baca header
          .on("data", (row) => results.push(row))
          .on("end", () => resolve(results))
          .on("error", reject);
      });
    } else {
      const workbook = XLSX.readFile(file.path);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      rows = XLSX.utils.sheet_to_json(sheet, { defval: null }); // defval agar sel kosong -> null
    }

    // --- Mapping per tabel ---
    let payload = [];
    if (table === "orders") {
      payload = rows.map(parseOrdersRow).filter((r) => r.nipp);
    } else if (table === "users") {
      payload = rows.map(parseUserRow).filter((r) => r.nipp);
    } else if (table === "prizes") {
      payload = rows.map(parsePrizeRow).filter((r) => r.prize);
    } else if (table === "admins") {
      payload = rows.map(parseAdminRow).filter((r) => r.nipp);
      payload = await Promise.all(
        payload.map(async (admin) => {
          if (admin.password) {
            const salt = await bcrypt.genSalt(10);
            admin.password = await bcrypt.hash(admin.password, salt);
          }
          return admin;
        })
      );
    }

    // --- Insert dengan transaksi ---
    const t = await db.transaction();
    try {
      // Catatan (Postgres): ignoreDuplicates bekerja kalau ada UNIQUE constraint,
      // misal orders.nipp UNIQUE. Kalau tidak ada constraint, tidak akan ada efek.
      await Model.bulkCreate(payload, {
        transaction: t,
        ignoreDuplicates: true,
      });
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw e;
    } finally {
      // hapus file temp
      try {
        fs.unlinkSync(file.path);
      } catch (_) {}
    }

    res.status(200).json({
      status: "success",
      message: `Imported ${payload.length} rows into ${table}`,
    });
  } catch (error) {
    // pastikan file temp dibersihkan juga jika error sangat awal
    if (file) {
      try {
        fs.unlinkSync(file.path);
      } catch (_) {}
    }
    res
      .status(error.statusCode || 500)
      .json({ status: "error", message: error.message });
  }
};
