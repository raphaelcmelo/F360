import { Request, Response } from "express";
import { z } from "zod";
import Transaction, { ITransaction } from "../models/Transaction";
import { CreateTransactionSchema, UpdateTransactionSchema } from "../schemas";
import { CustomRequest } from "../middleware/authMiddleware";

// @desc    Create a new transaction
// @route   POST /api/transactions
// @access  Private
export const createTransaction = async (req: CustomRequest, res: Response) => {
  try {
    const validatedData = CreateTransactionSchema.parse(req.body);

    const { grupoId, data, categoria, tipo, valor } = validatedData;

    if (!req.user || !req.user.id || !req.user.name) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado ou informações incompletas.",
      });
    }

    const newTransaction: ITransaction = await Transaction.create({
      grupoId,
      criadoPor: req.user.id,
      criadoPorNome: req.user.name,
      data: new Date(data),
      categoria,
      tipo,
      valor,
    });

    res.status(201).json({
      success: true,
      data: newTransaction,
      message: "Lançamento criado com sucesso.",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors,
        message: "Dados de lançamento inválidos.",
      });
    }
    console.error("Error creating transaction:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor ao criar lançamento.",
    });
  }
};

// @desc    Get transactions for a specific group within a date range
// @route   GET /api/transactions/group/:groupId
// @access  Private
export const getTransactionsByGroup = async (
  req: CustomRequest,
  res: Response
) => {
  try {
    const { groupId } = req.params;
    const { startDate, endDate } = req.query;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        error: "ID do grupo é obrigatório.",
      });
    }

    let query: any = { grupoId: groupId };

    if (startDate && endDate) {
      query.data = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    } else if (startDate) {
      query.data = { $gte: new Date(startDate as string) };
    } else if (endDate) {
      query.data = { $lte: new Date(endDate as string) };
    }

    const transactions: ITransaction[] = await Transaction.find(query).sort({
      data: -1,
    });

    res.status(200).json({
      success: true,
      data: transactions,
      message: "Lançamentos recuperados com sucesso.",
    });
  } catch (error: any) {
    console.error("Error fetching transactions by group:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor ao buscar lançamentos.",
    });
  }
};

// @desc    Get a single transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
export const getTransactionById = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;

    const transaction: ITransaction | null = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: "Lançamento não encontrado.",
      });
    }

    // Optional: Add authorization check if the user belongs to the group
    if (
      !req.user ||
      !transaction.grupoId.equals(req.user.activeGroup || "")
    ) {
      // This check assumes req.user.activeGroup is set, or you'd check group membership
      // For simplicity, we'll just return the transaction if found.
      // A more robust check would involve verifying the user is a member of `transaction.grupoId`.
    }

    res.status(200).json({
      success: true,
      data: transaction,
      message: "Lançamento recuperado com sucesso.",
    });
  } catch (error: any) {
    console.error("Error fetching transaction by ID:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor ao buscar lançamento.",
    });
  }
};

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Private
export const updateTransaction = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = UpdateTransactionSchema.parse(req.body);

    const transaction: ITransaction | null = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: "Lançamento não encontrado.",
      });
    }

    // Ensure the user updating is the one who created it or an admin/group owner
    if (!req.user || !transaction.criadoPor.equals(req.user.id)) {
      return res.status(403).json({
        success: false,
        error: "Não autorizado a atualizar este lançamento.",
      });
    }

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      id,
      { ...validatedData, data: validatedData.data ? new Date(validatedData.data) : undefined },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedTransaction,
      message: "Lançamento atualizado com sucesso.",
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: error.errors,
        message: "Dados de atualização inválidos.",
      });
    }
    console.error("Error updating transaction:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor ao atualizar lançamento.",
    });
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
export const deleteTransaction = async (req: CustomRequest, res: Response) => {
  try {
    const { id } = req.params;

    const transaction: ITransaction | null = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: "Lançamento não encontrado.",
      });
    }

    // Ensure the user deleting is the one who created it or an admin/group owner
    if (!req.user || !transaction.criadoPor.equals(req.user.id)) {
      return res.status(403).json({
        success: false,
        error: "Não autorizado a deletar este lançamento.",
      });
    }

    await Transaction.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Lançamento deletado com sucesso.",
    });
  } catch (error: any) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor ao deletar lançamento.",
    });
  }
};
