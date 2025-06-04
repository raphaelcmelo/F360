import { Request, Response } from 'express';
import Group from '../models/Group';
import User from '../models/User';
import { AuthenticatedRequest, ApiResponse } from '../types';
import { CreateGroupSchema, InviteMemberSchema, UpdateGroupDisplayNameSchema } from '../schemas';

// Create a new group
export const createGroup = async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    const validatedData = CreateGroupSchema.parse(req.body);
    const userId = req.user?._id;
    const { nome } = validatedData;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    // Check for existing group with the same display name for this user
    const existingGroupEntry = user.grupos.find(g => g.displayName === nome);
    if (existingGroupEntry) {
      return res.status(409).json({ success: false, error: 'Você já possui um grupo com este nome de exibição.' });
    }

    const newGroup = await Group.create({
      nome: nome, // The actual group name
      membros: [userId], // Creator is automatically a member
      criadoPor: userId,
    });

    // Add the new group to the creator's list of groups with its initial display name
    user.grupos.push({ groupId: newGroup._id, displayName: nome });
    await user.save();

    res.status(201).json({
      success: true,
      data: newGroup,
      message: 'Group created successfully.'
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    console.error('Error creating group:', error);
    res.status(500).json({ success: false, error: 'Server error creating group.' });
  }
};

// Get all groups a user is a member of, including their custom display names
export const getUserGroups = async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated.' });
    }

    const user = await User.findById(userId).select('grupos').lean(); // Get user's group entries
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    // Ensure user.grupos is an array before calling map
    const groupIds = (user.grupos || []).map(g => g.groupId);
    const groups = await Group.find({ _id: { $in: groupIds } }).populate('membros', 'name email').lean(); // Fetch actual group documents

    // Merge display names from user's groups array into the group objects
    const groupsWithDisplayNames = groups.map(group => {
      const userGroupEntry = (user.grupos || []).find(g => g.groupId.equals(group._id));
      return {
        ...group,
        displayName: userGroupEntry ? userGroupEntry.displayName : group.nome // Use user's display name, fallback to group's actual name
      };
    });

    res.status(200).json({
      success: true,
      data: groupsWithDisplayNames,
      message: 'User groups fetched successfully.'
    });
  } catch (error: any) {
    console.error('Error fetching user groups:', error);
    res.status(500).json({ success: false, error: 'Server error fetching groups.' });
  }
};

// Invite a member to an existing group
export const inviteMemberToGroup = async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    const { groupId } = req.params;
    const validatedData = InviteMemberSchema.parse(req.body);
    const { email } = validatedData;
    const inviterId = req.user?._id;

    if (!inviterId) {
      return res.status(401).json({ success: false, error: 'User not authenticated.' });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found.' });
    }

    // Check if the inviter is a member of the group
    if (!group.membros.includes(inviterId)) {
      return res.status(403).json({ success: false, error: 'You are not authorized to invite members to this group.' });
    }

    const invitedUser = await User.findOne({ email });

    if (!invitedUser) {
      return res.status(404).json({ success: false, error: 'User with this email not found.' });
    }

    // Check if the user is already a member of the group (by groupId)
    if ((invitedUser.grupos || []).some(g => g.groupId.equals(group._id))) {
      return res.status(400).json({ success: false, error: 'User is already a member of this group.' });
    }

    // Add user to group's members
    group.membros.push(invitedUser._id);
    await group.save();

    // Add group to user's groups with the group's actual name as default display name
    invitedUser.grupos.push({ groupId: group._id, displayName: group.nome });
    await invitedUser.save();

    res.status(200).json({
      success: true,
      message: `${invitedUser.name} has been added to the group ${group.nome}.`
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    console.error('Error inviting member:', error);
    res.status(500).json({ success: false, error: 'Server error inviting member.' });
  }
};

// New endpoint: Update user's display name for a specific group
export const updateGroupDisplayName = async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    const { groupId } = req.params;
    const validatedData = UpdateGroupDisplayNameSchema.parse(req.body);
    const { newDisplayName } = validatedData;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    // Check if the new display name conflicts with any other group the user has
    const existingDisplayNameConflict = (user.grupos || []).some(
      g => !g.groupId.equals(groupId) && g.displayName === newDisplayName
    );

    if (existingDisplayNameConflict) {
      return res.status(409).json({ success: false, error: 'Você já possui outro grupo com este nome de exibição.' });
    }

    // Find and update the specific group entry
    const groupEntry = (user.grupos || []).find(g => g.groupId.equals(groupId));

    if (!groupEntry) {
      return res.status(404).json({ success: false, error: 'Group not found in user\'s list.' });
    }

    groupEntry.displayName = newDisplayName;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Nome de exibição do grupo atualizado com sucesso.',
      data: { groupId, newDisplayName }
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, error: 'Validation error', details: error.errors });
    }
    console.error('Error updating group display name:', error);
    res.status(500).json({ success: false, error: 'Server error updating group display name.' });
  }
};

// Delete a group
export const deleteGroup = async (req: AuthenticatedRequest, res: Response<ApiResponse>) => {
  try {
    const { groupId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated.' });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found.' });
    }

    // Only the creator can delete the group
    if (!group.criadoPor.equals(userId)) {
      return res.status(403).json({ success: false, error: 'You are not authorized to delete this group.' });
    }

    // Remove the group reference from all members' user documents
    await User.updateMany(
      { 'grupos.groupId': groupId },
      { $pull: { grupos: { groupId: groupId } } }
    );

    // Delete the group document
    await Group.deleteOne({ _id: groupId });

    res.status(200).json({
      success: true,
      message: 'Group deleted successfully.'
    });
  } catch (error: any) {
    console.error('Error deleting group:', error);
    res.status(500).json({ success: false, error: 'Server error deleting group.' });
  }
};
