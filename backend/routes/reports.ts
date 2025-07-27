import express, { Request, Response } from 'express';
import { Types } from 'mongoose';
import PurchaseOrder from '../models/PurchaseOrder';
import Supplier from '../models/Supplier';
import { ApiResponse, ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@pharmacy-pos/shared/constants';

const router: express.Router = express.Router();

// 供應商進貨單總額報表介面
interface SupplierPurchaseReport {
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  totalOrders: number;
  totalAmount: number;
  completedOrders: number;
  completedAmount: number;
  pendingOrders: number;
  pendingAmount: number;
  lastOrderDate?: Date;
}

interface SupplierReportQuery {
  startDate?: string;
  endDate?: string;
  supplierId?: string;
  status?: string;
}

// @route   GET api/reports/suppliers/purchase-summary
// @desc    獲取供應商進貨單總額報表
// @access  Public
router.get('/suppliers/purchase-summary', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, supplierId, status } = req.query as SupplierReportQuery;
    
    // 建立查詢條件
    const matchConditions: any = {};
    
    // 時間範圍篩選
    if (startDate || endDate) {
      matchConditions.pobilldate = {};
      if (startDate) {
        matchConditions.pobilldate.$gte = new Date(startDate);
      }
      if (endDate) {
        matchConditions.pobilldate.$lte = new Date(endDate);
      }
    }
    
    // 供應商篩選
    if (supplierId) {
      matchConditions.supplier = new Types.ObjectId(supplierId);
    }
    
    // 狀態篩選
    if (status) {
      matchConditions.status = status;
    }

    // 使用聚合管道統計供應商進貨單總額
    const aggregationPipeline: any[] = [
      { $match: matchConditions },
      {
        $lookup: {
          from: 'suppliers',
          localField: 'supplier',
          foreignField: '_id',
          as: 'supplierInfo'
        }
      },
      {
        $group: {
          _id: {
            supplierId: '$supplier',
            supplierName: '$posupplier'
          },
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          completedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          completedAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$totalAmount', 0] }
          },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          pendingAmount: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$totalAmount', 0] }
          },
          lastOrderDate: { $max: '$pobilldate' },
          supplierInfo: { $first: '$supplierInfo' }
        }
      },
      {
        $project: {
          _id: 0,
          supplierId: '$_id.supplierId',
          supplierName: '$_id.supplierName',
          supplierCode: { $arrayElemAt: ['$supplierInfo.code', 0] },
          totalOrders: 1,
          totalAmount: 1,
          completedOrders: 1,
          completedAmount: 1,
          pendingOrders: 1,
          pendingAmount: 1,
          lastOrderDate: 1
        }
      },
      { $sort: { totalAmount: -1 } }
    ];

    const reportData = await PurchaseOrder.aggregate(aggregationPipeline).exec();

    // 格式化報表數據
    const formattedData: SupplierPurchaseReport[] = reportData.map(item => ({
      supplierId: item.supplierId?.toString() || '',
      supplierCode: item.supplierCode || '',
      supplierName: item.supplierName || '',
      totalOrders: item.totalOrders || 0,
      totalAmount: item.totalAmount || 0,
      completedOrders: item.completedOrders || 0,
      completedAmount: item.completedAmount || 0,
      pendingOrders: item.pendingOrders || 0,
      pendingAmount: item.pendingAmount || 0,
      lastOrderDate: item.lastOrderDate
    }));

    // 計算總計
    const summary = {
      totalSuppliers: formattedData.length,
      grandTotalOrders: formattedData.reduce((sum, item) => sum + item.totalOrders, 0),
      grandTotalAmount: formattedData.reduce((sum, item) => sum + item.totalAmount, 0),
      grandCompletedAmount: formattedData.reduce((sum, item) => sum + item.completedAmount, 0),
      grandPendingAmount: formattedData.reduce((sum, item) => sum + item.pendingAmount, 0)
    };

    const response: ApiResponse<{
      data: SupplierPurchaseReport[];
      summary: typeof summary;
      filters: {
        startDate?: string;
        endDate?: string;
        supplierId?: string;
        status?: string;
      };
    }> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      data: {
        data: formattedData,
        summary,
        filters: { startDate, endDate, supplierId, status }
      },
      timestamp: new Date()
    };

    res.json(response);
  } catch (err) {
    console.error('獲取供應商進貨單報表錯誤:', (err as Error).message);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(500).json(errorResponse);
  }
});

// @route   GET api/reports/suppliers/purchase-details/:supplierId
// @desc    獲取特定供應商的進貨單詳細報表
// @access  Public
router.get('/suppliers/purchase-details/:supplierId', async (req: Request, res: Response) => {
  try {
    const { supplierId } = req.params;
    const { startDate, endDate, status } = req.query as SupplierReportQuery;
    
    if (!supplierId) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '供應商ID為必填項',
        timestamp: new Date()
      };
      res.status(400).json(errorResponse);
      return;
    }

    // 建立查詢條件
    const matchConditions: any = {
      supplier: new Types.ObjectId(supplierId)
    };
    
    // 時間範圍篩選
    if (startDate || endDate) {
      matchConditions.pobilldate = {};
      if (startDate) {
        matchConditions.pobilldate.$gte = new Date(startDate);
      }
      if (endDate) {
        matchConditions.pobilldate.$lte = new Date(endDate);
      }
    }
    
    // 狀態篩選
    if (status) {
      matchConditions.status = status;
    }

    // 獲取供應商資訊
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '找不到該供應商',
        timestamp: new Date()
      };
      res.status(404).json(errorResponse);
      return;
    }

    // 獲取進貨單詳細資料
    const purchaseOrders = await PurchaseOrder.find(matchConditions)
      .sort({ pobilldate: -1 })
      .populate('supplier', 'name code')
      .populate('items.product', 'name code');

    const response: ApiResponse<{
      supplier: {
        _id: string;
        code: string;
        name: string;
      };
      orders: any[];
      summary: {
        totalOrders: number;
        totalAmount: number;
        completedOrders: number;
        completedAmount: number;
        pendingOrders: number;
        pendingAmount: number;
      };
    }> = {
      success: true,
      message: SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS,
      data: {
        supplier: {
          _id: (supplier._id as any).toString(),
          code: supplier.code || '',
          name: supplier.name
        },
        orders: purchaseOrders,
        summary: {
          totalOrders: purchaseOrders.length,
          totalAmount: purchaseOrders.reduce((sum, order) => sum + order.totalAmount, 0),
          completedOrders: purchaseOrders.filter(order => order.status === 'completed').length,
          completedAmount: purchaseOrders
            .filter(order => order.status === 'completed')
            .reduce((sum, order) => sum + order.totalAmount, 0),
          pendingOrders: purchaseOrders.filter(order => order.status === 'pending').length,
          pendingAmount: purchaseOrders
            .filter(order => order.status === 'pending')
            .reduce((sum, order) => sum + order.totalAmount, 0)
        }
      },
      timestamp: new Date()
    };

    res.json(response);
  } catch (err) {
    console.error('獲取供應商進貨單詳細報表錯誤:', (err as Error).message);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(500).json(errorResponse);
  }
});

export default router;