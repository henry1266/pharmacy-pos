import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import SupplierAccountMapping, { ISupplierAccountMapping } from '../models/SupplierAccountMapping';
import Account2 from '../models/Account2';
import Supplier from '../models/Supplier';
import { ApiResponse, ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@pharmacy-pos/shared/constants';

const router: express.Router = express.Router();

/**
 * @route   GET /api/supplier-account-mappings
 * @desc    獲取所有供應商科目配對
 * @access  Public
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { organizationId, supplierId } = req.query;
    
    const query: any = {};
    if (organizationId) query.organizationId = organizationId;
    if (supplierId) query.supplierId = supplierId;
    
    console.log('GET /api/supplier-account-mappings 查詢參數:', { organizationId, supplierId });
    console.log('MongoDB 查詢條件:', query);
    
    const mappings = await SupplierAccountMapping.find(query)
      .populate('supplierId', 'name code')
      .populate('organizationId', 'name code')
      .populate({
        path: 'accountMappings.accountId',
        select: 'code name accountType organizationId parentId level',
        populate: [
          {
            path: 'organizationId',
            select: 'name code'
          },
          {
            path: 'parentId',
            select: 'code name accountType parentId',
            populate: {
              path: 'parentId',
              select: 'code name accountType parentId',
              populate: {
                path: 'parentId',
                select: 'code name accountType parentId',
                populate: {
                  path: 'parentId',
                  select: 'code name accountType'
                }
              }
            }
          }
        ]
      })
      .sort({ supplierName: 1, 'accountMappings.priority': 1 });

    console.log('查詢結果數量:', mappings.length);
    console.log('查詢結果:', mappings);

    const response: ApiResponse<ISupplierAccountMapping[]> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      data: mappings,
      timestamp: new Date()
    };

    res.json(response);
  } catch (err) {
    console.error('獲取供應商科目配對失敗:', err);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(500).json(errorResponse);
  }
});

/**
 * @route   GET /api/supplier-account-mappings/supplier/:supplierId/accounts
 * @desc    獲取特定供應商的科目配對
 * @access  Public
 */
router.get('/supplier/:supplierId/accounts', async (req: Request, res: Response): Promise<void> => {
  try {
    const { supplierId } = req.params;
    const { organizationId } = req.query;

    console.log('GET /supplier/:supplierId/accounts 參數:', { supplierId, organizationId });

    const query: any = {
      supplierId: supplierId,
      isActive: true
    };
    
    // 如果提供了 organizationId，則加入查詢條件
    if (organizationId) {
      query.organizationId = organizationId;
    }
    
    console.log('查詢條件:', query);
    
    const mapping = await SupplierAccountMapping.findOne(query)
      .populate('supplierId', 'name code')
      .populate('organizationId', 'name code')
      .populate({
        path: 'accountMappings.accountId',
        select: 'code name accountType organizationId parentId level',
        populate: [
          {
            path: 'organizationId',
            select: 'name code'
          },
          {
            path: 'parentId',
            select: 'code name accountType parentId',
            populate: {
              path: 'parentId',
              select: 'code name accountType parentId',
              populate: {
                path: 'parentId',
                select: 'code name accountType parentId',
                populate: {
                  path: 'parentId',
                  select: 'code name accountType'
                }
              }
            }
          }
        ]
      });

    console.log('查詢結果:', mapping);

    const response: ApiResponse<ISupplierAccountMapping | null> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      data: mapping,
      timestamp: new Date()
    };

    res.json(response);
  } catch (err) {
    console.error('獲取供應商科目配對失敗:', err);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(500).json(errorResponse);
  }
});

