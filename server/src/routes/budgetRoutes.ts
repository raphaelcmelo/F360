import { Router } from "express";
import {
  createBudget,
  getBudgetById,
  getGroupBudgets,
  deleteBudget,
} from "../controllers/budgetController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.post("/", protect, createBudget);
router.get("/group/:groupId", protect, getGroupBudgets);
router.get("/:budgetId", protect, getBudgetById);
router.delete("/:budgetId", protect, deleteBudget);

export default router;
