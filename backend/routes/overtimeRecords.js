const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { check, validationResult } = require("express-validator");
const OvertimeRecord = require("../models/OvertimeRecord");
const Employee = require("../models/Employee");

/**
 * @route   GET api/overtime-records
 * @desc    獲取所有加班記錄
 * @access  Private
 */
router.get("/", auth, async (req, res) => {
  try {
    const { employeeId, startDate, endDate, status } = req.query;
    
    // 構建查詢條件
    const query = {};
    
    // 如果指定了員工ID，則只獲取該員工的加班記錄
    if (employeeId) {
      query.employeeId = employeeId;
    }
    
    // 如果指定了日期範圍，則只獲取該日期範圍內的加班記錄
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.date = { $lte: new Date(endDate) };
    }
    
    // 如果指定了狀態，則只獲取該狀態的加班記錄
    if (status) {
      query.status = status;
    }
    
    // 獲取加班記錄並填充員工資訊
    const overtimeRecords = await OvertimeRecord.find(query)
      .populate("employeeId", "name")
      .populate("approvedBy", "name")
      .populate("createdBy", "name")
      .sort({ date: -1 });
    
    res.json(overtimeRecords);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("伺服器錯誤");
  }
});

/**
 * @route   GET api/overtime-records/monthly-stats
 * @desc    獲取月度加班統計數據（包含獨立加班記錄和排班系統加班記錄）
 * @access  Private
 */
router.get("/monthly-stats", auth, async (req, res) => {
  try {
    const { year, month } = req.query;
    
    if (!year || !month) {
      return res.status(400).json({ msg: '請提供年份和月份' });
    }
    
    // 計算該月的開始和結束日期
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
    
    // 獲取該月的所有已核准獨立加班記錄
    const overtimeRecords = await OvertimeRecord.find({
      date: {
        $gte: startDate,
        $lte: endDate
      },
      status: 'approved'
    }).populate("employeeId", "name department position");
    
    // 獲取該月的所有排班系統加班記錄
    const EmployeeSchedule = require("../models/EmployeeSchedule");
    const scheduleOvertimeRecords = await EmployeeSchedule.find({
      date: {
        $gte: startDate,
        $lte: endDate
      },
      leaveType: 'overtime'
    }).populate("employeeId", "name department position");
    
    // 按員工分組計算加班時數
    const employeeStats = {};
    
    // 處理獨立加班記錄
    overtimeRecords.forEach(record => {
      const employeeId = record.employeeId._id.toString();
      const employeeName = record.employeeId.name;
      
      if (!employeeStats[employeeId]) {
        employeeStats[employeeId] = {
          employeeId,
          name: employeeName,
          overtimeHours: 0,
          independentRecordCount: 0,
          scheduleRecordCount: 0
        };
      }
      
      employeeStats[employeeId].overtimeHours += record.hours;
      employeeStats[employeeId].independentRecordCount += 1;
    });
    
    // 處理排班系統加班記錄
    scheduleOvertimeRecords.forEach(record => {
      const employeeId = record.employeeId._id.toString();
      const employeeName = record.employeeId.name;
      
      if (!employeeStats[employeeId]) {
        employeeStats[employeeId] = {
          employeeId,
          name: employeeName,
          overtimeHours: 0,
          independentRecordCount: 0,
          scheduleRecordCount: 0
        };
      }
      
      // 計算預估時數
      let estimatedHours = 0;
      switch(record.shift) {
        case 'morning':
          estimatedHours = 3.5; // 早班 8:30-12:00
          break;
        case 'afternoon':
          estimatedHours = 3; // 中班 15:00-18:00
          break;
        case 'evening':
          estimatedHours = 1.5; // 晚班 19:00-20:30
          break;
        // default 分支不需要，因為 estimatedHours 已經初始化為 0
      }
      
      employeeStats[employeeId].overtimeHours += estimatedHours;
      employeeStats[employeeId].scheduleRecordCount += 1;
    });
    
    // 轉換為數組格式
    const result = Object.values(employeeStats).map(stat => ({
      ...stat,
      overtimeHours: parseFloat(stat.overtimeHours.toFixed(1)),
      totalRecordCount: stat.independentRecordCount + stat.scheduleRecordCount
    }));
    
    // 按加班時數降序排序
    result.sort((a, b) => b.overtimeHours - a.overtimeHours);
    
    res.json(result);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("伺服器錯誤");
  }
});

/**
 * @route   GET api/overtime-records/:id
 * @desc    獲取指定ID的加班記錄
 * @access  Private
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const overtimeRecord = await OvertimeRecord.findById(req.params.id)
      .populate("employeeId", "name")
      .populate("approvedBy", "name")
      .populate("createdBy", "name");
    
    if (!overtimeRecord) {
      return res.status(404).json({ msg: "找不到加班記錄" });
    }
    
    res.json(overtimeRecord);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "找不到加班記錄" });
    }
    res.status(500).send("伺服器錯誤");
  }
});

/**
 * @route   POST api/overtime-records
 * @desc    創建加班記錄
 * @access  Private
 */
