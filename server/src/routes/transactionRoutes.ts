import { Router } from "express";
import { authenticateToken } from "../middleware/auth";
import {
  createTransaction,
  getTransactionsByGroup,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from "../controllers/transactionController";

const router = Router();

// Protect all transaction routes
router.use(authenticateToken);

router.post("/", createTransaction);
router.get("/group/:groupId", getTransactionsByGroup);
router.get("/:id", getTransactionById);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

export default router;
