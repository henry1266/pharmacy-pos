const express = require('express');
const router = express.Router();
const ShippingOrder = require('../models/ShippingOrder');
const { isAuthenticated } = require('../middleware/auth');
const { createShippingOrderPdf } = require('../utils/pdfGenerator');

// 生成出貨單PDF
router.get('/pdf/:id', isAuthenticated, async (req, res) => {
  try {
    const shippingOrder = await ShippingOrder.findById(req.params.id)
      .populate('customer')
      .lean();
    
    if (!shippingOrder) {
      return res.status(404).json({ msg: '找不到出貨單' });
    }

    // 生成PDF
    const pdfBuffer = await createShippingOrderPdf(shippingOrder);
    
    // 設置響應頭
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=shipping_order_${shippingOrder.soid}.pdf`);
    
    // 發送PDF
    res.send(pdfBuffer);
  } catch (err) {
    console.error('生成出貨單PDF時發生錯誤:', err);
    res.status(500).json({ msg: '生成PDF時發生錯誤' });
  }
});

module.exports = router;
