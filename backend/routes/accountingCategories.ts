import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import { check, validationResult } from 'express-validator';

// 使用 TypeScript import 語法導入模型和中介軟體
import AccountingCategory from '../models/AccountingCategory';
import auth from '../middleware/auth';

// 導入共享類型和常數
import { ApiResponse, ErrorResponse } from '../../shared/types/api';
import { ERROR_MESSAGES, API_CONSTANTS } from '../../shared/constants';
import { AuthenticatedRequest } from '../src/types/express';

// 定義請求介面
interface AccountingCategoryRequest {
  name: string;
  description?: string;
  isActive?: boolean;
  order?: number;
}

const router = express.Router();

// @route   GET api/accounting-categories
// @desc    獲取所有記帳名目類別
// @access  Private
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const categories = await AccountingCategory.find({ isActive: true })
      .sort({ order: 1, name: 1 });
    
    const response: ApiResponse<any[]> = {
      success: true,
      message: '成功獲取記帳名目類別',
      data: categories,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    console.error((err as Error).message);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      error: (err as Error).message,
      timestamp: new Date()
    };
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   GET api/accounting-categories/:id
// @desc    獲取單筆記帳名目類別
// @access  Private
router.get('/:id', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.INVALID_ID,
        error: '無效的類別 ID 格式',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
    }
    
    const category = await AccountingCategory.findById(id);
      
    if (!category) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        error: '找不到記帳名目類別',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }
    
    const response: ApiResponse<any> = {
      success: true,
      message: '成功獲取記帳名目類別',
      data: category,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    console.error((err as Error).message);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      error: (err as Error).message,
      timestamp: new Date()
    };
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   POST api/accounting-categories
// @desc    新增記帳名目類別
// @access  Private
router.post('/', auth, [
  check('name', '名稱為必填欄位').not().isEmpty(),
], async (req: AuthenticatedRequest, res: Response) => {
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
  
  try {
    const { name, description }: AccountingCategoryRequest = req.body;
    
    // 檢查是否已存在相同名稱的類別
    const existingCategory = await AccountingCategory.findOne({ name: name.toString() });
    
    if (existingCategory) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.ALREADY_EXISTS,
        error: '該名目類別已存在',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
    }
    
    const newCategory = new AccountingCategory({
      name,
      description: description || ''
    });
    
    const category = await newCategory.save();
    
    const response: ApiResponse<any> = {
      success: true,
      message: '記帳名目類別創建成功',
      data: category,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    console.error((err as Error).message);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      error: (err as Error).message,
      timestamp: new Date()
    };
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   PUT api/accounting-categories/:id
// @desc    更新記帳名目類別
// @access  Private
router.put('/:id', auth, [
  check('name', '名稱為必填欄位').not().isEmpty(),
], async (req: Request, res: Response) => {
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
  
  try {
    const { id } = req.params;
    const { name, description, isActive, order }: AccountingCategoryRequest = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.INVALID_ID,
        error: '無效的類別 ID 格式',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
    }
    
    // 檢查是否存在相同名稱的其他類別
    const existingCategory = await AccountingCategory.findOne({
      name: name.toString(),
      _id: { $ne: new mongoose.Types.ObjectId(id) }
    });
    
    if (existingCategory) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.ALREADY_EXISTS,
        error: '該名目類別已存在',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
    }
    
    let category = await AccountingCategory.findById(id);
    
    if (!category) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        error: '找不到記帳名目類別',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }
    
    // 更新類別
    category.name = name.toString();
    category.description = description ? description.toString() : '';
    if (isActive !== undefined) {
      category.isActive = isActive;
    }
    if (order !== undefined) {
      category.order = order;
    }
    
    category = await category.save();
    
    const response: ApiResponse<any> = {
      success: true,
      message: '記帳名目類別更新成功',
      data: category,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    console.error((err as Error).message);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      error: (err as Error).message,
      timestamp: new Date()
    };
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   DELETE api/accounting-categories/:id
// @desc    刪除記帳名目類別
// @access  Private
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.INVALID_ID,
        error: '無效的類別 ID 格式',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
    }
    
    const category = await AccountingCategory.findById(id);
    
    if (!category) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        error: '找不到記帳名目類別',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }
    
    // 軟刪除 - 將isActive設為false
    category.isActive = false;
    await category.save();
    
    const response: ApiResponse<null> = {
      success: true,
      message: '記帳名目類別已停用',
      data: null,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    console.error((err as Error).message);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      error: (err as Error).message,
      timestamp: new Date()
    };
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

export default router;