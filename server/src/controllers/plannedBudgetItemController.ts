import { Request, Response } from "express";
import PlannedBudgetItem from "../models/PlannedBudgetItem";
import Budget from "../models/Budget";
import Group from "../models/Group";
import { AuthenticatedRequest, ApiResponse } from "../types";
import {
  CreatePlannedBudgetItemSchema,
  UpdatePlannedBudgetItemSchema,
} from "../schemas";
import mongoose from "mongoose";

// Create a new planned budget item
export const createPlannedBudgetItem = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
) => {
  try {
    const validatedData = CreatePlannedBudgetItemSchema.parse(req.body);
    const userId = req.user?._id;
    const { budgetId, groupId, categoryType, nome, valorPlanejado } =
      validatedData;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "User not authenticated." });
    }

    // Validate budgetId and groupId as valid ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(budgetId) ||
      !mongoose.Types.ObjectId.isValid(groupId)
    ) {
      return res.status(400).json({
        success: false,
        error: "IDs de orçamento ou grupo inválidos.",
      });
    }

    // Verify budget exists and belongs to the specified group
    const budget = await Budget.findById(budgetId);
    if (!budget || !budget.grupoId.equals(groupId)) {
      return res.status(404).json({
        success: false,
        error: "Orçamento não encontrado ou não pertence ao grupo especificado.",
      });
    }

    // Verify user is a member of the group
    const group = await Group.findById(groupId);
    if (!group || !group.membros.some((member) => member.userId.equals(userId))) {
      return res.status(403).json({
        success: false,
        error: "Você não tem permissão para adicionar itens a este grupo.",
      });
    }

    const newPlannedItem = await PlannedBudgetItem.create({
      budgetId,
      groupId,
      categoryType,
      nome,
      valorPlanejado,
      criadoPor: userId,
    });

    res.status(201).json({
      success: true,
      data: newPlannedItem,
      message: "Item de orçamento planejado criado com sucesso.",
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
    }
    console.error("Error creating planned budget item:", error);
    res.status(500).json({
      success: false,
      error: "Server error creating planned budget item.",
    });
  }
};

// Get all planned budget items for a specific budget
export const getPlannedBudgetItemsForBudget = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
) => {
  try {
    const { budgetId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "User not authenticated." });
    }

    if (!mongoose.Types.ObjectId.isValid(budgetId)) {
      return res.status(400).json({
        success: false,
        error: "ID do orçamento inválido.",
      });
    }

    const budget = await Budget.findById(budgetId);
    if (!budget) {
      return res
        .status(404)
        .json({ success: false, error: "Orçamento não encontrado." });
    }

    // Verify user is a member of the group associated with this budget
    const group = await Group.findById(budget.grupoId);
    if (!group || !group.membros.some((member) => member.userId.equals(userId))) {
      return res.status(403).json({
        success: false,
        error: "Você não tem permissão para acessar os itens deste orçamento.",
      });
    }

    const plannedItems = await PlannedBudgetItem.find({ budgetId }).lean();

    res.status(200).json({
      success: true,
      data: plannedItems,
      message: "Itens de orçamento planejados encontrados com sucesso.",
    });
  } catch (error: any) {
    console.error("Error fetching planned budget items:", error);
    res.status(500).json({
      success: false,
      error: "Server error fetching planned budget items.",
    });
  }
};

// Update a planned budget item
export const updatePlannedBudgetItem = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
) => {
  try {
    const { itemId } = req.params;
    const validatedData = UpdatePlannedBudgetItemSchema.parse(req.body);
    const userId = req.user?._id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "User not authenticated." });
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({
        success: false,
        error: "ID do item de orçamento inválido.",
      });
    }

    const plannedItem = await PlannedBudgetItem.findById(itemId);

    if (!plannedItem) {
      return res
        .status(404)
        .json({ success: false, error: "Item de orçamento não encontrado." });
    }

    // Only the creator of the item or a group admin can update it
    // For simplicity, let's allow only the creator for now.
    // If group admin should be allowed, you'd need to fetch group and check roles.
    if (!plannedItem.criadoPor.equals(userId)) {
      return res.status(403).json({
        success: false,
        error: "Você não tem permissão para atualizar este item.",
      });
    }

    const updatedItem = await PlannedBudgetItem.findByIdAndUpdate(
      itemId,
      { $set: validatedData },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedItem,
      message: "Item de orçamento planejado atualizado com sucesso.",
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({
        success: false,
        error: "Validation error",
        details: error.errors,
      });
    }
    console.error("Error updating planned budget item:", error);
    res.status(500).json({
      success: false,
      error: "Server error updating planned budget item.",
    });
  }
};

// Delete a planned budget item
export const deletePlannedBudgetItem = async (
  req: AuthenticatedRequest,
  res: Response<ApiResponse>
) => {
  try {
    const { itemId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "User not authenticated." });
    }

    if (!mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({
        success: false,
        error: "ID do item de orçamento inválido.",
      });
    }

    const plannedItem = await PlannedBudgetItem.findById(itemId);

    if (!plannedItem) {
      return res
        .status(404)
        .json({ success: false, error: "Item de orçamento não encontrado." });
    }

    // Only the creator of the item can delete it
    if (!plannedItem.criadoPor.equals(userId)) {
      return res.status(403).json({
        success: false,
        error: "Você não tem permissão para deletar este item.",
      });
    }

    await PlannedBudgetItem.deleteOne({ _id: itemId });

    res.status(200).json({
      success: true,
      message: "Item de orçamento planejado deletado com sucesso.",
    });
  } catch (error: any) {
    console.error("Error deleting planned budget item:", error);
    res.status(500).json({
      success: false,
      error: "Server error deleting planned budget item.",
    });
  }
};
