import express, { Request, Response } from 'express';
import { check, validationResult, Result } from 'express-validator';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import {
  ApiResponse
} from '@pharmacy-pos/shared/types/api';
import {
  IBaseProductDocument,
  IProductDocument,
  IMedicineDocument
} from '../src/types/models';
import { ProductType } from '@pharmacy-pos/shared/enums';
import { ERROR_MESSAGES, API_CONSTANTS } from '@pharmacy-pos/shared/constants';
import auth from '../middleware/auth';
const BaseProduct = require('../models/BaseProduct');
const { Product, Medicine } = require('../models/BaseProduct');

const router: express.Router = express.Router();


// 配置 multer 存儲
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    // 確保上傳目錄存在
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// 文件過濾器
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // 只接受 CSV 文件
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('只接受CSV文件'));
  }
};

// 配置上傳
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } // 限制 5MB
});

// @route   GET api/products
// @desc    獲取所有產品
// @access  Public
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // 使用 $ne: false 查詢條件來獲取活躍產品
    // 注意：直接使用 isActive: true 在此資料庫中有查詢問題
    const products = await BaseProduct.find({ isActive: { $ne: false } })
      .populate('category', 'name')
      .populate('supplier', 'name')
      .sort({ code: 1 });
    
    res.json({
      success: true,
      message: '產品列表獲取成功',
      data: products,
      timestamp: new Date()
    } as ApiResponse<IBaseProductDocument[]>);
  } catch (err) {
    console.error('獲取產品列表錯誤:', err);
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.GENERIC.INTERNAL_ERROR,
      error: err instanceof Error ? err.message : '未知錯誤',
      timestamp: new Date()
    } as ApiResponse);
  }
});

// @route   GET api/products/products
// @desc    獲取所有商品（非藥品）
// @access  Public
router.get('/products', async (req: Request, res: Response): Promise<void> => {
  try {
    const products = await Product.find({ isActive: { $ne: false } })
      .populate('category', 'name')
      .populate('supplier', 'name')
      .sort({ code: 1 });
    
    res.json({
      success: true,
      message: '商品列表獲取成功',
      data: products,
      timestamp: new Date()
    } as ApiResponse<IProductDocument[]>);
  } catch (err) {
    console.error('獲取商品列表錯誤:', err);
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.GENERIC.INTERNAL_ERROR,
      error: err instanceof Error ? err.message : '未知錯誤',
      timestamp: new Date()
    } as ApiResponse);
  }
});

// @route   GET api/products/medicines
// @desc    獲取所有藥品
// @access  Public
router.get('/medicines', async (req: Request, res: Response): Promise<void> => {
  try {
    const medicines = await Medicine.find({ isActive: { $ne: false } })
      .populate('category', 'name')
      .populate('supplier', 'name')
      .sort({ code: 1 });
    
    res.json({
      success: true,
      message: '藥品列表獲取成功',
      data: medicines,
      timestamp: new Date()
    } as ApiResponse<IMedicineDocument[]>);
  } catch (err) {
    console.error('獲取藥品列表錯誤:', err);
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.GENERIC.INTERNAL_ERROR,
      error: err instanceof Error ? err.message : '未知錯誤',
      timestamp: new Date()
    } as ApiResponse);
  }
});

// @route   GET api/products/code/:code
// @desc    根據產品代碼獲取產品
// @access  Public
router.get('/code/:code', async (req: Request, res: Response): Promise<void> => {
  try {
    const productCode = (req.params.code ?? '').toString().trim().toUpperCase();
    
    const product = await BaseProduct.findByCode(productCode);
    
    if (!product) {
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.PRODUCT.NOT_FOUND,
        timestamp: new Date()
      } as ApiResponse);
      return;
    }
    
    res.json({
      success: true,
      message: '產品獲取成功',
      data: product,
      timestamp: new Date()
    } as ApiResponse<IBaseProductDocument>);
  } catch (err) {
    console.error('根據代碼獲取產品錯誤:', err);
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.GENERIC.INTERNAL_ERROR,
      error: err instanceof Error ? err.message : '未知錯誤',
      timestamp: new Date()
    } as ApiResponse);
  }
});

