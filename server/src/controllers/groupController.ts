import { Request, Response } from "express";
import Group, { IGroup } from "../models/Group";
import User, { IUser } from "../models/User";
import Token from "../models/Token"; // Import Token model
import { CustomRequest } from "../middleware/authMiddleware";
import {
  CreateGroupSchema,
  InviteMemberSchema,
  UpdateGroupDisplayNameSchema,
} from "../schemas";
import { z } from "zod";
import mongoose from "mongoose";
import crypto from "crypto"; // For generating tokens
import {
  sendGroupInvitationEmail,
  sendRegistrationInvitationEmail,
} from "../utils/emailService"; // Import new email services

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
export const createGroup = async (req: CustomRequest, res: Response) => {
  try {
    const validatedData = CreateGroupSchema.parse(req.body);
    const { nome } = validatedData;

    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, error: "Usuário não autenticado." });
    }

    const newGroup: IGroup = await Group.create({
      nome,
      criadoPor: req.user.id,
      membros: [{ userId: req.user.id, role: "admin" }], // Creator is admin
    });

    // Add the new group to the creator's groups array
    await User.findByIdAndUpdate(
      req.user.id,
      {
        $push: {
          grupos: { groupId: newGroup._id, displayName: newGroup.nome },
        },
      },
      { new: true }
    );

    res.status(201).json({
      success: true,
      data: newGroup,
      message: "Grupo criado com sucesso.",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors,
        message: "Dados de grupo inválidos.",
      });
    }
    console.error("Error creating group:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor ao criar grupo.",
    });
  }
};

// @desc    Get all groups a user belongs to
// @route   GET /api/groups
// @access  Private
export const getUserGroups = async (req: CustomRequest, res: Response) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, error: "Usuário não autenticado." });
    }

    // Populate the groups array in the user object
    const userWithGroups = await User.findById(req.user.id).populate({
      path: "grupos.groupId",
      model: "Group",
      select: "-__v", // Exclude __v field from the populated Group
    });

    if (!userWithGroups) {
      return res
        .status(404)
        .json({ success: false, error: "Usuário não encontrado." });
    }

    // Transform the groups to include the user-specific displayName directly on the group object
    const transformedGroups = userWithGroups.grupos
      .filter((group) => group.groupId !== null) // Filter out any null groupIds
      .map((groupAssociation) => ({
        _id: groupAssociation.groupId._id,
        nome: groupAssociation.groupId.nome,
        membros: groupAssociation.groupId.membros,
        criadoPor: groupAssociation.groupId.criadoPor,
        createdAt: groupAssociation.groupId.createdAt,
        updatedAt: groupAssociation.groupId.updatedAt,
        displayName: groupAssociation.displayName, // Add the user-specific display name
      }));

    res.status(200).json({
      success: true,
      data: transformedGroups,
      message: "Grupos do usuário recuperados com sucesso.",
    });
  } catch (error: any) {
    console.error("Error fetching user groups:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor ao buscar grupos do usuário.",
    });
  }
};