/**
 * @route   GET /api/supplier-account-mappings/:id
 * @desc    獲取單個供應商科目配對
 * @access  Public
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const mapping = await SupplierAccountMapping.findById(req.params.id)
      .populate('supplierId', 'name code')
      .populate('organizationId', 'name code')
      .populate('accountMappings.accountId', 'code name accountType');

    if (!mapping) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(404).json(errorResponse);
      return;
    }

    const response: ApiResponse<ISupplierAccountMapping> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      data: mapping,
      timestamp: new Date()
    };

    res.json(response);
  } catch (err) {
    console.error('獲取供應商科目配對失敗:', err);
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
 * @route   POST /api/supplier-account-mappings
 * @desc    創建供應商科目配對
 * @access  Public
 */
router.post('/', [
  check('supplierId', '供應商ID為必填項').notEmpty(),
  check('accountIds', '會計科目ID為必填項').isArray().notEmpty()
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
      errors: errors.array(),
      timestamp: new Date()
    };
    res.status(400).json(errorResponse);
    return;
  }

  try {
    const { supplierId, accountIds, priority, notes } = req.body;
    console.log('POST 請求資料:', { supplierId, accountIds, priority, notes });
    console.log('accountIds 類型:', typeof accountIds, 'isArray:', Array.isArray(accountIds));

    // 驗證供應商是否存在
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '供應商不存在',
        timestamp: new Date()
      };
      res.status(400).json(errorResponse);
      return;
    }

    // 驗證會計科目是否存在並獲取機構ID
    const accounts = await Account2.find({
      _id: { $in: accountIds }
    });
    
    if (accounts.length !== accountIds.length) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '部分會計科目不存在',
        timestamp: new Date()
      };
      res.status(400).json(errorResponse);
      return;
    }

    // 取得第一個會計科目的機構ID作為預設值，但允許混合不同機構的科目
    const organizationId = accounts[0].organizationId;
    
    // 移除同機構限制 - 允許選擇不同機構的會計科目
    console.log('允許混合不同機構的會計科目');

    // 補充科目資訊，每個科目自動分配不同的優先順序
    const enrichedAccountMappings = accountIds.map((accountId: any, index: number) => {
      // 處理不同格式的 accountId
      let accountIdStr: string;
      if (typeof accountId === 'string') {
        accountIdStr = accountId;
      } else if (typeof accountId === 'object' && accountId._id) {
        accountIdStr = accountId._id;
      } else if (typeof accountId === 'object' && accountId.id) {
        accountIdStr = accountId.id;
      } else {
        accountIdStr = accountId.toString();
      }
      
      console.log(`處理會計科目 ID: ${accountIdStr}, 原始類型: ${typeof accountId}, 原始值:`, accountId);
      
      const account = accounts.find(acc => acc._id.toString() === accountIdStr);
      if (!account) {
        console.error(`找不到會計科目，ID: ${accountIdStr}, 可用科目:`, accounts.map(a => a._id.toString()));
        throw new Error(`找不到會計科目 ID: ${accountIdStr}`);
      }
      return {
        accountId: accountIdStr,
        accountCode: account.code || `ACC-${accountIdStr.slice(-6)}`, // 如果沒有代碼，生成一個
        accountName: account.name || `科目-${accountIdStr.slice(-6)}`, // 如果沒有名稱，生成一個
        priority: index + 1, // 自動分配優先順序：1, 2, 3...
        isDefault: index === 0 // 第一個科目設為預設
      };
    });

    // 檢查是否已存在配對
    const existingMapping = await SupplierAccountMapping.findOne({
      supplierId,
      organizationId
    });

    if (existingMapping) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '該供應商在此機構已存在科目配對',
        timestamp: new Date()
      };
      res.status(400).json(errorResponse);
      return;
    }

    // 創建新配對
    const mapping = new SupplierAccountMapping({
      supplierId,
      supplierName: supplier.name,
      organizationId,
      accountMappings: enrichedAccountMappings,
      notes,
      createdBy: 'system', // 暫時使用系統作為創建者
      updatedBy: 'system'
    });

    await mapping.save();

    const response: ApiResponse<ISupplierAccountMapping> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.CREATED,
      data: mapping,
      timestamp: new Date()
    };

    res.status(201).json(response);
  } catch (err) {
    console.error('創建供應商科目配對失敗:', err);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(500).json(errorResponse);
  }
});

