import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import mongoose from 'mongoose';
// 使用 ES6 import 導入模型
import Sale from '../models/Sale';
import BaseProduct from '../models/BaseProduct';
import Inventory from '../models/Inventory';
import Customer from '../models/Customer';
// 使用 shared 架構的 API 類型
import { ApiResponse, ErrorResponse, SaleCreateRequest } from '@pharmacy-pos/shared/types/api';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@pharmacy-pos/shared/constants';

// 注意：OrderNumberService 目前未使用，但可能在未來的功能中需要
// import OrderNumberService from '../utils/OrderNumberService';
import logger from '../utils/logger';

const router: express.Router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     SaleItem:
 *       type: object
 *       required:
 *         - product
 *         - quantity
 *         - price
 *         - subtotal
 *       properties:
 *         product:
 *           type: string
 *           description: 產品ID
 *         quantity:
 *           type: number
 *           description: 數量
 *         price:
 *           type: number
 *           description: 單價
 *         subtotal:
 *           type: number
 *           description: 小計
 *     Sale:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: 銷售記錄ID
 *         saleNumber:
 *           type: string
 *           description: 銷售單號
 *         customer:
 *           type: string
 *           description: 客戶ID
 *         items:
 *           type: array
 *           description: 銷售項目
 *           items:
 *             $ref: '#/components/schemas/SaleItem'
 *         totalAmount:
 *           type: number
 *           description: 總金額
 *         discount:
 *           type: number
 *           description: 折扣金額
 *           default: 0
 *         paymentMethod:
 *           type: string
 *           description: 支付方式
 *           enum: [cash, credit_card, debit_card, mobile_payment, other, transfer, card]
 *           default: cash
 *         paymentStatus:
 *           type: string
 *           description: 支付狀態
 *           enum: [paid, pending, partial, cancelled]
 *           default: paid
 *         note:
 *           type: string
 *           description: 備註
 *         cashier:
 *           type: string
 *           description: 收銀員ID
 *         date:
 *           type: string
 *           format: date-time
 *           description: 銷售日期
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: 創建時間
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: 更新時間
 */

/**
 * 驗證 MongoDB ObjectId 是否有效
 * 防止 NoSQL 注入攻擊
 */
function isValidObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * 使用 aggregation 進行萬用字元搜尋，支援關聯資料搜尋
 * 支援 * (任意字串) 和 ? (單一字元) 萬用字元
 */