// @route   GET api/products/:id
// @desc    獲取單個產品
// @access  Public
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await BaseProduct.findById(req.params.id)
      .populate('category', 'name')
      .populate('supplier', 'name');
    
    if (!product) {
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.PRODUCT.NOT_FOUND,
        timestamp: new Date()
      } as ApiResponse);
      return;
    }
    
    res.json({
      success: true,
      message: '產品獲取成功',
      data: product,
      timestamp: new Date()
    } as ApiResponse<IBaseProductDocument>);
  } catch (err) {
    console.error('獲取產品錯誤:', err);
    if (err instanceof Error && err.name === 'CastError') {
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.PRODUCT.NOT_FOUND,
        timestamp: new Date()
      } as ApiResponse);
      return;
    }
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.GENERIC.INTERNAL_ERROR,
      error: err instanceof Error ? err.message : '未知錯誤',
      timestamp: new Date()
    } as ApiResponse);
  }
});

// @route   POST api/products/product
// @desc    創建商品
// @access  Private
router.post(
  '/product',
  auth,
  [
    check('name', '產品名稱為必填項目').not().isEmpty(),
    check('unit', '單位為必填項目').not().isEmpty(),
    check('purchasePrice', '進貨價格必須是數字').optional().isNumeric(),
    check('sellingPrice', '售價必須是數字').optional().isNumeric()
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
        details: errors.array(),
        timestamp: new Date()
      } as ApiResponse);
      return;
    }

    try {
      const {
        code,
        name,
        category,
        unit,
        purchasePrice,
        sellingPrice,
        description,
        supplier,
        minStock,
        barcode
      } = req.body;

      // 檢查產品代碼是否已存在
      if (code?.trim()) {
        const existingProduct = await BaseProduct.findByCode(code.trim());
        if (existingProduct) {
          res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: ERROR_MESSAGES.PRODUCT.CODE_EXISTS,
            timestamp: new Date()
          } as ApiResponse);
          return;
        }
      }

      // 創建商品
      const product = new Product({
        code: code?.trim() ?? await generateNextProductCode(),
        shortCode: req.body.shortCode?.trim() ?? '',
        name,
        category,
        unit,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : 0,
        sellingPrice: sellingPrice ? parseFloat(sellingPrice) : 0,
        description,
        supplier,
        minStock: minStock !== undefined ? parseInt(minStock) : 10,
        barcode,
        productType: ProductType.PRODUCT,
        isActive: true
      });

      await product.save();

      // 重新查詢以獲取完整的關聯資料
      const savedProduct = await Product.findById(product._id)
        .populate('category', 'name')
        .populate('supplier', 'name') as IProductDocument | null;

      if (!savedProduct) {
        res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: ERROR_MESSAGES.GENERIC.INTERNAL_ERROR,
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        message: '商品創建成功',
        data: savedProduct,
        timestamp: new Date()
      } as ApiResponse<IProductDocument>);
    } catch (err) {
      console.error('創建商品錯誤:', err);
      res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.GENERIC.INTERNAL_ERROR,
        error: err instanceof Error ? err.message : '未知錯誤',
        timestamp: new Date()
      } as ApiResponse);
    }
  }
);

