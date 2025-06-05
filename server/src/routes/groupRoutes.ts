import express from "express";
import {
  createGroup,
  getUserGroups,
  inviteMemberToGroup,
  updateGroupDisplayName,
  deleteGroup,
} from "../controllers/groupController";
import { acceptGroupInvitation } from "../controllers/groupInvitationController"; // Import the new controller
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.route("/").post(protect, createGroup).get(protect, getUserGroups);
router.route("/:groupId/invite").post(protect, inviteMemberToGroup);
router.route("/:groupId/display-name").put(protect, updateGroupDisplayName);
router.route("/:groupId").delete(protect, deleteGroup);

// New route for accepting group invitations
router.route("/accept-invite").post(protect, acceptGroupInvitation);

export default router;
