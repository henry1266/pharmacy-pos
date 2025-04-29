const express = require("express");
const router = express.Router();
const mongoose = require("mongoose"); // Import mongoose for ObjectId validation
const Accounting = require("../models/Accounting");
const Inventory = require("../models/Inventory"); // Import Inventory model
const BaseProduct = require("../models/BaseProduct"); // Import BaseProduct model for product code query (FIXED)
const auth = require("../middleware/auth");
const { check, validationResult } = require("express-validator");
const { startOfDay, endOfDay } = require("date-fns"); // Import date-fns for date manipulation

// @route   GET api/accounting
// @desc    獲取所有記帳記錄
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const { startDate, endDate, shift } = req.query;
    let query = {};

    // 日期範圍過濾
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // 班別過濾
    if (shift) {
      query.shift = shift;
    }

    const accountingRecords = await Accounting.find(query).sort({
      date: -1,
      shift: 1,
    });

    res.json(accountingRecords);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("伺服器錯誤");
  }
});

// @route   GET api/accounting/:id
// @desc    獲取單筆記帳記錄
// @access  Private
router.get("/:id", auth, async (req, res) => {
  try {
    const accounting = await Accounting.findById(req.params.id);

    if (!accounting) {
      return res.status(404).json({ msg: "找不到記帳記錄" });
    }

    res.json(accounting);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "找不到記帳記錄" });
    }
    res.status(500).send("伺服器錯誤");
  }
});

// @route   POST api/accounting
// @desc    新增記帳記錄 (並標記相關銷售記錄)
// @access  Private
router.post(
  "/",
  [
    auth,
    [
      check("date", "日期為必填欄位").not().isEmpty(),
      check("shift", "班別為必填欄位").isIn(["早", "中", "晚"]),
      check("items", "至少需要一個項目").isArray().not().isEmpty(),
      check("items.*.amount", "金額必須為數字").isFloat(),
      check("items.*.category", "名目為必填欄位").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { date, shift } = req.body;
      const accountingDate = new Date(date);

      // 1. 檢查是否已存在相同日期和班別的記錄
      const existingRecord = await Accounting.findOne({
        date: accountingDate,
        shift,
      }).session(session);

      if (existingRecord) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ msg: "該日期和班別已有記帳記錄" });
      }

      // 2. 新增記帳記錄
      const newAccounting = new Accounting({
        ...req.body,
        date: accountingDate, // Ensure date is stored as Date object
        createdBy: req.user.id,
      });

      const accounting = await newAccounting.save({ session });

      // 3. 找出該日期內尚未標記的銷售記錄 (Inventory type: 'sale')
      const dayStart = startOfDay(accountingDate);
      const dayEnd = endOfDay(accountingDate);

      const unaccountedSales = await Inventory.find({
        type: "sale",
        accountingId: null,
        lastUpdated: { $gte: dayStart, $lte: dayEnd },
      }).session(session);

      // 4. 更新這些銷售記錄的 accountingId
      if (unaccountedSales.length > 0) {
        const saleIdsToUpdate = unaccountedSales.map((sale) => sale._id);
        await Inventory.updateMany(
          { _id: { $in: saleIdsToUpdate } },
          { $set: { accountingId: accounting._id } },
          { session }
        );
        console.log(`Linked ${saleIdsToUpdate.length} sales to accounting record ${accounting._id}`);
      }

      await session.commitTransaction();
      session.endSession();

      res.json(accounting);
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      console.error("新增記帳記錄失敗:", err.message);
      res.status(500).send("伺服器錯誤");
    }
  }
);

// @route   PUT api/accounting/:id
// @desc    更新記帳記錄 (注意：此處未處理銷售記錄的重新關聯，可能需要根據業務邏輯調整)
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
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { date, shift, items } = req.body;
      const accountingDate = new Date(date);

      // 檢查是否存在相同日期和班別的其他記錄
      const existingRecord = await Accounting.findOne({
        date: accountingDate,
        shift,
        _id: { $ne: req.params.id },
      });

      if (existingRecord) {
        return res.status(400).json({ msg: "該日期和班別已有其他記帳記錄" });
      }

      let accounting = await Accounting.findById(req.params.id);

      if (!accounting) {
        return res.status(404).json({ msg: "找不到記帳記錄" });
      }

      // 更新記錄
      accounting.date = accountingDate;
      accounting.shift = shift;
      accounting.items = items;
      // totalAmount 會在 pre-save hook 中自動更新

      // **注意：** 如果日期或班別改變，可能需要取消舊的銷售連結並建立新的連結。
      // 此處暫未實現該邏輯，需要根據具體需求決定是否需要。

      accounting = await accounting.save();
      res.json(accounting);
    } catch (err) {
      console.error(err.message);
      if (err.kind === "ObjectId") {
        return res.status(404).json({ msg: "找不到記帳記錄" });
      }
      res.status(500).send("伺服器錯誤");
    }
  }
);

