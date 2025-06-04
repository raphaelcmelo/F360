import { Router } from "express";
import { protect } from "../middleware/authMiddleware";
import {
  createTransaction,
  getTransactionsByGroup,
  getTransactionById,
  updateTransaction,
  deleteTransaction,
} from "../controllers/transactionController";

const router = Router();

// Protect all transaction routes
router.use(protect);

router.post("/", createTransaction);
router.get("/group/:groupId", getTransactionsByGroup);
router.get("/:id", getTransactionById);
router.put("/:id", updateTransaction);
router.delete("/:id", deleteTransaction);

export default router;
