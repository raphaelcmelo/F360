import { Router } from "express";
import {
  createGroup,
  getUserGroups,
  inviteMemberToGroup,
  updateGroupDisplayName,
  deleteGroup, // Import deleteGroup
} from "../controllers/groupController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

router.route("/").post(protect, createGroup).get(protect, getUserGroups);
router.post("/:groupId/invite", protect, inviteMemberToGroup);
router.put("/:groupId/display-name", protect, updateGroupDisplayName);
router.delete("/:groupId", protect, deleteGroup); // Add delete route

export default router;
