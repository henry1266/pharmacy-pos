import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import { ApiResponse, ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { API_CONSTANTS, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';
import ProductCategory from '../../models/ProductCategory';
import auth from '../../middleware/auth';

const router: express.Router = express.Router();

// 型別定義
interface ProductCategoryRequest {
  name: string;
  description?: string;
  isActive?: boolean;
  order?: number;
}

// @route   GET api/product-categories
// @desc    獲取所有產品分類
// @access  Public
router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await ProductCategory.find({ isActive: { $ne: false } })
      .sort({ order: 1, name: 1 });
      
    const response: ApiResponse<any[]> = {
      success: true,
      message: '成功獲取產品分類',
      data: categories,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   GET api/product-categories/:id
// @desc    獲取單筆產品分類
// @access  Public
router.get('/:id', async (req: Request, res: Response) => {
  try {
    // 使用 findOne 替代 findById，並將 id 轉換為字串
    const category = await ProductCategory.findOne({ _id: req.params.id?.toString() });
      
    if (!category) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '找不到產品分類',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }
    
    const response: ApiResponse<any> = {
      success: true,
      message: '成功獲取產品分類',
      data: category,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    
    if (err instanceof Error && err.name === 'CastError') {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '找不到產品分類',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: '伺服器錯誤',
      timestamp: new Date()
    };
    
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   POST api/product-categories
// @desc    新增產品分類
// @access  Private
router.post('/',
  auth,
  [
    check('name', '名稱為必填欄位').not().isEmpty(),
  ],
  async (req: Request, res: Response) => {
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
    const { name, description } = req.body as ProductCategoryRequest;
    
    // 檢查是否已存在相同名稱的類別
    // 將 name 參數轉換為字串
    const existingCategory = await ProductCategory.findOne({ name: name.toString() });
    
    if (existingCategory) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '該產品分類已存在',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
    }
    
    const newCategory = new ProductCategory({
      name,
      description: description || ''
    });
    
    const category = await newCategory.save();
    
    const response: ApiResponse<any> = {
      success: true,
      message: '產品分類新增成功',
      data: category,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: '伺服器錯誤',
      timestamp: new Date()
    };
    
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   PUT api/product-categories/:id
// @desc    更新產品分類
// @access  Private
router.put('/:id',
  auth,
  [
    check('name', '名稱為必填欄位').not().isEmpty(),
  ],
  async (req: Request, res: Response) => {
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
    const { name, description, isActive, order } = req.body as ProductCategoryRequest;
    
    // 檢查是否存在相同名稱的其他類別
    // 將 name 和 id 參數轉換為字串
    const existingCategory = await ProductCategory.findOne({
      name: name.toString(),
      _id: { $ne: req.params.id?.toString() }
    });
    
    if (existingCategory) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '該產品分類已存在',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
    }
    
    // 使用 findOne 替代 findById，並將 id 轉換為字串
    let category = await ProductCategory.findOne({ _id: req.params.id?.toString() });
    
    if (!category) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '找不到產品分類',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }
    
    // 更新類別
    category.name = name;
    category.description = description || '';
    if (isActive !== undefined) {
      category.isActive = isActive;
    }
    if (order !== undefined) {
      category.order = order;
    }
    
    category = await category.save();
    
    const response: ApiResponse<any> = {
      success: true,
      message: '產品分類更新成功',
      data: category,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    
    if (err instanceof Error && err.name === 'CastError') {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '找不到產品分類',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: '伺服器錯誤',
      timestamp: new Date()
    };
    
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   DELETE api/product-categories/:id
// @desc    刪除產品分類
// @access  Private
router.delete('/:id', auth, async (req: Request, res: Response) => {
  try {
    // 使用 findOne 替代 findById，並將 id 轉換為字串
    const category = await ProductCategory.findOne({ _id: req.params.id?.toString() });
    
    if (!category) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '找不到產品分類',
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
      message: '產品分類已停用',
      data: null,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    
    if (err instanceof Error && err.name === 'CastError') {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '找不到產品分類',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: '伺服器錯誤',
      timestamp: new Date()
    };
    
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

export default router;