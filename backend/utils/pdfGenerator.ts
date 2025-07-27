// PDFKit 型別定義
interface PDFDocumentOptions {
  size?: string;
  margin?: number;
  info?: {
    Title?: string;
    Author?: string;
    Subject?: string;
  };
}

interface PDFDocument {
  registerFont(name: string, path: string): void;
  font(name: string): PDFDocument;
  fontSize(size: number): PDFDocument;
  text(text: string, options?: any): PDFDocument;
  text(text: string, x: number, y: number, options?: any): PDFDocument;
  moveDown(lines?: number): PDFDocument;
  moveTo(x: number, y: number): PDFDocument;
  lineTo(x: number, y: number): PDFDocument;
  stroke(): PDFDocument;
  addPage(): PDFDocument;
  switchToPage(pageNumber: number): PDFDocument;
  bufferedPageRange(): { count: number };
  end(): void;
  on(event: string, callback: (chunk: Buffer) => void): void;
  y: number;
  page: { width: number; height: number };
  pipe(stream: any): void;
}

type PDFDocumentConstructor = new (options?: PDFDocumentOptions) => PDFDocument;

// 使用 require 來避免模組宣告問題
const PDFDocument = require('pdfkit') as PDFDocumentConstructor;

import dayjs from 'dayjs';
import { Types } from 'mongoose';
import { PDFGenerationOptions, PDFGenerationResult } from '@pharmacy-pos/shared/types/utils';

// PDF 生成相關型別定義
export interface ShippingOrderPDFData {
  soid?: string; // 出貨單號 (legacy field name)
  orderNumber?: string; // 標準訂單號
  sosupplier?: string; // 供應商名稱 (legacy field name)
  customerName?: string; // 客戶名稱
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus?: 'paid' | 'unpaid' | 'pending';
  discountAmount?: number;
  totalAmount?: number;
  customer?: {
    name: string;
    [key: string]: any;
  };
  items: ShippingOrderPDFItem[];
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ShippingOrderPDFItem {
  dname?: string; // 產品名稱 (legacy field name)
  dquantity?: number; // 數量 (legacy field name)
  dprice?: number; // 單價 (legacy field name)
  productName?: string; // 標準產品名稱
  quantity?: number; // 標準數量
  unitPrice?: number; // 標準單價
  product?: Types.ObjectId;
  subtotal?: number;
}


/**
 * 生成出貨單PDF
 * @param shippingOrder - 出貨單資料
 * @param options - PDF 生成選項
 * @returns 返回PDF Buffer
 */
export const createShippingOrderPdf = async (
  shippingOrder: ShippingOrderPDFData,
  options: PDFGenerationOptions = {}
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      // 創建PDF文檔
      const doc = new PDFDocument({
        size: 'A4',
        margin: options.margins?.top || 50,
        info: {
          Title: `出貨單 #${shippingOrder.soid || shippingOrder.orderNumber}`,
          Author: '藥局POS系統',
          Subject: '出貨單',
        }
      });

      // 設置中文字體
      try {
        doc.registerFont('NotoSansCJK', '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc');
        doc.font('NotoSansCJK');
      } catch (fontError) {
        console.warn('無法載入中文字體，使用預設字體:', fontError);
        // 使用預設字體繼續
      }

      // 緩衝區收集PDF數據
      const buffers: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => buffers.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });

      // 添加標題
      doc.fontSize(options.fontSize || 20).text('出貨單', { align: 'center' });
      doc.moveDown();

      // 添加出貨單基本信息
      doc.fontSize(12);
      doc.text(`出貨單號: ${shippingOrder.soid || shippingOrder.orderNumber || 'N/A'}`, { continued: false });
      doc.text(`客戶: ${shippingOrder.customer?.name || shippingOrder.customerName || shippingOrder.sosupplier || '未指定'}`, { continued: false });
      doc.text(`狀態: ${getStatusText(shippingOrder.status)}`, { continued: false });
      doc.text(`付款狀態: ${getPaymentStatusText(shippingOrder.paymentStatus)}`, { continued: false });
      doc.text(`建立日期: ${formatDate(shippingOrder.createdAt)}`, { continued: false });
      doc.text(`更新日期: ${formatDate(shippingOrder.updatedAt)}`, { continued: false });
      
      if (shippingOrder.notes) {
        doc.moveDown();
        doc.text('備註:', { continued: false });
        doc.text(shippingOrder.notes, { continued: false });
      }
      
      doc.moveDown();
      
      // 添加分隔線
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
      doc.moveDown();

      // 添加項目表格標題
      const tableTop = doc.y;
      const tableHeaders = ['項目', '數量', '單價', '小計'];
      const columnWidths = [250, 70, 70, 70];
      let currentY = tableTop;

      // 繪製表格標題
      doc.font('NotoSansCJK').fontSize(10);
      let currentX = 50;
      tableHeaders.forEach((header, i) => {
        const width = columnWidths[i];
        if (width !== undefined) {
          doc.text(header, currentX, currentY, { width, align: 'left' });
          currentX += width;
        }
      });
      currentY += 20;
      
      // 繪製表格內容
      if (shippingOrder.items && shippingOrder.items.length > 0) {
        shippingOrder.items.forEach((item, _index) => {
          // 檢查是否需要新頁
          if (currentY > doc.page.height - 100) {
            doc.addPage();
            currentY = 50;
            
            // 在新頁重繪表格標題
            currentX = 50;
            tableHeaders.forEach((header, i) => {
              const width = columnWidths[i];
              if (width !== undefined) {
                doc.text(header, currentX, currentY, { width, align: 'left' });
                currentX += width;
              }
            });
            currentY += 20;
          }
          
          // 繪製項目行
          currentX = 50;
          const width0 = columnWidths[0];
          const width1 = columnWidths[1];
          const width2 = columnWidths[2];
          const width3 = columnWidths[3];
          
          if (width0 !== undefined) {
            doc.text(item.dname || item.productName || 'N/A', currentX, currentY, { width: width0, align: 'left' });
            currentX += width0;
          }
          
          const quantity = item.dquantity || item.quantity || 0;
          if (width1 !== undefined) {
            doc.text(quantity.toString(), currentX, currentY, { width: width1, align: 'right' });
            currentX += width1;
          }
          
          const unitPrice = item.dprice || item.unitPrice || 0;
          if (width2 !== undefined) {
            doc.text(formatCurrency(unitPrice), currentX, currentY, { width: width2, align: 'right' });
            currentX += width2;
          }
          
          const subtotal = quantity * unitPrice;
          if (width3 !== undefined) {
            doc.text(formatCurrency(subtotal), currentX, currentY, { width: width3, align: 'right' });
          }
          
          currentY += 20;
        });
      } else {
        doc.text('無項目', 50, currentY, { align: 'center' });
        currentY += 20;
      }
      
      // 添加分隔線
      doc.moveTo(50, currentY).lineTo(doc.page.width - 50, currentY).stroke();
      currentY += 20;
      
      // 添加金額信息
      const totalAmount = shippingOrder.totalAmount || 0;
      const discountAmount = shippingOrder.discountAmount || 0;
      const subtotal = totalAmount + discountAmount;
      
      doc.text(`小計: ${formatCurrency(subtotal)}`, { align: 'right' });
      
      if (discountAmount > 0) {
        doc.text(`折扣: ${formatCurrency(-discountAmount)}`, { align: 'right' });
      }
      
      doc.font('NotoSansCJK').fontSize(12).text(`總金額: ${formatCurrency(totalAmount)}`, { align: 'right' });
      
      doc.moveDown(2);
      
      // 添加簽名欄
      doc.fontSize(10);
      doc.text('客戶簽名: ____________________', 50, doc.y);
      doc.text('經手人: ____________________', 300, doc.y);
      
      doc.moveDown();
      doc.text(`列印日期: ${formatDate(new Date())}`, { align: 'center' });
      
      // 添加頁碼
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.text(`第 ${i + 1} 頁，共 ${pageCount} 頁`, 50, doc.page.height - 50, { align: 'center' });
      }
      
      // 完成PDF生成
      doc.end();
    } catch (error) {
      reject(new Error(`PDF 生成錯誤: ${error instanceof Error ? error.message : String(error)}`));
    }
  });
};

