import db from "../config/Database";
import Pickups from "../models/pickupModel";

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
    if (
      !timestamp ||
      !nipp ||
      !nama ||
      !jumlah_kuota ||
      !jenis_pengambilan ||
      !pos_pengambilan ||
      !status
    ) {
      const msg = !timestamp
        ? "timestamp field cannot be empty !"
        : !nipp
        ? "nipp field cannot be empty !"
        : !nama
        ? "nama field cannot be empty !"
        : !jumlah_kuota
        ? "jumlah_kuota field cannot be empty !"
        : !jenis_pengambilan
        ? "jenis_pengambilan field cannot be empty !"
        : !pos_pengambilan
        ? "pos_pengambilan field cannot be empty !"
        : "status field cannot be empty !";
      throw makeError(msg, 400);
    }

    let res = await Pickups.create(
      {
        timestamp: timestamp,
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
