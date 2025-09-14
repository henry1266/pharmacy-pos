import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Sale from '../../models/Sale';
import { ApiResponse, ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@pharmacy-pos/shared/constants';
import logger from '../../utils/logger';
import * as salesService from './sales.service';
import * as searchService from './services/search.service';
import { isValidObjectId } from './services/validation.service';
import { handleInventoryForDeletedSale } from './services/inventory.service';

// @route   GET api/sales
// @desc    Get all sales with optional wildcard search
// @access  Public
export const getAllSales = async (req: Request, res: Response) => {
  try {
    const { search, wildcardSearch } = req.query;
    
    let sales: any[] = [];
    
    // 如果有萬用字元搜尋參數
    if (wildcardSearch && typeof wildcardSearch === 'string') {
      sales = await searchService.performWildcardSearch(wildcardSearch);
    }
    // 如果有一般搜尋參數（向後兼容）
    else if (search && typeof search === 'string') {
      sales = await searchService.performRegularSearch(search);
    }
    // 沒有搜尋參數，返回所有記錄
    else {
      sales = await salesService.findAllSales();
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
    logger.error(`獲取銷售記錄錯誤: ${err instanceof Error ? err.message : 'Unknown error'}`);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(500).json(errorResponse);
  }
};

// @route   GET api/sales/today
// @desc    Get today's sales (server local timezone)
// @access  Public
export const getTodaySales = async (_req: Request, res: Response) => {
  try {
    const sales = await salesService.findTodaySales();

    const response: ApiResponse<any[]> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      data: sales.map((sale: any) => ({
        ...(sale.toObject ? sale.toObject() : sale),
        _id: sale._id.toString(),
        createdAt: sale.createdAt,
        updatedAt: sale.updatedAt
      })),
      timestamp: new Date()
    };

    res.json(response);
  } catch (err: unknown) {
    logger.error(`取得今日銷售錯誤: ${err instanceof Error ? err.message : 'Unknown error'}`);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(500).json(errorResponse);
  }
};

// @route   GET api/sales/:id
// @desc    Get sale by ID
// @access  Public
export const getSaleById = async (req: Request, res: Response) => {
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

    const sale = await salesService.findSaleById(req.params.id);
      
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
        _id: (sale._id as any).toString(),
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
};

// @route   POST api/sales
// @desc    Create a sale
// @access  Public
export const createSale = async (req: Request, res: Response) => {
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
    // 處理銷售創建的完整流程
    const sale = await salesService.processSaleCreation(req.body);
    
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
    logger.error(`創建銷售記錄錯誤: ${err instanceof Error ? err.message : 'Unknown error'}`);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(500).json(errorResponse);
  }
};

// @route   PUT api/sales/:id
// @desc    Update a sale
// @access  Public
export const updateSale = async (req: Request, res: Response) => {
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

    // 處理銷售更新的完整流程
    const updatedSale = await salesService.processSaleUpdate(req.params.id, req.body, existingSale);

    // 重新填充關聯資料
    const populatedSale = await salesService.findSaleById((updatedSale._id as any).toString());

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
        _id: (populatedSale._id as any).toString(),
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
};

// @route   DELETE api/sales/:id
// @desc    Delete a sale
// @access  Public
export const deleteSale = async (req: Request, res: Response) => {
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
    await salesService.deleteSaleRecord(req.params.id);

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
};