/**
 * 格式化日期
 * @param dateValue - 日期值
 * @returns 格式化後的日期字串
 */
const formatDate = (dateValue?: Date | string | null): string => {
  if (!dateValue) return 'N/A';
  return dayjs(dateValue).format('YYYY-MM-DD HH:mm');
};

/**
 * 格式化貨幣
 * @param value - 數值
 * @returns 格式化後的貨幣字串
 */
const formatCurrency = (value?: number | null): string => {
  if (value === undefined || value === null) return 'N/A';
  return `$${parseFloat(value.toString()).toFixed(2)}`;
};

/**
 * 獲取狀態文字
 * @param status - 狀態值
 * @returns 狀態文字
 */
const getStatusText = (status?: string): string => {
  switch (status) {
    case 'shipped':
      return '已出貨';
    case 'pending':
      return '待處理';
    case 'processing':
      return '處理中';
    case 'delivered':
      return '已送達';
    case 'cancelled':
      return '已取消';
    default:
      return status || '未知';
  }
};

/**
 * 獲取付款狀態文字
 * @param status - 付款狀態值
 * @returns 付款狀態文字
 */
const getPaymentStatusText = (status?: string): string => {
  switch (status) {
    case 'paid':
      return '已付款';
    case 'unpaid':
      return '未付款';
    case 'pending':
      return '待付款';
    default:
      return status || '未指定';
  }
};

/**
 * 生成出貨單PDF的包裝函數，提供更好的錯誤處理
 * @param shippingOrder - 出貨單資料
 * @param options - PDF 生成選項
 * @returns PDF 生成結果
 */
export const generateShippingOrderPdf = async (
  shippingOrder: ShippingOrderPDFData,
  options: PDFGenerationOptions = {}
): Promise<PDFGenerationResult> => {
  try {
    const buffer = await createShippingOrderPdf(shippingOrder, options);
    
    return {
      success: true,
      buffer,
      metadata: {
        pageCount: 1, // 實際頁數需要從 PDF 中計算
        fileSize: buffer.length,
        generatedAt: new Date(),
        processingTime: 0 // 可以在實際應用中計算處理時間
      }
    };
  } catch (error) {
    console.error('生成出貨單PDF時出錯:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知錯誤'
    };
  }
};

export default {
  createShippingOrderPdf,
  generateShippingOrderPdf
};