async function performWildcardSearch(wildcardSearch: string): Promise<any[]> {
  if (!wildcardSearch || wildcardSearch.trim() === '') {
    return [];
  }

  // 清理輸入，防止 ReDoS 攻擊
  const cleanSearch = wildcardSearch.trim().substring(0, 100); // 限制長度
  
  // 將萬用字元轉換為正規表達式
  // 支援 *, ?, [字元類別] 語法
  let regexPattern = cleanSearch;
  
  // 先處理字元類別 [...]，避免被跳脫
  const characterClassRegex = /\[([^\]]+)\]/g;
  const characterClasses: string[] = [];
  let classIndex = 0;
  
  // 暫時替換字元類別為佔位符
  regexPattern = regexPattern.replace(characterClassRegex, (_match, content) => {
    const placeholder = `__CHAR_CLASS_${classIndex}__`;
    characterClasses[classIndex] = `[${content}]`;
    classIndex++;
    return placeholder;
  });
  
  // 跳脫其他正規表達式特殊字元，但保留 * 和 ?
  regexPattern = regexPattern
    .replace(/[.+^${}()|\\]/g, '\\$&') // 跳脫正規表達式特殊字元（不包含 []）
    .replace(/\*/g, '.*') // * 轉換為 .*
    .replace(/\?/g, '.'); // ? 轉換為 .
  
  // 還原字元類別
  characterClasses.forEach((charClass, index) => {
    const placeholder = `__CHAR_CLASS_${index}__`;
    regexPattern = regexPattern.replace(placeholder, charClass);
  });

  try {
    const searchRegex = new RegExp(regexPattern, 'i');
    
    // 使用 aggregation 進行複雜搜尋
    const pipeline: any[] = [
      // 1. 關聯客戶資料
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customerData'
        }
      },
      // 2. 關聯產品資料
      {
        $lookup: {
          from: 'baseproducts',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productData'
        }
      },
      // 3. 關聯收銀員資料
      {
        $lookup: {
          from: 'users',
          localField: 'cashier',
          foreignField: '_id',
          as: 'cashierData'
        }
      },
      // 4. 搜尋條件
      {
        $match: {
          $or: [
            { saleNumber: searchRegex },
            { note: searchRegex },
            { 'customerData.name': searchRegex },
            { 'productData.name': searchRegex }
          ]
        }
      },
      // 5. 重組資料結構，模擬 populate() 的效果
      {
        $addFields: {
          // 填充客戶資料
          customer: {
            $cond: {
              if: { $gt: [{ $size: '$customerData' }, 0] },
              then: { $arrayElemAt: ['$customerData', 0] },
              else: '$customer'
            }
          },
          // 填充收銀員資料
          cashier: {
            $cond: {
              if: { $gt: [{ $size: '$cashierData' }, 0] },
              then: { $arrayElemAt: ['$cashierData', 0] },
              else: '$cashier'
            }
          },
          // 重組 items 陣列，填充產品資料
          items: {
            $map: {
              input: '$items',
              as: 'item',
              in: {
                $mergeObjects: [
                  '$$item',
                  {
                    product: {
                      $let: {
                        vars: {
                          matchedProduct: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: '$productData',
                                  cond: { $eq: ['$$this._id', '$$item.product'] }
                                }
                              },
                              0
                            ]
                          }
                        },
                        in: {
                          $cond: {
                            if: { $ne: ['$$matchedProduct', null] },
                            then: '$$matchedProduct',
                            else: '$$item.product'
                          }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      },
      // 6. 清理臨時欄位
      {
        $project: {
          customerData: 0,
          productData: 0,
          cashierData: 0
        }
      },
      // 7. 排序
      {
        $sort: { saleNumber: -1 as 1 | -1 }
      }
    ];

    const results = await Sale.aggregate(pipeline);
    return results;
  } catch (error) {
    logger.error(`萬用字元搜尋 aggregation 錯誤: ${(error as Error).message}`);
    return [];
  }
}

/**
 * 使用 aggregation 進行普通搜尋，支援關聯資料搜尋
 * 不進行萬用字元轉換，直接使用正規表達式搜尋
 */
async function performRegularSearch(searchTerm: string): Promise<any[]> {
  if (!searchTerm || searchTerm.trim() === '') {
    return [];
  }

  // 清理輸入，防止 ReDoS 攻擊
  const cleanSearch = searchTerm.trim().substring(0, 100); // 限制長度
  
  try {
    // 直接使用正規表達式，不進行萬用字元轉換
    const searchRegex = new RegExp(cleanSearch, 'i');
    
    // 使用與萬用字元搜尋相同的 aggregation pipeline
    const pipeline: any[] = [
      // 1. 關聯客戶資料
      {
        $lookup: {
          from: 'customers',
          localField: 'customer',
          foreignField: '_id',
          as: 'customerData'
        }
      },
      // 2. 關聯產品資料
      {
        $lookup: {
          from: 'baseproducts',
          localField: 'items.product',
          foreignField: '_id',
          as: 'productData'
        }
      },
      // 3. 關聯收銀員資料
      {
        $lookup: {
          from: 'users',
          localField: 'cashier',
          foreignField: '_id',
          as: 'cashierData'
        }
      },
      // 4. 搜尋條件
      {
        $match: {
          $or: [
            { saleNumber: searchRegex },
            { note: searchRegex },
            { 'customerData.name': searchRegex },
            { 'productData.name': searchRegex }
          ]
        }
      },
      // 5. 重組資料結構，模擬 populate() 的效果
      {
        $addFields: {
          // 填充客戶資料
          customer: {
            $cond: {
              if: { $gt: [{ $size: '$customerData' }, 0] },
              then: { $arrayElemAt: ['$customerData', 0] },
              else: '$customer'
            }
          },
          // 填充收銀員資料
          cashier: {
            $cond: {
              if: { $gt: [{ $size: '$cashierData' }, 0] },
              then: { $arrayElemAt: ['$cashierData', 0] },
              else: '$cashier'
            }
          },
          // 重組 items 陣列，填充產品資料
          items: {
            $map: {
              input: '$items',
              as: 'item',
              in: {
                $mergeObjects: [
                  '$$item',
                  {
                    product: {
                      $let: {
                        vars: {
                          matchedProduct: {
                            $arrayElemAt: [
                              {
                                $filter: {
                                  input: '$productData',
                                  cond: { $eq: ['$$this._id', '$$item.product'] }
                                }
                              },
                              0
                            ]
                          }
                        },
                        in: {
                          $cond: {
                            if: { $ne: ['$$matchedProduct', null] },
                            then: '$$matchedProduct',
                            else: '$$item.product'
                          }
                        }
                      }
                    }
                  }
                ]
              }
            }
          }
        }
      },
      // 6. 清理臨時欄位
      {
        $project: {
          customerData: 0,
          productData: 0,
          cashierData: 0
        }
      },
      // 7. 排序
      {
        $sort: { saleNumber: -1 as 1 | -1 }
      }
    ];

    const results = await Sale.aggregate(pipeline);
    return results;
  } catch (error) {
    logger.error(`普通搜尋 aggregation 錯誤: ${(error as Error).message}`);
    return [];
  }
}

// 型別定義
// 使用 shared 的 SaleCreateRequest，並擴展本地需要的欄位
interface SaleCreationRequest extends SaleCreateRequest {
  productName?: string; // 向後兼容
  finalAmount?: number;
  cashier?: string;
}

// 定義更具體的型別
// 使用 Record<string, any> 來避免 _id 型別衝突
type SaleDocument = mongoose.Document & Record<string, any>;

interface ValidationResult {
  success: boolean;
  statusCode?: number;
  message?: string;
  sale?: SaleDocument;
}

interface CustomerCheckResult {
  exists: boolean;
  error?: ValidationResult;
}

interface ProductCheckResult {
  exists: boolean;
  product?: mongoose.Document;
  error?: ValidationResult;
}

interface InventoryCheckResult {
  success: boolean;
  error?: ValidationResult;
}

// 定義錯誤型別
// interface MongooseError extends Error {
//   kind?: string;
// }

/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: 獲取所有銷售記錄
 *     description: 獲取所有銷售記錄，支援搜尋和萬用字元搜尋
 *     tags: [Sales]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: 搜尋關鍵字
 *       - in: query
 *         name: wildcardSearch
 *         schema:
 *           type: string
 *         description: 萬用字元搜尋（支援 * 和 ? 萬用字元）
 *     responses:
 *       200:
 *         description: 成功獲取銷售記錄列表
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
 *                   example: 操作成功
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Sale'
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
// @route   GET api/sales
// @desc    Get all sales with optional wildcard search
// @access  Public
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, wildcardSearch } = req.query;
    
    let sales: any[] = [];
    
    // 如果有萬用字元搜尋參數
    if (wildcardSearch && typeof wildcardSearch === 'string') {
      sales = await performWildcardSearch(wildcardSearch);
    }
    // 如果有一般搜尋參數（向後兼容）
    else if (search && typeof search === 'string') {
      sales = await performRegularSearch(search);
    }
    // 沒有搜尋參數，返回所有記錄
    else {
      sales = await Sale.find()
        .populate('customer')
        .populate('items.product')
        .populate('cashier')
        .sort({ saleNumber: -1 });
    }
    
    // 使用型別斷言解決型別不匹配問題
    const response: ApiResponse<any[]> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      data: sales.map(sale => ({
        ...sale.toObject ? sale.toObject() : sale,
        _id: sale._id.toString(),
        createdAt: sale.createdAt,
        updatedAt: sale.updatedAt
      })),
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err: unknown) {
    logger.error(`創建銷售記錄錯誤: ${err instanceof Error ? err.message : 'Unknown error'}`);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(500).json(errorResponse);
  }
});

