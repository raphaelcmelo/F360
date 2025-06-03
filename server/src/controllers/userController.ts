import { Response } from 'express';
import User from '../models/User';
import { UpdateUserSchema } from '../schemas';
import { AuthenticatedRequest, ApiResponse, PaginationQuery } from '../types';

export const getAllUsers = async (req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const { page = '1', limit = '10' } = req.query as PaginationQuery;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const users = await User.find({ isActive: true })
      .skip(skip)
      .limit(limitNum)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching users'
    });
  }
};

export const getUserById = async (req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user || !user.isActive) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching user'
    });
  }
};

export const updateUser = async (req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const validatedData = UpdateUserSchema.parse(req.body);
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      validatedData,
      { new: true, runValidators: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      error: 'Error updating user'
    });
  }
};

export const deleteUser = async (req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error deleting user'
    });
  }
};

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response<ApiResponse>): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments({ isActive: true });
    const activeUsers = await User.countDocuments({ 
      isActive: true, 
      updatedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        totalRevenue: 125000, // Mock data
        pendingOrders: 23 // Mock data
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error fetching dashboard stats'
    });
  }
};
