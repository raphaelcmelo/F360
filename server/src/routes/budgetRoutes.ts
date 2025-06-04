import { Router } from "express";
import {
  createBudget,
  getBudgetById,
  getGroupBudgets,
  deleteBudget,
} from "../controllers/budgetController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

router.route("/").post(authenticateToken, createBudget);
router.route("/group/:groupId").get(authenticateToken, getGroupBudgets);
router
  .route("/:budgetId")
  .get(authenticateToken, getBudgetById)
  .delete(authenticateToken, deleteBudget);

export default router;
