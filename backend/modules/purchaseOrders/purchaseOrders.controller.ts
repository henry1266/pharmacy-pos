import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../../src/types/express';
import { ApiResponse, ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@pharmacy-pos/shared/constants';
import logger from '../../utils/logger';
import * as purchaseOrdersService from './purchaseOrders.service';
import { IPurchaseOrderDocument } from './purchaseOrders.types';

/**
 * 獲取所有進貨單
 * @param req 請求對象
 * @param res 回應對象
 */
export async function getAllPurchaseOrders(_req: Request, res: Response) {
  try {
    const purchaseOrders = await purchaseOrdersService.getAllPurchaseOrders();
    
    const response: ApiResponse<IPurchaseOrderDocument[]> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      data: purchaseOrders,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    logger.error(`獲取最近的進貨單錯誤: ${(err as Error).message}`);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * 獲取單個進貨單
 * @param req 請求對象
 * @param res 回應對象
 */
export async function getPurchaseOrderById(req: Request, res: Response) {
  try {
    if (!req.params.id) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '進貨單ID為必填項',
        timestamp: new Date()
      };
      res.status(400).json(errorResponse);
      return;
    }

    const purchaseOrder = await purchaseOrdersService.getPurchaseOrderById(req.params.id);
    
    if (!purchaseOrder) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(404).json(errorResponse);
      return;
    }
    
    // 確保批號欄位被正確序列化
    const serializedPurchaseOrder = purchaseOrder.toObject();
    
    const response: ApiResponse<any> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      data: serializedPurchaseOrder,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    logger.error(`獲取單個進貨單錯誤: ${(err as Error).message}`);
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
}

/**
 * 創建新進貨單
 * @param req 請求對象
 * @param res 回應對象
 */
export async function createPurchaseOrder(req: Request, res: Response) {
  const authReq = req as AuthenticatedRequest;
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
    const userId = authReq.user?.id;
    const result = await purchaseOrdersService.createPurchaseOrder(req.body, userId);
    
    if (!result.success) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: result.error || ERROR_MESSAGES.GENERIC.SERVER_ERROR,
        timestamp: new Date()
      };
      res.status(400).json(errorResponse);
      return;
    }

    const response: ApiResponse<IPurchaseOrderDocument> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.CREATED,
      data: result.purchaseOrder!,
      timestamp: new Date()
    };

    res.json(response);
  } catch (err) {
    logger.error(`創建進貨單錯誤: ${(err as Error).message}`);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * 更新進貨單
 * @param req 請求對象
 * @param res 回應對象
 */
export async function updatePurchaseOrder(req: Request, res: Response) {
  const authReq = req as AuthenticatedRequest;
  try {
    if (!req.params.id) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '進貨單ID為必填項',
        timestamp: new Date()
      };
      res.status(400).json(errorResponse);
      return;
    }

    const userId = authReq.user?.id;
    const result = await purchaseOrdersService.updatePurchaseOrder(req.params.id, req.body, userId);
    
    if (!result.success) {
      const statusCode = result.error === '找不到該進貨單' ? 404 : 400;
      const errorResponse: ErrorResponse = {
        success: false,
        message: result.error || ERROR_MESSAGES.GENERIC.SERVER_ERROR,
        timestamp: new Date()
      };
      res.status(statusCode).json(errorResponse);
      return;
    }

    const response: ApiResponse<IPurchaseOrderDocument> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.UPDATED,
      data: result.purchaseOrder!,
      timestamp: new Date()
    };

    res.json(response);
  } catch (err) {
    logger.error(`更新進貨單錯誤: ${(err as Error).message}`);
    
    if (err instanceof Error && err.name === 'CastError') {
      res.status(404).json({ msg: '找不到該進貨單' });
      return;
    }
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * 刪除進貨單
 * @param req 請求對象
 * @param res 回應對象
 */
export async function deletePurchaseOrder(req: Request, res: Response) {
  try {
    if (!req.params.id) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '進貨單ID為必填項',
        timestamp: new Date()
      };
      res.status(400).json(errorResponse);
      return;
    }

    const result = await purchaseOrdersService.deletePurchaseOrder(req.params.id);
    
    if (!result.success) {
      const statusCode = result.error === '找不到該進貨單' ? 404 : 400;
      const errorResponse: ErrorResponse = {
        success: false,
        message: result.error || ERROR_MESSAGES.GENERIC.SERVER_ERROR,
        timestamp: new Date()
      };
      res.status(statusCode).json(errorResponse);
      return;
    }

    const response: ApiResponse<null> = {
      success: true,
      message: '進貨單已刪除',
      data: null,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    logger.error(`刪除進貨單錯誤: ${(err as Error).message}`);
    if (err instanceof Error && err.name === 'CastError') {
      res.status(404).json({ msg: '找不到該進貨單' });
      return;
    }
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * 獲取特定供應商的進貨單
 * @param req 請求對象
 * @param res 回應對象
 */
export async function getPurchaseOrdersBySupplier(req: Request, res: Response) {
  try {
    if (!req.params.supplierId) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '供應商ID為必填項',
        timestamp: new Date()
      };
      res.status(400).json(errorResponse);
      return;
    }

    const purchaseOrders = await purchaseOrdersService.getPurchaseOrdersBySupplier(req.params.supplierId);
    
    const response: ApiResponse<IPurchaseOrderDocument[]> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      data: purchaseOrders,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    logger.error(`獲取所有進貨單錯誤: ${(err as Error).message}`);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * 獲取特定產品的進貨單
 * @param req 請求對象
 * @param res 回應對象
 */
export async function getPurchaseOrdersByProduct(req: Request, res: Response) {
  try {
    if (!req.params.productId) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '產品ID為必填項',
        timestamp: new Date()
      };
      res.status(400).json(errorResponse);
      return;
    }

    const purchaseOrders = await purchaseOrdersService.getPurchaseOrdersByProduct(req.params.productId);
    
    const response: ApiResponse<IPurchaseOrderDocument[]> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      data: purchaseOrders,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    logger.error(`獲取特定供應商的進貨單錯誤: ${(err as Error).message}`);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(500).json(errorResponse);
  }
}

/**
 * 獲取最近的進貨單
 * @param req 請求對象
 * @param res 回應對象
 */
export async function getRecentPurchaseOrders(_req: Request, res: Response) {
  try {
    const purchaseOrders = await purchaseOrdersService.getRecentPurchaseOrders(10);
    
    const response: ApiResponse<IPurchaseOrderDocument[]> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      data: purchaseOrders,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    logger.error(`獲取特定產品的進貨單錯誤: ${(err as Error).message}`);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(500).json(errorResponse);
  }
}