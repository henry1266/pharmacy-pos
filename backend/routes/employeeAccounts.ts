import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import auth from '../middleware/auth';
import adminAuth from '../middleware/adminAuth';
import { handleError, createSuccessResponse } from '../utils/employeeAccountValidation';
import { ApiResponse, ErrorResponse } from '../src/types/api';

// 暫時使用 require 導入服務模組，直到轉換為 TypeScript
const {
  createEmployeeAccount,
  getEmployeeAccount,
  updateEmployeeAccount,
  deleteEmployeeAccount,
  unbindEmployeeAccount
} = require('../services/employeeAccountService');

const router = express.Router();

/**
 * 員工帳號管理路由
 * 提供員工帳號的 CRUD 操作
 */

// 請求介面定義
interface CreateEmployeeAccountRequest {
  employeeId: string;
  username: string;
  email?: string;
  password: string;
  role: 'admin' | 'pharmacist' | 'staff';
}

interface UpdateEmployeeAccountRequest {
  username?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'pharmacist' | 'staff';
}

// 服務函數型別定義
interface ServiceAccountData {
  employeeId: string;
  username: string;
  email?: string;
  password: string;
  role: 'admin' | 'pharmacist' | 'staff';
}

interface ServiceUpdateData {
  username?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'pharmacist' | 'staff';
}

// 驗證規則
const createAccountValidation = [
  check('employeeId', '員工ID為必填欄位').not().isEmpty(),
  check('username', '請提供有效的用戶名').not().isEmpty(),
  check('password', '請提供至少6個字符的密碼').isLength({ min: 6 }),
  check('role', '請提供有效的角色').isIn(['admin', 'pharmacist', 'staff'])
];

const updateAccountValidation = [
  check('username', '請提供有效的用戶名').optional().not().isEmpty(),
  check('email', '請提供有效的電子郵件').optional().isEmail(),
  check('password', '請提供至少6個字符的密碼').optional().isLength({ min: 6 }),
  check('role', '請提供有效的角色').optional().isIn(['admin', 'pharmacist', 'staff'])
];

/**
 * @route   POST api/employee-accounts
 * @desc    Create a user account for an employee
 * @access  Private/Admin
 */
router.post('/', [auth, adminAuth, ...createAccountValidation], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '驗證失敗',
        error: JSON.stringify(errors.array()),
        timestamp: new Date()
      };
      return res.status(400).json(errorResponse);
    }

    const requestBody = req.body as CreateEmployeeAccountRequest;
    const { employeeId, username, email, password, role } = requestBody;
    
    const serviceData: ServiceAccountData = {
      employeeId,
      username,
      email,
      password,
      role
    };

    const result = await createEmployeeAccount(serviceData);

    const response: ApiResponse<any> = {
      success: true,
      message: '員工帳號創建成功',
      data: result,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (error) {
    console.error('創建員工帳號錯誤:', error);
    handleError(res, error instanceof Error ? error : new Error('未知錯誤'), 400);
  }
});

/**
 * @route   GET api/employee-accounts/:employeeId
 * @desc    Get user account info for an employee
 * @access  Private/Admin
 */
router.get('/:employeeId', [auth, adminAuth], async (req: Request, res: Response) => {
  try {
    const employeeId = req.params.employeeId;
    
    if (!employeeId) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '員工ID為必填參數',
        timestamp: new Date()
      };
      return res.status(400).json(errorResponse);
    }

    const user = await getEmployeeAccount(employeeId);
    
    const response: ApiResponse<any> = {
      success: true,
      message: '員工帳號資訊獲取成功',
      data: user,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (error) {
    console.error('獲取員工帳號錯誤:', error);
    const statusCode = (error instanceof Error && error.message.includes('找不到')) ? 404 : 400;
    handleError(res, error instanceof Error ? error : new Error('未知錯誤'), statusCode);
  }
});

/**
 * @route   PUT api/employee-accounts/:employeeId
 * @desc    Update user account for an employee
 * @access  Private/Admin
 */
router.put('/:employeeId', [auth, adminAuth, ...updateAccountValidation], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '驗證失敗',
        error: JSON.stringify(errors.array()),
        timestamp: new Date()
      };
      return res.status(400).json(errorResponse);
    }

    const employeeId = req.params.employeeId;
    
    if (!employeeId) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '員工ID為必填參數',
        timestamp: new Date()
      };
      return res.status(400).json(errorResponse);
    }

    const requestBody = req.body as UpdateEmployeeAccountRequest;
    const { username, email, password, role } = requestBody;
    
    const updateData: ServiceUpdateData = {};
    if (username !== undefined) updateData.username = username;
    if (email !== undefined) updateData.email = email;
    if (password !== undefined) updateData.password = password;
    if (role !== undefined) updateData.role = role;

    const updatedUser = await updateEmployeeAccount(employeeId, updateData);

    const response: ApiResponse<{ user: any }> = {
      success: true,
      message: '員工帳號更新成功',
      data: { user: updatedUser },
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (error) {
    console.error('更新員工帳號錯誤:', error);
    const statusCode = (error instanceof Error && error.message.includes('找不到')) ? 404 : 400;
    handleError(res, error instanceof Error ? error : new Error('未知錯誤'), statusCode);
  }
});

/**
 * @route   DELETE api/employee-accounts/:employeeId
 * @desc    Delete user account for an employee
 * @access  Private/Admin
 */
router.delete('/:employeeId', [auth, adminAuth], async (req: Request, res: Response) => {
  try {
    const employeeId = req.params.employeeId;
    
    if (!employeeId) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '員工ID為必填參數',
        timestamp: new Date()
      };
      return res.status(400).json(errorResponse);
    }

    await deleteEmployeeAccount(employeeId);
    
    const response: ApiResponse<null> = {
      success: true,
      message: '員工帳號已刪除',
      data: null,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (error) {
    console.error('刪除員工帳號錯誤:', error);
    const statusCode = (error instanceof Error && error.message.includes('找不到')) ? 404 : 400;
    handleError(res, error instanceof Error ? error : new Error('未知錯誤'), statusCode);
  }
});

/**
 * @route   PUT api/employee-accounts/:employeeId/unbind
 * @desc    Unbind an employee from their account (without deleting the account)
 * @access  Private/Admin
 */
router.put('/:employeeId/unbind', [auth, adminAuth], async (req: Request, res: Response) => {
  try {
    const employeeId = req.params.employeeId;
    
    if (!employeeId) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '員工ID為必填參數',
        timestamp: new Date()
      };
      return res.status(400).json(errorResponse);
    }

    const result = await unbindEmployeeAccount(employeeId);
    
    const message = result.user 
      ? '員工帳號綁定已解除' 
      : '員工帳號綁定已解除（用戶不存在）';
    
    const response: ApiResponse<any> = {
      success: true,
      message,
      data: result,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (error) {
    console.error('解除員工帳號綁定錯誤:', error);
    const statusCode = (error instanceof Error && error.message.includes('找不到')) ? 404 : 400;
    handleError(res, error instanceof Error ? error : new Error('未知錯誤'), statusCode);
  }
});

export default router;