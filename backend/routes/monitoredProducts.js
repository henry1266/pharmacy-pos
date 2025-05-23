const express = require("express");
const router = express.Router();
const MonitoredProduct = require("../models/MonitoredProduct");
// Alternative import style for BaseProduct
const ProductModels = require("../models/BaseProduct"); 
const BaseProduct = ProductModels.BaseProduct; 
const auth = require("../middleware/auth");
const { check, validationResult } = require("express-validator");

// @route   GET api/monitored-products
// @desc    獲取所有監測產品編號（增強版：包含商品名稱）
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    // 獲取所有監測產品
    const monitoredProducts = await MonitoredProduct.find().sort({ productCode: 1 }); // 按照產品編號排序
    
    // 使用 Promise.all 並行查詢每個監測產品的詳細資訊
    const productsWithDetails = await Promise.all(
      monitoredProducts.map(async (product) => {
        // 將 productCode 轉換為字串，確保類型一致性
        const productCodeStr = String(product.productCode);
        
        // 查詢對應的基礎產品以獲取名稱 - 修正查詢條件，同時檢查 code 和 shortCode
        // 使用 $regex 和 $options 進行不區分大小寫的精確匹配
        const baseProduct = await BaseProduct.findOne({ 
          $or: [
            { code: { $regex: `^${productCodeStr}$`, $options: 'i' } },
            { shortCode: { $regex: `^${productCodeStr}$`, $options: 'i' } }
          ] 
        });
        
        // 記錄查詢結果，幫助調試
        console.log(`查詢產品: ${productCodeStr}, 結果:`, baseProduct ? 
          `找到產品 - 名稱: ${baseProduct.name}, code: ${baseProduct.code}, shortCode: ${baseProduct.shortCode}` : 
          '未找到產品');
        
        // 返回合併後的資料，不包含 addedAt
        // 確保 productName 欄位一定有值，並記錄最終回傳的資料
        const result = {
          _id: product._id,
          productCode: product.productCode,
          productName: baseProduct ? baseProduct.name : '未知產品',
          addedBy: product.addedBy
        };
        
        console.log(`最終回傳資料: ${JSON.stringify(result)}`);
        return result;
      })
    );
    
    res.json(productsWithDetails);
  } catch (err) {
    console.error("獲取監測產品失敗:", err.message);
    res.status(500).send("伺服器錯誤");
  }
});

// @route   POST api/monitored-products
// @desc    新增監測產品編號
// @access  Private
router.post(
  "/",
  [
    auth,
    [check("productCode", "產品編號為必填欄位").not().isEmpty().trim()],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { productCode } = req.body;
    try {
      // 1. 檢查產品編號是否存在於 BaseProduct 中 (Using alternative import)
      // 修正查詢條件，同時檢查 code 和 shortCode，並確保類型一致性
      const productCodeStr = String(productCode);
      const productExists = await BaseProduct.findOne({ 
        $or: [
          { code: { $regex: `^${productCodeStr}$`, $options: 'i' } },
          { shortCode: { $regex: `^${productCodeStr}$`, $options: 'i' } }
        ] 
      });
      
      // 記錄查詢結果，幫助調試
      console.log(`新增監測產品: ${productCodeStr}, 查詢結果:`, productExists ? 
        `找到產品 - 名稱: ${productExists.name}, code: ${productExists.code}, shortCode: ${productExists.shortCode}` : 
        '未找到產品');
        
      if (!productExists) {
        return res.status(404).json({ msg: `找不到產品編號為 ${productCode} 的產品，無法加入監測` });
      }
      // 2. 檢查是否已存在相同的監測產品編號
      let monitoredProduct = await MonitoredProduct.findOne({ productCode });
      if (monitoredProduct) {
        return res.status(400).json({ msg: "該產品編號已在監測列表中" });
      }
      // 3. 新增監測產品
      monitoredProduct = new MonitoredProduct({
        productCode,
        addedBy: req.user.id, // 記錄添加者
      });
      await monitoredProduct.save();
      
      // 4. 返回包含產品名稱的完整資訊，不包含 addedAt
      const responseData = {
        _id: monitoredProduct._id,
        productCode: monitoredProduct.productCode,
        productName: productExists.name,
        addedBy: monitoredProduct.addedBy
      };
      
      res.json(responseData);
    } catch (err) {
      console.error("新增監測產品失敗:", err.message);
      // Handle potential duplicate key error during save, although findOne should catch it first
      if (err.code === 11000) {
         return res.status(400).json({ msg: "該產品編號已在監測列表中" });
      }
      res.status(500).send("伺服器錯誤");
    }
  }
);

// @route   DELETE api/monitored-products/:id
// @desc    刪除監測產品編號
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  try {
    const monitoredProduct = await MonitoredProduct.findById(req.params.id);
    if (!monitoredProduct) {
      return res.status(404).json({ msg: "找不到要刪除的監測產品記錄" });
    }
    // 可選：權限檢查，例如只允許添加者刪除
    // if (monitoredProduct.addedBy.toString() !== req.user.id) {
    //   return res.status(401).json({ msg: "權限不足" });
    // }
    // Mongoose 6.x+ uses findByIdAndDelete()
    await MonitoredProduct.findByIdAndDelete(req.params.id);
    // If Mongoose 5.x, use: await monitoredProduct.remove();
    res.json({ msg: "監測產品已刪除" });
  } catch (err) {
    console.error("刪除監測產品失敗:", err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "找不到要刪除的監測產品記錄" });
    }
    res.status(500).send("伺服器錯誤");
  }
});

module.exports = router;
