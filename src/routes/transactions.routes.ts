import { Router } from "express";
import {
  createTransaction,
  getAllTransactions,
  getTransactionById,
  getTransactionsByDate,
  getTransactionsByTypeAndDate,
  updateTransaction,
  deleteTransaction,
} from "../controllers/transactions.controller";

import verifyToken from "../middlewares/auth.middleware";

const router = Router();

router.post("/", verifyToken, createTransaction);
router.get("/", verifyToken, getAllTransactions);
router.get("/byDate", verifyToken, getTransactionsByDate);
router.get("/byTypeDate", verifyToken, getTransactionsByTypeAndDate);
router.get("/:id", verifyToken, getTransactionById);
router.put("/:id", verifyToken, updateTransaction);
router.delete("/:id", verifyToken, deleteTransaction);


export default router;
