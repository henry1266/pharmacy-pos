const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Accounting = require("../models/Accounting");
const Inventory = require("../models/Inventory");
const BaseProduct = require("../models/BaseProduct");
const MonitoredProduct = require("../models/MonitoredProduct"); // Import MonitoredProduct model
const auth = require("../middleware/auth");
const { check, validationResult } = require("express-validator");
const { startOfDay, endOfDay } = require("date-fns");

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

// @route   GET api/accounting/unaccounted-sales
// @desc    獲取所有監測產品在特定日期尚未標記的銷售記錄 (MOVED UP)
// @access  Private
router.get("/unaccounted-sales", auth, async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ msg: "缺少日期參數" });
    }

    const targetDate = new Date(date);
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    // 1. 獲取所有監測產品的 productCode
    const monitored = await MonitoredProduct.find({}, 'productCode'); // 只選擇 productCode 欄位
    if (!monitored || monitored.length === 0) {
      return res.json([]); // 沒有設定監測產品，返回空陣列
    }
    const monitoredProductCodes = monitored.map(p => p.productCode);

    // 2. 根據 productCodes 找到對應的 productId
    const products = await BaseProduct.find({ code: { $in: monitoredProductCodes } }, '_id code name'); // 選擇需要的欄位
    if (!products || products.length === 0) {
        return res.json([]); // 監測的產品編號在產品庫中找不到
    }
    const monitoredProductIds = products.map(p => p._id);
    // Removed unused productMap
    // const productMap = products.reduce((map, p) => {
    //     map[p._id.toString()] = { code: p.code, name: p.name };
    //     return map;
    // }, {});

    // 3. 查詢 Inventory 中符合條件的銷售記錄
    const sales = await Inventory.find({
      product: { $in: monitoredProductIds }, // 篩選監測的產品 ID
      type: "sale",
      accountingId: null,
      lastUpdated: { $gte: dayStart, $lte: dayEnd },
    })
    .populate('product', 'code name') // 直接填充產品信息
    .sort({ lastUpdated: 1 }); // 按時間排序

    res.json(sales); // 返回包含產品信息的銷售記錄

  } catch (err) {
    console.error("查詢未標記銷售記錄失敗:", err.message);
    res.status(500).send("伺服器錯誤");
  }
});

// @route   GET api/accounting/summary/daily
// @desc    獲取每日記帳摘要 (MOVED UP)
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
          totalAmount: { $first: "$totalAmount" }, 
        },
      },
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

// @route   GET api/accounting/:id
// @desc    獲取單筆記帳記錄 (MUST be after specific routes like /unaccounted-sales)
// @access  Private
router.get("/:id", auth, async (req, res) => {
  // Check if the ID is a valid MongoDB ObjectId before querying
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: "無效的記帳記錄 ID 格式" });
  }
  try {
    const accounting = await Accounting.findById(req.params.id);

    if (!accounting) {
      return res.status(404).json({ msg: "找不到記帳記錄" });
    }

    res.json(accounting);
  } catch (err) {
    console.error(err.message);
    // Removed redundant ObjectId check as it's handled above
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
// @desc    更新記帳記錄
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
    
    // Check if the ID is a valid MongoDB ObjectId before proceeding
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ msg: "無效的記帳記錄 ID 格式" });
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

      accounting = await accounting.save();
      res.json(accounting);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("伺服器錯誤");
    }
  }
);

// @route   DELETE api/accounting/:id
// @desc    刪除記帳記錄 (並取消相關銷售記錄的標記)
// @access  Private
router.delete("/:id", auth, async (req, res) => {
  // Check if the ID is a valid MongoDB ObjectId before proceeding
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ msg: "無效的記帳記錄 ID 格式" });
  }

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
    await Accounting.findByIdAndDelete(req.params.id).session(session);

    await session.commitTransaction();
    session.endSession();

    res.json({ msg: "記帳記錄已刪除，相關銷售記錄已取消連結" });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("刪除記帳記錄失敗:", err.message);
    res.status(500).send("伺服器錯誤");
  }
});

module.exports = router;

