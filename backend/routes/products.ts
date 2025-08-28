import express, { Request, Response } from 'express';
import { check, validationResult, Result } from 'express-validator';
// import multer from 'multer';
// import fs from 'fs';
// import path from 'path';
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
import { PackageUnitService } from '../services/PackageUnitService';
import { generateProductCodeByHealthInsurance } from '../utils/codeGenerator';
const BaseProduct = require('../models/BaseProduct');
const { Product, Medicine } = require('../models/BaseProduct');

const router: express.Router = express.Router();


// 配置 multer 存儲
// const storage = multer.diskStorage({
//   destination: (_req, _file, cb) => {
//     const uploadDir = path.join(__dirname, '../uploads');
//     // 確保上傳目錄存在
//     if (!fs.existsSync(uploadDir)) {
//       fs.mkdirSync(uploadDir, { recursive: true });
//     }
//     cb(null, uploadDir);
//   },
//   filename: (_req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   }
// });

// 文件過濾器
// const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
//   // 只接受 CSV 文件
//   if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
//     cb(null, true);
//   } else {
//     cb(new Error('只接受CSV文件'));
//   }
// };

// 配置上傳
// const upload = multer({
//   storage: storage,
//   fileFilter: fileFilter,
//   limits: { fileSize: 1024 * 1024 * 5 } // 限制 5MB
// });

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: 獲取所有產品
 *     description: 獲取所有產品，支援多種過濾和排序選項
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜尋關鍵字（名稱、代碼、簡碼、條碼、健保代碼）
 *       - in: query
 *         name: productType
 *         schema:
 *           type: string
 *           enum: [all, PRODUCT, MEDICINE]
 *         description: 產品類型
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: 分類ID
 *       - in: query
 *         name: supplier
 *         schema:
 *           type: string
 *         description: 供應商ID
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: 最低價格
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: 最高價格
 *       - in: query
 *         name: stockStatus
 *         schema:
 *           type: string
 *           enum: [all, inStock, lowStock, outOfStock]
 *         description: 庫存狀態
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [code, name, price, stock]
 *         description: 排序欄位
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: 排序方向
 *     responses:
 *       200:
 *         description: 成功獲取產品列表
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 產品列表獲取成功
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/BaseProduct'
 *                 filters:
 *                   type: object
 *                   properties:
 *                     search:
 *                       type: string
 *                     productType:
 *                       type: string
 *                     category:
 *                       type: string
 *                     supplier:
 *                       type: string
 *                     priceRange:
 *                       type: object
 *                       properties:
 *                         min:
 *                           type: number
 *                         max:
 *                           type: number
 *                     stockStatus:
 *                       type: string
 *                     sort:
 *                       type: object
 *                       properties:
 *                         by:
 *                           type: string
 *                         order:
 *                           type: string
 *                 count:
 *                   type: number
 *                   example: 10
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: 伺服器錯誤
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      search,
      productType,
      category,
      supplier,
      minPrice,
      maxPrice,
      stockStatus,
      sortBy = 'code',
      sortOrder = 'asc'
    } = req.query;

    // 基本查詢條件
    let query: any = { isActive: { $ne: false } };

    // 搜尋條件（名稱、代碼、簡碼、條碼、健保代碼）
    if (search && typeof search === 'string') {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { shortCode: searchRegex },
        { barcode: searchRegex },
        { healthInsuranceCode: searchRegex }
      ];
    }

    // 產品類型篩選
    if (productType && productType !== 'all') {
      query.productType = productType;
    }

    // 分類篩選
    if (category && typeof category === 'string') {
      query.category = category;
    }

    // 供應商篩選
    if (supplier && typeof supplier === 'string') {
      query.supplier = supplier;
    }

    // 價格區間篩選
    if (minPrice || maxPrice) {
      query.sellingPrice = {};
      if (minPrice) query.sellingPrice.$gte = parseFloat(minPrice as string);
      if (maxPrice) query.sellingPrice.$lte = parseFloat(maxPrice as string);
    }

    // 排序設定
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    const products = await BaseProduct.find(query)
      .populate('category', 'name')
      .populate('supplier', 'name')
      .sort(sortOptions);

    // 為每個產品獲取包裝單位數據
    const productsWithPackageUnits = await Promise.all(
      products.map(async (product: IBaseProductDocument) => {
        const productObj = product.toObject();
        try {
          const packageUnits = await PackageUnitService.getProductPackageUnits(product._id.toString());
          productObj.packageUnits = packageUnits;
        } catch (packageError) {
          console.error(`獲取產品 ${product._id} 包裝單位失敗:`, packageError);
          productObj.packageUnits = [];
        }
        return productObj;
      })
    );
    
    res.json({
      success: true,
      message: '產品列表獲取成功',
      data: productsWithPackageUnits,
      filters: {
        search,
        productType,
        category,
        supplier,
        priceRange: { min: minPrice, max: maxPrice },
        stockStatus,
        sort: { by: sortBy, order: sortOrder }
      },
      count: productsWithPackageUnits.length,
      timestamp: new Date()
    } as ApiResponse<any[]>);
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
router.get('/products', async (_req: Request, res: Response): Promise<void> => {
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
router.get('/medicines', async (_req: Request, res: Response): Promise<void> => {
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
    if (!req.params.id) {
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: '缺少產品ID參數',
        timestamp: new Date()
      } as ApiResponse);
      return;
    }

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

    // 獲取包裝單位數據
    let productWithPackageUnits = product.toObject();
    try {
      const packageUnits = await PackageUnitService.getProductPackageUnits(req.params.id);
      productWithPackageUnits.packageUnits = packageUnits;
    } catch (packageError) {
      console.error('獲取包裝單位失敗:', packageError);
      productWithPackageUnits.packageUnits = [];
    }
    
    res.json({
      success: true,
      message: '產品獲取成功',
      data: productWithPackageUnits,
      timestamp: new Date()
    } as ApiResponse<any>);
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

/**
 * @swagger
 * /api/products/product:
 *   post:
 *     summary: 創建新商品
 *     description: 創建一個新的商品記錄
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - unit
 *             properties:
 *               code:
 *                 type: string
 *                 description: 產品代碼（如果不提供將自動生成）
 *               name:
 *                 type: string
 *                 description: 產品名稱
 *               subtitle:
 *                 type: string
 *                 description: 產品副標題
 *               category:
 *                 type: string
 *                 description: 分類ID
 *               unit:
 *                 type: string
 *                 description: 基本單位
 *               purchasePrice:
 *                 type: number
 *                 description: 進貨價格
 *               sellingPrice:
 *                 type: number
 *                 description: 售價
 *               description:
 *                 type: string
 *                 description: 產品描述
 *               supplier:
 *                 type: string
 *                 description: 供應商ID
 *               minStock:
 *                 type: number
 *                 description: 最低庫存量
 *               barcode:
 *                 type: string
 *                 description: 商品條碼
 *               healthInsuranceCode:
 *                 type: string
 *                 description: 健保碼
 *               excludeFromStock:
 *                 type: boolean
 *                 description: 是否排除於庫存計算
 *               packageUnits:
 *                 type: array
 *                 description: 包裝單位
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       description: 包裝單位名稱
 *                     conversionRate:
 *                       type: number
 *                       description: 轉換率
 *     responses:
 *       201:
 *         description: 商品創建成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 商品創建成功
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: 請求參數錯誤
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: 驗證失敗
 *                 details:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       param:
 *                         type: string
 *                       msg:
 *                         type: string
 *                       location:
 *                         type: string
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       409:
 *         description: 產品代碼已存在
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: 伺服器錯誤
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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
        subtitle,
        category,
        unit,
        purchasePrice,
        sellingPrice,
        description,
        supplier,
        minStock,
        barcode,
        healthInsuranceCode,
        excludeFromStock,
        packageUnits
      } = req.body;

      // 檢查產品代碼是否已存在
      if (code?.trim()) {
        const existingProduct = await BaseProduct.findByCode(code.trim());
        if (existingProduct) {
          res.status(API_CONSTANTS.HTTP_STATUS.CONFLICT).json({
            success: false,
            message: ERROR_MESSAGES.PRODUCT.CODE_EXISTS,
            timestamp: new Date()
          } as ApiResponse);
          return;
        }
      }

      // 根據是否有健保代碼生成產品代碼和判斷產品類型
      const hasHealthInsurance = !!(healthInsuranceCode?.trim());
      const generatedCode = code?.trim() || (await generateProductCodeByHealthInsurance(hasHealthInsurance)).code;
      
      // 根據健保碼自動判斷產品類型
      const autoProductType = hasHealthInsurance ? ProductType.MEDICINE : ProductType.PRODUCT;

      // 創建產品（根據類型決定使用 Product 或 Medicine 模型）
      const ProductModel = autoProductType === ProductType.MEDICINE ? Medicine : Product;
      const productData: any = {
        code: generatedCode,
        shortCode: req.body.shortCode?.trim() ?? '',
        name,
        subtitle,
        category,
        unit,
        purchasePrice: purchasePrice ? parseFloat(purchasePrice) : 0,
        sellingPrice: sellingPrice ? parseFloat(sellingPrice) : 0,
        description,
        supplier,
        minStock: minStock !== undefined ? parseInt(minStock) : 10,
        barcode,
        healthInsuranceCode: healthInsuranceCode?.trim() || '',
        excludeFromStock: excludeFromStock === true || excludeFromStock === 'true',
        productType: autoProductType,
        isActive: true
      };
      
      // 如果是藥品類型，添加健保價格
      if (autoProductType === ProductType.MEDICINE) {
        productData.healthInsurancePrice = req.body.healthInsurancePrice ? parseFloat(req.body.healthInsurancePrice) : 0;
      }
      
      const product = new ProductModel(productData);

      await product.save();

      // 處理包裝單位數據
      if (packageUnits && Array.isArray(packageUnits) && packageUnits.length > 0) {
        try {
          await PackageUnitService.createOrUpdatePackageUnits(product._id.toString(), packageUnits);
        } catch (packageError) {
          console.error('保存包裝單位失敗:', packageError);
          // 不中斷產品創建流程，只記錄錯誤
        }
      }

      // 重新查詢以獲取完整的關聯資料
      const savedProduct = await ProductModel.findById(product._id)
        .populate('category', 'name')
        .populate('supplier', 'name');

      if (!savedProduct) {
        res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: ERROR_MESSAGES.GENERIC.INTERNAL_ERROR,
          timestamp: new Date()
        } as ApiResponse);
        return;
      }

      const successMessage = autoProductType === ProductType.MEDICINE ? '藥品創建成功' : '商品創建成功';
      res.status(API_CONSTANTS.HTTP_STATUS.CREATED).json({
        success: true,
        message: successMessage,
        data: savedProduct,
        timestamp: new Date()
      } as ApiResponse<any>);
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
        subtitle,
        category,
        unit,
        purchasePrice,
        sellingPrice,
        description,
        supplier,
        minStock,
        barcode,
        healthInsuranceCode,
        healthInsurancePrice,
        excludeFromStock,
        packageUnits
      } = req.body;

      if (await checkProductCodeExistence(code, res)) {
        return;
      }

      // 根據是否有健保代碼生成產品代碼
      const hasHealthInsurance = !!(healthInsuranceCode?.trim());
      const generatedCode = code?.trim() || (await generateProductCodeByHealthInsurance(hasHealthInsurance)).code;

      const medicine = new Medicine({
        code: generatedCode,
        shortCode: req.body.shortCode?.trim() ?? '',
        name,
        subtitle,
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
        excludeFromStock: excludeFromStock === true || excludeFromStock === 'true',
        productType: ProductType.MEDICINE,
        isActive: true
      });

      const savedMedicine = await saveAndPopulateMedicine(medicine, res);
      if (!savedMedicine) {
        return; // saveAndPopulateMedicine 已經處理了錯誤響應
      }

      // 處理包裝單位數據
      if (packageUnits && Array.isArray(packageUnits) && packageUnits.length > 0) {
        try {
          await PackageUnitService.createOrUpdatePackageUnits(medicine._id.toString(), packageUnits);
        } catch (packageError) {
          console.error('保存包裝單位失敗:', packageError);
          // 不中斷產品創建流程，只記錄錯誤
        }
      }

      res.status(API_CONSTANTS.HTTP_STATUS.CREATED).json({
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
      
      // 處理健保碼欄位並自動判斷產品類型
      if (updateData.healthInsuranceCode !== undefined) {
        updateData.healthInsuranceCode = updateData.healthInsuranceCode?.trim() ?? '';
        
        // 根據健保碼自動設定產品類型
        const hasHealthInsuranceCode = updateData.healthInsuranceCode?.trim();
        if (hasHealthInsuranceCode) {
          updateData.productType = ProductType.MEDICINE;
        } else {
          updateData.productType = ProductType.PRODUCT;
        }
      }
      
      // 處理條碼欄位
      if (updateData.barcode !== undefined) {
        updateData.barcode = updateData.barcode?.trim() ?? '';
      }
      
      // 處理包裝單位數據
      const { packageUnits, ...productUpdateData } = updateData;
      
      // 更新產品
      const updatedProduct = await BaseProduct.findByIdAndUpdate(
        productId,
        { $set: productUpdateData },
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

      // 處理包裝單位數據
      if (packageUnits && Array.isArray(packageUnits)) {
        try {
          if (packageUnits.length > 0) {
            if (!productId) {
              throw new Error('產品ID不能為空');
            }
            await PackageUnitService.createOrUpdatePackageUnits(productId, packageUnits);
          } else {
            // 如果包裝單位數組為空，刪除現有的包裝單位
            if (!productId) {
              throw new Error('產品ID不能為空');
            }
            await PackageUnitService.deletePackageUnits(productId);
          }
        } catch (packageError) {
          console.error('更新包裝單位失敗:', packageError);
          // 不中斷產品更新流程，只記錄錯誤
        }
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
    
    if (!productId) {
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: '缺少產品ID參數',
        timestamp: new Date()
      } as ApiResponse);
      return;
    }
    
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

// 輔助函數：生成產品代碼（已棄用，請使用 codeGenerator.ts 中的函數）
// async function generateNextProductCode(): Promise<string> {
//   try {
//     // 查詢所有以 P 開頭的商品編號
//     const products = await Product.find({ code: /^P\d+$/ })
//       .select('code')
//       .lean() as unknown as Array<{ code: string }>;
    
//     if (products.length === 0) {
//       return 'P10001';
//     }
    
//     // 提取所有數字部分並找到最大值
//     const numericParts = products
//       .map(product => parseInt(product.code.substring(1), 10))
//       .filter(num => !isNaN(num));
    
//     if (numericParts.length === 0) {
//       return 'P10001';
//     }
    
//     const maxNumericPart = Math.max(...numericParts);
//     return `P${maxNumericPart + 1}`;
//   } catch (error) {
//     console.error('生成產品代碼錯誤:', error);
//     return `P${String(Date.now()).slice(-5)}`;
//   }
// }

// 輔助函數：生成藥品代碼（已棄用，請使用 codeGenerator.ts 中的函數）
// async function generateNextMedicineCode(): Promise<string> {
//   try {
//     // 查詢所有以 M 開頭的藥品編號
//     const medicines = await Medicine.find({ code: /^M\d+$/ })
//       .select('code')
//       .lean() as unknown as Array<{ code: string }>;
    
//     if (medicines.length === 0) {
//       return 'M10001';
//     }
    
//     // 提取所有數字部分並找到最大值
//     const numericParts = medicines
//       .map(medicine => parseInt(medicine.code.substring(1), 10))
//       .filter(num => !isNaN(num));
    
//     if (numericParts.length === 0) {
//       return 'M10001';
//     }
    
//     const maxNumericPart = Math.max(...numericParts);
//     return `M${maxNumericPart + 1}`;
//   } catch (error) {
//     console.error('生成藥品代碼錯誤:', error);
//     return `M${String(Date.now()).slice(-5)}`;
//   }
// }

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
      res.status(API_CONSTANTS.HTTP_STATUS.CONFLICT).json({
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


// @route   PUT api/products/:id/package-units
// @desc    更新產品包裝單位
// @access  Public
router.put('/:id/package-units', async (req: Request, res: Response): Promise<void> => {
  try {
    const productId = req.params.id;
    const { packageUnits } = req.body;

    if (!productId) {
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: '缺少產品ID參數',
        timestamp: new Date()
      } as ApiResponse);
      return;
    }

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

    // 處理包裝單位數據
    try {
      if (packageUnits && Array.isArray(packageUnits)) {
        if (packageUnits.length > 0) {
          await PackageUnitService.createOrUpdatePackageUnits(productId, packageUnits);
        } else {
          // 如果包裝單位數組為空，刪除現有的包裝單位
          await PackageUnitService.deletePackageUnits(productId);
        }
      } else {
        // 如果沒有提供包裝單位數據，刪除現有的包裝單位
        await PackageUnitService.deletePackageUnits(productId);
      }

      // 獲取更新後的包裝單位數據
      const updatedPackageUnits = await PackageUnitService.getProductPackageUnits(productId);

      res.json({
        success: true,
        message: '包裝單位更新成功',
        data: updatedPackageUnits,
        timestamp: new Date()
      } as ApiResponse<any>);
    } catch (packageError) {
      console.error('更新包裝單位失敗:', packageError);
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: '更新包裝單位失敗',
        error: packageError instanceof Error ? packageError.message : '未知錯誤',
        timestamp: new Date()
      } as ApiResponse);
    }
  } catch (err) {
    console.error('更新包裝單位錯誤:', err);
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

// 臨時測試端點：創建測試數據（僅用於開發測試）
router.post('/create-test-data', async (_req: Request, res: Response): Promise<void> => {
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