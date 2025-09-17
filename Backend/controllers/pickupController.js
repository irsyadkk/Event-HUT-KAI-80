import db from "../config/Database.js";
import Pickups from "../models/pickupModel.js";
import Order from "../models/orderModel.js";

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

    const ifOrderExist = await Order.findOne({
      where: { nipp: nipp },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!ifOrderExist) {
      throw makeError(`Order ${nipp} Doesn't Exist !`, 404);
    }

    const ifPickupExist = await Pickups.findOne({
      where: { nipp: nipp },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (ifPickupExist) {
      throw makeError(`Pickup ${nipp} Already Exist !`, 409);
    }

    await Pickups.create(
      {
        timestamp:
          typeof timestamp === "string" ? timestamp : new Date().toISOString(),
        nipp: nipp,
        nama: nama,
        jumlah_kuota: jumlah_kuota,
        jenis_pengambilan: jenis_pengambilan,
        pos_pengambilan: pos_pengambilan,
        nipp_pj: nipp_pj ?? null,
        nama_pj: nama_pj ?? null,
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

// GET PICKUP
export const getPickup = async (req, res) => {
  try {
    const pickups = await Pickups.findAll();
    res.status(200).json({
      status: "Success",
      message: "Pickups Retrieved",
      data: pickups,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error...",
      message: error.message,
    });
  }
};

// GET PICKUP BY NIPP
export const getPickupByNIPP = async (req, res) => {
  try {
    const nipp = req.params.nipp;
    const pickup = await Pickups.findOne({
      where: {
        nipp: nipp,
      },
    });
    if (!pickup) {
      throw makeError("Pickup Not Found !", 404);
    }
    res.status(200).json({
      status: "Success",
      message: "Pickup Retrieved",
      data: pickup,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      status: "Error...",
      message: error.message,
    });
  }
};

// DELETE PICKUP BY NIPP
export const deletePickupByNIPP = async (req, res) => {
  const t = await db.transaction();
  try {
    const nipp = req.params.nipp;
    const pickup = await Pickups.findOne({
      where: {
        nipp: nipp,
      },
      transaction: t,
    });
    if (!pickup) {
      throw makeError("Pickup Not Found !", 404);
    }

    await Pickups.destroy({ where: { nipp: nipp }, transaction: t });

    await t.commit();
    res.status(200).json({
      status: "Success",
      message: `Success Delete Pickup With NIPP ${nipp} !`,
    });
  } catch (error) {
    await t.rollback();
    res.status(error.statusCode || 500).json({
      status: "Error...",
      message: error.message,
    });
  }
};
