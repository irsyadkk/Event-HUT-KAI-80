import express from "express";
import multer from "multer";
import { importFile } from "../controllers/importController.js";
import { refreshToken } from "../controllers/refreshToken.js";
import {
  verifyToken,
  verifyAdmin,
  verifySuperAdmin,
} from "../middleware/verifyToken.js";
import { login, logout } from "../controllers/authController.js";
import {
  addAdmin,
  addSuperAdmin,
  deleteAdmin,
  getSuperAdmin,
  getSuperAdminByNIPP,
} from "../controllers/superAdminController.js";
import { getAdmin, getAdminByNIPP } from "../controllers/adminController.js";
import {
  getUser,
  getUserByNIPP,
  addUser,
  addPenetapanByNIPP,
  subPenetapanByNIPP,
  updateUser,
} from "../controllers/userController.js";
import {
  addOrder,
  deleteOrder,
  getOrder,
  getOrderByNIPP,
  editOrder,
  addOrderByAdmin,
} from "../controllers/orderController.js";
import {
  getQuota,
  addQuota,
  subQuota,
} from "../controllers/quotaController.js";
import {
  addPickup,
  getPickup,
  getPickupByNIPP,
  deletePickupByNIPP,
  editPickupByNIPP,
} from "../controllers/pickupController.js";
import {
  addPrize,
  addWinnerToPrize,
  changeWinnerStatus,
  deletePrizeById,
  editPrizeNameById,
  getPrize,
  getPrizeById,
  getPrizeName,
  winnerGugur,
} from "../controllers/prizeController.js";
import {
  addWinner,
  deleteWinnerByNipp,
  editWinnerByNipp,
  getWinner,
  getWinnerByNipp,
} from "../controllers/winnerController.js";
import { resetSingleTable } from "../controllers/resetDataController.js";
import { addEditTimer, getTimer } from "../controllers/timerController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// AUTH
router.post("/login", login);
router.delete("/logout", logout);
router.get("/token", refreshToken);

// USERS
router.get("/users", verifyToken, getUser); // ALL ROLE
router.get("/users/:nipp", verifyToken, getUserByNIPP); // ALL ROLE
router.post("/users", verifyAdmin, addUser); // ADMIN ROLE
router.patch("/usersadd/:nipp", verifyAdmin, addPenetapanByNIPP); // ADMIN ROLE
router.patch("/userssub/:nipp", verifyAdmin, subPenetapanByNIPP); // ADMIN ROLE
router.patch("/user/:nipp", verifyAdmin, updateUser); // ADMIN ROLE

// ADMIN & SUPER ADMIN
router.get("/admin", verifyAdmin, getAdmin); // ADMIN ROLE
router.get("/admin/:nipp", verifyAdmin, getAdminByNIPP); // ADMIN ROLE
router.get("/superadmin", verifySuperAdmin, getSuperAdmin); // SUPER ADMIN ROLE
router.get("/superadmin/:nipp", verifySuperAdmin, getSuperAdminByNIPP); // SUPER ADMIN ROLE
router.post("/superadmin", verifySuperAdmin, addSuperAdmin); // SUPER ADMIN ROLE
router.post("/admin", verifySuperAdmin, addAdmin); // SUPER ADMIN ROLE
router.delete("/admin/:nipp", verifySuperAdmin, deleteAdmin); // SUPER ADMIN ROLE

// ORDER
router.post("/order", verifyToken, addOrder); // ALL ROLE
router.post("/orderadmin", verifyAdmin, addOrderByAdmin); // ADMIN ROLE
router.get("/order", verifyToken, getOrder); // ALL ROLE
router.get("/order/:nipp", verifyToken, getOrderByNIPP); // ALL ROLE
router.delete("/order/:nipp", verifyAdmin, deleteOrder); // ADMIN ROLE
router.put("/order/:nipp", verifyAdmin, editOrder); // ADMIN ROLE

// QUOTA
router.get("/quota", verifyToken, getQuota); // ALL ROLE
router.patch("/addquota", verifyAdmin, addQuota); // ADMIN ROLE
router.patch("/subquota", verifyAdmin, subQuota); // ADMIN ROLE

// PICKUP
router.post("/pickup", verifyToken, addPickup); // ALL ROLE
router.get("/pickup", verifyToken, getPickup); // ALL ROLE
router.get("/pickup/:nipp", verifyToken, getPickupByNIPP); // ALL ROLE
router.delete("/pickup/:nipp", verifyAdmin, deletePickupByNIPP); // ADMIN ROLE
router.put("/pickup/:nipp", verifyAdmin, editPickupByNIPP); // ADMIN ROLE

// PRIZE
router.post("/addprize", verifyAdmin, addPrize); // ADMIN ROLE
router.get("/prize", verifyToken, getPrize); // ALL ROLE
router.get("/prizename", getPrizeName); // ALL ROLE
router.get("/prize/:id", verifyToken, getPrizeById); // ALL ROLE
router.patch("/prize/:id", verifyAdmin, editPrizeNameById); // ADMIN ROLE
router.delete("/prize/:id", verifyAdmin, deletePrizeById); // ADMIN ROLE

// WINNER TO A PRIZE
router.patch("/addwinner/:id", verifyAdmin, addWinnerToPrize); // ADMIN ROLE
router.patch("/winnergugur/:id", verifyAdmin, winnerGugur); // ADMIN ROLE
router.patch("/changestatus/:id", verifyAdmin, changeWinnerStatus); // ADMIN ROLE

// WINNER
router.post("/winner", verifyAdmin, addWinner); // ADMIN ROLE
router.get("/winner", getWinner); // ALL ROLE
router.get("/winner/:nipp", verifyToken, getWinnerByNipp); // ALL ROLE
router.put("/winner/:nipp", verifyToken, editWinnerByNipp); // ALL ROLE
router.delete("/winner/:nipp", verifyAdmin, deleteWinnerByNipp); // ADMIN ROLE

// RESET DATA TABLE
router.delete("/reset/:tableName", verifyAdmin, resetSingleTable); // ADMIN ROLE

// IMPORT DATA FROM CSV/XLSX
router.post("/import/:table", verifyAdmin, upload.single("file"), importFile);

// TIMER
router.get("/timer", getTimer); // GLOBAL
router.patch("/timer", verifyAdmin, addEditTimer); // ADMIN ROLE

export default router;
