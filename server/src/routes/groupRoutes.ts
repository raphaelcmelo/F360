import { Router } from 'express';
import {
  createGroup,
  getUserGroups,
  inviteMemberToGroup,
  updateGroupDisplayName,
  deleteGroup, // Import the new deleteGroup function
} from '../controllers/groupController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.route('/')
  .post(protect, createGroup)
  .get(protect, getUserGroups);

router.route('/:groupId/invite')
  .post(protect, inviteMemberToGroup);

router.route('/:groupId/display-name')
  .put(protect, updateGroupDisplayName);

router.route('/:groupId')
  .delete(protect, deleteGroup); // Add the delete route

export default router;
