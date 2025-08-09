import express, { Request, Response } from 'express';
import path from 'path';
import { Types } from 'mongoose';
// import dayjs from 'dayjs';

// 使用 ES6 import 導入模型和PDFKit
const PDFDocument = require('pdfkit');
import ShippingOrder from '../models/ShippingOrder';
import BaseProduct from '../models/BaseProduct';

// 擴展PDFKit類型
interface PDFTextOptions {
  align?: string;
  continued?: boolean;
  width?: number;
}

// 定義介面
interface ShippingOrderItem {
  product: Types.ObjectId;
  did?: string;
  dname?: string;
  dquantity?: number;
  dtotalCost?: number;
  healthInsuranceCode?: string;
  packageQuantity?: number;
  boxQuantity?: number;
  unit?: string;
  batchNumber?: string;
}

interface ShippingOrderDocument {
  _id: Types.ObjectId;
  soid: string;
  orderNumber?: string;
  sosupplier: string;
  supplier?: Types.ObjectId;
  items: ShippingOrderItem[];
  notes?: string;
  status?: string;
  totalAmount?: number;
}

const router: express.Router = express.Router();

// 生成出貨單PDF - 移除isAuthenticated中間件以解決undefined問題
router.get('/pdf/:id', async (req: Request, res: Response) => {
  try {
    // 驗證 ID 參數存在性
    if (!req.params.id) {
      res.status(404).json({ msg: '找不到出貨單' });
      return;
    }

    // 移除populate('customer')以解決schema錯誤
    const shippingOrder = await ShippingOrder.findById(req.params.id).lean() as ShippingOrderDocument;
    
    if (!shippingOrder) {
      res.status(404).json({ msg: '找不到出貨單' });
      return;
    }
    
    // 收集所有產品ID
    const productIds = shippingOrder.items.map(item => item.product);
    
    // 批次查詢所有相關產品
    const products = await BaseProduct.find({ _id: { $in: productIds } }).lean();
    
    // 建立產品ID到健保代碼的映射
    const productHealthInsuranceMap: Record<string, string> = {};
    products.forEach((product: any) => {
      // 如果是藥品類型且有健保代碼，則記錄健保代碼
      if (product.productType === 'medicine' && product.healthInsuranceCode) {
        productHealthInsuranceMap[product._id.toString()] = product.healthInsuranceCode;
      } else {
        // 非藥品或無健保代碼時，使用產品代碼
        productHealthInsuranceMap[product._id.toString()] = product.code ?? 'N/A';
      }
    });
    
    // 為每個項目添加健保代碼
    shippingOrder.items = shippingOrder.items.map(item => {
      const productId = item.product.toString();
      return {
        ...item,
        healthInsuranceCode: productHealthInsuranceMap[productId] ?? 'N/A'
      };
    });

    // 創建PDF文檔
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `出貨單 #${shippingOrder.soid}`,
        Author: 'POS系統',
        Subject: '出貨單',
      }
    });
    
    // 設置響應頭
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=shipping_order_${shippingOrder.soid}.pdf`);
    
    // 將PDF流導向響應
    doc.pipe(res);

    // Windows環境中的字體路徑
    const fontPath = path.join(process.cwd(), 'assets', 'fonts', 'NotoSansTC-Thin.ttf');
    
    try {
      // 嘗試註冊字體，如果失敗則使用默認字體
      doc.registerFont('NotoSansTC', fontPath);
      doc.font('NotoSansTC');
    } catch (fontError) {
      console.warn('無法載入中文字體，使用默認字體:', fontError instanceof Error ? fontError.message : String(fontError));
      // 繼續使用默認字體
    }

    // 添加標題
    doc.fontSize(20).text('出貨單', { align: 'center' } as PDFTextOptions);
    doc.moveDown();

    // 添加出貨單基本信息
    doc.fontSize(12);
    doc.text(`出貨單號: ${shippingOrder.soid ?? 'N/A'}`, { continued: false } as PDFTextOptions);
    
    // 直接使用sosupplier而非customer.name
    doc.text(`客戶: ${shippingOrder.sosupplier ?? '未指定'}`, { continued: false } as PDFTextOptions);
    
    if (shippingOrder.notes) {
      doc.moveDown();
      doc.text('備註:', { continued: false } as PDFTextOptions);
      doc.text(shippingOrder.notes, { continued: false } as PDFTextOptions);
    }
    
    doc.moveDown();
    
    // 添加分隔線
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
    doc.moveDown();

    // 添加表格標題
    const tableTop = doc.y;
    const tableHeaders = ['序號', '健保代碼', '項目', '數量', '單價', '小計'];
    // 調整欄寬以避免數字重疊
    const columnWidths: number[] = [30, 60, 220, 60, 60, 60];
    let currentY = tableTop;
    
    // 繪製表格標題
    doc.fontSize(10);
    let currentX = 50;
    
    // 繪製表格外框
    doc.lineWidth(0.2);
    doc.strokeColor('#c0c0c0');
    doc.rect(50, currentY, doc.page.width - 100, 20).stroke();
    
    // 繪製表格標題
    tableHeaders.forEach((header, i) => {
      const align = 'center';
      doc.text(header, currentX, currentY, { width: columnWidths[i] || 50, align: align } as PDFTextOptions);
      currentX += (columnWidths[i] || 50);
      
      // 繪製垂直分隔線（除了最後一列）
      if (i < tableHeaders.length - 1) {
        doc.lineWidth(0.2);
        doc.strokeColor('#c0c0c0');
        doc.moveTo(50 + columnWidths.slice(0, i + 1).reduce((a, b) => a + b, 0), currentY)
           .lineTo(50 + columnWidths.slice(0, i + 1).reduce((a, b) => a + b, 0), currentY + 20)
           .stroke();
      }
    });
    currentY += 20;
    
    // 繪製表格內容
    if (shippingOrder.items && shippingOrder.items.length > 0) {
      shippingOrder.items.forEach((item, index) => {
        // 檢查是否需要新頁
        if (currentY > doc.page.height - 100) {
          doc.addPage();
          currentY = 50;
          
          // 在新頁重繪表格標題
          currentX = 50;
          
          // 繪製表格外框
          doc.lineWidth(0.2);
          doc.strokeColor('#c0c0c0');
          doc.rect(50, currentY, doc.page.width - 100, 20).stroke();
          
          tableHeaders.forEach((header, i) => {
            const align = 'center';
            doc.text(header, currentX, currentY, { width: columnWidths[i], align: align } as PDFTextOptions);
            currentX += (columnWidths[i] || 50);
            
            // 繪製垂直分隔線（除了最後一列）
            if (i < tableHeaders.length - 1) {
              doc.lineWidth(0.2);
              doc.strokeColor('#c0c0c0');
              doc.moveTo(50 + columnWidths.slice(0, i + 1).reduce((a, b) => a + b, 0), currentY)
                 .lineTo(50 + columnWidths.slice(0, i + 1).reduce((a, b) => a + b, 0), currentY + 20)
                 .stroke();
            }
          });
          currentY += 20;
        }
        
        // 增加行高
        const rowHeight = 30; // 從原來的20增加到25
        
        // 繪製項目行外框
        doc.lineWidth(0.2);
        doc.strokeColor('#c0c0c0');
        doc.rect(50, currentY, doc.page.width - 100, rowHeight).stroke();
        
        // 繪製項目行
        currentX = 50;
        
        // 序號 - 垂直居中
        doc.text((index + 1).toString(), currentX, currentY + (rowHeight - 10) / 2, { width: columnWidths[0], align: 'center' } as PDFTextOptions);
        currentX += (columnWidths[0] || 30);
        
        // 繪製第一條垂直分隔線
        doc.moveTo(currentX, currentY)
           .lineTo(currentX, currentY + rowHeight)
           .stroke();
        
        // 健保代碼
        // 從 item.healthInsuranceCode 取得健保代碼
        doc.text(item.healthInsuranceCode ?? 'N/A', currentX, currentY + (rowHeight - 10) / 2, { width: columnWidths[1], align: 'center' } as PDFTextOptions);
        currentX += (columnWidths[1] || 60);
        
        // 繪製第二條垂直分隔線
        doc.moveTo(currentX, currentY)
           .lineTo(currentX, currentY + rowHeight)
           .stroke();
        
        // 項目名稱 - 垂直居中
        doc.text(item.dname ?? 'N/A', currentX, currentY + (rowHeight - 10) / 2, { width: columnWidths[2], align: 'center' } as PDFTextOptions);
        currentX += (columnWidths[2] || 220);
        
        // 繪製第三條垂直分隔線
        doc.moveTo(currentX, currentY)
           .lineTo(currentX, currentY + rowHeight)
           .stroke();
        
        // 數量置中對齊
        doc.text(item.dquantity?.toString() ?? '0', currentX, currentY + (rowHeight - 10) / 2, { width: columnWidths[3], align: 'center' } as PDFTextOptions);
        currentX += (columnWidths[3] || 60);
        
        // 繪製第三條垂直分隔線
        doc.moveTo(currentX, currentY)
           .lineTo(currentX, currentY + rowHeight)
           .stroke();
        
        // 單價靠右對齊，但保留右側空間
        const dprice = (item.dtotalCost ?? 0) / (item.dquantity ?? 1);
        doc.text(formatCurrency(dprice), currentX, currentY + (rowHeight - 10) / 2, { width: (columnWidths[3] || 60), align: 'center' } as PDFTextOptions);
        currentX += (columnWidths[3] || 60);
        
        // 繪製第四條垂直分隔線
        doc.moveTo(currentX, currentY)
           .lineTo(currentX, currentY + rowHeight)
           .stroke();
        
        // 小計靠右對齊，但保留右側空間
        const subtotal = (item.dtotalCost ?? 0) ;
        doc.text(formatCurrency(subtotal), currentX, currentY + (rowHeight - 10) / 2, { width: (columnWidths[4] || 60) - 1, align: 'center' } as PDFTextOptions);
        
        currentY += rowHeight;
      });
    } else {
      // 無項目時繪製空行
      const rowHeight = 30; // 從原來的20增加到25
      doc.lineWidth(0.2);
      doc.strokeColor('#c0c0c0');
      doc.rect(50, currentY, doc.page.width - 100, rowHeight).stroke();
      doc.text('無項目', 50, currentY + (rowHeight - 10) / 2, { align: 'center', width: doc.page.width - 100 } as PDFTextOptions);
      currentY += rowHeight;
    }
    
    // 添加分隔線
    doc.moveTo(50, currentY).lineTo(doc.page.width - 50, currentY).stroke();
    currentY += 20;
    
    // 添加金額信息
    doc.fontSize(12).text(`總金額: ${formatCurrency(shippingOrder.totalAmount ?? 0)}`, 50, currentY,  { align: 'right' } as PDFTextOptions);
    currentY += 20;
    
    doc.moveDown(2);
    
    // 完成PDF生成
    doc.end();
    
  } catch (err) {
    console.error('生成出貨單PDF時發生錯誤:', err instanceof Error ? err.message : String(err));
    res.status(500).json({ msg: '生成PDF時發生錯誤' });
  }
});

// 格式化日期
// const formatDate = (dateValue?: Date | string | null): string => {
//   if (!dateValue) return 'N/A';
//   return dayjs(dateValue).format('YYYY-MM-DD');
// };

// 格式化貨幣
const formatCurrency = (value?: number | null): string => {
  if (value === undefined || value === null) return 'N/A';
  return `$${parseFloat(value.toString()).toFixed(1)}`;
};

// 生成出貨單PDF - 第二種排版（無健保代碼，副標題小字）
router.get('/pdf-v2/:id', async (req: Request, res: Response) => {
  try {
    // 驗證 ID 參數存在性
    if (!req.params.id) {
      res.status(404).json({ msg: '找不到出貨單' });
      return;
    }

    // 移除populate('customer')以解決schema錯誤
    const shippingOrder = await ShippingOrder.findById(req.params.id).lean() as ShippingOrderDocument;
    
    if (!shippingOrder) {
      res.status(404).json({ msg: '找不到出貨單' });
      return;
    }
    
    // 收集所有產品ID
    const productIds = shippingOrder.items.map(item => item.product);
    
    // 批次查詢所有相關產品
    const products = await BaseProduct.find({ _id: { $in: productIds } }).lean();
    
    // 建立產品ID到產品資訊的映射
    const productInfoMap: Record<string, any> = {};
    products.forEach((product: any) => {
      productInfoMap[product._id.toString()] = product;
    });
    
    // 為每個項目添加產品資訊
    shippingOrder.items = shippingOrder.items.map(item => {
      const productId = item.product.toString();
      const product = productInfoMap[productId];
      return {
        ...item,
        productInfo: product
      };
    });

    // 創建PDF文檔
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `出貨單 #${shippingOrder.soid}`,
        Author: 'POS系統',
        Subject: '出貨單',
      }
    });
    
    // 設置響應頭
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=shipping_order_v2_${shippingOrder.soid}.pdf`);
    
    // 將PDF流導向響應
    doc.pipe(res);

    // Windows環境中的字體路徑
    const fontPath = path.join(process.cwd(), 'assets', 'fonts', 'NotoSansTC-Thin.ttf');
    
    try {
      // 嘗試註冊字體，如果失敗則使用默認字體
      doc.registerFont('NotoSansTC', fontPath);
      doc.font('NotoSansTC');
    } catch (fontError) {
      console.warn('無法載入中文字體，使用默認字體:', fontError instanceof Error ? fontError.message : String(fontError));
      // 繼續使用默認字體
    }

    // 添加標題
    doc.fontSize(20).text('出貨單', { align: 'center' } as PDFTextOptions);
    doc.moveDown();

    // 添加出貨單基本信息
    doc.fontSize(12);
    doc.text(`出貨單號: ${shippingOrder.soid ?? 'N/A'}`, { continued: false } as PDFTextOptions);
    
    // 直接使用sosupplier而非customer.name
    doc.text(`客戶: ${shippingOrder.sosupplier ?? '未指定'}`, { continued: false } as PDFTextOptions);
    
    if (shippingOrder.notes) {
      doc.moveDown();
      doc.text('備註:', { continued: false } as PDFTextOptions);
      doc.text(shippingOrder.notes, { continued: false } as PDFTextOptions);
    }
    
    doc.moveDown();
    
    // 添加分隔線
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
    doc.moveDown();

    // 添加表格標題 - 第二種排版：移除健保代碼欄位
    const tableTop = doc.y;
    const tableHeaders = ['序號', '項目', '數量', '單價', '小計'];
    // 調整欄寬：確保不超出頁面範圍 (A4寬度約530px可用)
    const columnWidths: number[] = [40, 250, 60, 80, 80];
    let currentY = tableTop;
    
    // 繪製表格標題
    doc.fontSize(10);
    let currentX = 50;
    
    // 繪製表格外框
    doc.lineWidth(0.2);
    doc.strokeColor('#c0c0c0');
    doc.rect(50, currentY, doc.page.width - 100, 20).stroke();
    
    // 繪製表格標題
    tableHeaders.forEach((header, i) => {
      const align = 'center';
      doc.text(header, currentX, currentY, { width: columnWidths[i] || 50, align: align } as PDFTextOptions);
      currentX += (columnWidths[i] || 50);
      
      // 繪製垂直分隔線（除了最後一列）
      if (i < tableHeaders.length - 1) {
        doc.lineWidth(0.2);
        doc.strokeColor('#c0c0c0');
        doc.moveTo(50 + columnWidths.slice(0, i + 1).reduce((a, b) => a + b, 0), currentY)
           .lineTo(50 + columnWidths.slice(0, i + 1).reduce((a, b) => a + b, 0), currentY + 20)
           .stroke();
      }
    });
    currentY += 20;
    
    // 繪製表格內容
    if (shippingOrder.items && shippingOrder.items.length > 0) {
      shippingOrder.items.forEach((item: any, index) => {
        // 檢查是否需要新頁
        if (currentY > doc.page.height - 100) {
          doc.addPage();
          currentY = 50;
          
          // 在新頁重繪表格標題
          currentX = 50;
          
          // 繪製表格外框
          doc.lineWidth(0.2);
          doc.strokeColor('#c0c0c0');
          doc.rect(50, currentY, doc.page.width - 100, 20).stroke();
          
          tableHeaders.forEach((header, i) => {
            const align = 'center';
            doc.text(header, currentX, currentY, { width: columnWidths[i], align: align } as PDFTextOptions);
            currentX += (columnWidths[i] || 50);
            
            // 繪製垂直分隔線（除了最後一列）
            if (i < tableHeaders.length - 1) {
              doc.lineWidth(0.2);
              doc.strokeColor('#c0c0c0');
              doc.moveTo(50 + columnWidths.slice(0, i + 1).reduce((a, b) => a + b, 0), currentY)
                 .lineTo(50 + columnWidths.slice(0, i + 1).reduce((a, b) => a + b, 0), currentY + 20)
                 .stroke();
            }
          });
          currentY += 20;
        }
        
        // 計算項目行高度（考慮副標題）
        const hasSubtitle = item.productInfo?.subtitle && item.productInfo.subtitle.trim() !== '';
        const rowHeight = hasSubtitle ? 30 : 20;
        
        // 繪製項目行外框
        doc.lineWidth(0.2);
        doc.strokeColor('#c0c0c0');
        doc.rect(50, currentY, doc.page.width - 100, rowHeight).stroke();
        
        // 繪製項目行
        currentX = 50;
        
        // 序號
        doc.text((index + 1).toString(), currentX, currentY + (rowHeight - 10) / 2, { width: columnWidths[0], align: 'center' } as PDFTextOptions);
        currentX += (columnWidths[0] || 40);
        
        // 繪製第一條垂直分隔線
        doc.moveTo(currentX, currentY)
           .lineTo(currentX, currentY + rowHeight)
           .stroke();
        
        // 項目名稱（主標題 + 副標題）
        const itemStartY = currentY + 2;
        doc.fontSize(10);
        doc.text(item.dname ?? 'N/A', currentX + 2, itemStartY, { width: (columnWidths[1] || 250) - 4, align: 'left' } as PDFTextOptions);
        
        // 如果有副標題，以小字顯示在下方
        if (hasSubtitle) {
          doc.fontSize(8);
          doc.fillColor('#525252');
          doc.text(item.productInfo.subtitle, currentX + 2, itemStartY + 12, { width: (columnWidths[1] || 250) - 4, align: 'left' } as PDFTextOptions);
          doc.fillColor('#000000'); // 恢復黑色
          doc.fontSize(10);
        }
        
        currentX += (columnWidths[1] || 250);
        
        // 繪製第二條垂直分隔線
        doc.moveTo(currentX, currentY)
           .lineTo(currentX, currentY + rowHeight)
           .stroke();
        
        // 數量置中對齊
        doc.text(item.dquantity?.toString() ?? '0', currentX, currentY + (rowHeight - 10) / 2, { width: columnWidths[2], align: 'center' } as PDFTextOptions);
        currentX += (columnWidths[2] || 60);
        
        // 繪製第三條垂直分隔線
        doc.moveTo(currentX, currentY)
           .lineTo(currentX, currentY + rowHeight)
           .stroke();
        
        // 單價置中對齊
        const dprice = (item.dtotalCost ?? 0) / (item.dquantity ?? 1);
        doc.text(formatCurrency(dprice), currentX, currentY + (rowHeight - 10) / 2, { width: (columnWidths[3] || 80), align: 'center' } as PDFTextOptions);
        currentX += (columnWidths[3] || 80);
        
        // 繪製第四條垂直分隔線
        doc.moveTo(currentX, currentY)
           .lineTo(currentX, currentY + rowHeight)
           .stroke();
        
        // 小計置中對齊
        const subtotal = (item.dtotalCost ?? 0);
        doc.text(formatCurrency(subtotal), currentX, currentY + (rowHeight - 10) / 2, { width: (columnWidths[4] || 80) - 1, align: 'center' } as PDFTextOptions);
        
        currentY += rowHeight;
      });
    } else {
      // 無項目時繪製空行
      const rowHeight = 30; // 從原來的20增加到25
      doc.lineWidth(0.2);
      doc.strokeColor('#c0c0c0');
      doc.rect(50, currentY, doc.page.width - 100, rowHeight).stroke();
      doc.text('無項目', 50, currentY + (rowHeight - 10) / 2, { align: 'center', width: doc.page.width - 100 } as PDFTextOptions);
      currentY += rowHeight;
    }
    
    // 添加分隔線
    doc.moveTo(50, currentY).lineTo(doc.page.width - 50, currentY).stroke();
    currentY += 20;
    
    // 添加金額信息
    doc.fontSize(12).text(`總金額: ${formatCurrency(shippingOrder.totalAmount ?? 0)}`, 50, currentY, { align: 'right' } as PDFTextOptions);
    currentY += 20;
    
    doc.moveDown(2);
    
    // 完成PDF生成
    doc.end();
    
  } catch (err) {
    console.error('生成出貨單PDF第二版時發生錯誤:', err instanceof Error ? err.message : String(err));
    res.status(500).json({ msg: '生成PDF時發生錯誤' });
  }
});

// 生成出貨單PDF - 第三種排版（基於第一版，添加大包裝信息）
router.get('/pdf-v3/:id', async (req: Request, res: Response) => {
  try {
    // 驗證 ID 參數存在性
    if (!req.params.id) {
      res.status(404).json({ msg: '找不到出貨單' });
      return;
    }

    // 獲取是否顯示大包裝信息的參數
    const showPackageInfo = req.query.showPackageInfo !== 'false';

    // 移除populate('customer')以解決schema錯誤
    const shippingOrder = await ShippingOrder.findById(req.params.id).lean() as ShippingOrderDocument;
    
    if (!shippingOrder) {
      res.status(404).json({ msg: '找不到出貨單' });
      return;
    }
    
    // 收集所有產品ID
    const productIds = shippingOrder.items.map(item => item.product);
    
    // 批次查詢所有相關產品
    const products = await BaseProduct.find({ _id: { $in: productIds } }).lean();
    
    // 建立產品ID到健保代碼的映射
    const productHealthInsuranceMap: Record<string, string> = {};
    products.forEach((product: any) => {
      // 如果是藥品類型且有健保代碼，則記錄健保代碼
      if (product.productType === 'medicine' && product.healthInsuranceCode) {
        productHealthInsuranceMap[product._id.toString()] = product.healthInsuranceCode;
      } else {
        // 非藥品或無健保代碼時，使用產品代碼
        productHealthInsuranceMap[product._id.toString()] = product.code ?? 'N/A';
      }
    });
    
    // 為每個項目添加健保代碼
    shippingOrder.items = shippingOrder.items.map(item => {
      const productId = item.product.toString();
      return {
        ...item,
        healthInsuranceCode: productHealthInsuranceMap[productId] ?? 'N/A'
      };
    });

    // 創建PDF文檔
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `出貨單 #${shippingOrder.soid}`,
        Author: 'POS系統',
        Subject: '出貨單',
      }
    });
    
    // 設置響應頭
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=shipping_order_v3_${shippingOrder.soid}.pdf`);
    
    // 將PDF流導向響應
    doc.pipe(res);

    // Windows環境中的字體路徑
    const fontPath = path.join(process.cwd(), 'assets', 'fonts', 'NotoSansTC-Thin.ttf');
    const fontPath1 = path.join(process.cwd(), 'assets', 'fonts', 'NotoSansTC-Bold.ttf');
    try {
      // 嘗試註冊字體，如果失敗則使用默認字體
      doc.registerFont('NotoSansTC', fontPath);
      doc.registerFont('Noto-Bold', fontPath1);
      doc.font('NotoSansTC');
    } catch (fontError) {
      console.warn('無法載入中文字體，使用默認字體:', fontError instanceof Error ? fontError.message : String(fontError));
      // 繼續使用默認字體
    }

    // 添加標題
    doc.fontSize(20).text('出貨單', { align: 'center' } as PDFTextOptions);
    doc.moveDown();

    // 添加出貨單基本信息
    doc.fontSize(12);
    doc.text(`出貨單號: ${shippingOrder.soid ?? 'N/A'}`, { continued: false } as PDFTextOptions);
    
    // 直接使用sosupplier而非customer.name
    doc.text(`客戶: ${shippingOrder.sosupplier ?? '未指定'}`, { continued: false } as PDFTextOptions);
    
    if (shippingOrder.notes) {
      doc.moveDown();
      doc.text('備註:', { continued: false } as PDFTextOptions);
      doc.text(shippingOrder.notes, { continued: false } as PDFTextOptions);
    }
    
    doc.moveDown();
    
    // 添加分隔線
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
    doc.moveDown();

    // 添加表格標題
    const tableTop = doc.y;
    // 根據是否顯示大包裝信息來決定表頭
    const tableHeaders = showPackageInfo
      ? ['序號', '健保代碼', '項目', '包裝規格', '總數量', '單價', '小計']
      : ['序號', '健保代碼', '項目', '數量', '單價', '小計'];
    
    // 調整欄寬以避免數字重疊
    const columnWidths: number[] = showPackageInfo
      ? [30, 60, 140, 80, 60, 60, 60]
      : [30, 60, 220, 60, 60, 60];
    
    let currentY = tableTop;
    
    // 定義行高
    const rowHeight = 30; // 從原來的20增加到25
    
    // 繪製表格標題
    doc.fontSize(10);
    let currentX = 50;
    
    // 繪製表格外框
    doc.lineWidth(0.2);
    doc.strokeColor('#666666ff');
    doc.rect(50, currentY, doc.page.width - 100, rowHeight).stroke();
    
    // 繪製表格標題
    tableHeaders.forEach((header, i) => {
      const align = 'center';
      doc.text(header, currentX, currentY + (rowHeight - 10) / 2, { width: columnWidths[i] || 50, align: align } as PDFTextOptions);
      currentX += (columnWidths[i] || 50);
      
      // 繪製垂直分隔線（除了最後一列）
      if (i < tableHeaders.length - 1) {
        doc.lineWidth(0.2);
        doc.strokeColor('#c0c0c0');
        doc.moveTo(50 + columnWidths.slice(0, i + 1).reduce((a, b) => a + b, 0), currentY)
           .lineTo(50 + columnWidths.slice(0, i + 1).reduce((a, b) => a + b, 0), currentY + rowHeight)
           .stroke();
      }
    });
    currentY += rowHeight;
    
    // 繪製表格內容
    if (shippingOrder.items && shippingOrder.items.length > 0) {
      shippingOrder.items.forEach((item: any, index) => {
        // 檢查是否需要新頁
        if (currentY > doc.page.height - 100) {
          doc.addPage();
          currentY = 50;
          
          // 在新頁重繪表格標題
          currentX = 50;
          
          // 繪製表格外框
          doc.lineWidth(0.2);
          doc.strokeColor('#c0c0c0');
          doc.rect(50, currentY, doc.page.width - 100, rowHeight).stroke();
          
          tableHeaders.forEach((header, i) => {
            const align = 'center';
            doc.text(header, currentX, currentY + (rowHeight - 10) / 2, { width: columnWidths[i], align: align } as PDFTextOptions);
            currentX += (columnWidths[i] || 50);
            
            // 繪製垂直分隔線（除了最後一列）
            if (i < tableHeaders.length - 1) {
              doc.lineWidth(0.2);
              doc.strokeColor('#c0c0c0');
              doc.moveTo(50 + columnWidths.slice(0, i + 1).reduce((a, b) => a + b, 0), currentY)
                 .lineTo(50 + columnWidths.slice(0, i + 1).reduce((a, b) => a + b, 0), currentY + rowHeight)
                 .stroke();
            }
          });
          currentY += rowHeight;
        }
        
        // 繪製項目行外框
        doc.lineWidth(0.2);
        doc.strokeColor('#c0c0c0');
        doc.rect(50, currentY, doc.page.width - 100, rowHeight).stroke();
        
        // 繪製項目行
        currentX = 50;
        
        // 序號 - 垂直居中
        doc.font('NotoSansTC').text((index + 1).toString(), currentX, currentY + (rowHeight - 10) / 2, { width: columnWidths[0], align: 'center' } as PDFTextOptions);
        currentX += (columnWidths[0] || 30);
        
        // 繪製第一條垂直分隔線
        doc.moveTo(currentX, currentY)
           .lineTo(currentX, currentY + rowHeight)
           .stroke();
        
        // 健保代碼 - 垂直居中
        doc.text(item.healthInsuranceCode ?? 'N/A', currentX, currentY + (rowHeight - 10) / 2, { width: columnWidths[1], align: 'center' } as PDFTextOptions);
        currentX += (columnWidths[1] || 60);
        
        // 繪製第二條垂直分隔線
        doc.moveTo(currentX, currentY)
           .lineTo(currentX, currentY + rowHeight)
           .stroke();
        
        // 項目名稱 - 垂直居中
        doc.text(item.dname ?? 'N/A', currentX, currentY + (rowHeight - 10) / 2, { width: columnWidths[2], align: 'center' } as PDFTextOptions);
        currentX += (columnWidths[2] || (showPackageInfo ? 140 : 220));
        
        // 繪製第三條垂直分隔線
        doc.moveTo(currentX, currentY)
           .lineTo(currentX, currentY + rowHeight)
           .stroke();
        
        if (showPackageInfo) {
          // 合併大包裝和每盒數量為一欄，以 "28x30" 的方式呈現
          let packageText = 'N/A';
          if (item.packageQuantity && item.boxQuantity) {
            packageText = `${item.packageQuantity}${item.unit || '盒'} x ${item.boxQuantity}`;
          } else if (item.packageQuantity) {
            packageText = `${item.packageQuantity}${item.unit || '盒'}`;
          } else if (item.boxQuantity) {
            packageText = `${item.boxQuantity}個/盒`;
          }
          
          doc.text(packageText, currentX, currentY + (rowHeight - 10) / 2, { width: columnWidths[3], align: 'center' } as PDFTextOptions);
          currentX += (columnWidths[3] || 80);
          
          // 繪製垂直分隔線
          doc.moveTo(currentX, currentY)
             .lineTo(currentX, currentY + rowHeight)
             .stroke();
        }
        
        // 數量置中對齊
        doc.font('Noto-Bold').text(item.dquantity?.toString() ?? '0', currentX, currentY + (rowHeight - 10) / 2, { width: columnWidths[showPackageInfo ? 4 : 3], align: 'center' } as PDFTextOptions);
        currentX += (columnWidths[showPackageInfo ? 4 : 3] || 60);
        
        // 繪製垂直分隔線
        doc.moveTo(currentX, currentY)
           .lineTo(currentX, currentY + rowHeight)
           .stroke();
        
        // 單價靠右對齊，但保留右側空間
        const dprice = (item.dtotalCost ?? 0) / (item.dquantity ?? 1);
        doc.font('NotoSansTC').text(formatCurrency(dprice), currentX, currentY + (rowHeight - 10) / 2, { width: (columnWidths[showPackageInfo ? 5 : 4] || 60), align: 'center' } as PDFTextOptions);
        currentX += (columnWidths[showPackageInfo ? 5 : 4] || 60);
        
        // 繪製垂直分隔線
        doc.moveTo(currentX, currentY)
           .lineTo(currentX, currentY + rowHeight)
           .stroke();
        
        // 小計靠右對齊，但保留右側空間
        const subtotal = (item.dtotalCost ?? 0) ;
        doc.font('Noto-Bold').text(formatCurrency(subtotal), currentX, currentY + (rowHeight - 10) / 2, { width: (columnWidths[showPackageInfo ? 6 : 5] || 60) - 1, align: 'center' } as PDFTextOptions);
        
        currentY += rowHeight;
      });
    } else {
      // 無項目時繪製空行
      doc.lineWidth(0.2);
      doc.strokeColor('#c0c0c0');
      doc.rect(50, currentY, doc.page.width - 100, rowHeight).stroke();
      doc.text('無項目', 50, currentY + (rowHeight - 10) / 2, { align: 'center', width: doc.page.width - 100 } as PDFTextOptions);
      currentY += rowHeight;
    }
    
    // 添加分隔線
    doc.moveTo(50, currentY).lineTo(doc.page.width - 50, currentY).stroke();
    currentY += 20;
    
    // 添加金額信息
    doc.fontSize(13).text(`總金額: ${formatCurrency(shippingOrder.totalAmount ?? 0)}`, 50, currentY,  { align: 'right' } as PDFTextOptions);
    currentY += 20;
    
    doc.moveDown(2);
    
    // 完成PDF生成
    doc.end();
    
  } catch (err) {
    console.error('生成出貨單PDF第三版時發生錯誤:', err instanceof Error ? err.message : String(err));
    res.status(500).json({ msg: '生成PDF時發生錯誤' });
  }
});

export default router;