const express = require('express');
const router = express.Router();
const ShippingOrder = require('../models/ShippingOrder');
const path = require('path');
const PDFDocument = require('pdfkit');
const dayjs = require('dayjs');

// 生成出貨單PDF - 移除isAuthenticated中間件以解決undefined問題
router.get('/pdf/:id', async (req, res) => {
  try {
    const shippingOrder = await ShippingOrder.findById(req.params.id)
      .populate('customer')
      .lean();
    
    if (!shippingOrder) {
      return res.status(404).json({ msg: '找不到出貨單' });
    }

    // 創建PDF文檔
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: `出貨單 #${shippingOrder.soid}`,
        Author: '藥局POS系統',
        Subject: '出貨單',
      }
    });
    
    // 設置響應頭
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=shipping_order_${shippingOrder.soid}.pdf`);
    
    // 將PDF流導向響應
    doc.pipe(res);

    // Windows環境中的字體路徑
    const fontPath = path.join(process.cwd(), 'assets', 'fonts', 'NotoSansCJK-Regular.ttc');
    
    try {
      // 嘗試註冊字體，如果失敗則使用默認字體
      doc.registerFont('NotoSansCJK', fontPath);
      doc.font('NotoSansCJK');
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
    doc.text(`客戶: ${shippingOrder.customer?.name || shippingOrder.sosupplier || '未指定'}`, { continued: false });
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
    doc.fontSize(10);
    let currentX = 50;
    tableHeaders.forEach((header, i) => {
      doc.text(header, currentX, currentY, { width: columnWidths[i], align: 'left' });
      currentX += columnWidths[i];
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
          tableHeaders.forEach((header, i) => {
            doc.text(header, currentX, currentY, { width: columnWidths[i], align: 'left' });
            currentX += columnWidths[i];
          });
          currentY += 20;
        }
        
        // 繪製項目行
        currentX = 50;
        doc.text(item.dname || 'N/A', currentX, currentY, { width: columnWidths[0], align: 'left' });
        currentX += columnWidths[0];
        
        doc.text(item.dquantity?.toString() || '0', currentX, currentY, { width: columnWidths[1], align: 'right' });
        currentX += columnWidths[1];
        
        doc.text(formatCurrency(item.dprice), currentX, currentY, { width: columnWidths[2], align: 'right' });
        currentX += columnWidths[2];
        
        const subtotal = (item.dquantity || 0) * (item.dprice || 0);
        doc.text(formatCurrency(subtotal), currentX, currentY, { width: columnWidths[3], align: 'right' });
        
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
    const subtotal = (shippingOrder.totalAmount || 0) + (shippingOrder.discountAmount || 0);
    doc.text(`小計: ${formatCurrency(subtotal)}`, { align: 'right' });
    
    if (shippingOrder.discountAmount && shippingOrder.discountAmount > 0) {
      doc.text(`折扣: ${formatCurrency(-shippingOrder.discountAmount)}`, { align: 'right' });
    }
    
    doc.fontSize(12).text(`總金額: ${formatCurrency(shippingOrder.totalAmount || 0)}`, { align: 'right' });
    
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

// 獲取狀態文字
const getStatusText = (status) => {
  if (status === 'shipped') return '已出貨';
  if (status === 'pending') return '待處理';
  if (status === 'cancelled') return '已取消';
  return status || '未知';
};

// 獲取付款狀態文字
const getPaymentStatusText = (status) => {
  if (status === 'paid') return '已付款';
  if (status === 'unpaid') return '未付款';
  return status || '未指定';
};

module.exports = router;