/**
 * @route   PUT /api/supplier-account-mappings/:id
 * @desc    更新供應商科目配對
 * @access  Public
 */
router.put('/:id', [
  check('accountIds', '會計科目ID為必填項').isArray().notEmpty()
], async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
      errors: errors.array(),
      timestamp: new Date()
    };
    res.status(400).json(errorResponse);
    return;
  }

  try {
    const { accountIds, notes, isActive } = req.body;
    console.log('PUT 請求資料:', { accountIds, notes, isActive });
    console.log('accountIds 類型:', typeof accountIds, 'isArray:', Array.isArray(accountIds));

    const mapping = await SupplierAccountMapping.findById(req.params.id);
    if (!mapping) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(404).json(errorResponse);
      return;
    }

    // 驗證會計科目是否存在
    const accounts = await Account2.find({
      _id: { $in: accountIds }
    });
    
    if (accounts.length !== accountIds.length) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '部分會計科目不存在',
        timestamp: new Date()
      };
      res.status(400).json(errorResponse);
      return;
    }

    // 取得第一個會計科目的機構ID作為預設值，但允許混合不同機構的科目
    const organizationId = accounts[0].organizationId;
    
    // 移除同機構限制 - 允許選擇不同機構的會計科目
    console.log('PUT: 允許混合不同機構的會計科目');

    // 補充科目資訊，每個科目自動分配不同的優先順序
    const enrichedAccountMappings = accountIds.map((accountId: any, index: number) => {
      // 處理不同格式的 accountId
      let accountIdStr: string;
      if (typeof accountId === 'string') {
        accountIdStr = accountId;
      } else if (typeof accountId === 'object' && accountId._id) {
        accountIdStr = accountId._id;
      } else if (typeof accountId === 'object' && accountId.id) {
        accountIdStr = accountId.id;
      } else {
        accountIdStr = accountId.toString();
      }
      
      console.log(`處理會計科目 ID: ${accountIdStr}, 原始類型: ${typeof accountId}, 原始值:`, accountId);
      
      const account = accounts.find(acc => acc._id.toString() === accountIdStr);
      if (!account) {
        console.error(`找不到會計科目，ID: ${accountIdStr}, 可用科目:`, accounts.map(a => a._id.toString()));
        throw new Error(`找不到會計科目 ID: ${accountIdStr}`);
      }
      return {
        accountId: accountIdStr,
        accountCode: account.code || `ACC-${accountIdStr.slice(-6)}`, // 如果沒有代碼，生成一個
        accountName: account.name || `科目-${accountIdStr.slice(-6)}`, // 如果沒有名稱，生成一個
        priority: index + 1, // 自動分配優先順序：1, 2, 3...
        isDefault: index === 0 // 第一個科目設為預設
      };
    });

    // 更新配對
    mapping.accountMappings = enrichedAccountMappings;
    mapping.organizationId = organizationId; // 更新機構ID
    if (notes !== undefined) mapping.notes = notes;
    if (isActive !== undefined) mapping.isActive = isActive;
    mapping.updatedBy = 'system';

    await mapping.save();

    const response: ApiResponse<ISupplierAccountMapping> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.UPDATED,
      data: mapping,
      timestamp: new Date()
    };

    res.json(response);
  } catch (err) {
    console.error('更新供應商科目配對失敗:', err);
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
 * @route   DELETE /api/supplier-account-mappings/:id
 * @desc    刪除供應商科目配對
 * @access  Public
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const mapping = await SupplierAccountMapping.findById(req.params.id);
    if (!mapping) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(404).json(errorResponse);
      return;
    }

    await mapping.deleteOne();

    const response: ApiResponse<null> = {
      success: true,
      message: '供應商科目配對已刪除',
      data: null,
      timestamp: new Date()
    };

    res.json(response);
  } catch (err) {
    console.error('刪除供應商科目配對失敗:', err);
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


export default router;