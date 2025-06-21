import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';
import path from 'path';
import { AuthenticatedRequest } from '../src/types/express';
import { ApiResponse, ProductCreateRequest, ProductResponse } from '../src/types/api';
import { IBaseProductDocument, IProductDocument, IMedicineDocument } from '../src/types/models';
import auth from '../middleware/auth';
import BaseProduct, { Product, Medicine } from '../models/BaseProduct';

const router = express.Router();

// CSV 匯入結果介面
interface CSVImportResult {
  success: boolean;
  count: number;
  errors?: Array<{
    item: any;
    error: string;
  }>;
}

// CSV 項目資料介面
interface CSVItemData {
  code?: string;
  shortCode: string;
  name: string;
  category?: string;
  unit?: string;
  purchasePrice?: string;
  sellingPrice?: string;
  description?: string;
  supplier?: string;
  minStock?: string;
  barcode?: string;
  healthInsuranceCode?: string;
  healthInsurancePrice?: string;
}

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
    const products = await BaseProduct.find({ isActive: true })
      .populate('category', 'name')
      .populate('supplier', 'name')
      .sort({ productCode: 1 });
    
    res.json({
      success: true,
      message: '產品列表獲取成功',
      data: products,
      timestamp: new Date()
    } as ApiResponse<IBaseProductDocument[]>);
  } catch (err) {
    console.error('獲取產品列表錯誤:', err);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
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
    const products = await Product.find({ isActive: true })
      .populate('category', 'name')
      .populate('supplier', 'name')
      .sort({ productCode: 1 });
    
    res.json({
      success: true,
      message: '商品列表獲取成功',
      data: products as any,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('獲取商品列表錯誤:', err);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
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
    const medicines = await Medicine.find({ isActive: true })
      .populate('category', 'name')
      .populate('supplier', 'name')
      .sort({ productCode: 1 });
    
    res.json({
      success: true,
      message: '藥品列表獲取成功',
      data: medicines as any,
      timestamp: new Date()
    });
  } catch (err) {
    console.error('獲取藥品列表錯誤:', err);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
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
    const productCode = (req.params.code || '').toString().trim().toUpperCase();
    
    const product = await BaseProduct.findByCode(productCode);
    
    if (!product) {
      res.status(404).json({
        success: false,
        message: '產品不存在',
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
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
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
      res.status(404).json({
        success: false,
        message: '產品不存在',
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
      res.status(404).json({
        success: false,
        message: '產品不存在',
        timestamp: new Date()
      } as ApiResponse);
      return;
    }
    res.status(500).json({
      success: false,
      message: '伺服器錯誤',
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
    check('productName', '產品名稱為必填項目').not().isEmpty(),
    check('unit', '單位為必填項目').not().isEmpty(),
    check('costPrice', '成本價格必須是數字').optional().isNumeric(),
    check('sellingPrice', '售價必須是數字').optional().isNumeric()
  ],
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: '驗證失敗',
        details: errors.array(),
        timestamp: new Date()
      } as ApiResponse);
      return;
    }
    
    try {
      const {
        productCode,
        productName,
        category,
        unit,
        costPrice,
        sellingPrice,
        description,
        supplier,
        minStock,
        maxStock,
        tags
      } = req.body;
      
      // 檢查產品代碼是否已存在
      if (productCode) {
        const existingProduct = await BaseProduct.findByCode(productCode);
        if (existingProduct) {
          res.status(400).json({
            success: false,
            message: '產品代碼已存在',
            timestamp: new Date()
          } as ApiResponse);
          return;
        }
      }
      
      // 創建商品
      const product = new Product({
        productCode: productCode || await generateNextProductCode(),
        productName,
        category,
        unit,
        costPrice: parseFloat(costPrice) || 0,
        sellingPrice: parseFloat(sellingPrice) || 0,
        description,
        supplier,
        minStock: parseInt(minStock) || 0,
        maxStock: parseInt(maxStock) || undefined,
        tags: tags || [],
        isActive: true
      });
      
      await product.save();
      
      // 重新查詢以獲取完整的關聯資料
      const savedProduct = await Product.findById(product._id)
        .populate('category', 'name')
        .populate('supplier', 'name');
      
      res.json({
        success: true,
        message: '商品創建成功',
        data: savedProduct,
        timestamp: new Date()
      } as ApiResponse<IProductDocument>);
    } catch (err) {
      console.error('創建商品錯誤:', err);
      res.status(500).json({
        success: false,
        message: '伺服器錯誤',
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
    check('productName', '產品名稱為必填項目').not().isEmpty(),
    check('unit', '單位為必填項目').not().isEmpty(),
    check('costPrice', '成本價格必須是數字').optional().isNumeric(),
    check('sellingPrice', '售價必須是數字').optional().isNumeric()
  ],
  async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthenticatedRequest;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        message: '驗證失敗',
        details: errors.array(),
        timestamp: new Date()
      } as ApiResponse);
      return;
    }
    
    try {
      const {
        productCode,
        productName,
        category,
        unit,
        costPrice,
        sellingPrice,
        description,
        supplier,
        minStock,
        maxStock,
        tags,
        activeIngredient,
        dosageForm,
        strength,
        manufacturer,
        licenseNumber,
        expiryDate,
        storageConditions,
        prescriptionRequired
      } = req.body;
      
      // 檢查產品代碼是否已存在
      if (productCode) {
        const existingProduct = await BaseProduct.findByCode(productCode);
        if (existingProduct) {
          res.status(400).json({
            success: false,
            message: '產品代碼已存在',
            timestamp: new Date()
          } as ApiResponse);
          return;
        }
      }
      
      // 創建藥品
      const medicine = new Medicine({
        productCode: productCode || await generateNextMedicineCode(),
        productName,
        category,
        unit,
        costPrice: parseFloat(costPrice) || 0,
        sellingPrice: parseFloat(sellingPrice) || 0,
        description,
        supplier,
        minStock: parseInt(minStock) || 0,
        maxStock: parseInt(maxStock) || undefined,
        tags: tags || [],
        isActive: true,
        activeIngredient,
        dosageForm,
        strength,
        manufacturer,
        licenseNumber,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        storageConditions,
        prescriptionRequired: Boolean(prescriptionRequired)
      });
      
      await medicine.save();
      
      // 重新查詢以獲取完整的關聯資料
      const savedMedicine = await Medicine.findById(medicine._id)
        .populate('category', 'name')
        .populate('supplier', 'name');
      
      res.json({
        success: true,
        message: '藥品創建成功',
        data: savedMedicine,
        timestamp: new Date()
      } as ApiResponse<IMedicineDocument>);
    } catch (err) {
      console.error('創建藥品錯誤:', err);
      res.status(500).json({
        success: false,
        message: '伺服器錯誤',
        error: err instanceof Error ? err.message : '未知錯誤',
        timestamp: new Date()
      } as ApiResponse);
    }
  }
);

// 輔助函數：生成產品代碼（需要實現）
async function generateNextProductCode(): Promise<string> {
  // 這裡需要實現產品代碼生成邏輯
  // 暫時返回一個簡單的實現
  const count = await Product.countDocuments();
  return `P${String(count + 1).padStart(6, '0')}`;
}

// 輔助函數：生成藥品代碼（需要實現）
async function generateNextMedicineCode(): Promise<string> {
  // 這裡需要實現藥品代碼生成邏輯
  // 暫時返回一個簡單的實現
  const count = await Medicine.countDocuments();
  return `M${String(count + 1).padStart(6, '0')}`;
}

export default router;