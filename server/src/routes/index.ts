import { Router } from "express";
import {
  register,
  login,
  getProfile,
  forgotPassword,
  resetPassword,
  logout,
} from "../controllers/authController";
import {
  createGroup,
  getUserGroups,
  inviteMemberToGroup,
} from "../controllers/groupController"; // Import group controllers
import { protect } from "../middleware/authMiddleware";
import budgetRoutes from "./budgetRoutes"; // Import budget routes
import budgetItemRoutes from "./budgetItemRoutes"; // Import budget item routes

const router = Router();

// Auth routes
router.post("/auth/register", register);
router.post("/auth/login", login);
router.post("/auth/forgot-password", forgotPassword);
router.post("/auth/reset-password/:token", resetPassword);
router.post("/auth/logout", protect, logout); // Protect logout if it requires authentication
router.get("/auth/profile", protect, getProfile);

// Group routes
router.post("/groups", protect, createGroup);
router.get("/groups", protect, getUserGroups);
router.post("/groups/:groupId/invite", protect, inviteMemberToGroup);

// Budget routes
router.use("/budgets", budgetRoutes);
router.use("/budget-items", budgetItemRoutes);

export default router;
