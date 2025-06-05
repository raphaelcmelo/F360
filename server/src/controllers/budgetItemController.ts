import { Request, Response } from "express";
import PlannedBudgetItem from "../models/PlannedBudgetItem";
import Budget from "../models/Budget";
import Group from "../models/Group";
import { AuthenticatedRequest, ApiResponse } from "../types";
import {
  CreatePlannedBudgetItemSchema,
  UpdatePlannedBudgetItemSchema,
} from "../schemas";

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

    // Verify if the budget exists and belongs to the specified group
    const budget = await Budget.findById(budgetId);
    if (!budget) {
      return res
        .status(404)
        .json({ success: false, error: "Orçamento não encontrado." });
    }
    if (!budget.grupoId.equals(groupId)) {
      return res.status(400).json({
        success: false,
        error: "O orçamento não pertence ao grupo especificado.",
      });
    }

    // Verify if the user is a member of the group associated with this budget
    const group = await Group.findById(groupId);
    if (
      !group ||
      !group.membros.some((member) => member.userId.equals(userId))
    ) {
      return res.status(403).json({
        success: false,
        error: "Você não tem permissão para adicionar itens a este orçamento.",
      });
    }

    // Check for existing planned budget item with the same categoryType and nome for this budget
    const existingItem = await PlannedBudgetItem.findOne({
      budgetId,
      categoryType,
      nome: { $regex: new RegExp(`^${nome}$`, "i") }, // Case-insensitive match for nome
    });

    if (existingItem) {
      return res.status(409).json({
        success: false,
        error:
          "Já existe uma entrada com a mesma categoria e tipo para este orçamento.",
      });
    }

    const newPlannedBudgetItem = await PlannedBudgetItem.create({
      budgetId,
      groupId,
      categoryType,
      nome,
      valorPlanejado,
      criadoPor: userId,
    });

    res.status(201).json({
      success: true,
      data: newPlannedBudgetItem,
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
      details: error.message, // Adicionado para depuração
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined, // Adicionado para depuração
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

    // Verify if the budget exists and the user has access to its group
    const budget = await Budget.findById(budgetId);
    if (!budget) {
      return res
        .status(404)
        .json({ success: false, error: "Orçamento não encontrado." });
    }

    const group = await Group.findById(budget.grupoId);
    if (
      !group ||
      !group.membros.some((member) => member.userId.equals(userId))
    ) {
      return res.status(403).json({
        success: false,
        error: "Você não tem permissão para acessar os itens deste orçamento.",
      });
    }

    const plannedItems = await PlannedBudgetItem.find({ budgetId })
      .sort({ categoryType: 1, nome: 1 })
      .lean();

    res.status(200).json({
      success: true,
      data: plannedItems,
      message: "Itens de orçamento planejado encontrados com sucesso.",
    });
  } catch (error: any) {
    console.error("Error fetching planned budget items:", error);
    res.status(500).json({
      success: false,
      error: "Server error fetching planned budget items.",
      details: error.message, // Adicionado para depuração
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined, // Adicionado para depuração
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

    const item = await PlannedBudgetItem.findById(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: "Item de orçamento planejado não encontrado.",
      });
    }

    // Verify if the user has access to the group associated with this item's budget
    const budget = await Budget.findById(item.budgetId);
    if (!budget) {
      return res
        .status(404)
        .json({ success: false, error: "Orçamento associado não encontrado." });
    }
    const group = await Group.findById(budget.grupoId);
    if (
      !group ||
      !group.membros.some((member) => member.userId.equals(userId))
    ) {
      return res.status(403).json({
        success: false,
        error: "Você não tem permissão para atualizar este item.",
      });
    }

    // If nome or categoryType are being updated, check for duplicates
    if (
      validatedData.nome !== undefined ||
      validatedData.categoryType !== undefined
    ) {
      const newNome =
        validatedData.nome !== undefined ? validatedData.nome : item.nome;
      const newCategoryType =
        validatedData.categoryType !== undefined
          ? validatedData.categoryType
          : item.categoryType;

      const existingItemWithSameNameAndCategory =
        await PlannedBudgetItem.findOne({
          _id: { $ne: itemId }, // Exclude the current item
          budgetId: item.budgetId,
          categoryType: newCategoryType,
          nome: { $regex: new RegExp(`^${newNome}$`, "i") },
        });

      if (existingItemWithSameNameAndCategory) {
        return res.status(409).json({
          success: false,
          error:
            "Já existe outra entrada com a mesma categoria e tipo para este orçamento.",
        });
      }
    }

    // Update the item
    Object.assign(item, validatedData);
    await item.save();

    res.status(200).json({
      success: true,
      data: item,
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
      details: error.message, // Adicionado para depuração
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined, // Adicionado para depuração
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

    const item = await PlannedBudgetItem.findById(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        error: "Item de orçamento planejado não encontrado.",
      });
    }

    // Verify if the user has access to the group associated with this item's budget
    const budget = await Budget.findById(item.budgetId);
    if (!budget) {
      return res
        .status(404)
        .json({ success: false, error: "Orçamento associado não encontrado." });
    }
    const group = await Group.findById(budget.grupoId);
    if (
      !group ||
      !group.membros.some((member) => member.userId.equals(userId))
    ) {
      return res.status(403).json({
        success: false,
        error: "Você não tem permissão para deletar este item.",
      });
    }

    // Only the creator of the item or the budget creator can delete it (or group admin)
    // For simplicity, let's allow any group member to delete their own item or an item in a budget they have access to.
    // If you want stricter control, you might check item.criadoPor.equals(userId)
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
      details: error.message, // Adicionado para depuração
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined, // Adicionado para depuração
    });
  }
};
