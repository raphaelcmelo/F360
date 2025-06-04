import { Router } from "express";
import {
  createPlannedBudgetItem,
  getPlannedBudgetItemsForBudget,
  updatePlannedBudgetItem,
  deletePlannedBudgetItem,
} from "../controllers/budgetItemController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.route("/").post(authenticateToken, createPlannedBudgetItem);
router.route("/budget/:budgetId").get(authenticateToken, getPlannedBudgetItemsForBudget);
router.route("/:itemId")
  .put(authenticateToken, updatePlannedBudgetItem)
  .delete(authenticateToken, deletePlannedBudgetItem);

export default router;
