import { Request, Response } from "express";
import { z } from "zod";
import Group, { IGroup } from "../models/Group";
import User, { IUser } from "../models/User";
import { CustomRequest } from "../middleware/authMiddleware";
import { createActivityLog } from "./activityLogController"; // Import the helper

// @desc    Create a new group
// @route   POST /api/groups
// @access  Private
export const createGroup = async (req: CustomRequest, res: Response) => {
  try {
    const { nome } = req.body;

    if (!nome) {
      return res.status(400).json({
        success: false,
        error: "O nome do grupo é obrigatório.",
      });
    }

    if (!req.user || !req.user.id || !req.user.name) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado ou informações incompletas.",
      });
    }

    const newGroup: IGroup = await Group.create({
      nome,
      membros: [{ userId: req.user.id, role: "admin" }], // Creator is admin
      criadoPor: req.user.id,
    });

    // Add group to user's groups list
    await User.findByIdAndUpdate(req.user.id, {
      $push: { grupos: { groupId: newGroup._id, displayName: newGroup.nome } },
    });

    // Log activity
    await createActivityLog(
      newGroup._id,
      req.user.id,
      req.user.name,
      "group_created",
      `Grupo "${newGroup.nome}" criado.`,
      { groupId: newGroup._id, groupName: newGroup.nome }
    );

    res.status(201).json({
      success: true,
      data: newGroup,
      message: "Grupo criado com sucesso.",
    });
  } catch (error: any) {
    console.error("Error creating group:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor ao criar grupo.",
    });
  }
};

// @desc    Get all groups for the authenticated user
// @route   GET /api/groups
// @access  Private
export const getUserGroups = async (req: CustomRequest, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado.",
      });
    }

    // Find groups where the user is a member
    const groups: IGroup[] = await Group.find({
      "membros.userId": req.user.id,
    }).populate("membros.userId", "name email"); // Populate member details

    res.status(200).json({
      success: true,
      data: groups,
      message: "Grupos recuperados com sucesso.",
    });
  } catch (error: any) {
    console.error("Error fetching user groups:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor ao buscar grupos.",
    });
  }
};

// @desc    Invite a member to a group
// @route   POST /api/groups/:groupId/invite
// @access  Private (Group Admin)
export const inviteMember = async (req: CustomRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "O email do membro é obrigatório.",
      });
    }

    if (!req.user || !req.user.id || !req.user.name) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado ou informações incompletas.",
      });
    }

    const group: IGroup | null = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Grupo não encontrado.",
      });
    }

    // Check if the inviting user is an admin of the group
    const inviterIsAdmin = group.membros.some(
      (member) =>
        member.userId.equals(req.user!.id) && member.role === "admin"
    );

    if (!inviterIsAdmin) {
      return res.status(403).json({
        success: false,
        error: "Não autorizado a convidar membros para este grupo.",
      });
    }

    const newMember: IUser | null = await User.findOne({ email });

    if (!newMember) {
      return res.status(404).json({
        success: false,
        error: "Usuário com este email não encontrado.",
      });
    }

    // Check if member is already in the group
    if (group.membros.some((member) => member.userId.equals(newMember._id))) {
      return res.status(400).json({
        success: false,
        error: "Este usuário já é membro do grupo.",
      });
    }

    group.membros.push({ userId: newMember._id, role: "member" });
    await group.save();

    // Add group to the invited user's groups list
    await User.findByIdAndUpdate(newMember._id, {
      $push: { grupos: { groupId: group._id, displayName: group.nome } },
    });

    // Log activity
    await createActivityLog(
      group._id,
      req.user.id,
      req.user.name,
      "member_invited",
      `Membro "${newMember.name}" (${newMember.email}) convidado para o grupo "${group.nome}".`,
      { groupId: group._id, invitedUserId: newMember._id, invitedUserName: newMember.name }
    );

    res.status(200).json({
      success: true,
      message: "Membro convidado com sucesso.",
    });
  } catch (error: any) {
    console.error("Error inviting member:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor ao convidar membro.",
    });
  }
};

