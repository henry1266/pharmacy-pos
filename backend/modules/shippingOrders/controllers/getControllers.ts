import { Request, Response } from 'express';
import ShippingOrder from '../../../models/ShippingOrder';
import { 
  processHealthInsuranceCode, 
  createSuccessResponse, 
  createErrorResponse, 
  handleDatabaseError 
} from '../services';
import { ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';

/**
 * 獲取所有出貨單
 * @route GET /api/shipping-orders
 */
export async function getAllShippingOrders(_req: Request, res: Response) {
  try {
    const shippingOrders = await ShippingOrder.find()
      .sort({ soid: -1 })
      .populate('supplier', 'name')
      .populate('items.product', 'name code healthInsuranceCode');
    
    processHealthInsuranceCode(shippingOrders);
    res.json(createSuccessResponse(shippingOrders));
  } catch (err) {
    handleDatabaseError(res, err as Error);
  }
}

/**
 * 獲取單個出貨單
 * @route GET /api/shipping-orders/:id
 */
export async function getShippingOrderById(req: Request, res: Response) {
  try {
    if (!req.params.id) {
      res.status(400).json(createErrorResponse('缺少出貨單ID參數'));
      return;
    }

    const shippingOrder = await ShippingOrder.findById(req.params.id)
      .populate('supplier', 'name')
      .populate('items.product', 'name code healthInsuranceCode');
    
    if (!shippingOrder) {
      res.status(404).json(createErrorResponse(ERROR_MESSAGES.GENERIC.NOT_FOUND));
      return;
    }
    
    processHealthInsuranceCode([shippingOrder]);
    res.json(createSuccessResponse(shippingOrder));
  } catch (err) {
    handleDatabaseError(res, err as Error);
  }
}

/**
 * 獲取特定供應商的出貨單
 * @route GET /api/shipping-orders/supplier/:supplierId
 */
export async function getShippingOrdersBySupplier(req: Request, res: Response) {
  try {
    if (!req.params.supplierId) {
      res.status(400).json(createErrorResponse('缺少供應商ID參數'));
      return;
    }

    const shippingOrders = await ShippingOrder.find({ supplier: req.params.supplierId.toString() })
      .sort({ createdAt: -1 })
      .populate('supplier', 'name')
      .populate('items.product', 'name code healthInsuranceCode');
    
    processHealthInsuranceCode(shippingOrders);
    res.json(createSuccessResponse(shippingOrders));
  } catch (err) {
    handleDatabaseError(res, err as Error);
  }
}

/**
 * 搜索出貨單
 * @route GET /api/shipping-orders/search/query
 */
export async function searchShippingOrders(req: Request, res: Response) {
  try {
    const { soid, sosupplier, startDate, endDate, status, paymentStatus } = req.query;
    
    // 構建查詢條件
    const query: any = {};
    
    // 根據 soid 過濾
    if (soid) {
      query.soid = { $regex: soid, $options: 'i' };
    }
    
    // 根據 sosupplier 過濾
    if (sosupplier) {
      query.sosupplier = { $regex: sosupplier, $options: 'i' };
    }
    
    // 根據日期範圍過濾
    if (startDate || endDate) {
      query.shippingDate = {};
      
      if (startDate) {
        query.shippingDate.$gte = new Date(startDate as string);
      }
      
      if (endDate) {
        // 設置結束日期為當天的最後一毫秒
        const endDateObj = new Date(endDate as string);
        endDateObj.setHours(23, 59, 59, 999);
        query.shippingDate.$lte = endDateObj;
      }
    }
    
    // 根據狀態過濾
    if (status) {
      query.status = status;
    }
    
    // 根據付款狀態過濾
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }
    
    // 執行查詢
    const shippingOrders = await ShippingOrder.find(query)
      .sort({ createdAt: -1 })
      .populate('supplier', 'name')
      .populate('items.product', 'name code healthInsuranceCode');
    
    processHealthInsuranceCode(shippingOrders);
    res.json(createSuccessResponse(shippingOrders));
  } catch (err) {
    handleDatabaseError(res, err as Error, '搜索出貨單時出錯');
  }
}

/**
 * 獲取特定產品的出貨單
 * @route GET /api/shipping-orders/product/:productId
 */
export async function getShippingOrdersByProduct(req: Request, res: Response) {
  try {
    // 安全處理：驗證和清理productId
    if (!req.params.productId) {
      res.status(400).json(createErrorResponse('缺少產品ID參數'));
      return;
    }
    
    if (typeof req.params.productId !== 'string') {
      res.status(400).json(createErrorResponse('無效的產品ID'));
      return;
    }
    
    const sanitizedProductId = req.params.productId.trim();
    
    // 使用安全的方式構建查詢條件
    const query = {
      'status': 'completed'
    };
    
    // 使用安全的方式查詢所有出貨單
    const allOrders = await ShippingOrder.find(query)
      .populate('supplier', 'name')
      .populate('items.product', 'name code healthInsuranceCode');
    
    // 在應用層面過濾產品，而不是直接在數據庫查詢中使用用戶輸入
    const shippingOrders = allOrders.filter((order: any) => {
      if (!order.items || !Array.isArray(order.items)) return false;
      
      return order.items.some((item: any) =>
        item.product?._id?.toString() === sanitizedProductId
      );
    });
    
    processHealthInsuranceCode(shippingOrders);
    res.json(createSuccessResponse(shippingOrders));
  } catch (err) {
    handleDatabaseError(res, err as Error);
  }
}

/**
 * 獲取最近的出貨單
 * @route GET /api/shipping-orders/recent/list
 */
export async function getRecentShippingOrders(_req: Request, res: Response) {
  try {
    const shippingOrders = await ShippingOrder.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('supplier', 'name')
      .populate('items.product', 'name code healthInsuranceCode');
    
    processHealthInsuranceCode(shippingOrders);
    res.json(createSuccessResponse(shippingOrders));
  } catch (err) {
    handleDatabaseError(res, err as Error);
  }
}