// @route   POST api/products/medicine
// @desc    創建藥品
// @access  Private
router.post(
  '/medicine',
  auth,
  [
    check('name', '產品名稱為必填項目').not().isEmpty(),
    check('unit', '單位為必填項目').not().isEmpty(),
    check('purchasePrice', '進貨價格必須是數字').optional().isNumeric(),
    check('sellingPrice', '售價必須是數字').optional().isNumeric()
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (handleValidationErrors(errors, res)) {
      return;
    }

    try {
      const {
        code,
        name,
        category,
        unit,
        purchasePrice,
        sellingPrice,
        description,
        supplier,
        minStock,
        barcode,
        healthInsuranceCode,
        healthInsurancePrice
      } = req.body;

      if (await checkProductCodeExistence(code, res)) {
        return;
      }

      const medicine = new Medicine({
        code: code?.trim() ?? await generateNextMedicineCode(),
        shortCode: req.body.shortCode?.trim() ?? '',
        name,
        category,
        unit,
        purchasePrice: parseFloatOrDefault(purchasePrice, 0),
        sellingPrice: parseFloatOrDefault(sellingPrice, 0),
        description,
        supplier,
        minStock: parseIntOrDefault(minStock, 10),
        barcode,
        healthInsuranceCode,
        healthInsurancePrice: parseFloatOrDefault(healthInsurancePrice, 0),
        productType: ProductType.MEDICINE,
        isActive: true
      });

      const savedMedicine = await saveAndPopulateMedicine(medicine, res);
      if (!savedMedicine) {
        return; // saveAndPopulateMedicine 已經處理了錯誤響應
      }

      res.json({
        success: true,
        message: '藥品創建成功',
        data: savedMedicine,
        timestamp: new Date()
      } as ApiResponse<IMedicineDocument>);
    } catch (err) {
      console.error('創建藥品錯誤:', err);
      res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.GENERIC.INTERNAL_ERROR,
        error: err instanceof Error ? err.message : '未知錯誤',
        timestamp: new Date()
      } as ApiResponse);
    }
  }
);

// @route   PUT api/products/:id
// @desc    更新產品
// @access  Private
router.put(
  '/:id',
  auth,
  [
    check('name', '產品名稱為必填項目').notEmpty().withMessage('產品名稱不能為空'),
    check('unit', '單位為必填項目').notEmpty().withMessage('單位不能為空'),
    check('purchasePrice', '進貨價格必須是數字').optional().isNumeric().withMessage('進貨價格格式錯誤'),
    check('sellingPrice', '售價必須是數字').optional().isNumeric().withMessage('售價格式錯誤'),
    check('minStock', '最低庫存必須是數字').optional().isInt({ min: 0 }).withMessage('最低庫存必須是非負整數'),
    check('healthInsurancePrice', '健保價格必須是數字').optional().isNumeric().withMessage('健保價格格式錯誤')
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      console.log('驗證錯誤詳情:', errors.array()); // 除錯用
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
        details: errors.array(),
        timestamp: new Date()
      } as ApiResponse);
      return;
    }
    
    try {
      const productId = req.params.id;
      const updateData = req.body;
      
      // 檢查產品是否存在
      const existingProduct = await BaseProduct.findById(productId);
      if (!existingProduct) {
        res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: ERROR_MESSAGES.PRODUCT.NOT_FOUND,
          timestamp: new Date()
        } as ApiResponse);
        return;
      }
      
      // 如果更新代碼，檢查是否與其他產品重複
      if (updateData.code?.trim() && updateData.code.trim() !== existingProduct.code) {
        const duplicateProduct = await BaseProduct.findByCode(updateData.code.trim());
        if (duplicateProduct) {
          res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: ERROR_MESSAGES.PRODUCT.CODE_EXISTS,
            timestamp: new Date()
          } as ApiResponse);
          return;
        }
      }
      
      // 處理數值欄位
      if (updateData.purchasePrice !== undefined) {
        updateData.purchasePrice = updateData.purchasePrice ? parseFloat(updateData.purchasePrice) : 0;
      }
      if (updateData.sellingPrice !== undefined) {
        updateData.sellingPrice = updateData.sellingPrice ? parseFloat(updateData.sellingPrice) : 0;
      }
      if (updateData.healthInsurancePrice !== undefined) {
        updateData.healthInsurancePrice = updateData.healthInsurancePrice ? parseFloat(updateData.healthInsurancePrice) : 0;
      }
      if (updateData.minStock !== undefined) {
        updateData.minStock = parseInt(updateData.minStock);
        // 如果解析失敗（NaN），則設為 10，但允許 0 值
        if (isNaN(updateData.minStock)) {
          updateData.minStock = 10;
        }
      }
      
      // 處理代碼欄位
      if (updateData.code !== undefined) {
        updateData.code = updateData.code?.trim() ?? existingProduct.code;
      }
      
      // 處理簡碼欄位 - 不自動帶入商品編號
      if (updateData.shortCode !== undefined) {
        updateData.shortCode = updateData.shortCode?.trim() ?? '';
      }
      
      // 更新產品
      const updatedProduct = await BaseProduct.findByIdAndUpdate(
        productId,
        { $set: updateData },
        { new: true, runValidators: true }
      )
        .populate('category', 'name')
        .populate('supplier', 'name');
      
      if (!updatedProduct) {
        res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: ERROR_MESSAGES.GENERIC.INTERNAL_ERROR,
          timestamp: new Date()
        } as ApiResponse);
        return;
      }
      
      res.json({
        success: true,
        message: '產品更新成功',
        data: updatedProduct,
        timestamp: new Date()
      } as ApiResponse<IBaseProductDocument>);
    } catch (err) {
      console.error('更新產品錯誤:', err);
      if (err instanceof Error && err.name === 'CastError') {
        res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: ERROR_MESSAGES.PRODUCT.NOT_FOUND,
          timestamp: new Date()
        } as ApiResponse);
        return;
      }
      res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.GENERIC.INTERNAL_ERROR,
        error: err instanceof Error ? err.message : '未知錯誤',
        timestamp: new Date()
      } as ApiResponse);
    }
  }
);

