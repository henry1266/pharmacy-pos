const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Accounting = require("../models/Accounting");
const Inventory = require("../models/Inventory");
const { BaseProduct } = require("../models/BaseProduct"); 
const MonitoredProduct = require("../models/MonitoredProduct");
const auth = require("../middleware/auth");
const { check, validationResult } = require("express-validator");
const { startOfDay, endOfDay, format } = require("date-fns");

// @route   GET api/accounting
// @desc    獲取所有記帳記錄
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const { startDate, endDate, shift } = req.query;
    let query = {};
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (shift) query.shift = shift.toString();
    const accountingRecords = await Accounting.find(query).sort({ date: -1, shift: 1 });
    res.json(accountingRecords);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("伺服器錯誤");
  }
});

// @route   GET api/accounting/unaccounted-sales
// @desc    獲取所有監測產品在特定日期尚未標記的銷售記錄 (按銷售單號前綴篩選)
// @access  Private
router.get("/unaccounted-sales", auth, async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ msg: "缺少日期參數" });

    let datePrefix;
    try {
      datePrefix = format(new Date(date), "yyyyMMdd");
    } catch (formatError) {
      console.error("日期格式化錯誤:", formatError);
      return res.status(400).json({ msg: "無效的日期格式" });
    }

    const monitored = await MonitoredProduct.find({}, 'productCode');
    if (!monitored || monitored.length === 0) return res.json([]);
    const monitoredProductCodes = monitored.map(p => p.productCode);

    const products = await BaseProduct.find({ code: { $in: monitoredProductCodes } }, '_id code name');
    if (!products || products.length === 0) return res.json([]);
    const monitoredProductIds = products.map(p => p._id);
    const productMap = products.reduce((map, p) => {
      map[p._id.toString()] = p;
      return map;
    }, {});

    const sales = await Inventory.find({
      product: { $in: monitoredProductIds },
      type: "sale",
      accountingId: null,
      saleNumber: { $regex: `^${datePrefix}` }
    })
    .sort({ lastUpdated: 1 });

    // Manually add product details to sales records
    const salesWithProductDetails = sales.map(sale => {
      const productDetails = productMap[sale.product.toString()];
      return {
        ...sale.toObject(), // Convert Mongoose doc to plain object
        product: productDetails ? { _id: productDetails._id, code: productDetails.code, name: productDetails.name } : { _id: sale.product, code: 'N/A', name: '未知產品' }
      };
    });

    res.json(salesWithProductDetails);
  } catch (err) {
    console.error("查詢未標記銷售記錄失敗:", err.message);
    res.status(500).send("伺服器錯誤");
  }
});

// @route   GET api/accounting/summary/daily
// @desc    獲取每日記帳摘要
// @access  Private
router.get("/summary/daily", auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let matchStage = {};
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }
    const summary = await Accounting.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, shift: "$shift" },
          totalAmount: { $first: "$totalAmount" }, 
        },
      },
      {
        $group: {
           _id: "$_id.date",
           shifts: { $push: { shift: "$_id.shift", totalAmount: "$totalAmount" } },
           dailyTotal: { $sum: "$totalAmount" }
        }
      },
      { $sort: { _id: -1 } },
    ]);
    res.json(summary);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("伺服器錯誤");
  }
});

// @route   GET api/accounting/:id
// @desc    獲取單筆記帳記錄
// @access  Private
router.get("/:id", auth, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: "無效的記帳記錄 ID 格式" });
  }
  try {
    const accounting = await Accounting.findById(req.params.id);
    if (!accounting) return res.status(404).json({ msg: "找不到記帳記錄" });
    res.json(accounting);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("伺服器錯誤");
  }
});

