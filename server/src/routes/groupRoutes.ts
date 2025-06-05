import express from "express";
import {
  createGroup,
  getUserGroups,
  inviteMemberToGroup,
  updateGroupDisplayName,
  deleteGroup,
} from "../controllers/groupController";
import { acceptGroupInvitation } from "../controllers/groupInvitationController"; // Import the new controller
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router
  .route("/")
  .post(authenticateToken, createGroup)
  .get(authenticateToken, getUserGroups);
router.route("/:groupId/invite").post(authenticateToken, inviteMemberToGroup);
router
  .route("/:groupId/display-name")
  .put(authenticateToken, updateGroupDisplayName);
router.route("/:groupId").delete(authenticateToken, deleteGroup);

// New route for accepting group invitations
router.route("/accept-invite").post(authenticateToken, acceptGroupInvitation);

export default router;