// @route   DELETE api/products/:id
// @desc    刪除產品（軟刪除）
// @access  Private
router.delete('/:id', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const productId = req.params.id;
    
    // 檢查產品是否存在
    const existingProduct = await BaseProduct.findById(productId);
    if (!existingProduct) {
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.PRODUCT.NOT_FOUND,
        timestamp: new Date()
      } as ApiResponse);
      return;
    }
    
    // 軟刪除：設置 isActive 為 false
    const deletedProduct = await BaseProduct.findByIdAndUpdate(
      productId,
      { $set: { isActive: false } },
      { new: true }
    );
    
    if (!deletedProduct) {
      res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.GENERIC.INTERNAL_ERROR,
        timestamp: new Date()
      } as ApiResponse);
      return;
    }
    
    res.json({
      success: true,
      message: '產品刪除成功',
      data: deletedProduct,
      timestamp: new Date()
    } as ApiResponse<IBaseProductDocument>);
  } catch (err) {
    console.error('刪除產品錯誤:', err);
    if (err instanceof Error && err.name === 'CastError') {
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: ERROR_MESSAGES.PRODUCT.NOT_FOUND,
        timestamp: new Date()
      } as ApiResponse);
      return;
    }
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.GENERIC.INTERNAL_ERROR,
      error: err instanceof Error ? err.message : '未知錯誤',
      timestamp: new Date()
    } as ApiResponse);
  }
});

// 輔助函數：生成產品代碼
async function generateNextProductCode(): Promise<string> {
  try {
    const count = await Product.countDocuments();
    return `P${String(count + 10001).padStart(5, '0')}`;
  } catch (error) {
    console.error('生成產品代碼錯誤:', error);
    return `P${String(Date.now()).slice(-5)}`;
  }
}

// 輔助函數：生成藥品代碼
async function generateNextMedicineCode(): Promise<string> {
  try {
    const count = await Medicine.countDocuments();
    return `M${String(count + 10001).padStart(5, '0')}`;
  } catch (error) {
    console.error('生成藥品代碼錯誤:', error);
    return `M${String(Date.now()).slice(-5)}`;
  }
}

/**
 * 處理驗證錯誤並發送響應
 */
function handleValidationErrors(errors: Result, res: Response): boolean {
  if (!errors.isEmpty()) {
    res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
      details: errors.array(),
      timestamp: new Date()
    } as ApiResponse);
    return true;
  }
  return false;
}