// @desc    Update group display name
// @route   PUT /api/groups/:groupId/display-name
// @access  Private (Group Admin)
export const updateGroupDisplayName = async (req: CustomRequest, res: Response) => {
  try {
    const { groupId } = req.params;
    const { newDisplayName } = req.body;

    if (!newDisplayName) {
      return res.status(400).json({
        success: false,
        error: "O novo nome de exibição é obrigatório.",
      });
    }

    if (!req.user || !req.user.id || !req.user.name) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado ou informações incompletas.",
      });
    }

    const group: IGroup | null = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Grupo não encontrado.",
      });
    }

    // Check if the updating user is an admin of the group
    const updaterIsAdmin = group.membros.some(
      (member) =>
        member.userId.equals(req.user!.id) && member.role === "admin"
    );

    if (!updaterIsAdmin) {
      return res.status(403).json({
        success: false,
        error: "Não autorizado a atualizar o nome deste grupo.",
      });
    }

    const oldDisplayName = group.nome;
    group.nome = newDisplayName;
    await group.save();

    // Update display name in all members' user documents
    await User.updateMany(
      { "grupos.groupId": group._id },
      { $set: { "grupos.$.displayName": newDisplayName } }
    );

    // Log activity
    await createActivityLog(
      group._id,
      req.user.id,
      req.user.name,
      "group_updated",
      `Nome do grupo alterado de "${oldDisplayName}" para "${newDisplayName}".`,
      { groupId: group._id, oldName: oldDisplayName, newName: newDisplayName }
    );

    res.status(200).json({
      success: true,
      message: "Nome de exibição do grupo atualizado com sucesso.",
      data: group,
    });
  } catch (error: any) {
    console.error("Error updating group display name:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor ao atualizar nome do grupo.",
    });
  }
};

// @desc    Delete a group
// @route   DELETE /api/groups/:groupId
// @access  Private (Group Admin)
export const deleteGroup = async (req: CustomRequest, res: Response) => {
  try {
    const { groupId } = req.params;

    if (!req.user || !req.user.id || !req.user.name) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado ou informações incompletas.",
      });
    }

    const group: IGroup | null = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Grupo não encontrado.",
      });
    }

    // Check if the deleting user is the creator of the group
    if (!group.criadoPor.equals(req.user.id)) {
      return res.status(403).json({
        success: false,
        error: "Não autorizado a deletar este grupo. Apenas o criador pode deletar.",
      });
    }

    // Remove group from all members' user documents
    await User.updateMany(
      { "grupos.groupId": group._id },
      { $pull: { grupos: { groupId: group._id } } }
    );

    await group.deleteOne(); // Use deleteOne() for Mongoose 6+

    // Log activity (this log will be associated with the user, but the group will no longer exist)
    await createActivityLog(
      group._id, // Still log with the group ID even if it's being deleted
      req.user.id,
      req.user.name,
      "group_deleted",
      `Grupo "${group.nome}" excluído.`,
      { groupId: group._id, groupName: group.nome }
    );

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

// @desc    Remove a member from a group
// @route   DELETE /api/groups/:groupId/members/:memberId
// @access  Private (Group Admin)
export const removeMember = async (req: CustomRequest, res: Response) => {
  try {
    const { groupId, memberId } = req.params;

    if (!req.user || !req.user.id || !req.user.name) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado ou informações incompletas.",
      });
    }

    const group: IGroup | null = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: "Grupo não encontrado.",
      });
    }

    // Check if the removing user is an admin of the group
    const removerIsAdmin = group.membros.some(
      (member) =>
        member.userId.equals(req.user!.id) && member.role === "admin"
    );

    if (!removerIsAdmin) {
      return res.status(403).json({
        success: false,
        error: "Não autorizado a remover membros deste grupo.",
      });
    }

    // Prevent admin from removing themselves if they are the only admin
    const targetMember = group.membros.find(m => m.userId.toString() === memberId);
    if (targetMember && targetMember.role === 'admin') {
      const adminCount = group.membros.filter(m => m.role === 'admin').length;
      if (adminCount === 1 && targetMember.userId.equals(req.user.id)) {
        return res.status(400).json({
          success: false,
          error: "Você não pode se remover como o único administrador do grupo.",
        });
      }
    }

    const memberToRemove = await User.findById(memberId);
    if (!memberToRemove) {
      return res.status(404).json({
        success: false,
        error: "Membro não encontrado.",
      });
    }

    // Remove member from the group's members list
    group.membros = group.membros.filter(
      (member) => !member.userId.equals(memberId)
    );
    await group.save();

    // Remove group from the member's groups list
    await User.findByIdAndUpdate(memberId, {
      $pull: { grupos: { groupId: group._id } },
    });

    // Log activity
    await createActivityLog(
      group._id,
      req.user.id,
      req.user.name,
      "member_removed",
      `Membro "${memberToRemove.name}" (${memberToRemove.email}) removido do grupo "${group.nome}".`,
      { groupId: group._id, removedUserId: memberToRemove._id, removedUserName: memberToRemove.name }
    );

    res.status(200).json({
      success: true,
      message: "Membro removido com sucesso.",
    });
  } catch (error: any) {
    console.error("Error removing member:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor ao remover membro.",
    });
  }
};
