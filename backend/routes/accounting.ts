import express, { Request, Response } from 'express';
import mongoose, { Types } from 'mongoose';
import { check, validationResult } from 'express-validator';
import { format } from 'date-fns';

// 使用 TypeScript import 語法導入模型和中介軟體
import Accounting from '../models/Accounting';
import Inventory from '../models/Inventory';
import BaseProduct from '../models/BaseProduct';
import MonitoredProduct from '../models/MonitoredProduct';
import { ApiResponse, ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { API_CONSTANTS, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';
import auth from '../middleware/auth';

// 定義會計記錄狀態型別
type AccountingStatus = 'pending' | 'completed';
type ShiftType = '早' | '中' | '晚';

// 定義會計項目介面
interface AccountingItem {
  amount: number;
  category: string;
  categoryId?: Types.ObjectId | null | undefined;
  notes?: string;
  isAutoLinked?: boolean;
}


// 定義會計記錄請求介面
interface AccountingRequest {
  date: Date | string;
  shift: ShiftType;
  items?: AccountingItem[];
  status?: AccountingStatus;
}

// 定義查詢參數介面
interface AccountingQueryParams {
  startDate?: string;
  endDate?: string;
  shift?: string;
  date?: string;
  search?: string; // 新增內文搜尋參數
}

// 定義每日摘要介面
interface DailySummary {
  _id: string;
  shifts: Array<{
    shift: ShiftType;
    totalAmount: number;
  }>;
  dailyTotal: number;
}

// 使用 IInventoryDocument 型別，不需要自定義 SaleRecord 介面

// 定義產品詳情介面
interface ProductDetails {
  _id: Types.ObjectId;
  code: string;
  name: string;
}

// 擴展 Request 介面以包含用戶資訊
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

const router: express.Router = express.Router();

// @route   GET api/accounting
// @desc    獲取所有記帳記錄
// @access  Private
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, shift, search } = req.query as AccountingQueryParams;
    
    const query: Record<string, any> = {};
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    if (shift) query.shift = shift.toString();
    
    // 新增內文搜尋邏輯
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i'); // 不區分大小寫的正則表達式
      query.$or = [
        { 'items.category': searchRegex }, // 搜尋項目類別
        { 'items.note': searchRegex },     // 搜尋項目備註
      ];
    }
    
    const accountingRecords = await Accounting.find(query).sort({ date: -1, shift: 1 });
    
    const response: ApiResponse<any[]> = {
      success: true,
      message: '記帳記錄獲取成功',
      data: accountingRecords,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    console.error((err as Error).message);
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   GET api/accounting/unaccounted-sales
// @desc    獲取所有監測產品在特定日期尚未標記的銷售記錄 (按銷售單號前綴篩選)
// @access  Private
router.get('/unaccounted-sales', auth, async (req: Request, res: Response) => {
  try {
    const { date } = req.query as AccountingQueryParams;
    
    if (!date) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '缺少日期參數',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
    }

    let datePrefix: string;
    try {
      datePrefix = format(new Date(date), 'yyyyMMdd');
    } catch (formatError) {
      console.error('日期格式化錯誤:', formatError);
      const errorResponse: ErrorResponse = {
        success: false,
        message: '無效的日期格式',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
    }

    const monitored = await MonitoredProduct.find({}, 'productCode');
    if (!monitored || monitored.length === 0) {
      const response: ApiResponse<any[]> = {
        success: true,
        message: '無監測產品',
        data: [],
        timestamp: new Date()
      };
      res.json(response);
      return;
    }
    
    const monitoredProductCodes = monitored.map((p: any) => p.productCode);

    const products = await BaseProduct.find(
      {
        $or: [
          { code: { $in: monitoredProductCodes } },
          { shortCode: { $in: monitoredProductCodes } }
        ]
      },
      '_id code shortCode name'
    );
    
    if (!products || products.length === 0) {
      const response: ApiResponse<any[]> = {
        success: true,
        message: '無相關產品',
        data: [],
        timestamp: new Date()
      };
      res.json(response);
      return;
    }
    
    const monitoredProductIds = products.map((p: any) => p._id);
    const productMap = products.reduce((map: Record<string, ProductDetails>, p: any) => {
      map[p._id.toString()] = p;
      return map;
    }, {});

    const sales = await Inventory.find({
      product: { $in: monitoredProductIds },
      type: { $in: ['sale', 'sale-no-stock'] },
      accountingId: null,
      saleNumber: { $regex: `^${datePrefix}` }
    }).sort({ lastUpdated: 1 });

    // Manually add product details to sales records
    const salesWithProductDetails = sales.map((sale: any) => {
      const productDetails = productMap[sale.product.toString()];
      return {
        ...sale.toObject(), // Convert Mongoose doc to plain object
        product: productDetails 
          ? { _id: productDetails._id, code: productDetails.code, name: productDetails.name }
          : { _id: sale.product, code: 'N/A', name: '未知產品' }
      };
    });

    const response: ApiResponse<any[]> = {
      success: true,
      message: '未標記銷售記錄獲取成功',
      data: salesWithProductDetails,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    console.error('查詢未標記銷售記錄失敗:', (err as Error).message);
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   GET api/accounting/summary/daily
// @desc    獲取每日記帳摘要
// @access  Private
router.get('/summary/daily', auth, async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query as AccountingQueryParams;
    
    const matchStage: Record<string, any> = {};
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }
    
    const summary = await Accounting.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { 
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, 
            shift: '$shift' 
          },
          totalAmount: { $first: '$totalAmount' }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          shifts: { 
            $push: { 
              shift: '$_id.shift', 
              totalAmount: '$totalAmount' 
            } 
          },
          dailyTotal: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: -1 } }
    ]);
    
    const response: ApiResponse<DailySummary[]> = {
      success: true,
      message: '每日記帳摘要獲取成功',
      data: summary,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    console.error((err as Error).message);
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   GET api/accounting/:id
// @desc    獲取單筆記帳記錄
// @access  Private
router.get('/:id', auth, async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: '記帳記錄ID為必填項',
      timestamp: new Date()
    };
    res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
    return;
  }
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: '無效的記帳記錄 ID 格式',
      timestamp: new Date()
    };
    res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
    return;
  }
  
  try {
    const accounting = await Accounting.findById(id);
    if (!accounting) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '找不到記帳記錄',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }
    
    const response: ApiResponse<any> = {
      success: true,
      message: '記帳記錄獲取成功',
      data: accounting,
      timestamp: new Date()
    };
    
    res.json(response);
  } catch (err) {
    console.error((err as Error).message);
    
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   POST api/accounting
// @desc    新增記帳記錄 (將關聯銷售加入 items, 僅限監測產品, 名目為其他自費, 備註含數量)
// @access  Private
router.post(
  '/',
  auth,
  [
    check('date', '日期為必填欄位').not().isEmpty(),
    check('shift', '班別為必填欄位').isIn(['早', '中', '晚']),
    check('items', '至少需要一個項目').isArray(), // Allow empty initially, will add sales
    check('items.*.amount', '金額必須為數字').optional().isFloat(),
    check('items.*.category', '名目為必填欄位').optional().not().isEmpty()
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
        error: JSON.stringify(errors.array()),
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
    }

    try {
      const { date, shift, status } = req.body as AccountingRequest;
      let items = req.body.items ?? []; // Get items from request or default to empty array
      const accountingDate = new Date(date);

      // 檢查是否已存在相同日期和班別的記錄
      const existingRecord = await Accounting.findOne({ 
        date: accountingDate, 
        shift: shift.toString() 
      });
      
      if (existingRecord) {
        res.status(400).json({ msg: '該日期和班別已有記帳記錄' });
        return;
      }

      // 找出該日期對應銷售單號前綴且尚未標記的 *監測產品* 銷售記錄
      let datePrefix: string;
      try {
        datePrefix = format(accountingDate, 'yyyyMMdd');
      } catch (formatError) {
        console.error('內部日期格式化錯誤:', formatError);
        throw new Error('內部日期格式化錯誤'); 
      }

      // 1. 獲取監測產品列表
      const monitored = await MonitoredProduct.find({}, 'productCode');
      const monitoredProductCodes = monitored.map((p: any) => p.productCode);
      let monitoredProductIds: Types.ObjectId[] = [];
      
      if (monitoredProductCodes.length > 0) {
        const products = await BaseProduct.find(
          {
            $or: [
              { code: { $in: monitoredProductCodes } },
              { shortCode: { $in: monitoredProductCodes } }
            ]
          },
          '_id code shortCode'
        );
        monitoredProductIds = products.map((p: any) => p._id);
      }
      
      let unaccountedSales: any[] = [];
      if (monitoredProductIds.length > 0) {
        // 2. 查找符合條件的銷售記錄 (僅限監測產品)
        unaccountedSales = await Inventory.find({
          product: { $in: monitoredProductIds }, // *** 只查找監測產品 ***
          type: { $in: ['sale', 'sale-no-stock'] },
          accountingId: null,
          saleNumber: { $regex: `^${datePrefix}` }
        }).populate('product', 'name'); // Populate product name
      }

      // 將未結算銷售轉換為記帳項目並加入 items 陣列
      const salesItems: AccountingItem[] = unaccountedSales.map((sale: any) => ({
        amount: sale.totalAmount ?? 0,
        category: '其他自費', // *** 將名目設為 其他自費 ***
        categoryId: null, // Find the ID for '其他自費' category if needed
        note: `${sale.saleNumber} - ${sale.product ? sale.product.name : '未知產品'}#${Math.abs(sale.quantity ?? 0)}`, // *** 加入數量 ***
        isAutoLinked: true // Add a flag to differentiate if needed
      }));
      
      // 合併手動輸入的項目和自動關聯的銷售項目
      const allItems: AccountingItem[] = [...items, ...salesItems];

      // 檢查合併後是否有項目
      if (allItems.length === 0) {
        res.status(400).json({ msg: '沒有手動輸入的項目，且當日無自動關聯的銷售記錄' });
        return;
      }

      // 計算最終總額 (所有項目加總)
      const finalTotalAmount = allItems.reduce((sum, item) => sum + (item.amount ?? 0), 0);

      // 新增記帳記錄 (包含合併後的項目和計算後的總額)
      const newAccounting = new Accounting({
        date: accountingDate,
        shift,
        items: allItems, // Use the merged items array
        totalAmount: finalTotalAmount, // Use the final calculated total
        status: status ?? 'pending', // Set status from request or default to pending
        createdBy: req.user?.id
      });

      const accounting = await newAccounting.save();

      // 更新銷售記錄的 accountingId *僅當狀態為 completed*
      if (status === 'completed' && unaccountedSales.length > 0) {
        const saleIdsToUpdate = unaccountedSales.map((sale: any) => sale._id);
        await Inventory.updateMany(
          { _id: { $in: saleIdsToUpdate } },
          { $set: { accountingId: accounting._id } }
        );
        console.log(`Linked ${saleIdsToUpdate.length} monitored sales to accounting record ${accounting._id} upon creation with completed status.`);
      }

      res.json(accounting);
    } catch (err) {
      console.error('新增記帳記錄失敗:', (err as Error).message);
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
        timestamp: new Date()
      };
      res.status(500).json(errorResponse);
    }
  }
);