// @route   POST api/accounting
// @desc    新增記帳記錄 (將關聯銷售加入 items, 僅限監測產品, 名目為其他自費, 備註含數量)
// @access  Private
router.post(
  "/",
  [
    auth,
    [
      check("date", "日期為必填欄位").not().isEmpty(),
      check("shift", "班別為必填欄位").isIn(["早", "中", "晚"]),
      check("items", "至少需要一個項目").isArray(), // Allow empty initially, will add sales
      check("items.*.amount", "金額必須為數字").optional().isFloat(),
      check("items.*.category", "名目為必填欄位").optional().not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { date, shift, status } = req.body; // Add status here
      let items = req.body.items || []; // Get items from request or default to empty array
      const accountingDate = new Date(date);

      // 檢查是否已存在相同日期和班別的記錄
      const existingRecord = await Accounting.findOne({ 
        date: accountingDate, 
        shift: shift.toString() 
      });
      if (existingRecord) {
        return res.status(400).json({ msg: "該日期和班別已有記帳記錄" });
      }

      // 找出該日期對應銷售單號前綴且尚未標記的 *監測產品* 銷售記錄
      let datePrefix;
      try {
        datePrefix = format(accountingDate, "yyyyMMdd");
      } catch (formatError) {
        console.error("內部日期格式化錯誤:", formatError);
        throw new Error("內部日期格式化錯誤"); 
      }

      // 1. 獲取監測產品列表
      const monitored = await MonitoredProduct.find({}, 'productCode');
      const monitoredProductCodes = monitored.map(p => p.productCode);
      let monitoredProductIds = [];
      if (monitoredProductCodes.length > 0) {
          const products = await BaseProduct.find({ code: { $in: monitoredProductCodes } }, '_id');
          monitoredProductIds = products.map(p => p._id);
      }
      
      let unaccountedSales = [];
      if (monitoredProductIds.length > 0) {
          // 2. 查找符合條件的銷售記錄 (僅限監測產品)
          unaccountedSales = await Inventory.find({
            product: { $in: monitoredProductIds }, // *** 只查找監測產品 ***
            type: "sale",
            accountingId: null,
            saleNumber: { $regex: `^${datePrefix}` }
          }).populate('product', 'name'); // Populate product name
      }

      // 將未結算銷售轉換為記帳項目並加入 items 陣列
      const salesItems = unaccountedSales.map(sale => ({
        amount: sale.totalAmount || 0,
        category: "其他自費", // *** 將名目設為 其他自費 ***
        categoryId: null, // Find the ID for '其他自費' category if needed
        note: `${sale.saleNumber} - ${sale.product ? sale.product.name : '未知產品'}#${Math.abs(sale.quantity || 0)}`, // *** 加入數量 ***
        isAutoLinked: true // Add a flag to differentiate if needed
      }));
      
      // 合併手動輸入的項目和自動關聯的銷售項目
      const allItems = [...items, ...salesItems];

      // 檢查合併後是否有項目
      if (allItems.length === 0) {
         return res.status(400).json({ msg: "沒有手動輸入的項目，且當日無自動關聯的銷售記錄" });
      }

      // 計算最終總額 (所有項目加總)
      const finalTotalAmount = allItems.reduce((sum, item) => sum + (item.amount || 0), 0);

      // 新增記帳記錄 (包含合併後的項目和計算後的總額)
      const newAccounting = new Accounting({
        date: accountingDate,
        shift,
        items: allItems, // Use the merged items array
        totalAmount: finalTotalAmount, // Use the final calculated total
        status: status || 'pending', // Set status from request or default to pending
        createdBy: req.user.id,
      });

      const accounting = await newAccounting.save();

      // 更新銷售記錄的 accountingId *僅當狀態為 completed*
      if (status === 'completed' && unaccountedSales.length > 0) {
        const saleIdsToUpdate = unaccountedSales.map((sale) => sale._id);
        await Inventory.updateMany(
          { _id: { $in: saleIdsToUpdate } },
          { $set: { accountingId: accounting._id } }
        );
        console.log(`Linked ${saleIdsToUpdate.length} monitored sales to accounting record ${accounting._id} upon creation with completed status.`);
      }

      res.json(accounting);
    } catch (err) {
      console.error("新增記帳記錄失敗:", err.message);
      res.status(500).send("伺服器錯誤");
    }
  }
);

