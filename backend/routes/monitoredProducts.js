const express = require("express");
const router = express.Router();
const MonitoredProduct = require("../models/MonitoredProduct");
// Correctly import BaseProduct using destructuring
const { BaseProduct } = require("../models/BaseProduct"); 
const auth = require("../middleware/auth");
const { check, validationResult } = require("express-validator");

// @route   GET api/monitored-products
// @desc    獲取所有監測產品編號
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const products = await MonitoredProduct.find().sort({ addedAt: -1 });
    res.json(products);
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
      // 1. 檢查產品編號是否存在於 BaseProduct 中 (Now uses the correctly imported BaseProduct model)
      const productExists = await BaseProduct.findOne({ code: productCode });
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
      res.json(monitoredProduct);
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

