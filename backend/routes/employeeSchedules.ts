import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import EmployeeSchedule, { IEmployeeScheduleDocument } from '../models/EmployeeSchedule';
import Employee from '../models/Employee';
import auth from '../middleware/auth';
import { AuthenticatedRequest } from '../src/types/express';

// 導入 shared 類型和常量
import {
  ApiResponse,
  ErrorResponse,
  ERROR_MESSAGES
} from '@pharmacy-pos/shared';

const router = express.Router();

// @route   GET api/employee-schedules
// @desc    Get employee schedules with date range filter
// @access  Private
router.get('/', [
  auth,
  check('startDate').optional().isISO8601().withMessage('開始日期格式無效'),
  check('endDate').optional().isISO8601().withMessage('結束日期格式無效'),
  check('employeeId').optional().custom(value => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error('員工ID格式無效');
    }
    return true;
  })
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate request parameters
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
        errors: errors.array(),
        timestamp: new Date().toISOString()
      };
      res.status(400).json(errorResponse);
      return;
    }

    const { startDate, endDate, employeeId, leaveType } = req.query;
    
    // Build filter object with validated data
    const filter: Record<string, any> = {};
    
    // Add date range filter if provided
    if (startDate && endDate) {
      const startDateObj = new Date(startDate as string);
      const endDateObj = new Date(endDate as string);
      
      // Additional validation to ensure dates are valid
      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: ERROR_MESSAGES.GENERIC.INVALID_REQUEST,
          timestamp: new Date().toISOString()
        };
        res.status(400).json(errorResponse);
      return;
      }
      
      filter.date = {
        $gte: startDateObj,
        $lte: endDateObj
      };
    }
    
    // Add employee filter if provided and validated
    if (employeeId && mongoose.Types.ObjectId.isValid(employeeId as string)) {
      filter.employeeId = new mongoose.Types.ObjectId(employeeId as string);
    }
    
    // Add leaveType filter if provided
    if (leaveType) {
      filter.leaveType = leaveType;
    }
    
    // 使用參數化查詢而非直接構建查詢對象
    const validatedFilter = { ...filter }; // 創建過濾條件的副本
    const schedules = await EmployeeSchedule.find(validatedFilter)
      .populate('employeeId', 'name department position')
      .sort({ date: 1, shift: 1 })
      .lean(); // 使用 lean() 提高查詢性能
    
    const response: ApiResponse<any[]> = {
      success: true,
      data: schedules,
      message: '員工排班資料獲取成功',
      timestamp: new Date().toISOString()
    };
    res.json(response);
  } catch (err) {
    console.error((err as Error).message);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      error: (err as Error).message,
      timestamp: new Date().toISOString()
    };
    res.status(500).json(errorResponse);
  }
});

// @route   POST api/employee-schedules
// @desc    Create a new employee schedule
// @access  Private
router.post(
  '/',
  [
    auth,
    check('date', '日期為必填欄位').not().isEmpty(),
    check('shift', '班次為必填欄位').isIn(['morning', 'afternoon', 'evening']),
    check('employeeId', '員工ID為必填欄位').not().isEmpty(),
    check('leaveType', '請假類型格式無效').optional().isIn(['sick', 'personal', 'overtime'])
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
        errors: errors.array(),
        timestamp: new Date().toISOString()
      };
      res.status(400).json(errorResponse);
      return;
    }

    try {
      // 驗證員工ID是否存在
      if (!mongoose.Types.ObjectId.isValid(req.body.employeeId)) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: ERROR_MESSAGES.GENERIC.INVALID_ID,
          timestamp: new Date().toISOString()
        };
        res.status(400).json(errorResponse);
      return;
      }

      const employee = await Employee.findById(req.body.employeeId);
      if (!employee) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
          timestamp: new Date().toISOString()
        };
        res.status(404).json(errorResponse);
      return;
      }

      // 檢查是否已有相同日期、班次的排班
      // 使用獨立變量存儲查詢條件，避免嵌套
      const scheduleDate = new Date(req.body.date);
      const scheduleShift = req.body.shift;
      const scheduleEmployeeId = req.body.employeeId;
      
      // 使用安全的方式構建查詢，避免直接使用用戶輸入
      // 先將用戶輸入轉換為安全的格式，再用於查詢
      const safeShift = scheduleShift.toString();
      const safeEmployeeId = scheduleEmployeeId.toString();
      
      const existingSchedule = await EmployeeSchedule.findOne({
        date: scheduleDate,
        shift: safeShift,
        employeeId: safeEmployeeId
      });

      // 如果存在排班，返回錯誤
      if (existingSchedule) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: ERROR_MESSAGES.GENERIC.ALREADY_EXISTS,
          timestamp: new Date().toISOString()
        };
        res.status(400).json(errorResponse);
      return;
      }

      // 建立新排班
      const newSchedule = new EmployeeSchedule({
        date: req.body.date,
        shift: req.body.shift,
        employeeId: req.body.employeeId,
        leaveType: req.body.leaveType || null,
        createdBy: req.user.id
      });

      const savedSchedule = await newSchedule.save();
      
      // 返回包含員工資訊的排班資料
      const populatedSchedule = await EmployeeSchedule.findById(savedSchedule._id)
        .populate('employeeId', 'name department position');
      
      const response: ApiResponse<any> = {
        success: true,
        data: populatedSchedule,
        message: '員工排班建立成功',
        timestamp: new Date().toISOString()
      };
      res.json(response);
    } catch (err) {
      console.error((err as Error).message);
      if ((err as any).code === 11000) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: ERROR_MESSAGES.GENERIC.ALREADY_EXISTS,
          timestamp: new Date().toISOString()
        };
        res.status(400).json(errorResponse);
      return;
      }
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
        error: (err as Error).message,
        timestamp: new Date().toISOString()
      };
      res.status(500).json(errorResponse);
    }
  }
);

