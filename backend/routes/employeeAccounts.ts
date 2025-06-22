import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import auth from '../middleware/auth';
import adminAuth from '../middleware/adminAuth';
import { handleError, createSuccessResponse } from '../utils/employeeAccountValidation';
import {
  createEmployeeAccount,
  getEmployeeAccount,
  updateEmployeeAccount,
  deleteEmployeeAccount,
  unbindEmployeeAccount
} from '../services/employeeAccountService';

const router = express.Router();

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
      return res.status(400).json({ errors: errors.array() });
    }

    const { employeeId, username, email, password, role } = req.body;
    
    const result = await createEmployeeAccount({
      employeeId,
      username,
      email,
      password,
      role
    });

    const response = createSuccessResponse('員工帳號創建成功', result);
    res.json(response);
  } catch (error: any) {
    handleError(res, error, 400);
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
    res.json(user);
  } catch (error: any) {
    const statusCode = error.message.includes('找不到') ? 404 : 400;
    handleError(res, error, statusCode);
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
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, role } = req.body;
    
    const updatedUser = await updateEmployeeAccount(req.params.employeeId, {
      username,
      email,
      password,
      role
    });

    const response = createSuccessResponse('員工帳號更新成功', { user: updatedUser });
    res.json(response);
  } catch (error: any) {
    const statusCode = error.message.includes('找不到') ? 404 : 400;
    handleError(res, error, statusCode);
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
    
    const response = createSuccessResponse('員工帳號已刪除');
    res.json(response);
  } catch (error: any) {
    const statusCode = error.message.includes('找不到') ? 404 : 400;
    handleError(res, error, statusCode);
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
    
    const response = createSuccessResponse(message, result);
    res.json(response);
  } catch (error: any) {
    const statusCode = error.message.includes('找不到') ? 404 : 400;
    handleError(res, error, statusCode);
  }
});

export default router;