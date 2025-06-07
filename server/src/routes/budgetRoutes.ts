import { Router } from "express";
import {
  createBudget,
  getBudgetById,
  getGroupBudgets,
  deleteBudget,
} from "../controllers/budgetController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.post("/", authenticateToken, createBudget);
router.get("/group/:groupId", authenticateToken, getGroupBudgets);
router.get("/:budgetId", authenticateToken, getBudgetById);
router.delete("/:budgetId", authenticateToken, deleteBudget);

export default router;
