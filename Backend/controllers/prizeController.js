// controllers/prizeController.js
import db from "../config/Database.js";
import Prize from "../models/prizeModel.js";
import Winner from "../models/winnersModel.js";
import Pickups from "../models/pickupModel.js"; // kalau dibutuhkan, aktifkan

const makeError = (msg, code = 400) => {
  const error = new Error(msg);
  error.statusCode = code;
  return error;
};

// (opsional) kirim update ke client via socket.io jika tersedia
const broadcastPrizes = async (req) => {
  try {
    const rows = await Prize.findAll();
    if (req?.io) req.io.emit("PRIZE_UPDATE", rows);
  } catch {
    // abaikan error broadcast
  }
};

// ============== ADD PRIZE ==================
export const addPrize = async (req, res) => {
  const t = await db.transaction();
  try {
    const { id, prize, kategori } = req.body;

    if (!id || !prize || !kategori) {
      const msg = !id
        ? "id field cannot be empty !"
        : !prize
        ? "prize field cannot be empty !"
        : "kategori field cannot be empty";
      throw makeError(msg, 400);
    }

    const ifPrizeExist = await Prize.findOne({
      where: { id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (ifPrizeExist) {
      throw makeError(`Prize with ID ${id} Already Exist`, 400);
    }

    await Prize.create({ id, prize, kategori }, { transaction: t });

    await t.commit();
    await broadcastPrizes(req);

    res.status(200).json({
      status: "Success",
      message: `Prize ${prize} with ID ${id} Added to ${kategori} Successfully !`,
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    res.status(error.statusCode || 500).json({ status: "Error", message: error.message });
  }
};

// ============== GET ALL PRIZES =============
export const getPrize = async (_req, res) => {
  try {
    const prizes = await Prize.findAll();
    res.status(200).json({ status: "Success", message: "Prizes Retrieved", data: prizes });
  } catch (error) {
    res.status(error.statusCode || 500).json({ status: "Error...", message: error.message });
  }
};

// ============== GET PRIZE NAME (KATEGORI) ==
export const getPrizeName = async (_req, res) => {
  try {
    const prizes = await Prize.findAll({ attributes: ["kategori"] });
    res.status(200).json({ status: "Success", message: "Prizes Retrieved", data: prizes });
  } catch (error) {
    res.status(error.statusCode || 500).json({ status: "Error...", message: error.message });
  }
};

// ============== GET PRIZE BY ID ============
export const getPrizeById = async (req, res) => {
  try {
    const { id } = req.params;
    const prize = await Prize.findOne({ where: { id } });
    if (!prize) throw makeError(`Prize With ID ${id} Not Found !`, 404);
    res.status(200).json({ status: "Success", message: "Prize Retrieved", data: prize });
  } catch (error) {
    res.status(error.statusCode || 500).json({ status: "Error...", message: error.message });
  }
};

// ============== DELETE PRIZE BY ID =========
// Wajib kirim body { nipp } -> status winner direset ke "Belum Verifikasi"
export const deletePrizeById = async (req, res) => {
  const t = await db.transaction();
  try {
    const { id } = req.params;

    const ifPrizeExist = await Prize.findOne({
      where: { id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!ifPrizeExist) throw makeError("Prize Not Found !", 404);

    await Prize.destroy({ where: { id }, transaction: t });

    await t.commit();
    await broadcastPrizes(req);

    res.status(200).json({
      status: "Success",
      message: `Success Delete Prize ${ifPrizeExist.prize} With ID ${id} !`,
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    res.status(error.statusCode || 500).json({ status: "Error...", message: error.message });
  }
};

// ============== EDIT PRIZE (NAME & KATEGORI)
export const editPrizeNameById = async (req, res) => {
  const t = await db.transaction();
  try {
    const { id } = req.params;
    const { prize, kategori } = req.body;

    if (!prize || !kategori) {
      const msg = !prize
        ? "prize field cannot be empty !"
        : "kategori field cannot be empty";
      throw makeError(msg, 400);
    }

    const ifPrizeExist = await Prize.findOne({
      where: { id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!ifPrizeExist) throw makeError(`Prize With ${id} Not Found !`, 404);

    await Prize.update(
      { prize, kategori },
      { where: { id }, transaction: t }
    );

    await t.commit();
    await broadcastPrizes(req);

    res.status(200).json({
      status: "Success",
      message: `Success Edit Prize With ID ${id} to ${prize} !`,
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    res.status(error.statusCode || 500).json({ status: "Error...", message: error.message });
  }
};

// ============== ADD WINNER TO PRIZE ========
// PATCH /addwinner/:id  { winner }
export const addWinnerToPrize = async (req, res) => {
  const t = await db.transaction();
  try {
    const { id } = req.params;
    const { winner } = req.body;

    const winnerTrim = String(winner || "").trim();
    if (!winnerTrim) throw makeError("winner field cannot be empty !", 400);

    const ifWinnerExist = await Winner.findOne({
      where: { nipp: winnerTrim },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!ifWinnerExist) throw makeError(`Winner Dengan NIPP ${winnerTrim} Tidak Ada !`, 404);

    const ifPrizeExist = await Prize.findOne({
      where: { id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!ifPrizeExist) throw makeError(`Hadiah dengan ID ${id} Tidak Ada !`, 400);

    // pastikan NIPP belum menang hadiah lain
    const ifNIPPHadWin = await Prize.findOne({
      where: { pemenang: winnerTrim },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (ifNIPPHadWin) throw makeError(`NIPP ${winnerTrim} Sudah Pernah Menang !`, 400);

    await Prize.update(
      { pemenang: winnerTrim, status: "Belum Verifikasi" },
      { where: { id }, transaction: t }
    );

    await Winner.update(
      { status: "Belum Verifikasi" },
      { where: { nipp: winnerTrim }, transaction: t }
    );

    await t.commit();
    await broadcastPrizes(req);

    res.status(200).json({
      status: "Success",
      message: `Prize ${ifPrizeExist.prize} With ID ${id} Won by ${winnerTrim} !`,
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    res.status(error.statusCode || 500).json({ status: "Error", message: error.message });
  }
};

// ============== CLEAR WINNER (GUGUR) =======
// PATCH /winnergugur/:id  { nipp }
export const winnerGugur = async (req, res) => {
  const t = await db.transaction();
  try {
    const { id } = req.params;
    const { nipp } = req.body || {};

    const nippTrim = String(nipp || "").trim();
    if (!nippTrim) throw makeError("nipp field cannot be empty", 400);

    const ifPrizeExist = await Prize.findOne({
      where: { id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!ifPrizeExist) throw makeError(`Hadiah dengan ID ${id} Tidak Ada !`, 400);

    const ifWinnerExist = await Winner.findOne({
      where: { nipp: nippTrim },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!ifWinnerExist) {
      throw makeError(`NIPP ${nippTrim} Not Found in winners table !`, 404);
    }

    // Kosongkan pemenang & status hadiah
    await Prize.update(
      { pemenang: null, status: null },
      { where: { id }, transaction: t }
    );

    // Reset status NIPP pada tabel winners
    await Winner.update(
      { status: "Belum Verifikasi" },
      { where: { nipp: nippTrim }, transaction: t }
    );

    await t.commit();
    await broadcastPrizes(req);

    res.status(200).json({
      status: "Success",
      message: `Prize ${ifPrizeExist.prize} With ID ${id} Has no Winner !`,
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    res.status(error.statusCode || 500).json({ status: "Error", message: error.message });
  }
};

// ============== CHANGE WINNER STATUS ========
// PATCH /changestatus/:id  { status, nipp }
export const changeWinnerStatus = async (req, res) => {
  const t = await db.transaction();
  try {
    const { id } = req.params;
    const { status, nipp } = req.body;

    const statusTrim = String(status || "").trim();
    const nippTrim = String(nipp || "").trim();

    if (!statusTrim || !nippTrim) {
      const msg = !statusTrim
        ? "status field cannot be empty !"
        : "nipp field cannot be empty";
      throw makeError(msg, 400);
    }

    const ifPrizeExist = await Prize.findOne({
      where: { id },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!ifPrizeExist) throw makeError(`Hadiah dengan ID ${id} Tidak Ada !`, 400);

    if (!ifPrizeExist.pemenang) {
      throw makeError(
        `Hadiah ${ifPrizeExist.prize} dengan ID ${id} Tidak Punya Pemenang !`,
        400
      );
    }

    await Prize.update(
      { status: statusTrim },
      { where: { id }, transaction: t }
    );

    await Winner.update(
      { status: statusTrim },
      { where: { nipp: nippTrim }, transaction: t }
    );

    await t.commit();
    await broadcastPrizes(req);

    res.status(200).json({
      status: "Success",
      message: `Prize ${ifPrizeExist.prize} With ID ${id} and Winner with NIPP ${nippTrim} Status Changed to ${statusTrim} !`,
    });
  } catch (error) {
    if (!t.finished) await t.rollback();
    res.status(error.statusCode || 500).json({ status: "Error", message: error.message });
  }
};
