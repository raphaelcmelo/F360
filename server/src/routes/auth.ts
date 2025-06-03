import express, { Router } from "express";
import {
  register,
  login,
  getProfile,
  forgotPassword,
  resetPassword,
  logout,
} from "../controllers/authController";
import { authenticateToken } from "../middleware/auth";

const router: Router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/profile", authenticateToken, getProfile);

// Password recovery routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Logout route
router.post("/logout", authenticateToken, logout);

export default router;
