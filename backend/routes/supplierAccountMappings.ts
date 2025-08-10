import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import SupplierAccountMapping from '../models/SupplierAccountMapping';
import Account2 from '../models/Account2';
import Supplier from '../models/Supplier';
import { ApiResponse, ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@pharmacy-pos/shared/constants';
import logger from '../utils/logger';

const router: express.Router = express.Router();

// 共用工具函數
const createErrorResponse = (message: string, errors?: any[]): ErrorResponse => ({
  success: false,
  message,
  ...(errors && { errors }),
  timestamp: new Date()
});

const createSuccessResponse = <T>(data: T, message: string = SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS): ApiResponse<T> => ({
  success: true,
  message,
  data,
  timestamp: new Date()
});

// 共用的 Populate 配置
const POPULATE_CONFIG = {
  supplier: 'name code',
  organization: 'name code',
  account: {
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
  },
  accountSimple: 'code name accountType'
};

// AccountId 處理工具函數
const processAccountId = (accountId: any): string => {
  if (typeof accountId === 'string') {
    return accountId;
  } else if (typeof accountId === 'object' && accountId._id) {
    return accountId._id;
  } else if (typeof accountId === 'object' && accountId.id) {
    return accountId.id;
  } else {
    return accountId.toString();
  }
};

const enrichAccountMappings = (accountIds: any[], accounts: any[]) => {
  return accountIds.map((accountId: any, index: number) => {
    const accountIdStr = processAccountId(accountId);
    logger.debug(`處理會計科目 ID:`, {
      id: accountIdStr,
      originalType: typeof accountId,
      originalValue: accountId
    });
    
    const account = accounts.find(acc => (acc._id as any).toString() === accountIdStr);
    if (!account) {
      logger.error(`找不到會計科目:`, {
        id: accountIdStr,
        availableAccounts: accounts.map(a => (a._id as any).toString())
      });
      throw new Error(`找不到會計科目 ID: ${accountIdStr}`);
    }
    
    return {
      accountId: new mongoose.Types.ObjectId(accountIdStr),
      accountCode: account.code || `ACC-${accountIdStr.slice(-6)}`,
      accountName: account.name || `科目-${accountIdStr.slice(-6)}`,
      priority: index + 1,
      isDefault: index === 0
    };
  });
};

// 參數驗證工具函數
const validateRequiredParam = (res: Response, param: any, paramName: string): boolean => {
  if (!param) {
    res.status(400).json(createErrorResponse(`${paramName}為必填項`));
    return false;
  }
  return true;
};

// 共用錯誤處理函數
const handleCastError = (res: Response, err: any) => {
  if (err instanceof Error && err.name === 'CastError') {
    res.status(404).json(createErrorResponse(ERROR_MESSAGES.GENERIC.NOT_FOUND));
    return true;
  }
  return false;
};

const handleServerError = (res: Response, err: any, operation: string) => {
  logger.error(`${operation}失敗:`, err);
  if (!handleCastError(res, err)) {
    res.status(500).json(createErrorResponse(ERROR_MESSAGES.GENERIC.SERVER_ERROR));
  }
};

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
    
    logger.debug('GET /api/supplier-account-mappings 查詢參數:', {
      organizationId,
      supplierId,
      query
    });
    
    const mappings = await SupplierAccountMapping.find(query)
      .populate('supplierId', POPULATE_CONFIG.supplier)
      .populate('organizationId', POPULATE_CONFIG.organization)
      .populate(POPULATE_CONFIG.account)
      .sort({ supplierName: 1, 'accountMappings.priority': 1 });

    logger.debug('查詢結果:', {
      count: mappings.length
    });

    res.json(createSuccessResponse(mappings));
  } catch (err) {
    logger.error('獲取供應商科目配對失敗:', err);
    res.status(500).json(createErrorResponse(ERROR_MESSAGES.GENERIC.SERVER_ERROR));
  }
});

/**
 * @route   GET /api/supplier-account-mappings/supplier/:supplierId/accounts
 * @desc    獲取特定供應商的科目配對
 * @access  Public
 */
router.get('/supplier/:supplierId/accounts', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!validateRequiredParam(res, req.params.supplierId, '供應商ID')) return;

    const { supplierId } = req.params;
    const { organizationId } = req.query;

    logger.debug('GET /supplier/:supplierId/accounts 參數:', {
      supplierId,
      organizationId
    });

    const query: any = {
      supplierId: supplierId,
      isActive: true
    };
    
    if (organizationId) {
      query.organizationId = organizationId;
    }
    
    logger.debug('查詢條件:', query);
    
    const mapping = await SupplierAccountMapping.findOne(query)
      .populate('supplierId', POPULATE_CONFIG.supplier)
      .populate('organizationId', POPULATE_CONFIG.organization)
      .populate(POPULATE_CONFIG.account);

    logger.debug('查詢結果:', {
      found: !!mapping
    });

    res.json(createSuccessResponse(mapping));
  } catch (err) {
    logger.error('獲取供應商科目配對失敗:', err);
    res.status(500).json(createErrorResponse(ERROR_MESSAGES.GENERIC.SERVER_ERROR));
  }
});

