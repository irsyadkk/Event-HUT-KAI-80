import express from "express";
import { refreshToken } from "../controllers/refreshToken.js";
import { verifyToken } from "../middleware/verifyToken.js";
import {
  getUser,
  getUserByNIPP,
  loginHandler,
  logout,
  addUser,
  addPenetapanByNIPP,
  subPenetapanByNIPP,
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
} from "../controllers/pickupController.js";
import {
  addPrize,
  addWinner,
  changeWinnerStatus,
  deletePrizeById,
  editPrizeNameById,
  getPrize,
  getPrizeById,
  winnerGugur,
} from "../controllers/prizeController.js";

const router = express.Router();
// REFRESH TOKEN
router.get("/token", refreshToken);

// AUTH
router.post("/login", loginHandler);
router.delete("/logout", logout);

// USERS
router.get("/users", verifyToken, getUser);
router.get("/users/:nipp", verifyToken, getUserByNIPP);
router.post("/users", verifyToken, addUser);
router.patch("/usersadd/:nipp", verifyToken, addPenetapanByNIPP);
router.patch("/userssub/:nipp", verifyToken, subPenetapanByNIPP);

// ORDER
router.post("/order", verifyToken, addOrder);
router.post("/orderadmin", verifyToken, addOrderByAdmin);
router.get("/order", verifyToken, getOrder);
router.get("/order/:nipp", verifyToken, getOrderByNIPP);
router.delete("/order/:nipp", verifyToken, deleteOrder);
router.put("/order/:nipp", verifyToken, editOrder);

// QUOTA
router.get("/quota", verifyToken, getQuota);
router.patch("/addquota", verifyToken, addQuota);
router.patch("/subquota", verifyToken, subQuota);

// PICKUP
router.post("/pickup", verifyToken, addPickup);
router.get("/pickup", verifyToken, getPickup);
router.get("/pickup/:nipp", verifyToken, getPickupByNIPP);
router.delete("/pickup/:nipp", verifyToken, deletePickupByNIPP);

// PRIZE
router.post("/addprize", verifyToken, addPrize);
router.get("/prize", getPrize);
router.get("/prize/:id", verifyToken, getPrizeById);
router.patch("/prize/:id", verifyToken, editPrizeNameById);
router.delete("/prize/:id", verifyToken, deletePrizeById);

// WINNER
router.patch("/addwinner/:id", verifyToken, addWinner);
router.patch("/winnergugur/:id", verifyToken, winnerGugur);
router.patch("/changestatus/:id", verifyToken, changeWinnerStatus);

export default router;