// 驗證排班ID
interface ScheduleValidationResult {
  valid: boolean;
  error?: {
    status: number;
    msg: string;
  };
  schedule?: IEmployeeScheduleDocument;
}

const validateScheduleId = async (id: string): Promise<ScheduleValidationResult> => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { valid: false, error: { status: 400, msg: '無效的排班ID格式' } };
  }

  const schedule = await EmployeeSchedule.findById(id);
  if (!schedule) {
    return { valid: false, error: { status: 404, msg: '找不到此排班資料' } };
  }

  return { valid: true, schedule };
};

// 驗證員工ID
interface EmployeeValidationResult {
  valid: boolean;
  error?: {
    status: number;
    msg: string;
  };
}

const validateEmployeeId = async (employeeId: string): Promise<EmployeeValidationResult> => {
  if (!mongoose.Types.ObjectId.isValid(employeeId)) {
    return { valid: false, error: { status: 400, msg: '無效的員工ID格式' } };
  }

  const employee = await Employee.findById(employeeId);
  if (!employee) {
    return { valid: false, error: { status: 404, msg: '找不到此員工資料' } };
  }

  return { valid: true };
};

/**
 * 檢查排班衝突 - 簡化版本
 * @param {string} scheduleId - 當前排班ID (用於排除自身)
 * @param {Date} date - 排班日期
 * @param {string} shift - 班次
 * @param {string} employeeId - 員工ID
 * @returns {Promise<boolean>} - 如果存在衝突返回true，否則返回false
 */
const checkScheduleConflict = async (
  scheduleId: string,
  date: Date,
  shift: string,
  employeeId: string | mongoose.Types.ObjectId
): Promise<boolean> => {
  // 使用安全的方式構建查詢，避免直接使用用戶輸入
  // 先將用戶輸入轉換為安全的格式，再用於查詢
  const safeScheduleId = scheduleId.toString();
  const safeShift = shift.toString();
  const safeEmployeeId = employeeId.toString();
  
  const count = await EmployeeSchedule.countDocuments({
    _id: { $ne: safeScheduleId },
    date: date,
    shift: safeShift,
    employeeId: safeEmployeeId
  });
  
  // 如果計數大於0，則存在衝突
  return count > 0;
};

