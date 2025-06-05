import { Router } from "express";
import {
  createGroup,
  getUserGroups,
  inviteMember,
  updateGroupDisplayName,
  deleteGroup,
  removeMember,
} from "../controllers/groupController";
import { authenticateToken } from "../middleware/auth";

const router = Router();

// Protect all group routes
router.use(authenticateToken);

router.post("/", createGroup);
router.get("/", getUserGroups);
router.post("/:groupId/invite", inviteMember);
router.put("/:groupId/display-name", updateGroupDisplayName);
router.delete("/:groupId", deleteGroup);
router.delete("/:groupId/members/:memberId", removeMember); // New route for removing members

export default router;
