import { Router } from "express";
import {
  createPlannedBudgetItem,
  getPlannedBudgetItemsForBudget,
  updatePlannedBudgetItem,
  deletePlannedBudgetItem,
} from "../controllers/plannedBudgetItemController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.post("/", protect, createPlannedBudgetItem);
router.get("/budget/:budgetId", protect, getPlannedBudgetItemsForBudget);
router.put("/:itemId", protect, updatePlannedBudgetItem);
router.delete("/:itemId", protect, deletePlannedBudgetItem);

export default router;
