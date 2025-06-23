import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import auth from '../middleware/auth';
import adminAuth from '../middleware/adminAuth';
import {
  createEmployeeAccount,
  getEmployeeAccount,
  updateEmployeeAccount,
  deleteEmployeeAccount,
  unbindEmployeeAccount
} from '../services/employeeAccountService';

// 導入共享類型和常數
import { ApiResponse, ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { ERROR_MESSAGES, API_CONSTANTS } from '@pharmacy-pos/shared/constants';

// 定義介面
interface EmployeeInfo {
  id: string;
  name: string;
}

interface UserInfo {
  id: string;
  name: string;
  username: string;
  role?: string;
}

interface EmployeeAccountResult {
  employee: EmployeeInfo;
  user?: UserInfo;
}

interface EmployeeUser {
  _id: string;
  name: string;
  username: string;
  email?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

const router: express.Router = express.Router();

/**
 * 員工帳號管理路由
 * 提供員工帳號的 CRUD 操作
 */

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
        message: ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
        error: JSON.stringify(errors.array()),
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
    }

    const { employeeId, username, email, password, role } = req.body;
    
    const result = await createEmployeeAccount({
      employeeId,
      username,
      email,
      password,
      role
    });

    const response: ApiResponse<EmployeeAccountResult> = {
      success: true,
      message: '員工帳號創建成功',
      data: result,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      error: (error as Error).message,
      timestamp: new Date()
    };
    res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
  }
});

/**
 * @route   GET api/employee-accounts/:employeeId
 * @desc    Get user account info for an employee
 * @access  Private/Admin
 */
router.get('/:employeeId', [auth, adminAuth], async (req: Request, res: Response) => {
  try {
    const user = await getEmployeeAccount(req.params.employeeId);
    const response: ApiResponse<EmployeeUser> = {
      success: true,
      message: '成功獲取員工帳號資訊',
      data: user,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    const errorMessage = (error as Error).message;
    const statusCode = errorMessage.includes('找不到') ? API_CONSTANTS.HTTP_STATUS.NOT_FOUND : API_CONSTANTS.HTTP_STATUS.BAD_REQUEST;
    const errorResponse: ErrorResponse = {
      success: false,
      message: errorMessage.includes('找不到') ? ERROR_MESSAGES.GENERIC.NOT_FOUND : ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      error: errorMessage,
      timestamp: new Date()
    };
    res.status(statusCode).json(errorResponse);
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
        message: ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
        error: JSON.stringify(errors.array()),
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
    }

    const { username, email, password, role } = req.body;
    
    const updatedUser = await updateEmployeeAccount(req.params.employeeId, {
      username,
      email,
      password,
      role
    });

    const response: ApiResponse<{ user: EmployeeUser }> = {
      success: true,
      message: '員工帳號更新成功',
      data: { user: updatedUser },
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    const errorMessage = (error as Error).message;
    const statusCode = errorMessage.includes('找不到') ? API_CONSTANTS.HTTP_STATUS.NOT_FOUND : API_CONSTANTS.HTTP_STATUS.BAD_REQUEST;
    const errorResponse: ErrorResponse = {
      success: false,
      message: errorMessage.includes('找不到') ? ERROR_MESSAGES.GENERIC.NOT_FOUND : ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      error: errorMessage,
      timestamp: new Date()
    };
    res.status(statusCode).json(errorResponse);
  }
});

/**
 * @route   DELETE api/employee-accounts/:employeeId
 * @desc    Delete user account for an employee
 * @access  Private/Admin
 */
router.delete('/:employeeId', [auth, adminAuth], async (req: Request, res: Response) => {
  try {
    await deleteEmployeeAccount(req.params.employeeId);
    
    const response: ApiResponse<null> = {
      success: true,
      message: '員工帳號已刪除',
      data: null,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    const errorMessage = (error as Error).message;
    const statusCode = errorMessage.includes('找不到') ? API_CONSTANTS.HTTP_STATUS.NOT_FOUND : API_CONSTANTS.HTTP_STATUS.BAD_REQUEST;
    const errorResponse: ErrorResponse = {
      success: false,
      message: errorMessage.includes('找不到') ? ERROR_MESSAGES.GENERIC.NOT_FOUND : ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      error: errorMessage,
      timestamp: new Date()
    };
    res.status(statusCode).json(errorResponse);
  }
});

/**
 * @route   PUT api/employee-accounts/:employeeId/unbind
 * @desc    Unbind an employee from their account (without deleting the account)
 * @access  Private/Admin
 */
router.put('/:employeeId/unbind', [auth, adminAuth], async (req: Request, res: Response) => {
  try {
    const result = await unbindEmployeeAccount(req.params.employeeId);
    
    const message = result.user 
      ? '員工帳號綁定已解除' 
      : '員工帳號綁定已解除（用戶不存在）';
    
    const response: ApiResponse<EmployeeAccountResult> = {
      success: true,
      message: message,
      data: result,
      timestamp: new Date()
    };
    res.json(response);
  } catch (error) {
    const errorMessage = (error as Error).message;
    const statusCode = errorMessage.includes('找不到') ? API_CONSTANTS.HTTP_STATUS.NOT_FOUND : API_CONSTANTS.HTTP_STATUS.BAD_REQUEST;
    const errorResponse: ErrorResponse = {
      success: false,
      message: errorMessage.includes('找不到') ? ERROR_MESSAGES.GENERIC.NOT_FOUND : ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      error: errorMessage,
      timestamp: new Date()
    };
    res.status(statusCode).json(errorResponse);
  }
});

export default router;