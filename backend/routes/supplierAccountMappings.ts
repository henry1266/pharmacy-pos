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
    
    const mappings = await SupplierAccountMapping.find(query)
      .populate('supplierId', 'name code')
      .populate('organizationId', 'name code')
      .populate('accountMappings.accountId', 'code name accountType')
      .sort({ supplierName: 1, 'accountMappings.priority': 1 });

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

    if (!organizationId) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '機構ID為必填參數',
        timestamp: new Date()
      };
      res.status(400).json(errorResponse);
      return;
    }

    const query: any = {
      supplierId: supplierId,
      organizationId: organizationId,
      isActive: true
    };
    
    const mapping = await SupplierAccountMapping.findOne(query)
      .populate('supplierId', 'name code')
      .populate('accountMappings.accountId', 'code name accountType');

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
  check('accountIds', '會計科目ID為必填項').isArray().notEmpty(),
  check('priority', '優先順序為必填項').isNumeric()
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

    // 從第一個會計科目獲取機構ID（假設所有科目都屬於同一機構）
    const organizationId = accounts[0].organizationId;
    
    // 驗證所有科目都屬於同一機構
    const differentOrgs = accounts.filter(acc => acc.organizationId?.toString() !== organizationId?.toString());
    if (differentOrgs.length > 0) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '所選會計科目必須屬於同一機構',
        timestamp: new Date()
      };
      res.status(400).json(errorResponse);
      return;
    }

    // 補充科目資訊
    const enrichedAccountMappings = accountIds.map((accountId: string) => {
      const account = accounts.find(acc => acc._id.toString() === accountId);
      return {
        accountId,
        accountCode: account?.code || '',
        accountName: account?.name || '',
        priority: priority || 0,
        isDefault: false
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
  check('accountIds', '會計科目ID為必填項').isArray().notEmpty(),
  check('priority', '優先順序為必填項').isNumeric()
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
    const { accountIds, priority, notes, isActive } = req.body;

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

    // 驗證所有科目都屬於同一機構
    const organizationId = accounts[0].organizationId;
    const differentOrgs = accounts.filter(acc => acc.organizationId?.toString() !== organizationId?.toString());
    if (differentOrgs.length > 0) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '所選會計科目必須屬於同一機構',
        timestamp: new Date()
      };
      res.status(400).json(errorResponse);
      return;
    }

    // 補充科目資訊
    const enrichedAccountMappings = accountIds.map((accountId: string) => {
      const account = accounts.find(acc => acc._id.toString() === accountId);
      return {
        accountId,
        accountCode: account?.code || '',
        accountName: account?.name || '',
        priority: priority || 0,
        isDefault: false
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