/**
 * @swagger
 * /api/sales/{id}:
 *   get:
 *     summary: 獲取單個銷售記錄
 *     description: 根據ID獲取單個銷售記錄的詳細信息
 *     tags: [Sales]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 銷售記錄ID
 *     responses:
 *       200:
 *         description: 成功獲取銷售記錄
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
 *                   example: 操作成功
 *                 data:
 *                   $ref: '#/components/schemas/Sale'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: 找不到銷售記錄
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
// @route   GET api/sales/:id
// @desc    Get sale by ID
// @access  Public
router.get('/:id', async (req: Request, res: Response) => {
  try {
    // 驗證 ID 參數存在性和格式
    if (!req.params.id) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(404).json(errorResponse);
      return;
    }

    // 驗證 ID 格式，防止 NoSQL 注入
    if (!isValidObjectId(req.params.id)) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(404).json(errorResponse);
      return;
    }

    const sale = await Sale.findById(req.params.id)
      .populate('customer')
      .populate({
        path: 'items.product',
        model: 'baseproduct'
      })
      .populate('cashier');
      
    if (!sale) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(404).json(errorResponse);
      return;
    }
    
    // 使用型別斷言解決型別不匹配問題
    const response: ApiResponse<any> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      data: {
        ...sale.toObject(),
        _id: sale._id.toString(),
        createdAt: sale.createdAt,
        updatedAt: sale.updatedAt
      },
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err: unknown) {
    logger.error(`獲取單個銷售記錄錯誤: ${err instanceof Error ? err.message : 'Unknown error'}`);
    if (err instanceof Error && err.name === 'CastError') {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(404).json(errorResponse);
      return;
    }
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(500).json(errorResponse);
  }
});

/**
 * @swagger
 * /api/sales:
 *   post:
 *     summary: 創建銷售記錄
 *     description: 創建新的銷售記錄
 *     tags: [Sales]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - totalAmount
 *             properties:
 *               saleNumber:
 *                 type: string
 *                 description: 銷售單號（如果不提供將自動生成）
 *               customer:
 *                 type: string
 *                 description: 客戶ID
 *               items:
 *                 type: array
 *                 description: 銷售項目
 *                 items:
 *                   type: object
 *                   required:
 *                     - product
 *                     - quantity
 *                   properties:
 *                     product:
 *                       type: string
 *                       description: 產品ID
 *                     quantity:
 *                       type: number
 *                       description: 數量
 *                     price:
 *                       type: number
 *                       description: 單價
 *                     unitPrice:
 *                       type: number
 *                       description: 單位價格
 *                     discount:
 *                       type: number
 *                       description: 折扣
 *                     subtotal:
 *                       type: number
 *                       description: 小計
 *               totalAmount:
 *                 type: number
 *                 description: 總金額
 *               discount:
 *                 type: number
 *                 description: 折扣金額
 *               paymentMethod:
 *                 type: string
 *                 description: 支付方式
 *                 enum: [cash, credit_card, debit_card, mobile_payment, other, transfer, card]
 *               paymentStatus:
 *                 type: string
 *                 description: 支付狀態
 *                 enum: [paid, pending, partial, cancelled]
 *               note:
 *                 type: string
 *                 description: 備註
 *               cashier:
 *                 type: string
 *                 description: 收銀員ID
 *     responses:
 *       200:
 *         description: 銷售記錄創建成功
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
 *                   example: 已創建
 *                 data:
 *                   $ref: '#/components/schemas/Sale'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: 請求參數錯誤
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
// @route   POST api/sales
// @desc    Create a sale
// @access  Public
router.post(
  '/',
  [
    check('items', '至少需要一個銷售項目').isArray({ min: 1 }),
    check('totalAmount', '總金額為必填項').isNumeric()
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
      res.status(400).json(errorResponse);
      return;
    }
    
    try {
      // 1. 驗證請求和檢查記錄
      const validationResult = await validateSaleCreationRequest(req.body as SaleCreationRequest);
      if (!validationResult.success) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: validationResult.message || ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
          timestamp: new Date()
        };
        res.status(validationResult.statusCode || 400).json(errorResponse);
      return;
      }
      
      // 2. 創建銷售記錄
      const sale = await createSaleRecord(req.body as SaleCreationRequest);
      
      // 3. 處理庫存變更
      await handleInventoryForNewSale(sale);
      
      // 4. 處理客戶積分
      await updateCustomerPoints(sale);
      
      // 使用型別斷言解決型別不匹配問題
      const response: ApiResponse<any> = {
        success: true,
        message: SUCCESS_MESSAGES.GENERIC.CREATED,
        data: {
          ...sale.toObject(),
          _id: (sale._id as any).toString(),
          createdAt: sale.createdAt,
          updatedAt: sale.updatedAt
        },
        timestamp: new Date()
      };
      
      
      res.json(response);
    } catch (err: unknown) {
      logger.error(`獲取所有銷售記錄錯誤: ${err instanceof Error ? err.message : 'Unknown error'}`);
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
        timestamp: new Date()
      };
      res.status(500).json(errorResponse);
    }
  }
);

// 檢查客戶是否存在
async function checkCustomerExists(customerId?: string): Promise<CustomerCheckResult> {
  if (!customerId) return { exists: true };
  
  // 驗證 ID 格式，防止 NoSQL 注入
  if (!isValidObjectId(customerId)) {
    return {
      exists: false,
      error: {
        success: false,
        statusCode: 404,
        message: '客戶ID格式無效'
      }
    };
  }
  
  const customerExists = await Customer.findById(customerId);
  if (!customerExists) {
    return { 
      exists: false, 
      error: { 
        success: false, 
        statusCode: 404, 
        message: '客戶不存在' 
      }
    };
  }
  
  return { exists: true };
}

// 檢查產品是否存在
async function checkProductExists(productId: string): Promise<ProductCheckResult> {
  // 驗證 ID 格式，防止 NoSQL 注入
  if (!isValidObjectId(productId)) {
    return {
      exists: false,
      error: {
        success: false,
        statusCode: 404,
        message: `產品ID ${productId} 格式無效`
      }
    };
  }
  
  const product = await BaseProduct.findById(productId);
  if (!product) {
    return { 
      exists: false, 
      error: { 
        success: false, 
        statusCode: 404, 
        message: `產品ID ${productId} 不存在` 
      }
    };
  }
  
  return { exists: true, product };
}

// 檢查產品庫存
async function checkProductInventory(product: mongoose.Document, quantity: number): Promise<InventoryCheckResult> {
  try {
    // 確保 _id 是有效的 ObjectId
    if (!isValidObjectId((product._id as any).toString())) {
      return {
        success: false,
        error: {
          success: false,
          statusCode: 400,
          message: '產品ID格式無效'
        }
      };
    }
    
    // 安全地訪問產品屬性
    const productDoc = product as any;
    
    // 檢查產品是否設定為「不扣庫存」
    if (productDoc.excludeFromStock === true) {
      logger.debug(`產品 ${productDoc.name ?? '未知'} 設定為不扣庫存，跳過庫存檢查`);
      return { success: true };
    }
    
    // 獲取所有庫存記錄
    const inventories = await Inventory.find({ product: product._id }).lean();
    logger.debug(`找到 ${inventories.length} 個庫存記錄`);
    
    // 計算總庫存量
    let totalQuantity = calculateTotalInventory(inventories);
    
    logger.debug(`產品 ${productDoc.name ?? '未知'} 總庫存量: ${totalQuantity}，銷售數量: ${quantity}`);
    
    // 不再檢查庫存是否足夠，允許負庫存
    if (totalQuantity < quantity) {
      logger.warn(`產品 ${(product as any).name ?? '未知'} 庫存不足，當前總庫存: ${totalQuantity}，需求: ${quantity}，將允許負庫存`);
    }
    
    return { success: true };
  } catch (err: unknown) {
    logger.error(`庫存檢查錯誤: ${err instanceof Error ? err.message : '未知錯誤'}`);
    return {
      success: false,
      error: {
        success: false,
        statusCode: 500,
        message: `庫存檢查錯誤: ${err instanceof Error ? err.message : '未知錯誤'}`
      }
    };
  }
}

// 計算總庫存量
// interface InventoryRecord {
//   _id: mongoose.Types.ObjectId | string;
//   quantity: number;
//   type?: string;
// }

function calculateTotalInventory(inventories: any[]): number {
  let totalQuantity = 0;
  for (const inv of inventories) {
    totalQuantity += inv.quantity;
    // 安全地處理 _id，可能是 ObjectId 或字串
    let recordId = '未知';
    if (inv._id) {
      // 提取三元運算符為獨立語句，提高可讀性
      if (typeof inv._id === 'object') {
        recordId = inv._id.toString();
      } else {
        recordId = inv._id;
      }
    }
    logger.debug(`庫存記錄: ${recordId}, 類型: ${inv.type ?? 'purchase'}, 數量: ${inv.quantity}`);
  }
  return totalQuantity;
}

// 驗證銷售創建請求
async function validateSaleCreationRequest(requestBody: SaleCreationRequest): Promise<ValidationResult> {
  const { customer, items } = requestBody;
  
  // 檢查客戶是否存在
  const customerCheck = await checkCustomerExists(customer);
  if (!customerCheck.exists && customerCheck.error) {
    return customerCheck.error;
  }
  
  // 檢查所有產品是否存在
  for (const item of items) {
    // 檢查產品是否存在
    const productCheck = await checkProductExists(item.product);
    if (!productCheck.exists && productCheck.error) {
      return productCheck.error;
    }
    
    // 記錄當前庫存量，但不限制負庫存
    // 安全地訪問產品名稱，避免使用非空斷言
    const productName = productCheck.product && 'name' in productCheck.product
      ? (productCheck.product as any).name
      : '未知產品';
    logger.debug(`檢查產品ID: ${item.product}, 名稱: ${productName}`);
    
    // 檢查產品庫存
    if (productCheck.product) {
      const inventoryCheck = await checkProductInventory(productCheck.product, item.quantity);
      if (!inventoryCheck.success && inventoryCheck.error) {
        return inventoryCheck.error;
      }
    }
  }
  
  return { success: true };
}

// 創建銷售記錄
async function createSaleRecord(requestBody: SaleCreationRequest): Promise<SaleDocument> {
  // 生成銷貨單號（如果未提供）
  const finalSaleNumber = await generateSaleNumber(requestBody.saleNumber);
  
  // 確保銷貨單號不為空
  if (!finalSaleNumber) {
    logger.error('無法生成有效的銷貨單號');
    throw new Error('無法生成有效的銷貨單號');
  }
  
  // 建立銷售記錄
  const saleData = {
    saleNumber: finalSaleNumber,
    customer: requestBody.customer,
    items: requestBody.items,
    totalAmount: requestBody.totalAmount || 0,
    discount: requestBody.discount,
    paymentMethod: requestBody.paymentMethod,
    paymentStatus: requestBody.paymentStatus,
    notes: requestBody.notes,
    cashier: requestBody.cashier
  };
  
  const saleFields = buildSaleFields({
    saleNumber: saleData.saleNumber,
    customer: saleData.customer || '',
    items: saleData.items,
    totalAmount: saleData.totalAmount,
    discount: saleData.discount || 0,
    paymentMethod: saleData.paymentMethod,
    paymentStatus: saleData.paymentStatus || 'pending',
    notes: saleData.notes || '',
    cashier: saleData.cashier || ''
  });

  const sale = new Sale(saleFields);
  await sale.save();
  return sale;
}

// 生成銷貨單號
async function generateSaleNumber(saleNumber?: string): Promise<string> {
  // 如果前端提供了銷貨單號，記錄但不使用它
  if (saleNumber && saleNumber.trim() !== '') {
    //logger.debug(`前端提供了銷貨單號: "${saleNumber}"，但將被忽略以確保序號連續性`);
  }

  //logger.debug(`由後端生成銷貨單號`);

  try {
    // 生成日期前綴（YYYYMMDD）
    const today = new Date();
    const year = today.getFullYear().toString();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // 月份從0開始，需要+1
    const day = String(today.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;
    
    //logger.debug(`生成日期前綴: ${datePrefix}`);

    // 查詢數據庫中以該日期前綴開頭的所有銷貨單號
    const regexPattern = `^${datePrefix}\\d{3}$`; // 匹配格式: YYYYMMDD + 3位數字
    const query = { saleNumber: { $regex: new RegExp(regexPattern) } };
    //logger.debug(`查詢當日銷貨單號，日期前綴: ${datePrefix}, 正則表達式: ${regexPattern}`);
    
    // 先獲取所有匹配的銷貨單號，以便記錄日誌
    const allSales = await Sale.find(query).lean();
    //logger.debug(`找到 ${allSales.length} 個匹配的銷貨單號`);
    
    // 記錄所有找到的銷貨單號，以便分析
    if (allSales.length > 0) {
      // const allSaleNumbers = allSales.map(sale => sale.saleNumber);
      //logger.debug(`所有匹配的銷貨單號: ${JSON.stringify(allSaleNumbers)}`);
    }
    
    // 按銷貨單號降序排序，找出最大的一個
    const latestSales = await Sale.find(query)
      .sort({ saleNumber: -1 })
      .limit(1)
      .lean();
    
    // 設置默認序號
    let sequenceNumber = 1;
    
    // 如果找到了當天的銷貨單號，提取序號部分並加1
    if (latestSales.length > 0 && latestSales[0] && latestSales[0].saleNumber) {
      const latestSaleNumber = latestSales[0].saleNumber;
      //logger.debug(`找到當天最後一個銷貨單號: ${latestSaleNumber}`);
      
      // 提取序號部分（最後3位）
      const sequencePart = latestSaleNumber.slice(-3);
      const sequence = parseInt(sequencePart, 10);
      
      if (!isNaN(sequence)) {
        sequenceNumber = sequence + 1;
        //logger.debug(`提取序號: ${sequence}, 新序號: ${sequenceNumber}`);
      } else {
        logger.warn(`無法從銷貨單號 ${latestSaleNumber} 提取有效序號，使用默認值1`);
      }
    } else {
      logger.debug(`未找到當天銷貨單號，使用起始序號1`);
    }
    
    // 嘗試使用數字排序而不是字典序排序
    if (allSales.length > 1) {
      // 提取所有序號並按數字大小排序
      const allSequences = allSales.map(sale => {
        // 確保 sale.saleNumber 存在
        if (sale && sale.saleNumber) {
          const sequencePart = sale.saleNumber.slice(-3);
          return parseInt(sequencePart, 10);
        }
        return NaN; // 如果 saleNumber 不存在，返回 NaN
      }).filter(seq => !isNaN(seq));
      
      if (allSequences.length > 0) {
        // 找出最大序號
        const maxSequence = Math.max(...allSequences);
        //logger.debug(`使用數字排序找到的最大序號: ${maxSequence}`);
        
        // 比較兩種方法找到的最大序號
        if (maxSequence + 1 !== sequenceNumber) {
          logger.warn(`警告：兩種方法找到的最大序號不一致！字典序: ${sequenceNumber - 1}, 數字排序: ${maxSequence}`);
          // 使用數字排序找到的最大序號
          sequenceNumber = maxSequence + 1;
          //logger.debug(`使用數字排序的結果，新序號: ${sequenceNumber}`);
        }
      }
    }
    
    // 確保序號不超過3位數
    if (sequenceNumber > 999) {
      logger.warn(`序號 ${sequenceNumber} 超過3位數限制，重置為1`);
      sequenceNumber = 1;
    }
    
    // 格式化序號為3位數（例如：001, 010, 100）
    const formattedSequence = String(sequenceNumber).padStart(3, '0');
    
    // 組合最終銷貨單號
    const finalSaleNumber = `${datePrefix}${formattedSequence}`;
    
    logger.debug(`生成銷貨單號: ${finalSaleNumber}`);
    
    return finalSaleNumber;
  } catch (error) {
    logger.error(`生成銷貨單號時出錯: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error('系統無法生成銷貨單號，請稍後再試');
  }
}

// 建立銷售記錄欄位
// 更靈活的銷售項目型別
interface SaleItemInput {
  product: string;
  quantity: number;
  price?: number;
  unitPrice?: number;
  discount?: number;
  subtotal?: number;
  notes?: string;
}

interface SaleFieldsInput {
  saleNumber: string;
  customer?: string;
  items: SaleItemInput[];
  totalAmount: number;
  discount?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  notes?: string;
  cashier?: string;
}

function buildSaleFields(saleData: SaleFieldsInput): Record<string, any> {
  // Ensure saleNumber is never empty to prevent duplicate key errors
  if (!saleData.saleNumber) {
    logger.error('嘗試創建銷售記錄時銷貨單號為空');
    throw new Error('Sale number cannot be empty');
  }
  
  const saleFields: Record<string, any> = {
    saleNumber: saleData.saleNumber,
    items: saleData.items,
    totalAmount: saleData.totalAmount,
  };
  
  if (saleData.customer) saleFields.customer = saleData.customer;
  if (saleData.discount) saleFields.discount = saleData.discount;
  if (saleData.paymentMethod) saleFields.paymentMethod = saleData.paymentMethod as any;
  if (saleData.paymentStatus) saleFields.paymentStatus = saleData.paymentStatus as any;
  if (saleData.notes) saleFields.notes = saleData.notes;
  if (saleData.cashier) saleFields.cashier = saleData.cashier;
  
  // 計算最終金額
  saleFields.finalAmount = saleFields.totalAmount - (saleFields.discount ?? 0);
  
  return saleFields;
}

// 處理新銷售的庫存變更
async function handleInventoryForNewSale(sale: SaleDocument): Promise<void> {
  // 為每個銷售項目創建負數庫存記錄
  if (!sale.items || !Array.isArray(sale.items)) {
    logger.error('銷售記錄缺少有效的項目陣列');
    return;
  }
  
  const items = sale.items as any[];
  for (const item of items) {
    try {
      await createInventoryRecord(item, sale);
    } catch (err) {
      logger.error(`處理庫存記錄時出錯: ${err instanceof Error ? err.message : '未知錯誤'}`);
      // 繼續處理其他項目，不中斷流程
    }
  }
}

// 創建庫存記錄
interface SaleItem {
  product: string | mongoose.Types.ObjectId;
  quantity: number;
  subtotal?: number;
}

async function createInventoryRecord(item: SaleItem, sale: SaleDocument): Promise<void> {
  // 確保產品ID有效
  if (!item.product) {
    logger.error('銷售項目缺少產品ID');
    return;
  }
  
  // 確保數量有效
  if (typeof item.quantity !== 'number') {
    logger.error(`產品 ${item.product} 的數量無效`);
    return;
  }

  // 檢查產品是否設定為「不扣庫存」
  try {
    const product = await BaseProduct.findById(item.product);
    if (!product) {
      logger.error(`找不到產品ID: ${item.product}`);
      return;
    }

    const productDoc = product as any;
    if (productDoc.excludeFromStock === true) {
      // 為「不扣庫存」產品創建特殊的庫存記錄，用於毛利計算
      await createNoStockSaleRecord(item, sale, productDoc);
      return;
    }
  } catch (err) {
    logger.error(`檢查產品 ${item.product} 的不扣庫存設定時出錯: ${(err as Error).message}`);
    // 如果檢查失敗，為了安全起見，仍然創建庫存記錄
  }

  const inventoryRecord = new Inventory({
    product: item.product,
    quantity: -item.quantity, // 負數表示庫存減少
    totalAmount: Number(item.subtotal), // 添加totalAmount字段
    saleNumber: sale.saleNumber, // 添加銷貨單號
    type: 'sale',
    saleId: sale._id,
    lastUpdated: new Date()
  });
  
  await inventoryRecord.save();
  logger.debug(`為產品 ${item.product} 創建銷售庫存記錄，數量: -${item.quantity}, 總金額: ${item.subtotal || 0}`);
}

// 為「不扣庫存」產品創建特殊的銷售記錄
async function createNoStockSaleRecord(item: SaleItem, sale: SaleDocument, product: any): Promise<void> {
  try {
    // 計算單價（售價）
    const unitPrice = item.subtotal ? item.subtotal / item.quantity : 0;
    
    // 獲取產品的進價（成本價）
    const costPrice = product.purchasePrice || 0;
    
    // 計算毛利：數量 × (售價 - 進價)
    const grossProfit = item.quantity * (unitPrice - costPrice);
    
    // 創建特殊的庫存記錄，用於毛利計算
    const inventoryRecord = new Inventory({
      product: item.product,
      quantity: item.quantity, // 保持實際銷售數量，不扣庫存的邏輯在 FIFO 計算時處理
      totalAmount: Number(item.subtotal), // 銷售總額
      saleNumber: sale.saleNumber,
      type: 'sale-no-stock', // 特殊類型標記
      saleId: sale._id,
      lastUpdated: new Date(),
      // 添加毛利計算相關欄位
      costPrice: costPrice,
      unitPrice: unitPrice,
      grossProfit: grossProfit
    });
    
    await inventoryRecord.save();
    logger.debug(`為不扣庫存產品 ${product.name ?? '未知'} 創建毛利記錄，數量: ${item.quantity}, 售價: ${unitPrice}, 進價: ${costPrice}, 毛利: ${grossProfit}`);
  } catch (err) {
    logger.error(`創建不扣庫存產品的毛利記錄時出錯: ${(err as Error).message}`);
  }
}

// 更新客戶積分
async function updateCustomerPoints(sale: SaleDocument): Promise<void> {
  // 如果有客戶，更新客戶積分
  if (!sale.customer) return;
  
  // 驗證客戶ID格式，防止 NoSQL 注入
  if (!isValidObjectId(sale.customer.toString())) {
    logger.error(`客戶ID格式無效: ${sale.customer}`);
    return;
  }
  
  const customerToUpdate = await Customer.findOne({ _id: sale.customer });
  if (!customerToUpdate) return;
  
  // 更新客戶總購買金額
  customerToUpdate.totalPurchases = (customerToUpdate.totalPurchases ?? 0) + sale.totalAmount;
  customerToUpdate.lastPurchaseDate = new Date();
  await customerToUpdate.save();
  
  logger.debug(`為客戶 ${customerToUpdate._id} 更新購買記錄，金額: ${sale.totalAmount}`);
}

/**
 * @swagger
 * /api/sales/{id}:
 *   put:
 *     summary: 更新銷售記錄
 *     description: 根據ID更新銷售記錄
 *     tags: [Sales]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 銷售記錄ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customer:
 *                 type: string
 *                 description: 客戶ID
 *               items:
 *                 type: array
 *                 description: 銷售項目
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                       description: 產品ID
 *                     quantity:
 *                       type: number
 *                       description: 數量
 *                     price:
 *                       type: number
 *                       description: 單價
 *                     unitPrice:
 *                       type: number
 *                       description: 單位價格
 *                     discount:
 *                       type: number
 *                       description: 折扣
 *                     subtotal:
 *                       type: number
 *                       description: 小計
 *               totalAmount:
 *                 type: number
 *                 description: 總金額
 *               discount:
 *                 type: number
 *                 description: 折扣金額
 *               paymentMethod:
 *                 type: string
 *                 description: 支付方式
 *                 enum: [cash, credit_card, debit_card, mobile_payment, other, transfer, card]
 *               paymentStatus:
 *                 type: string
 *                 description: 支付狀態
 *                 enum: [paid, pending, partial, cancelled]
 *               note:
 *                 type: string
 *                 description: 備註
 *               cashier:
 *                 type: string
 *                 description: 收銀員ID
 *     responses:
 *       200:
 *         description: 銷售記錄更新成功
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
 *                   example: 已更新
 *                 data:
 *                   $ref: '#/components/schemas/Sale'
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: 找不到銷售記錄
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
// @route   PUT api/sales/:id
// @desc    Update a sale
// @access  Public
router.put('/:id', async (req: Request, res: Response) => {
  try {
    // 驗證 ID 參數存在性
    if (!req.params.id) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(404).json(errorResponse);
      return;
    }

    // 驗證 ID 格式，防止 NoSQL 注入
    if (!isValidObjectId(req.params.id)) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(404).json(errorResponse);
      return;
    }

    // 檢查銷售記錄是否存在
    const existingSale = await Sale.findById(req.params.id);
    if (!existingSale) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(404).json(errorResponse);
      return;
    }

    // 驗證更新請求
    const validationResult = await validateSaleUpdateRequest(req.body as SaleCreationRequest);
    if (!validationResult.success) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: validationResult.message || ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
        timestamp: new Date()
      };
      res.status(validationResult.statusCode || 400).json(errorResponse);
      return;
    }

    // 更新銷售記錄
    const updatedSale = await updateSaleRecord(req.params.id, req.body as SaleCreationRequest, existingSale);

    // 處理庫存變更（如果項目有變化）
    await handleInventoryForUpdatedSale(existingSale, updatedSale);

    // 重新填充關聯資料
    const populatedSale = await Sale.findById(updatedSale._id)
      .populate('customer')
      .populate({
        path: 'items.product',
        model: 'baseproduct'
      })
      .populate('cashier');

    if (!populatedSale) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(404).json(errorResponse);
      return;
    }

    const response: ApiResponse<any> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.UPDATED,
      data: {
        ...populatedSale.toObject(),
        _id: populatedSale._id.toString(),
        createdAt: populatedSale.createdAt,
        updatedAt: populatedSale.updatedAt
      },
      timestamp: new Date()
    };


    res.json(response);
  } catch (err: unknown) {
    logger.error(`更新銷售記錄失敗: ${err instanceof Error ? err.message : 'Unknown error'}`);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(500).json(errorResponse);
  }
});

// 驗證銷售更新請求
async function validateSaleUpdateRequest(requestBody: SaleCreationRequest): Promise<ValidationResult> {
  const { customer, items } = requestBody;
  
  // 檢查客戶是否存在
  const customerCheck = await checkCustomerExists(customer);
  if (!customerCheck.exists && customerCheck.error) {
    return customerCheck.error;
  }
  
  // 檢查所有產品是否存在
  for (const item of items) {
    const productCheck = await checkProductExists(item.product);
    if (!productCheck.exists && productCheck.error) {
      return productCheck.error;
    }
  }
  
  return { success: true };
}

// 更新銷售記錄
async function updateSaleRecord(saleId: string, requestBody: SaleCreationRequest, existingSale: SaleDocument): Promise<SaleDocument> {
  // 保持原有的銷貨單號
  const saleData = {
    saleNumber: existingSale.saleNumber, // 保持原有銷貨單號
    customer: requestBody.customer,
    items: requestBody.items,
    totalAmount: requestBody.totalAmount || 0,
    discount: requestBody.discount,
    paymentMethod: requestBody.paymentMethod,
    paymentStatus: requestBody.paymentStatus,
    notes: requestBody.notes,
    cashier: requestBody.cashier
  };
  
  const saleFields = buildSaleFields({
    saleNumber: saleData.saleNumber,
    customer: saleData.customer || '',
    items: saleData.items,
    totalAmount: saleData.totalAmount,
    discount: saleData.discount || 0,
    paymentMethod: saleData.paymentMethod,
    paymentStatus: saleData.paymentStatus || 'pending',
    notes: saleData.notes || '',
    cashier: saleData.cashier || ''
  });
  
  // 更新銷售記錄
  const updatedSale = await Sale.findByIdAndUpdate(
    saleId,
    { $set: saleFields },
    { new: true, runValidators: true }
  );
  
  if (!updatedSale) {
    throw new Error('更新銷售記錄失敗');
  }
  
  return updatedSale;
}

// 處理更新銷售的庫存變更
async function handleInventoryForUpdatedSale(originalSale: SaleDocument, updatedSale: SaleDocument): Promise<void> {
  try {
    // 刪除原有的銷售庫存記錄（包括 sale 和 sale-no-stock 類型）
    await Inventory.deleteMany({
      saleId: originalSale._id,
      type: { $in: ['sale', 'sale-no-stock'] }
    });
    
    // 為更新後的銷售項目創建新的庫存記錄
    if (updatedSale.items && Array.isArray(updatedSale.items)) {
      const items = updatedSale.items as any[];
      for (const item of items) {
        try {
          await createInventoryRecord(item, updatedSale);
        } catch (err) {
          logger.error(`處理更新銷售的庫存記錄時出錯: ${err instanceof Error ? err.message : '未知錯誤'}`);
        }
      }
    }
  } catch (err) {
    logger.error(`處理更新銷售的庫存變更時出錯: ${err instanceof Error ? err.message : '未知錯誤'}`);
    // 不拋出錯誤，避免影響銷售記錄更新
  }
}

/**
 * @swagger
 * /api/sales/{id}:
 *   delete:
 *     summary: 刪除銷售記錄
 *     description: 根據ID刪除銷售記錄
 *     tags: [Sales]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: 銷售記錄ID
 *     responses:
 *       200:
 *         description: 銷售記錄刪除成功
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
 *                   example: 銷售記錄已刪除
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       description: 被刪除的銷售記錄ID
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: 找不到銷售記錄
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
// @route   DELETE api/sales/:id
// @desc    Delete a sale
// @access  Public
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    // 驗證 ID 參數存在性
    if (!req.params.id) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(404).json(errorResponse);
      return;
    }

    // 驗證 ID 格式，防止 NoSQL 注入
    if (!isValidObjectId(req.params.id)) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(404).json(errorResponse);
      return;
    }

    // 檢查銷售記錄是否存在
    const existingSale = await Sale.findById(req.params.id);
    if (!existingSale) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(404).json(errorResponse);
      return;
    }

    // 處理庫存恢復（刪除銷售相關的庫存記錄，恢復庫存）
    await handleInventoryForDeletedSale(existingSale);

    // 刪除銷售記錄
    await Sale.findByIdAndDelete(req.params.id);

    const response: ApiResponse<{ id: string }> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.DELETED || '銷售記錄已刪除',
      data: { id: req.params.id },
      timestamp: new Date()
    };


    res.json(response);
  } catch (err: unknown) {
    logger.error(`刪除銷售記錄失敗: ${err instanceof Error ? err.message : 'Unknown error'}`);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(500).json(errorResponse);
  }
});

// 處理刪除銷售的庫存恢復
async function handleInventoryForDeletedSale(sale: SaleDocument): Promise<void> {
  try {
    // 刪除與此銷售相關的所有庫存記錄（包括 sale 和 sale-no-stock 類型）
    const deletedInventories = await Inventory.deleteMany({
      saleId: sale._id,
      type: { $in: ['sale', 'sale-no-stock'] }
    });
    
    logger.info(`已刪除 ${deletedInventories.deletedCount} 個與銷售 ${sale.saleNumber} 相關的庫存記錄`);
    
    // 記錄庫存恢復日誌
    if (sale.items && Array.isArray(sale.items)) {
      const items = sale.items as any[];
      for (const item of items) {
        logger.debug(`恢復產品 ${item.product} 的庫存，數量: +${item.quantity}`);
      }
    }
  } catch (err) {
    logger.error(`處理刪除銷售的庫存恢復時出錯: ${err instanceof Error ? err.message : '未知錯誤'}`);
    // 不拋出錯誤，避免影響銷售記錄刪除
  }
}

export default router;