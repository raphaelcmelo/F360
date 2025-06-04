import express from "express";
import {
  createGroup,
  getUserGroups,
  inviteMemberToGroup,
  updateGroupDisplayName,
} from "../controllers/groupController";
import { authenticateToken } from "../middleware/auth"; // Corrected import path and function name

const router = express.Router();

router.post("/", authenticateToken, createGroup);
router.get("/", authenticateToken, getUserGroups);
router.post("/:groupId/invite", authenticateToken, inviteMemberToGroup);
router.put("/:groupId/display-name", authenticateToken, updateGroupDisplayName);

export default router;
