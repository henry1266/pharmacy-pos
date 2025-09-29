import { Request, Response } from 'express';
// express-validator no longer used; using Zod middlewares
import { mapModelItemsToApiItems } from './utils/sales.utils';
import Sale from '../../models/Sale';
import { ApiResponse, ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@pharmacy-pos/shared/constants';
import logger from '../../utils/logger';
import * as salesService from './sales.service';\r\nimport { SaleServiceError } from './sales.service';
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
    
    // 憒???典???撠???
    if (wildcardSearch && typeof wildcardSearch === 'string') {
      sales = await searchService.performWildcardSearch(wildcardSearch);
    }
    // 憒????祆?撠??賂????澆捆嚗?
    else if (search && typeof search === 'string') {
      sales = await searchService.performRegularSearch(search);
    }
    // 瘝????嚗???????
    else {
      sales = await salesService.findAllSales();
    }
    
    // 雿輻??瑁?閫?捱?銝??憿?
    const response: ApiResponse<any[]> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      data: sales.map(sale => {
        const plain = (sale as any)?.toObject ? (sale as any).toObject() : sale;
        return {
          ...plain,
          items: mapModelItemsToApiItems((plain as any).items),
          _id: sale._id.toString(),
          createdAt: sale.createdAt,
          updatedAt: sale.updatedAt
        };
      }),
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err: unknown) {
    logger.error(`?脣??瑕閮??航炊: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
      data: sales.map((sale: any) => {
        const plain = sale?.toObject ? sale.toObject() : sale;
        return {
          ...plain,
          items: mapModelItemsToApiItems(plain.items),
          _id: sale._id.toString(),
          createdAt: sale.createdAt,
          updatedAt: sale.updatedAt
        };
      }),
      timestamp: new Date()
    };

    res.json(response);
  } catch (err: unknown) {
    logger.error(`??隞?瑕?航炊: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
    // 撽? ID ?摮?批??澆?
    if (!req.params.id) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(404).json(errorResponse);
      return;
    }

    // 撽? ID ?澆?嚗甇?NoSQL 瘜典
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
    
    // 雿輻??瑁?閫?捱?銝??憿?
    const salePlain = sale.toObject();
    const response: ApiResponse<any> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      data: {
        ...salePlain,
        items: mapModelItemsToApiItems((salePlain as any).items),
        _id: (sale._id as any).toString(),
        createdAt: sale.createdAt,
        updatedAt: sale.updatedAt
      },
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err: unknown) {
    logger.error(`?脣??桀?株??隤? ${err instanceof Error ? err.message : 'Unknown error'}`);
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
  try {
    // ???瑕?萄遣???湔?蝔?
    const sale = await salesService.processSaleCreation(req.body);
    
    // 雿輻??瑁?閫?捱?銝??憿?
    const response: ApiResponse<any> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.CREATED,
      data: {
        ...sale.toObject(),
        items: mapModelItemsToApiItems((sale as any).items),
        _id: (sale._id as any).toString(),
        createdAt: sale.createdAt,
        updatedAt: sale.updatedAt
      },
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err: unknown) {
    logger.error(`?萄遣?瑕閮??航炊: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
    // 撽? ID ?摮??
    if (!req.params.id) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(404).json(errorResponse);
      return;
    }

    // 撽? ID ?澆?嚗甇?NoSQL 瘜典
    if (!isValidObjectId(req.params.id)) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(404).json(errorResponse);
      return;
    }

    // 瑼Ｘ?瑕閮??臬摮
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

    // ???瑕?湔???湔?蝔?
    const updatedSale = await salesService.processSaleUpdate(req.params.id, req.body, existingSale);

    // ?憛怠??鞈?
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

    const populatedPlain = populatedSale.toObject();
    const response: ApiResponse<any> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.UPDATED,
      data: {
        ...populatedPlain,
        items: mapModelItemsToApiItems((populatedPlain as any).items),
        _id: (populatedSale._id as any).toString(),
        createdAt: populatedSale.createdAt,
        updatedAt: populatedSale.updatedAt
      },
      timestamp: new Date()
    };

    res.json(response);
  } catch (err: unknown) {
    logger.error(`?湔?瑕閮?憭望?: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
    // 撽? ID ?摮??
    if (!req.params.id) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(404).json(errorResponse);
      return;
    }

    // 撽? ID ?澆?嚗甇?NoSQL 瘜典
    if (!isValidObjectId(req.params.id)) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        timestamp: new Date()
      };
      res.status(404).json(errorResponse);
      return;
    }

    // 瑼Ｘ?瑕閮??臬摮
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

    // ??摨怠??Ｗ儔嚗?日?桃??摨怠?閮?嚗敺拙澈摮?
    await handleInventoryForDeletedSale(existingSale);

    // ?芷?瑕閮?
    await salesService.deleteSaleRecord(req.params.id);

    const response: ApiResponse<{ id: string }> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.DELETED || '?瑕閮?撌脣??,
      data: { id: req.params.id },
      timestamp: new Date()
    };

    res.json(response);
  } catch (err: unknown) {
    logger.error(`?芷?瑕閮?憭望?: ${err instanceof Error ? err.message : 'Unknown error'}`);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(500).json(errorResponse);
  }
};