// @route   PUT api/accounting/:id
// @desc    更新記帳記錄 (注意：此處未處理總額重新計算，可能需要根據業務邏輯調整)
// @access  Private
router.put(
  "/:id",
  [
    auth,
    [
      check("date", "日期為必填欄位").not().isEmpty(),
      check("shift", "班別為必填欄位").isIn(["早", "中", "晚"]),
      check("items", "至少需要一個項目").isArray().not().isEmpty(),
      check("items.*.amount", "金額必須為數字").isFloat(),
      check("items.*.category", "名目為必填欄位").not().isEmpty(),
      check("status", "狀態為必填欄位").optional().isIn(["pending", "completed"]), // Add status validation
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // 驗證ID格式並轉換為安全的ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ msg: "無效的記帳記錄 ID 格式" });
    }

    try {
      const { date, shift, items, status } = req.body;
      const accountingDate = new Date(date);

      // 使用已驗證的ID創建安全的ObjectId
      const safeParamId = mongoose.Types.ObjectId(req.params.id);
      
      // 使用參數化查詢而非直接構建查詢對象
      const existingRecord = await Accounting.findOne({
        date: accountingDate,
        shift: shift.toString(),
        _id: { $ne: safeParamId }
      });

      if (existingRecord) {
        return res.status(400).json({ msg: "該日期和班別已有其他記帳記錄" });
      }

      let accounting = await Accounting.findById(req.params.id);
      if (!accounting) return res.status(404).json({ msg: "找不到記帳記錄" });

      // --- Start: New logic for handling status change and sales re-linking ---

      // 1. Always unlink previously associated sales regardless of the final status
      const unlinkResult = await Inventory.updateMany(
        { accountingId: accounting._id },
        { $set: { accountingId: null } }
      );
      if (unlinkResult.modifiedCount > 0) {
        console.log(`Unlinked ${unlinkResult.modifiedCount} previous sales from accounting record ${accounting._id} during update.`);
      }

      // The 'items' array from req.body *already* contains only the manual items (filtered by frontend)
      const manualItemsFromRequest = items; // Use items directly from request
      let finalItems = manualItemsFromRequest;
      let finalTotalAmount = manualItemsFromRequest.reduce((sum, item) => sum + (item.amount || 0), 0);
      let linkedSaleIds = [];
      let currentUnaccountedSales = []; // Define outside the if block

      // 2. Always re-fetch current sales to include in items and total, regardless of final status
      // Re-fetch logic (similar to POST route)
      let datePrefix;
      try {
        datePrefix = format(accountingDate, "yyyyMMdd");
      } catch (formatError) {
        console.error("內部日期格式化錯誤 during update:", formatError);
        throw new Error("內部日期格式化錯誤"); 
      }
      const monitored = await MonitoredProduct.find({}, "productCode");
      const monitoredProductCodes = monitored.map(p => p.productCode);
      let monitoredProductIds = [];
      if (monitoredProductCodes.length > 0) {
          const products = await BaseProduct.find({ code: { $in: monitoredProductCodes } }, "_id");
          monitoredProductIds = products.map(p => p._id);
      }
      
      if (monitoredProductIds.length > 0) {
          currentUnaccountedSales = await Inventory.find({
            product: { $in: monitoredProductIds },
            type: "sale",
            accountingId: null, // Find currently unlinked sales
            saleNumber: { $regex: `^${datePrefix}` }
          }).populate("product", "name");
      }

      const newSalesItems = currentUnaccountedSales.map(sale => ({
        amount: sale.totalAmount || 0,
        category: "其他自費",
        categoryId: null, 
        note: `${sale.saleNumber} - ${sale.product ? sale.product.name : "未知產品"}#${Math.abs(sale.quantity || 0)}`,
        isAutoLinked: true
      }));

      // Always merge manual items and current sales for storage
      finalItems = [...manualItemsFromRequest, ...newSalesItems];
      finalTotalAmount = finalItems.reduce((sum, item) => sum + (item.amount || 0), 0);
      linkedSaleIds = currentUnaccountedSales.map(sale => sale._id); // Prepare IDs to link if completed

      // 3. Update the accounting record
      accounting.date = accountingDate;
      accounting.shift = shift;
      accounting.items = finalItems; 
      accounting.totalAmount = finalTotalAmount;
      if (status) accounting.status = status;

      accounting = await accounting.save();

      // 4. Link the sales *only* if status is being set to completed
      if (status === "completed" && linkedSaleIds.length > 0) {
        await Inventory.updateMany(
          { _id: { $in: linkedSaleIds } },
          { $set: { accountingId: accounting._id } }
        );
        console.log(`Linked ${linkedSaleIds.length} current sales to accounting record ${accounting._id} upon completion.`);
      }
      
      // --- End: New logic ---
      res.json(accounting);
    } catch (err) {
      console.error("更新記帳記錄失敗:", err.message);
      res.status(500).send("伺服器錯誤");
    }
  }
);

// @route   DELETE api/accounting/:id
// @desc    刪除記帳記錄
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: "無效的記帳記錄 ID 格式" });
  }

  try {
    const accounting = await Accounting.findById(req.params.id);
    if (!accounting) {
      return res.status(404).json({ msg: "找不到記帳記錄" });
    }

    // 1. 取消與此記帳記錄關聯的銷售記錄標記
    const updateResult = await Inventory.updateMany(
      { accountingId: accounting._id },
      { $set: { accountingId: null } }
    );
    console.log(`Unlinked ${updateResult.modifiedCount} sales from accounting record ${accounting._id}`);

    // 2. 刪除記帳記錄
    await Accounting.findByIdAndDelete(req.params.id);

    res.json({ msg: "記帳記錄已刪除，相關銷售記錄已取消連結" });
  } catch (err) {
    console.error("刪除記帳記錄失敗:", err.message);
    res.status(500).send("伺服器錯誤");
  }
});

module.exports = router;