// @route   DELETE api/accounting/:id
// @desc    刪除記帳記錄 (並取消相關銷售記錄的標記)
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const accounting = await Accounting.findById(req.params.id).session(session);

    if (!accounting) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ msg: "找不到記帳記錄" });
    }

    // 1. 取消與此記帳記錄關聯的銷售記錄標記
    const updateResult = await Inventory.updateMany(
      { accountingId: accounting._id },
      { $set: { accountingId: null } },
      { session }
    );
    console.log(`Unlinked ${updateResult.modifiedCount} sales from accounting record ${accounting._id}`);

    // 2. 刪除記帳記錄
    // Mongoose 5.x 使用 remove(), 6.x+ 使用 deleteOne() 或 findByIdAndDelete()
    // Assuming Mongoose 6.x+
    await Accounting.findByIdAndDelete(req.params.id).session(session);
    // 如果是 Mongoose 5.x, 使用 await accounting.remove({ session });

    await session.commitTransaction();
    session.endSession();

    res.json({ msg: "記帳記錄已刪除，相關銷售記錄已取消連結" });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("刪除記帳記錄失敗:", err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "找不到記帳記錄" });
    }
    res.status(500).send("伺服器錯誤");
  }
});

// @route   GET api/accounting/unaccounted-sales
// @desc    獲取指定產品在特定日期尚未標記的銷售記錄
// @access  Private
router.get("/unaccounted-sales", auth, async (req, res) => {
  try {
    const { date, productCode } = req.query;

    if (!date || !productCode) {
      return res.status(400).json({ msg: "缺少日期或產品編號參數" });
    }

    const targetDate = new Date(date);
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    // 1. 根據 productCode 找到 productId (FIXED: Use BaseProduct)
    const product = await BaseProduct.findOne({ code: productCode });
    if (!product) {
      // Return empty array instead of 404 to avoid frontend error display
      // return res.status(404).json({ msg: `找不到產品編號為 ${productCode} 的產品` });
      return res.json([]); 
    }
    const productId = product._id;

    // 2. 查詢 Inventory 中符合條件的銷售記錄
    const sales = await Inventory.find({
      product: productId,
      type: "sale",
      accountingId: null,
      lastUpdated: { $gte: dayStart, $lte: dayEnd },
    }).sort({ lastUpdated: 1 }); // 按時間排序

    res.json(sales);
  } catch (err) {
    console.error("查詢未標記銷售記錄失敗:", err.message);
    res.status(500).send("伺服器錯誤");
  }
});


// @route   GET api/accounting/summary/daily
// @desc    獲取每日記帳摘要 (此路由未修改)
// @access  Private
router.get("/summary/daily", auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let matchStage = {};

    // 日期範圍過濾
    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) {
        matchStage.date.$gte = new Date(startDate);
      }
      if (endDate) {
        matchStage.date.$lte = new Date(endDate);
      }
    }

    const summary = await Accounting.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            shift: "$shift",
          },
          totalAmount: { $sum: "$totalAmount" }, // 這裡應該是 $sum: 
'$items.amount' 但需要 $unwind
          // 改為直接從 Accounting model 取 totalAmount
          // totalAmount: { $sum: "$totalAmount" },
          // items: { $push: "$items" }
        },
      },
      // 修正 group stage 以正確加總 totalAmount
      {
        $group: {
           _id: "$_id.date",
           shifts: {
             $push: {
               shift: "$_id.shift",
               totalAmount: "$totalAmount"
             }
           },
           dailyTotal: { $sum: "$totalAmount" }
        }
      },
      { $sort: { _id: -1 } }, // 按日期排序
    ]);

    res.json(summary);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("伺服器錯誤");
  }
});

module.exports = router;