router.post(
  "/",
  [
    auth,
    [
      check("employeeId", "員工ID為必填欄位").not().isEmpty(),
      check("date", "日期為必填欄位").not().isEmpty(),
      check("hours", "加班時數為必填欄位").isNumeric().isFloat({ min: 0.5, max: 24 })
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    try {
      // 檢查員工是否存在
      const employee = await Employee.findById(req.body.employeeId);
      if (!employee) {
        return res.status(404).json({ msg: "找不到員工" });
      }
      
      // 創建新的加班記錄
      const newOvertimeRecord = new OvertimeRecord({
        employeeId: req.body.employeeId,
        date: new Date(req.body.date),
        hours: req.body.hours,
        description: req.body.description,
        status: req.body.status || "pending",
        createdBy: req.user.id
      });
      
      // 如果狀態為已核准，則設置審核人員和審核日期
      if (newOvertimeRecord.status === "approved") {
        newOvertimeRecord.approvedBy = req.user.id;
        newOvertimeRecord.approvedAt = Date.now();
        newOvertimeRecord.approvalNote = req.body.approvalNote;
      }
      
      const overtimeRecord = await newOvertimeRecord.save();
      
      res.json(overtimeRecord);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("伺服器錯誤");
    }
  }
);

/**
 * @route   PUT api/overtime-records/:id
 * @desc    更新加班記錄
 * @access  Private
 */
router.put("/:id", auth, async (req, res) => {
  try {
    // 獲取加班記錄
    let overtimeRecord = await OvertimeRecord.findById(req.params.id);
    
    if (!overtimeRecord) {
      return res.status(404).json({ msg: "找不到加班記錄" });
    }
    
    // 更新加班記錄
    const { employeeId, date, hours, description, status, approvalNote } = req.body;
    
    if (employeeId) overtimeRecord.employeeId = employeeId;
    if (date) overtimeRecord.date = new Date(date);
    if (hours !== undefined) overtimeRecord.hours = hours;
    if (description !== undefined) overtimeRecord.description = description;
    
    // 如果狀態從非核准變為核准，則設置審核人員和審核日期
    if (status && status !== overtimeRecord.status) {
      overtimeRecord.status = status;
      
      if (status === "approved" && overtimeRecord.status !== "approved") {
        overtimeRecord.approvedBy = req.user.id;
        overtimeRecord.approvedAt = Date.now();
      }
    }
    
    if (approvalNote !== undefined) overtimeRecord.approvalNote = approvalNote;
    
    // 更新時間
    overtimeRecord.updatedAt = Date.now();
    
    await overtimeRecord.save();
    
    res.json(overtimeRecord);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "找不到加班記錄" });
    }
    res.status(500).send("伺服器錯誤");
  }
});

/**
 * @route   DELETE api/overtime-records/:id
 * @desc    刪除加班記錄
 * @access  Private
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const overtimeRecord = await OvertimeRecord.findById(req.params.id);
    
    if (!overtimeRecord) {
      return res.status(404).json({ msg: "找不到加班記錄" });
    }
    
    await overtimeRecord.remove();
    
    res.json({ msg: "加班記錄已刪除" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "找不到加班記錄" });
    }
    res.status(500).send("伺服器錯誤");
  }
});

/**
 * @route   GET api/overtime-records/summary/employee/:employeeId
 * @desc    獲取指定員工的加班時數統計
 * @access  Private
 */
router.get("/summary/employee/:employeeId", auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // 構建查詢條件
    const query = {
      employeeId: req.params.employeeId,
      status: "approved" // 只計算已核准的加班
    };
    
    // 如果指定了日期範圍，則只獲取該日期範圍內的加班記錄
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.date = { $lte: new Date(endDate) };
    }
    
    // 獲取加班記錄
    const overtimeRecords = await OvertimeRecord.find(query);
    
    // 計算總加班時數
    const totalHours = overtimeRecords.reduce((total, record) => total + record.hours, 0);
    
    res.json({
      employeeId: req.params.employeeId,
      totalHours,
      recordCount: overtimeRecords.length
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("伺服器錯誤");
  }
});

/**
 * @route   GET api/overtime-records/summary/all
 * @desc    獲取所有員工的加班時數統計
 * @access  Private
 */
router.get("/summary/all", auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // 構建查詢條件
    const query = {
      status: "approved" // 只計算已核准的加班
    };
    
    // 如果指定了日期範圍，則只獲取該日期範圍內的加班記錄
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.date = { $lte: new Date(endDate) };
    }
    
    // 使用聚合管道計算每位員工的加班時數
    const summary = await OvertimeRecord.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$employeeId",
          totalHours: { $sum: "$hours" },
          recordCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "employees",
          localField: "_id",
          foreignField: "_id",
          as: "employee"
        }
      },
      {
        $project: {
          employeeId: "$_id",
          totalHours: 1,
          recordCount: 1,
          employeeName: { $arrayElemAt: ["$employee.name", 0] }
        }
      },
      { $sort: { totalHours: -1 } }
    ]);
    
    res.json(summary);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("伺服器錯誤");
  }
});


module.exports = router;