/**
 * @route   GET /api/supplier-account-mappings/:id
 * @desc    獲取單個供應商科目配對
 * @access  Public
 */
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!validateRequiredParam(res, req.params.id, '配對ID')) return;

    const mapping = await SupplierAccountMapping.findById(req.params.id)
      .populate('supplierId', POPULATE_CONFIG.supplier)
      .populate('organizationId', POPULATE_CONFIG.organization)
      .populate('accountMappings.accountId', POPULATE_CONFIG.accountSimple);

    if (!mapping) {
      res.status(404).json(createErrorResponse(ERROR_MESSAGES.GENERIC.NOT_FOUND));
      return;
    }

    res.json(createSuccessResponse(mapping));
  } catch (err) {
    handleServerError(res, err, '獲取供應商科目配對');
  }
});

// 共用驗證函數
const validateSupplierAndAccounts = async (supplierId: string, accountIds: any[]) => {
  // 驗證供應商是否存在
  const supplier = await Supplier.findById(supplierId);
  if (!supplier) {
    throw new Error('供應商不存在');
  }

  // 驗證會計科目是否存在
  const accounts = await Account2.find({ _id: { $in: accountIds } });
  if (accounts.length !== accountIds.length) {
    throw new Error('部分會計科目不存在');
  }

  // 取得第一個會計科目的機構ID
  const organizationId = accounts[0]?.organizationId;
  if (!organizationId) {
    throw new Error('無法獲取會計科目的機構ID');
  }

  logger.debug('允許混合不同機構的會計科目');
  return { supplier, accounts, organizationId };
};

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
    res.status(400).json(createErrorResponse(ERROR_MESSAGES.GENERIC.VALIDATION_FAILED, errors.array()));
    return;
  }

  try {
    const { supplierId, accountIds, priority, notes } = req.body;
    logger.debug('POST 請求資料:', {
      supplierId,
      accountIds,
      priority,
      notes,
      accountIdsType: typeof accountIds,
      isArray: Array.isArray(accountIds)
    });

    const { supplier, accounts, organizationId } = await validateSupplierAndAccounts(supplierId, accountIds);

    // 檢查是否已存在配對
    const existingMapping = await SupplierAccountMapping.findOne({
      supplierId,
      organizationId
    });

    if (existingMapping) {
      res.status(400).json(createErrorResponse('該供應商在此機構已存在科目配對'));
      return;
    }

    // 使用共用函數處理科目映射
    const enrichedAccountMappings = enrichAccountMappings(accountIds, accounts);

    // 創建新配對
    const mapping = new SupplierAccountMapping({
      supplierId,
      supplierName: supplier.name,
      organizationId,
      accountMappings: enrichedAccountMappings,
      notes,
      createdBy: 'system',
      updatedBy: 'system'
    });

    await mapping.save();

    res.status(201).json(createSuccessResponse(mapping, SUCCESS_MESSAGES.GENERIC.CREATED));
  } catch (err) {
    if (err instanceof Error) {
      res.status(400).json(createErrorResponse(err.message));
    } else {
      handleServerError(res, err, '創建供應商科目配對');
    }
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
    res.status(400).json(createErrorResponse(ERROR_MESSAGES.GENERIC.VALIDATION_FAILED, errors.array()));
    return;
  }

  try {
    if (!validateRequiredParam(res, req.params.id, '配對ID')) return;

    const { accountIds, notes, isActive } = req.body;
    logger.debug('PUT 請求資料:', {
      accountIds,
      notes,
      isActive,
      accountIdsType: typeof accountIds,
      isArray: Array.isArray(accountIds)
    });

    const mapping = await SupplierAccountMapping.findById(req.params.id);
    if (!mapping) {
      res.status(404).json(createErrorResponse(ERROR_MESSAGES.GENERIC.NOT_FOUND));
      return;
    }

    // 驗證會計科目
    const accounts = await Account2.find({ _id: { $in: accountIds } });
    if (accounts.length !== accountIds.length) {
      res.status(400).json(createErrorResponse('部分會計科目不存在'));
      return;
    }

    const organizationId = accounts[0]?.organizationId;
    if (!organizationId) {
      res.status(400).json(createErrorResponse('無法獲取會計科目的機構ID'));
      return;
    }
    
    logger.debug('PUT: 允許混合不同機構的會計科目');

    // 使用共用函數處理科目映射
    const enrichedAccountMappings = enrichAccountMappings(accountIds, accounts);

    // 更新配對
    mapping.accountMappings = enrichedAccountMappings;
    if (organizationId) mapping.organizationId = organizationId;
    if (notes !== undefined) mapping.notes = notes;
    if (isActive !== undefined) mapping.isActive = isActive;
    mapping.updatedBy = 'system';

    await mapping.save();

    res.json(createSuccessResponse(mapping, SUCCESS_MESSAGES.GENERIC.UPDATED));
  } catch (err) {
    if (err instanceof Error) {
      res.status(400).json(createErrorResponse(err.message));
    } else {
      handleServerError(res, err, '更新供應商科目配對');
    }
  }
});

/**
 * @route   DELETE /api/supplier-account-mappings/:id
 * @desc    刪除供應商科目配對
 * @access  Public
 */
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    if (!validateRequiredParam(res, req.params.id, '配對ID')) return;

    const mapping = await SupplierAccountMapping.findById(req.params.id);
    if (!mapping) {
      res.status(404).json(createErrorResponse(ERROR_MESSAGES.GENERIC.NOT_FOUND));
      return;
    }

    await mapping.deleteOne();

    res.json(createSuccessResponse(null, '供應商科目配對已刪除'));
  } catch (err) {
    handleServerError(res, err, '刪除供應商科目配對');
  }
});


export default router;