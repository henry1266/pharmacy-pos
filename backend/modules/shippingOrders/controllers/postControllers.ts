import { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import fs from 'fs';
import ShippingOrder from '../../../models/ShippingOrder';
import Customer from '../../../models/Customer';
import OrderNumberService from '../../../utils/OrderNumberService';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  handleDatabaseError,
  handleShippingOrderId,
  validateProductsAndInventory,
  findSupplier,
  createShippingInventoryRecords
} from '../services';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';
import { ShippingOrderRequest } from '../types';

/**
 * 創建新出貨單的驗證規則
 */
export const createShippingOrderValidation = [
  check('sosupplier', '供應商為必填項').not().isEmpty(),
  check('items', '至少需要一個藥品項目').isArray().not().isEmpty()
];

/**
 * 創建新出貨單
 * @route POST /api/shipping-orders
 */
export async function createShippingOrder(req: Request, res: Response) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json(createErrorResponse(ERROR_MESSAGES.GENERIC.VALIDATION_FAILED, errors.array()));
    return;
  }

  try {
    let { soid, sosupplier, supplier, items, notes, status, paymentStatus } = req.body as ShippingOrderRequest;

    // 處理出貨單號
    const soidResult = await handleShippingOrderId(soid);
    if (soidResult.error) {
      res.status(400).json(createErrorResponse(soidResult.error));
      return;
    }
    soid = soidResult.soid;

    // 生成唯一訂單號
    const orderNumber = await OrderNumberService.generateUniqueOrderNumber('shipping', soid!);

    // 驗證產品並檢查庫存 - 允許負庫存
    const productsResult = await validateProductsAndInventory(items, true);
    if (!productsResult.valid) {
      res.status(400).json(createErrorResponse(productsResult.error || ERROR_MESSAGES.GENERIC.VALIDATION_FAILED));
      return;
    }
    items = productsResult.items!;

    // 查找供應商
    const supplierId = await findSupplier(supplier, sosupplier);

    // 創建新出貨單
    const shippingOrder = new ShippingOrder({
      soid,
      orderNumber,
      sosupplier,
      supplier: supplierId,
      items,
      notes,
      status: status || 'pending',
      paymentStatus: paymentStatus || '未收'
    });

    await shippingOrder.save();

    // 如果狀態為已完成，則創建ship類型庫存記錄
    if (shippingOrder.status === 'completed') {
      await createShippingInventoryRecords(shippingOrder);
    }

    res.json(createSuccessResponse(shippingOrder, SUCCESS_MESSAGES.GENERIC.CREATED));
  } catch (err) {
    handleDatabaseError(res, err as Error, '創建出貨單錯誤');
  }
}

/**
 * 導入出貨單基本資訊CSV
 * @route POST /api/shipping-orders/import/basic
 */
export async function importShippingOrdersBasic(req: Request, res: Response) {
  try {
    if (!req.file) {
      res.status(400).json(createErrorResponse('請上傳CSV文件'));
      return;
    }

    const results: any[] = [];
    const errors: string[] = [];
    let successCount = 0;

    // 讀取並解析CSV文件
    // 在這裡導入 csv-parser，只在需要時使用
    const csv = require('csv-parser');
    
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data: any) => results.push(data))
      .on('end', async () => {
        // 刪除上傳的文件
        fs.unlinkSync(req.file!.path);

        // 處理每一行數據
        for (const row of results) {
          try {
            // 檢查必要字段
            if (!row['出貨單號'] || !row['客戶']) {
              errors.push(`行 ${results.indexOf(row) + 1}: 出貨單號和客戶為必填項`);
              continue;
            }

            // 檢查出貨單號是否已存在
            const existingSO = await ShippingOrder.findOne({ soid: row['出貨單號'] });
            if (existingSO) {
              errors.push(`行 ${results.indexOf(row) + 1}: 出貨單號 ${row['出貨單號']} 已存在`);
              continue;
            }

            // 準備出貨單數據
            const shippingOrderData: any = {
              soid: row['出貨單號'],
              sobill: row['發票號'] ?? '',
              socustomer: row['客戶'],
              paymentStatus: row['付款狀態'] ?? '未收',
              items: [],
              status: 'pending'
            };

            // 嘗試查找客戶
            const customerDoc = await Customer.findOne({ name: row['客戶'] });
            if (customerDoc) {
              shippingOrderData.customer = customerDoc._id;
            }

            // 創建出貨單
            const shippingOrder = new ShippingOrder(shippingOrderData);
            await shippingOrder.save();
            successCount++;
          } catch (err) {
            errors.push(`行 ${results.indexOf(row) + 1}: ${(err as Error).message}`);
          }
        }

        // 返回結果
        res.json({
          msg: `成功導入 ${successCount} 筆出貨單基本資訊${errors.length > 0 ? '，但有部分錯誤' : ''}`,
          success: successCount,
          errors: errors
        });
      });
  } catch (err) {
    handleDatabaseError(res, err as Error, 'CSV導入錯誤');
  }
}