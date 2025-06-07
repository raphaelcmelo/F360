import { Router } from "express";
import authRoutes from "./authRoutes";
import groupRoutes from "./groupRoutes";
import budgetRoutes from "./budgetRoutes";
import plannedBudgetItemRoutes from "./plannedBudgetItemRoutes"; // Import new routes
import transactionRoutes from "./transactionRoutes";
import activityLogRoutes from "./activityLogRoutes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/groups", groupRoutes);
router.use("/budgets", budgetRoutes);
router.use("/budget-items", plannedBudgetItemRoutes); // Use new routes
router.use("/transactions", transactionRoutes);
router.use("/activities", activityLogRoutes);

export default router;