/**
 * 檢查產品代碼是否已存在
 */
async function checkProductCodeExistence(code: string | undefined, res: Response): Promise<boolean> {
  if (code?.trim()) {
    const existingProduct = await BaseProduct.findByCode(code.trim());
    if (existingProduct) {
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: ERROR_MESSAGES.PRODUCT.CODE_EXISTS,
        timestamp: new Date()
      } as ApiResponse);
      return true;
    }
  }
  return false;
}

/**
 * 將值解析為浮點數，如果無效則返回預設值
 */
function parseFloatOrDefault(value: any, defaultValue: number): number {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * 將值解析為整數，如果無效則返回預設值
 */
function parseIntOrDefault(value: any, defaultValue: number): number {
  const parsed = parseInt(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * 保存 Medicine 文檔並重新查詢以獲取完整的關聯資料
 */
async function saveAndPopulateMedicine(medicine: IMedicineDocument, res: Response): Promise<IMedicineDocument | null> {
  await medicine.save();
  const savedMedicine = await Medicine.findById(medicine._id)
    .populate('category', 'name')
    .populate('supplier', 'name') as unknown as IMedicineDocument | null;

  if (!savedMedicine) {
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.GENERIC.INTERNAL_ERROR,
      timestamp: new Date()
    } as ApiResponse);
    return null;
  }
  return savedMedicine;
}


// 臨時測試端點：創建測試數據（僅用於開發測試）
router.post('/create-test-data', async (req: Request, res: Response): Promise<void> => {
  try {
    // 檢查是否已有數據
    const existingCount = await BaseProduct.countDocuments();
    if (existingCount > 0) {
      res.json({
        success: true,
        message: '測試數據已存在',
        data: { count: existingCount },
        timestamp: new Date()
      });
      return;
    }

    // 創建測試商品
    const testProduct = new Product({
      code: 'P000001',
      shortCode: 'P001',
      name: '測試商品A',
      unit: '個',
      purchasePrice: 50,
      sellingPrice: 80,
      description: '這是一個測試商品',
      minStock: 10,
      productType: ProductType.PRODUCT,
      isActive: true
    });

    const testProduct2 = new Product({
      code: 'P000002',
      shortCode: 'P002',
      name: '測試商品B',
      unit: '盒',
      purchasePrice: 30,
      sellingPrice: 50,
      description: '這是另一個測試商品',
      minStock: 5,
      productType: ProductType.PRODUCT,
      isActive: true
    });

    // 創建測試藥品
    const testMedicine = new Medicine({
      code: 'M000001',
      shortCode: 'M001',
      name: '測試藥品A',
      unit: '盒',
      purchasePrice: 100,
      sellingPrice: 150,
      description: '這是一個測試藥品',
      minStock: 5,
      healthInsuranceCode: 'HC001',
      healthInsurancePrice: 120,
      productType: ProductType.MEDICINE,
      isActive: true
    });

    const testMedicine2 = new Medicine({
      code: 'M000002',
      shortCode: 'M002',
      name: '測試藥品B',
      unit: '瓶',
      purchasePrice: 80,
      sellingPrice: 120,
      description: '這是另一個測試藥品',
      minStock: 3,
      healthInsuranceCode: 'HC002',
      healthInsurancePrice: 100,
      productType: ProductType.MEDICINE,
      isActive: true
    });

    await testProduct.save();
    await testProduct2.save();
    await testMedicine.save();
    await testMedicine2.save();

    res.json({
      success: true,
      message: '測試數據創建成功',
      data: {
        created: 4,
        products: 2,
        medicines: 2
      },
      timestamp: new Date()
    });
  } catch (err) {
    console.error('創建測試數據錯誤:', err);
    res.status(500).json({
      success: false,
      message: '創建測試數據失敗',
      error: err instanceof Error ? err.message : '未知錯誤',
      timestamp: new Date()
    });
  }
});

export default router;