// @desc    Invite a member to a group
// @route   POST /api/groups/:groupId/invite
// @access  Private
export const inviteMemberToGroup = async (
  req: CustomRequest,
  res: Response
) => {
  try {
    const { groupId } = req.params;
    const validatedData = InviteMemberSchema.parse(req.body);
    const { email } = validatedData;

    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, error: "Usuário não autenticado." });
    }

    // Populate the 'userId' field within the 'membros' array
    const group = await Group.findById(groupId).populate("membros.userId");

    if (!group) {
      return res
        .status(404)
        .json({ success: false, error: "Grupo não encontrado." });
    }

    console.log("Inviting user ID:", req.user.id);
    console.log("Group members:", group.membros);

    // Check if the inviting user is an admin of the group
    const inviterIsAdmin = group.membros.some((member) => {
      console.log("Checking member:", member);
      console.log("Member userId:", member?.userId);
      console.log("Member role:", member?.role);
      // Now member.userId should be populated, so we can directly compare IDs
      const isMatch =
        member && member.userId && member.userId.equals(req.user!.id);
      const hasRole =
        member && (member.role === "admin" || member.role === "owner");
      console.log("Is user ID match?", isMatch);
      console.log("Has admin/owner role?", hasRole);
      return isMatch && hasRole;
    });

    console.log("Inviter is admin:", inviterIsAdmin);

    if (!inviterIsAdmin) {
      return res.status(403).json({
        success: false,
        error: "Você não tem permissão para convidar membros para este grupo.",
      });
    }

    const invitedUser = await User.findOne({ email });

    // Generate a unique token for the invitation
    const invitationToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(invitationToken)
      .digest("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    if (invitedUser) {
      // User is already registered
      const isAlreadyMember = group.membros.some((member) =>
        member.userId.equals(invitedUser._id)
      );

      if (isAlreadyMember) {
        return res.status(400).json({
          success: false,
          error: "Este usuário já é membro deste grupo.",
        });
      }

      // Create a token for registered user to accept the invite
      await Token.create({
        userId: invitedUser._id,
        groupId: group._id,
        token: hashedToken,
        type: "groupInvitation",
        expiresAt,
      });

      await sendGroupInvitationEmail(
        email,
        group.nome,
        group._id.toString(),
        invitationToken
      );

      res.status(200).json({
        success: true,
        message: "Convite enviado com sucesso para o usuário registrado.",
      });
    } else {
      // User is not registered, send registration invitation
      // Create a token linked to the email for registration and group association
      await Token.create({
        invitedEmail: email,
        groupId: group._id,
        token: hashedToken,
        type: "groupInvitation",
        expiresAt,
      });

      await sendRegistrationInvitationEmail(
        email,
        group.nome,
        group._id.toString(),
        invitationToken
      );

      res.status(200).json({
        success: true,
        message: "Convite de registro enviado com sucesso para o novo usuário.",
      });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors,
        message: "Dados de convite inválidos.",
      });
    }
    console.error("Error inviting member to group:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor ao convidar membro para o grupo.",
    });
  }
};

// @desc    Update group display name for a user
// @route   PUT /api/groups/:groupId/display-name
// @access  Private
export const updateGroupDisplayName = async (
  req: CustomRequest,
  res: Response
) => {
  try {
    const { groupId } = req.params;
    const validatedData = UpdateGroupDisplayNameSchema.parse(req.body);
    const { newDisplayName } = validatedData;

    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, error: "Usuário não autenticado." });
    }

    // Find the user and update the displayName for the specific group
    const user = await User.findById(req.user.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "Usuário não encontrado." });
    }

    const groupIndex = user.grupos.findIndex((g) => g.groupId.equals(groupId));

    if (groupIndex === -1) {
      return res.status(404).json({
        success: false,
        error: "Grupo não encontrado nas suas associações.",
      });
    }

    user.grupos[groupIndex].displayName = newDisplayName;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Nome de exibição do grupo atualizado com sucesso.",
      data: user.grupos[groupIndex],
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors,
        message: "Dados de atualização inválidos.",
      });
    }
    console.error("Error updating group display name:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor ao atualizar nome de exibição do grupo.",
    });
  }
};

// @desc    Delete a group
// @route   DELETE /api/groups/:groupId
// @access  Private
export const deleteGroup = async (req: CustomRequest, res: Response) => {
  try {
    const { groupId } = req.params;

    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, error: "Usuário não autenticado." });
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return res
        .status(404)
        .json({ success: false, error: "Grupo não encontrado." });
    }

    // Check if the user is the creator of the group
    if (!group.criadoPor.equals(req.user.id)) {
      return res.status(403).json({
        success: false,
        error: "Você não tem permissão para deletar este grupo.",
      });
    }

    // Remove group from all members' group lists
    await User.updateMany(
      { "grupos.groupId": groupId },
      { $pull: { grupos: { groupId: groupId } } }
    );

    await group.deleteOne(); // Use deleteOne() instead of remove()

    res.status(200).json({
      success: true,
      message: "Grupo deletado com sucesso.",
    });
  } catch (error: any) {
    console.error("Error deleting group:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor ao deletar grupo.",
    });
  }
};
