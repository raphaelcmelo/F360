import express, { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getDashboardStats,
  updateUserPreferences, // Import the new controller
} from "../controllers/userController";
import { authenticateToken, requireRole } from "../middleware/auth";

const router: Router = express.Router();

// Dashboard stats (accessible by all authenticated users)
router.get("/dashboard/stats", authenticateToken, getDashboardStats);

// User preferences (accessible by authenticated user for their own preferences)
router.put("/preferences", authenticateToken, updateUserPreferences); // New route

// User management routes (admin only)
router.get("/", authenticateToken, requireRole(["admin"]), getAllUsers);
router.get("/:id", authenticateToken, requireRole(["admin"]), getUserById);
router.put("/:id", authenticateToken, requireRole(["admin"]), updateUser);
router.delete("/:id", authenticateToken, requireRole(["admin"]), deleteUser);

export default router;
