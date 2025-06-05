import { Request, Response } from "express";
import { z } from "zod";
import PlannedBudgetItem, { IPlannedBudgetItem } from "../models/PlannedBudgetItem";
import { CreatePlannedBudgetItemSchema, UpdatePlannedBudgetItemSchema } from "../schemas";
import { CustomRequest } from "../middleware/authMiddleware";
import { createActivityLog } from "./activityLogController"; // Import the helper

// @desc    Create a new planned budget item
// @route   POST /api/budget-items
// @access  Private
export const createPlannedBudgetItem = async (req: CustomRequest, res: Response) => {
  try {
    const validatedData = CreatePlannedBudgetItemSchema.parse(req.body);

    const { budgetId, groupId, categoryType, nome, valorPlanejado } = validatedData;

    if (!req.user || !req.user.id || !req.user.name) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado ou informações incompletas.",
      });
    }

    const newBudgetItem: IPlannedBudgetItem = await PlannedBudgetItem.create({
      budgetId,
      groupId,
      criadoPor: req.user.id,
      criadoPorNome: req.user.name,
      categoryType,
      nome,
      valorPlanejado,
    });

    // Log activity
    await createActivityLog(
      newBudgetItem.groupId,
      req.user.id,
      req.user.name,
      "budget_item_created",
      `Item de orçamento "${newBudgetItem.nome}" (${newBudgetItem.categoryType}) no valor de R$ ${newBudgetItem.valorPlanejado.toFixed(2)} criado.`,
      { budgetItemId: newBudgetItem._id, budgetId: newBudgetItem.budgetId, name: newBudgetItem.nome, value: newBudgetItem.valorPlanejado }
    );

    res.status(201).json({
      success: true,
      data: newBudgetItem,
      message: "Item de orçamento planejado criado com sucesso.",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors,
        message: "Dados de item de orçamento inválidos.",
      });
    }
    console.error("Error creating planned budget item:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor ao criar item de orçamento planejado.",
    });
  }
};

// @desc    Get planned budget items for a specific budget
// @route   GET /api/budget-items/budget/:budgetId
// @access  Private
export const getPlannedBudgetItemsForBudget = async (req: CustomRequest, res: Response) => {
  try {
    const { budgetId } = req.params;

    if (!budgetId) {
      return res.status(400).json({
        success: false,
        error: "ID do orçamento é obrigatório.",
      });
    }

    const budgetItems: IPlannedBudgetItem[] = await PlannedBudgetItem.find({ budgetId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      data: budgetItems,
      message: "Itens de orçamento planejado recuperados com sucesso.",
    });
  } catch (error: any) {
    console.error("Error fetching planned budget items:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor ao buscar itens de orçamento planejado.",
    });
  }
};

// @desc    Update a planned budget item
// @route   PUT /api/budget-items/:itemId
// @access  Private
export const updatePlannedBudgetItem = async (req: CustomRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const validatedData = UpdatePlannedBudgetItemSchema.parse(req.body);

    const budgetItem: IPlannedBudgetItem | null = await PlannedBudgetItem.findById(itemId);

    if (!budgetItem) {
      return res.status(404).json({
        success: false,
        error: "Item de orçamento planejado não encontrado.",
      });
    }

    // Ensure the user updating is the one who created it or an admin/group owner
    if (!req.user || !budgetItem.criadoPor.equals(req.user.id)) {
      return res.status(403).json({
        success: false,
        error: "Não autorizado a atualizar este item de orçamento.",
      });
    }

    const oldBudgetItem = { ...budgetItem.toObject() }; // Capture old state

    const updatedBudgetItem = await PlannedBudgetItem.findByIdAndUpdate(
      itemId,
      validatedData,
      { new: true, runValidators: true }
    );

    if (updatedBudgetItem) {
      // Log activity
      await createActivityLog(
        updatedBudgetItem.groupId,
        req.user.id,
        req.user.name,
        "budget_item_updated",
        `Item de orçamento "${oldBudgetItem.nome}" atualizado (R$ ${oldBudgetItem.valorPlanejado.toFixed(2)} para R$ ${updatedBudgetItem.valorPlanejado.toFixed(2)}).`,
        {
          budgetItemId: updatedBudgetItem._id,
          oldValue: oldBudgetItem.valorPlanejado,
          newValue: updatedBudgetItem.valorPlanejado,
          oldName: oldBudgetItem.nome,
          newName: updatedBudgetItem.nome,
        }
      );
    }

    res.status(200).json({
      success: true,
      data: updatedBudgetItem,
      message: "Item de orçamento planejado atualizado com sucesso.",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors,
        message: "Dados de atualização inválidos.",
      });
    }
    console.error("Error updating planned budget item:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor ao atualizar item de orçamento planejado.",
    });
  }
};

// @desc    Delete a planned budget item
// @route   DELETE /api/budget-items/:itemId
// @access  Private
export const deletePlannedBudgetItem = async (req: CustomRequest, res: Response) => {
  try {
    const { itemId } = req.params;

    const budgetItem: IPlannedBudgetItem | null = await PlannedBudgetItem.findById(itemId);

    if (!budgetItem) {
      return res.status(404).json({
        success: false,
        error: "Item de orçamento planejado não encontrado.",
      });
    }

    // Ensure the user deleting is the one who created it or an admin/group owner
    if (!req.user || !budgetItem.criadoPor.equals(req.user.id)) {
      return res.status(403).json({
        success: false,
        error: "Não autorizado a deletar este item de orçamento.",
      });
    }

    await PlannedBudgetItem.findByIdAndDelete(itemId);

    // Log activity
    await createActivityLog(
      budgetItem.groupId,
      req.user.id,
      req.user.name,
      "budget_item_deleted",
      `Item de orçamento "${budgetItem.nome}" excluído.`,
      { budgetItemId: budgetItem._id, name: budgetItem.nome, value: budgetItem.valorPlanejado }
    );

    res.status(200).json({
      success: true,
      message: "Item de orçamento planejado deletado com sucesso.",
    });
  } catch (error: any) {
    console.error("Error deleting planned budget item:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor ao deletar item de orçamento planejado.",
    });
  }
};
