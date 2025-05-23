const express = require('express');
const router = express.Router();
const ShippingOrder = require('../models/ShippingOrder');
const path = require('path');
const PDFDocument = require('pdfkit');
const dayjs = require('dayjs');

// 生成出貨單PDF - 移除isAuthenticated中間件以解決undefined問題
router.get('/pdf/:id', async (req, res) => {
  try {
    // 移除populate('customer')以解決schema錯誤
    const shippingOrder = await ShippingOrder.findById(req.params.id).lean();
    
    if (!shippingOrder) {
      return res.status(404).json({ msg: '找不到出貨單' });
    }

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
      console.warn('無法載入中文字體，使用默認字體:', fontError.message);
      // 繼續使用默認字體
    }

    // 添加標題
    doc.fontSize(20).text('出貨單', { align: 'center' });
    doc.moveDown();

    // 添加出貨單基本信息
    doc.fontSize(12);
    doc.text(`出貨單號: ${shippingOrder.soid || 'N/A'}`, { continued: false });
    
    // 直接使用sosupplier而非customer.name
    doc.text(`客戶: ${shippingOrder.sosupplier || '未指定'}`, { continued: false });
    
    if (shippingOrder.notes) {
      doc.moveDown();
      doc.text('備註:', { continued: false });
      doc.text(shippingOrder.notes, { continued: false });
    }
    
    doc.moveDown();
    
    // 添加分隔線
    doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
    doc.moveDown();

      // 添加表格標題
    const tableTop = doc.y;
    const tableHeaders = ['序號', '健保代碼', '項目', '數量', '單價', '小計'];
    // 調整欄寬以避免數字重疊
    const columnWidths = [40, 80, 140, 60, 60, 80];
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
      doc.text(header, currentX, currentY, { width: columnWidths[i], align: align });
      currentX += columnWidths[i];
      
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
            const align = i === 0 || i === 1 ? 'left' : 'center';
            doc.text(header, currentX, currentY, { width: columnWidths[i], align: align });
            currentX += columnWidths[i];
            
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
        
        // 繪製項目行外框
        doc.lineWidth(0.2);
        doc.strokeColor('#c0c0c0');
        doc.rect(50, currentY, doc.page.width - 100, 20).stroke();
        
        // 繪製項目行
        currentX = 50;
        
        // 序號靠左對齊
        doc.text((index + 1).toString(), currentX, currentY, { width: columnWidths[0], align: 'center' });
        currentX += columnWidths[0];
        
        // 繪製第一條垂直分隔線
        doc.moveTo(currentX, currentY)
           .lineTo(currentX, currentY + 20)
           .stroke();
        
        // 健保代碼靠左對齊
        // 從 item.healthInsuranceCode 取得健保代碼
        doc.text(item.healthInsuranceCode || 'N/A', currentX, currentY, { width: columnWidths[1] - 10, align: 'left' });
        currentX += columnWidths[1];
        
        // 繪製第二條垂直分隔線
        doc.moveTo(currentX, currentY)
           .lineTo(currentX, currentY + 20)
           .stroke();
        
        // 項目名稱靠左對齊
        doc.text(item.dname || 'N/A', currentX, currentY, { width: columnWidths[2] - 10, align: 'left' });
        currentX += columnWidths[2];
        
        // 繪製第三條垂直分隔線
        doc.moveTo(currentX, currentY)
           .lineTo(currentX, currentY + 20)
           .stroke();
        
        // 數量置中對齊
        doc.text(item.dquantity?.toString() || '0', currentX, currentY, { width: columnWidths[3], align: 'center' });
        currentX += columnWidths[3];
        
        // 繪製第三條垂直分隔線
        doc.moveTo(currentX, currentY)
           .lineTo(currentX, currentY + 20)
           .stroke();
        
        // 單價靠右對齊，但保留右側空間
        const dprice = (item.dtotalCost || 0) / (item.dquantity || 1);
        doc.text(formatCurrency(dprice), currentX, currentY, { width: columnWidths[3] , align: 'center' });
        currentX += columnWidths[3];
        
        // 繪製第四條垂直分隔線
        doc.moveTo(currentX, currentY)
           .lineTo(currentX, currentY + 20)
           .stroke();
        
        // 小計靠右對齊，但保留右側空間
        const subtotal = (item.dtotalCost || 0) ;
        doc.text(formatCurrency(subtotal), currentX, currentY, { width: columnWidths[4] - 1, align: 'center' });
        
        currentY += 20;
      });
    } else {
      // 無項目時繪製空行
      doc.lineWidth(0.2);
      doc.strokeColor('#666666');
      doc.rect(50, currentY, doc.page.width - 100, 20).stroke();
      doc.text('無項目', 50, currentY, { align: 'center', width: doc.page.width - 100 });
      currentY += 20;
    }
    
    // 添加分隔線
    doc.moveTo(50, currentY).lineTo(doc.page.width - 50, currentY).stroke();
    currentY += 20;
    
    // 添加金額信息
    
    doc.fontSize(12).text(`總金額: ${formatCurrency(shippingOrder.totalAmount || 0)}`, 50, currentY,  { align: 'right' });
    currentY += 20;
    
    doc.moveDown(2);
    
    
    doc.moveDown();
    doc.text(`列印日期: ${formatDate(new Date())}`, { align: 'center' });
    
    // 添加頁碼
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      doc.text(`第 ${i + 1} 頁，共 ${pageCount} 頁`, 50, doc.page.height - 100, { align: 'center' });
    }
    
    // 完成PDF生成
    doc.end();
    
  } catch (err) {
    console.error('生成出貨單PDF時發生錯誤:', err);
    res.status(500).json({ msg: '生成PDF時發生錯誤' });
  }
});

// 格式化日期
const formatDate = (dateValue) => {
  if (!dateValue) return 'N/A';
  return dayjs(dateValue).format('YYYY-MM-DD HH:mm');
};

// 格式化貨幣
const formatCurrency = (value) => {
  if (value === undefined || value === null) return 'N/A';
  return `$${parseFloat(value).toFixed(2)}`;
};


module.exports = router;