// @route   PUT api/employee-schedules/:id
// @desc    Update an employee schedule
// @access  Private
router.put('/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 驗證排班ID
    const scheduleValidation = await validateScheduleId(req.params.id);
    if (!scheduleValidation.valid) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: scheduleValidation.error!.msg,
        timestamp: new Date().toISOString()
      };
      res.status(scheduleValidation.error!.status).json(errorResponse);
      return;
    }
    const schedule = scheduleValidation.schedule!;

    // 如果要更新員工ID，先檢查員工是否存在
    if (req.body.employeeId) {
      const employeeValidation = await validateEmployeeId(req.body.employeeId);
      if (!employeeValidation.valid) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: employeeValidation.error!.msg,
          timestamp: new Date().toISOString()
        };
        res.status(employeeValidation.error!.status).json(errorResponse);
      return;
      }
    }

    // 更新資料
    const updatedFields: Record<string, any> = {};
    const allowedFields = ['date', 'shift', 'employeeId', 'leaveType'];
    
    for (const [key, value] of Object.entries(req.body)) {
      if (value !== undefined && allowedFields.includes(key)) {
        updatedFields[key] = value;
      }
    }
    
    updatedFields.updatedAt = Date.now();

    // 檢查更新後是否會與現有排班衝突
    if (updatedFields.date || updatedFields.shift || updatedFields.employeeId) {
      const hasConflict = await checkScheduleConflict(
        req.params.id,
        updatedFields.date || schedule.date,
        updatedFields.shift || schedule.shift,
        updatedFields.employeeId || schedule.employeeId
      );
      
      if (hasConflict) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: ERROR_MESSAGES.GENERIC.ALREADY_EXISTS,
          timestamp: new Date().toISOString()
        };
        res.status(400).json(errorResponse);
      return;
      }
    }

    const updatedSchedule = await EmployeeSchedule.findByIdAndUpdate(
      req.params.id,
      { $set: updatedFields },
      { new: true, runValidators: true }
    ).populate('employeeId', 'name department position');

    const response: ApiResponse<any> = {
      success: true,
      data: updatedSchedule,
      message: '員工排班更新成功',
      timestamp: new Date().toISOString()
    };
    res.json(response);
  } catch (err) {
    console.error((err as Error).message);
    if ((err as any).code === 11000) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.ALREADY_EXISTS,
        timestamp: new Date().toISOString()
      };
      res.status(400).json(errorResponse);
      return;
    }
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      error: (err as Error).message,
      timestamp: new Date().toISOString()
    };
    res.status(500).json(errorResponse);
  }
});

// @route   DELETE api/employee-schedules/:id
// @desc    Delete an employee schedule
// @access  Private
router.delete('/:id', auth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 驗證ID格式是否為有效的ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.INVALID_ID,
        timestamp: new Date().toISOString()
      };
      res.status(400).json(errorResponse);
      return;
    }

    const schedule = await EmployeeSchedule.findById(req.params.id);
    if (!schedule) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        timestamp: new Date().toISOString()
      };
      res.status(404).json(errorResponse);
      return;
    }

    await EmployeeSchedule.findByIdAndDelete(req.params.id);
    const response: ApiResponse<null> = {
      success: true,
      data: null,
      message: '排班資料已刪除',
      timestamp: new Date().toISOString()
    };
    res.json(response);
  } catch (err) {
    console.error((err as Error).message);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      error: (err as Error).message,
      timestamp: new Date().toISOString()
    };
    res.status(500).json(errorResponse);
  }
});

// @route   GET api/employee-schedules/by-date
// @desc    Get schedules grouped by date
// @access  Private
router.get('/by-date', [
  auth,
  check('startDate').isISO8601().withMessage('開始日期格式無效'),
  check('endDate').isISO8601().withMessage('結束日期格式無效')
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Validate request parameters
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
        errors: errors.array(),
        timestamp: new Date().toISOString()
      };
      res.status(400).json(errorResponse);
      return;
    }

    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.INVALID_REQUEST,
        timestamp: new Date().toISOString()
      };
      res.status(400).json(errorResponse);
      return;
    }
    
    // Validate and convert dates
    const startDateObj = new Date(startDate as string);
    const endDateObj = new Date(endDate as string);
    
    // Additional validation to ensure dates are valid
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.INVALID_REQUEST,
        timestamp: new Date().toISOString()
      };
      res.status(400).json(errorResponse);
      return;
    }
    
    const schedules = await EmployeeSchedule.find({
      date: {
        $gte: startDateObj,
        $lte: endDateObj
      }
    }).populate('employeeId', 'name department position');
    
    // 將排班按日期和班次分組
    interface GroupedSchedules {
      [date: string]: {
        morning: any[];
        afternoon: any[];
        evening: any[];
      };
    }
    
    const groupedSchedules: GroupedSchedules = {};
    
    schedules.forEach(schedule => {
      const dateStr = schedule.date.toISOString().split('T')[0];
      
      if (!groupedSchedules[dateStr]) {
        groupedSchedules[dateStr] = {
          morning: [],
          afternoon: [],
          evening: []
        };
      }
      
      groupedSchedules[dateStr][schedule.shift as keyof typeof groupedSchedules[string]].push({
        _id: schedule._id,
        employee: schedule.employeeId,
        shift: schedule.shift,
        leaveType: schedule.leaveType
      });
    });
    
    const response: ApiResponse<any> = {
      success: true,
      data: groupedSchedules,
      message: '按日期分組的排班資料獲取成功',
      timestamp: new Date().toISOString()
    };
    res.json(response);
  } catch (err) {
    console.error((err as Error).message);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      error: (err as Error).message,
      timestamp: new Date().toISOString()
    };
    res.status(500).json(errorResponse);
  }
});

export default router;