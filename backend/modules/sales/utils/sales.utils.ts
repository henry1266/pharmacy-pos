import Sale from '../../../models/Sale';
import logger from '../../../utils/logger';
import { SaleFieldsInput } from '../sales.types';

// SSOT helpers: map API <-> Model item fields
export function mapApiItemsToModelItems(items: any[] = []): any[] {
  return (items || []).map((item: any) => {
    const { notes, ...rest } = item || {};
    return notes !== undefined ? { ...rest, note: notes } : { ...rest };
  });
}

export function mapModelItemsToApiItems(items: any[] = []): any[] {
  return (items || []).map((item: any) => {
    // Normalize potential mongoose subdocs to plain objects
    const src = item && typeof item.toObject === 'function' ? item.toObject() : (item || {});
    const productPlain = src.product && typeof src.product?.toObject === 'function'
      ? src.product.toObject()
      : src.product;
    // Extract note and reassign as notes, keep product explicitly
    const { note, product, ...rest } = src;
    const base = { ...rest, product: productPlain ?? product };
    return note !== undefined ? { ...base, notes: note } : base;
  });
}

export function normalizePaymentMethod(method?: string): string | undefined {
  if (!method) return method;
  // Align to shared/enums PaymentMethod while keeping backward compatibility
  switch (method) {
    case 'card':
      return 'credit_card';
    default:
      return method;
  }
}

// 生成銷貨單號
export async function generateSaleNumber(saleNumber?: string): Promise<string> {
  // 如果前端提供了銷貨單號，記錄但不使用它
  if (saleNumber && saleNumber.trim() !== '') {
    //logger.debug(`前端提供了銷貨單號: "${saleNumber}"，但將被忽略以確保序號連續性`);
  }

  //logger.debug(`由後端生成銷貨單號`);

  try {
    // 生成日期前綴（YYYYMMDD）
    const today = new Date();
    const year = today.getFullYear().toString();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // 月份從0開始，需要+1
    const day = String(today.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;
    
    //logger.debug(`生成日期前綴: ${datePrefix}`);

    // 查詢數據庫中以該日期前綴開頭的所有銷貨單號
    const regexPattern = `^${datePrefix}\\d{3}$`; // 匹配格式: YYYYMMDD + 3位數字
    const query = { saleNumber: { $regex: new RegExp(regexPattern) } };
    //logger.debug(`查詢當日銷貨單號，日期前綴: ${datePrefix}, 正則表達式: ${regexPattern}`);
    
    // 先獲取所有匹配的銷貨單號，以便記錄日誌
    const allSales = await Sale.find(query).lean();
    //logger.debug(`找到 ${allSales.length} 個匹配的銷貨單號`);
    
    // 記錄所有找到的銷貨單號，以便分析
    if (allSales.length > 0) {
      // const allSaleNumbers = allSales.map(sale => sale.saleNumber);
      //logger.debug(`所有匹配的銷貨單號: ${JSON.stringify(allSaleNumbers)}`);
    }
    
    // 按銷貨單號降序排序，找出最大的一個
    const latestSales = await Sale.find(query)
      .sort({ saleNumber: -1 })
      .limit(1)
      .lean();
    
    // 設置默認序號
    let sequenceNumber = 1;
    
    // 如果找到了當天的銷貨單號，提取序號部分並加1
    if (latestSales.length > 0 && latestSales[0] && latestSales[0].saleNumber) {
      const latestSaleNumber = latestSales[0].saleNumber;
      //logger.debug(`找到當天最後一個銷貨單號: ${latestSaleNumber}`);
      
      // 提取序號部分（最後3位）
      const sequencePart = latestSaleNumber.slice(-3);
      const sequence = parseInt(sequencePart, 10);
      
      if (!isNaN(sequence)) {
        sequenceNumber = sequence + 1;
        //logger.debug(`提取序號: ${sequence}, 新序號: ${sequenceNumber}`);
      } else {
        logger.warn(`無法從銷貨單號 ${latestSaleNumber} 提取有效序號，使用默認值1`);
      }
    } else {
      logger.debug(`未找到當天銷貨單號，使用起始序號1`);
    }
    
    // 嘗試使用數字排序而不是字典序排序
    if (allSales.length > 1) {
      // 提取所有序號並按數字大小排序
      const allSequences = allSales.map(sale => {
        // 確保 sale.saleNumber 存在
        if (sale && sale.saleNumber) {
          const sequencePart = sale.saleNumber.slice(-3);
          return parseInt(sequencePart, 10);
        }
        return NaN; // 如果 saleNumber 不存在，返回 NaN
      }).filter(seq => !isNaN(seq));
      
      if (allSequences.length > 0) {
        // 找出最大序號
        const maxSequence = Math.max(...allSequences);
        //logger.debug(`使用數字排序找到的最大序號: ${maxSequence}`);
        
        // 比較兩種方法找到的最大序號
        if (maxSequence + 1 !== sequenceNumber) {
          logger.warn(`警告：兩種方法找到的最大序號不一致！字典序: ${sequenceNumber - 1}, 數字排序: ${maxSequence}`);
          // 使用數字排序找到的最大序號
          sequenceNumber = maxSequence + 1;
          //logger.debug(`使用數字排序的結果，新序號: ${sequenceNumber}`);
        }
      }
    }
    
    // 確保序號不超過3位數
    if (sequenceNumber > 999) {
      logger.warn(`序號 ${sequenceNumber} 超過3位數限制，重置為1`);
      sequenceNumber = 1;
    }
    
    // 格式化序號為3位數（例如：001, 010, 100）
    const formattedSequence = String(sequenceNumber).padStart(3, '0');
    
    // 組合最終銷貨單號
    const finalSaleNumber = `${datePrefix}${formattedSequence}`;
    
    logger.debug(`生成銷貨單號: ${finalSaleNumber}`);
    
    return finalSaleNumber;
  } catch (error) {
    logger.error(`生成銷貨單號時出錯: ${error instanceof Error ? error.message : String(error)}`);
    throw new Error('系統無法生成銷貨單號，請稍後再試');
  }
}

// 建立銷售記錄欄位
export function buildSaleFields(saleData: SaleFieldsInput): Record<string, any> {
  // Ensure saleNumber is never empty to prevent duplicate key errors
  if (!saleData.saleNumber) {
    logger.error('嘗試創建銷售記錄時銷貨單號為空');
    throw new Error('Sale number cannot be empty');
  }
  
  const saleFields: Record<string, any> = {
    saleNumber: saleData.saleNumber,
    // Map API items (notes) to model items (note)
    items: mapApiItemsToModelItems(saleData.items as any),
    totalAmount: saleData.totalAmount,
  };
  
  if (saleData.customer) saleFields.customer = saleData.customer;
  if (saleData.discount) saleFields.discount = saleData.discount;
  if (saleData.paymentMethod) saleFields.paymentMethod = normalizePaymentMethod(saleData.paymentMethod) as any;
  if (saleData.paymentStatus) saleFields.paymentStatus = saleData.paymentStatus as any;
  if (saleData.notes) saleFields.notes = saleData.notes;
  if (saleData.cashier) saleFields.cashier = saleData.cashier;
  
  // 計算最終金額
  saleFields.finalAmount = saleFields.totalAmount - (saleFields.discount ?? 0);
  
  return saleFields;
}
