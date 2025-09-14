import db from "../config/Database.js";
import Pickups from "../models/pickupModel.js";

const makeError = (msg, code = 400) => {
  const error = new Error(msg);
  error.statusCode = code;
  return error;
};

// ADD PICKUP
export const addPickup = async (req, res) => {
  const t = await db.transaction();
  try {
    const {
      timestamp,
      nipp,
      nama,
      jumlah_kuota,
      jenis_pengambilan,
      pos_pengambilan,
      nipp_pj,
      nama_pj,
      status,
    } = req.body;
    // Validasi minimal
    if (
      !nipp ||
      !nama ||
      !jumlah_kuota ||
      !jenis_pengambilan ||
      !pos_pengambilan ||
      !status
    ) {
      const msg = !nipp
        ? "nipp field cannot be empty !"
        : !nama
        ? "nama field cannot be empty !"
        : !jumlah_kuota
        ? "Status field cannot be empty !"
        : !jenis_pengambilan
        ? "jenis_pengambilan field cannot be empty !"
        : !pos_pengambilan
        ? "pos_pengambilan field cannot be empty !"
        : "status field cannot be empty !";
      throw makeError(msg, 400);
    }

    if (!["INDIVIDU", "KOLEKTIF"].includes(jenis_pengambilan)) {
      throw makeError("jenis_pengambilan must be INDIVIDU or KOLEKTIF", 400);
    }

    if (jenis_pengambilan === "KOLEKTIF" && (!nipp_pj || !nama_pj)) {
      throw makeError("nipp_pj & nama_pj are required for KOLEKTIF", 400);
    }

    if (Number.isNaN(Number(jumlah_kuota)) || Number(jumlah_kuota) <= 0) {
      throw makeError("jumlah_kuota must be a positive number", 400);
    }

    await Pickups.create(
      {
        timestamp: timestamp ?? new Date(),
        nipp: nipp,
        nama: nama,
        jumlah_kuota: jumlah_kuota,
        jenis_pengambilan: jenis_pengambilan,
        pos_pengambilan: pos_pengambilan,
        nipp_pj: nipp_pj,
        nama_pj: nama_pj,
        status: status,
      },
      { transaction: t }
    );

    await t.commit();
    res.status(200).json({
      status: "Success",
      message: `Pickup ${nipp} Added !`,
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