// @route   PUT api/accounting/:id
// @desc    更新記帳記錄
// @access  Private
router.put(
  '/:id',
  auth,
  [
    check('date', '日期為必填欄位').optional().not().isEmpty(),
    check('shift', '班別為必填欄位').optional().isIn(['早', '中', '晚']),
    check('items', '至少需要一個項目').optional().isArray().not().isEmpty(),
    check('items.*.amount', '金額必須為數字').optional().isFloat(),
    check('items.*.category', '名目為必填欄位').optional().not().isEmpty(),
    check('status', '狀態必須為有效值').optional().isIn(['pending', 'completed'])
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    
    const { id } = req.params;
    
    if (!id) {
      res.status(400).json({ msg: '記帳記錄ID為必填項' });
      return;
    }
    
    // 驗證ID格式並轉換為安全的ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ msg: '無效的記帳記錄 ID 格式' });
      return;
    }

    try {
      const { date, shift, items, status } = req.body as AccountingRequest;

      let accounting = await Accounting.findById(id);
      if (!accounting) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: '找不到記帳記錄',
          timestamp: new Date()
        };
        res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
        return;
      }

      const accountingDate = date ? new Date(date) : accounting.date;
      const accountingShift = shift || accounting.shift;
      
      // 判斷是否為僅更新狀態的請求
      const isStatusOnlyUpdate = !items && !date && !shift && status;
      
      let finalItems: AccountingItem[];
      let finalTotalAmount: number;
      let linkedSaleIds: Types.ObjectId[] = [];
      
      if (isStatusOnlyUpdate) {
        // 僅更新狀態：保持現有的所有項目不變
        finalItems = accounting.items;
        finalTotalAmount = accounting.totalAmount;
        
        // 處理狀態變更的銷售記錄關聯 - 完整模擬所有事件
        if (status === 'completed' && accounting.status === 'pending') {
          // 狀態從 pending 變為 completed：執行完整的關聯邏輯
          console.log(`Status change: pending -> completed for accounting record ${accounting._id}`);
          
          // 0. 先清空現有的銷售記錄關聯（模擬編輯時的清空操作）
          const unlinkResult = await Inventory.updateMany(
            { accountingId: accounting._id },
            { $set: { accountingId: null } }
          );
          console.log(`Cleared ${unlinkResult.modifiedCount} existing sales associations before re-linking`);
          
          // 1. 重新獲取該日期的所有未關聯監測產品銷售記錄
          let datePrefix: string;
          try {
            datePrefix = format(accountingDate, 'yyyyMMdd');
          } catch (formatError) {
            console.error('日期格式化錯誤 during status completion:', formatError);
            throw new Error('日期格式化錯誤');
          }

          // 2. 獲取監測產品列表
          const monitored = await MonitoredProduct.find({}, 'productCode');
          const monitoredProductCodes = monitored.map((p: any) => p.productCode);
          let monitoredProductIds: Types.ObjectId[] = [];
          
          if (monitoredProductCodes.length > 0) {
            const products = await BaseProduct.find(
              {
                $or: [
                  { code: { $in: monitoredProductCodes } },
                  { shortCode: { $in: monitoredProductCodes } }
                ]
              },
              '_id code shortCode'
            );
            monitoredProductIds = products.map((p: any) => p._id);
          }
          
          // 3. 查找該日期所有未關聯的監測產品銷售記錄
          let unaccountedSales: any[] = [];
          if (monitoredProductIds.length > 0) {
            unaccountedSales = await Inventory.find({
              product: { $in: monitoredProductIds },
              type: { $in: ['sale', 'sale-no-stock'] },
              accountingId: null, // 只關聯尚未被其他記帳記錄關聯的銷售
              saleNumber: { $regex: `^${datePrefix}` }
            }).populate('product', 'name'); // 需要產品名稱來生成項目
          }
          
          // 4. 先清空現有的自動關聯項目，然後重新加入所有監測產品
          // 模擬清空事件：移除所有自動關聯項目
          const manualItems = accounting.items.filter((item: any) => !item.isAutoLinked);
          console.log(`Cleared ${accounting.items.length - manualItems.length} existing auto-linked items`);
          
          // 重新加入所有未關聯的監測產品銷售記錄
          if (unaccountedSales.length > 0) {
            const newSalesItems: AccountingItem[] = unaccountedSales.map((sale: any) => ({
              amount: sale.totalAmount ?? 0,
              category: '其他自費',
              categoryId: null,
              note: `${sale.saleNumber} - ${sale.product ? sale.product.name : '未知產品'}#${Math.abs(sale.quantity ?? 0)}`,
              isAutoLinked: true
            }));
            
            // 合併手動項目和新的銷售項目
            finalItems = [...manualItems, ...newSalesItems];
            
            // 重新計算總金額
            finalTotalAmount = finalItems.reduce((sum, item) => sum + (item.amount ?? 0), 0);
            
            console.log(`Added ${newSalesItems.length} new sales items to accounting record ${accounting._id} after clearing existing auto-linked items`);
            
            // 關聯所有未關聯的銷售記錄
            linkedSaleIds = unaccountedSales.map((sale: any) => sale._id);
            
            // 執行實際的銷售記錄關聯操作
            if (linkedSaleIds.length > 0) {
              await Inventory.updateMany(
                { _id: { $in: linkedSaleIds } },
                { $set: { accountingId: accounting._id } }
              );
              console.log(`Linked ${linkedSaleIds.length} sales to accounting record ${accounting._id} during status change to completed.`);
            }
          } else {
            // 如果沒有新的銷售記錄，只保留手動項目
            finalItems = manualItems;
            finalTotalAmount = finalItems.reduce((sum, item) => sum + (item.amount ?? 0), 0);
            console.log(`No new sales items found, kept only ${manualItems.length} manual items`);
          }
          
        } else if (status === 'pending' && accounting.status === 'completed') {
          // 狀態從 completed 變為 pending：取消關聯銷售記錄
          console.log(`Status change: completed -> pending for accounting record ${accounting._id}`);
          const unlinkResult = await Inventory.updateMany(
            { accountingId: accounting._id },
            { $set: { accountingId: null } }
          );
          console.log(`Unlinked ${unlinkResult.modifiedCount} sales from accounting record ${accounting._id} during status change to pending.`);
        }
      } else {
        // 完整更新：重新處理項目和自動關聯
        const manualItemsFromRequest = items || accounting.items.filter((item: any) => !item.isAutoLinked);

        // 檢查日期和班別衝突（如果有更新的話）
        if (date || shift) {
          const safeParamId = new mongoose.Types.ObjectId(id);
          const existingRecord = await Accounting.findOne({
            date: accountingDate,
            shift: accountingShift.toString(),
            _id: { $ne: safeParamId }
          });

          if (existingRecord) {
            res.status(400).json({ msg: '該日期和班別已有其他記帳記錄' });
            return;
          }
        }

        // 1. Always unlink previously associated sales regardless of the final status
        const unlinkResult = await Inventory.updateMany(
          { accountingId: accounting._id },
          { $set: { accountingId: null } }
        );
        
        if (unlinkResult.modifiedCount > 0) {
          console.log(`Unlinked ${unlinkResult.modifiedCount} previous sales from accounting record ${accounting._id} during update.`);
        }

        // 2. Re-fetch current sales to include in items and total
        let datePrefix: string;
        try {
          datePrefix = format(accountingDate, 'yyyyMMdd');
        } catch (formatError) {
          console.error('內部日期格式化錯誤 during update:', formatError);
          throw new Error('內部日期格式化錯誤'); 
        }
        
        const monitored = await MonitoredProduct.find({}, 'productCode');
        const monitoredProductCodes = monitored.map((p: any) => p.productCode);
        let monitoredProductIds: Types.ObjectId[] = [];
        
        if (monitoredProductCodes.length > 0) {
          const products = await BaseProduct.find(
            {
              $or: [
                { code: { $in: monitoredProductCodes } },
                { shortCode: { $in: monitoredProductCodes } }
              ]
            },
            '_id code shortCode'
          );
          monitoredProductIds = products.map((p: any) => p._id);
        }
        
        let currentUnaccountedSales: any[] = [];
        if (monitoredProductIds.length > 0) {
          currentUnaccountedSales = await Inventory.find({
            product: { $in: monitoredProductIds },
            type: { $in: ['sale', 'sale-no-stock'] },
            accountingId: null, // Find currently unlinked sales
            saleNumber: { $regex: `^${datePrefix}` }
          }).populate('product', 'name');
        }

        const newSalesItems: AccountingItem[] = currentUnaccountedSales.map((sale: any) => ({
          amount: sale.totalAmount ?? 0,
          category: '其他自費',
          categoryId: null,
          note: `${sale.saleNumber} - ${sale.product ? sale.product.name : '未知產品'}#${Math.abs(sale.quantity ?? 0)}`,
          isAutoLinked: true
        }));

        // Merge manual items and current sales for storage
        finalItems = [...manualItemsFromRequest, ...newSalesItems];
        finalTotalAmount = finalItems.reduce((sum, item) => sum + (item.amount ?? 0), 0);
        linkedSaleIds = currentUnaccountedSales.map((sale: any) => sale._id); // Prepare IDs to link if completed
      }

      // 3. Update the accounting record
      accounting.date = accountingDate;
      if (shift) accounting.shift = shift; // Only update shift if provided
      accounting.items = finalItems.map(item => {
        const accountingItem: any = {
          amount: item.amount,
          category: item.category,
          isAutoLinked: item.isAutoLinked
        };
        
        if (item.notes) {
          accountingItem.note = item.notes;
        }
        
        if (item.categoryId) {
          accountingItem.categoryId = item.categoryId;
        }
        
        return accountingItem;
      });
      accounting.totalAmount = finalTotalAmount;
      if (status) accounting.status = status;

      accounting = await accounting.save();

      // 4. Link the sales *only* if status is being set to completed
      if (status === 'completed' && linkedSaleIds.length > 0) {
        await Inventory.updateMany(
          { _id: { $in: linkedSaleIds } },
          { $set: { accountingId: accounting._id } }
        );
        console.log(`Linked ${linkedSaleIds.length} current sales to accounting record ${accounting._id} upon completion.`);
      }
      
      res.json(accounting);
    } catch (err) {
      console.error('更新記帳記錄失敗:', (err as Error).message);
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
        timestamp: new Date()
      };
      res.status(500).json(errorResponse);
    }
  }
);

// @route   DELETE api/accounting/:id
// @desc    刪除記帳記錄
// @access  Private
router.delete('/:id', auth, async (req: Request, res: Response) => {
  const { id } = req.params;
  
  if (!id) {
    res.status(400).json({ msg: '記帳記錄ID為必填項' });
    return;
  }
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ msg: '無效的記帳記錄 ID 格式' });
    return;
  }

  try {
    const accounting = await Accounting.findById(id);
    if (!accounting) {
      res.status(404).json({ msg: '找不到記帳記錄' });
      return;
    }

    // 1. 取消與此記帳記錄關聯的銷售記錄標記
    const updateResult = await Inventory.updateMany(
      { accountingId: accounting._id },
      { $set: { accountingId: null } }
    );
    console.log(`Unlinked ${updateResult.modifiedCount} sales from accounting record ${accounting._id}`);

    // 2. 刪除記帳記錄
    await Accounting.findByIdAndDelete(id);

    res.json({ msg: '記帳記錄已刪除，相關銷售記錄已取消連結' });
  } catch (err) {
    console.error('刪除記帳記錄失敗:', (err as Error).message);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(500).json(errorResponse);
  }
});

export default router;