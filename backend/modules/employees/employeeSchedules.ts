import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import EmployeeSchedule, { IEmployeeScheduleDocument } from '../../models/EmployeeSchedule';
import Employee from '../../models/Employee';
import auth from '../../middleware/auth';
import { AuthenticatedRequest } from '../../src/types/express';

// 導入 shared 類型和常量
import {
  ApiResponse,
  ErrorResponse,
  ERROR_MESSAGES
} from '@pharmacy-pos/shared';

const router: express.Router = express.Router();

// 預設班次時間函數
const getDefaultStartTime = (shift: string): string => {
  switch (shift) {
    case 'morning': return '08:00';
    case 'afternoon': return '16:00';
    case 'evening': return '00:00';
    default: return '08:00';
  }
};

const getDefaultEndTime = (shift: string): string => {
  switch (shift) {
    case 'morning': return '16:00';
    case 'afternoon': return '24:00';
    case 'evening': return '08:00';
    default: return '16:00';
  }
};

// @route   GET api/employee-schedules
// @desc    Get employee schedules with date range filter
// @access  Private
router.get('/employee-schedules', [
  auth,
  check('startDate').optional().isISO8601().withMessage('開始日期格式無效'),
  check('endDate').optional().isISO8601().withMessage('結束日期格式無效'),
  check('employeeId').optional().custom(value => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error('員工ID格式無效');
    }
    return true;
  })
], async (req: Request, res: Response) => {
  try {
    // Validate request parameters
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
        error: JSON.stringify(errors.array()),
        timestamp: new Date().toISOString()
      };
      res.status(400).json(errorResponse);
      return;
    }

    const { startDate, endDate, employeeId, leaveType } = req.query;
    
    // Build filter object with validated data
    const filter: Record<string, unknown> = {};
    
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
    
    const response: ApiResponse<typeof schedules> = {
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
  '/employee-schedules',
  [
    auth,
    check('date', '日期為必填欄位').not().isEmpty(),
    check('shift', '班次為必填欄位').isIn(['morning', 'afternoon', 'evening']),
    check('employeeId', '員工ID為必填欄位').not().isEmpty(),
    check('leaveType', '請假類型格式無效').optional().isIn(['sick', 'personal', 'overtime'])
  ],
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
        error: JSON.stringify(errors.array()),
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
          error: '該員工在此日期和班次已有排班記錄',
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
        leaveType: req.body.leaveType ?? null,
        createdBy: authReq.user.id
      });

      const savedSchedule = await newSchedule.save();
      
      // 返回包含員工資訊的排班資料
      const populatedSchedule = await EmployeeSchedule.findById(savedSchedule._id)
        .populate('employeeId', 'name department position');
      
      const response: ApiResponse<typeof populatedSchedule> = {
        success: true,
        data: populatedSchedule,
        message: '員工排班建立成功',
        timestamp: new Date().toISOString()
      };
      res.json(response);
    } catch (err) {
      console.error((err as Error).message);
      if ((err as Error & { code?: number }).code === 11000) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: ERROR_MESSAGES.GENERIC.ALREADY_EXISTS,
          error: '該員工在此日期和班次已有排班記錄',
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

/**
 * 準備更新欄位
 */
const prepareScheduleUpdateFields = (requestBody: Record<string, unknown>): Record<string, unknown> => {
  const updatedFields: Record<string, unknown> = {};
  const allowedFields = ['date', 'shift', 'employeeId', 'leaveType'];
  
  for (const [key, value] of Object.entries(requestBody)) {
    if (value !== undefined && allowedFields.includes(key)) {
      updatedFields[key] = value;
    }
  }
  
  updatedFields.updatedAt = Date.now();
  return updatedFields;
};

/**
 * 檢查排班更新衝突
 */
const checkScheduleUpdateConflict = async (
  scheduleId: string,
  updatedFields: Record<string, unknown>,
  originalSchedule: IEmployeeScheduleDocument
): Promise<boolean> => {
  if (!updatedFields.date && !updatedFields.shift && !updatedFields.employeeId) {
    return false;
  }

  return await checkScheduleConflict(
    scheduleId,
    updatedFields.date ? new Date(updatedFields.date as string) : originalSchedule.date,
    updatedFields.shift ? (updatedFields.shift as string) : originalSchedule.shift,
    updatedFields.employeeId ? (updatedFields.employeeId as string) : originalSchedule.employeeId
  );
};

/**
 * 處理排班更新錯誤回應
 */
const handleScheduleUpdateError = (res: Response, error: any): void => {
  console.error(error.message);
  
  if (error.code === 11000) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.ALREADY_EXISTS,
      error: '該員工在此日期和班次已有排班記錄',
      timestamp: new Date().toISOString()
    };
    res.status(400).json(errorResponse);
    return;
  }
  
  const errorResponse: ErrorResponse = {
    success: false,
    message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
    error: error.message,
    timestamp: new Date().toISOString()
  };
  res.status(500).json(errorResponse);
};

// @route   PUT api/employee-schedules/:id
// @desc    Update an employee schedule
// @access  Private
router.put('/employee-schedules/:id', auth, async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '排班ID為必填項',
        timestamp: new Date().toISOString()
      };
      res.status(400).json(errorResponse);
      return;
    }

    // 驗證排班ID
    const scheduleValidation = await validateScheduleId(req.params.id);
    if (!scheduleValidation.valid) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: scheduleValidation.error?.msg ?? '驗證失敗',
        error: scheduleValidation.error?.msg ?? '驗證失敗',
        timestamp: new Date().toISOString()
      };
      res.status(scheduleValidation.error?.status ?? 400).json(errorResponse);
      return;
    }
    const schedule = scheduleValidation.schedule;

    // 如果要更新員工ID，先檢查員工是否存在
    if (req.body.employeeId) {
      const employeeValidation = await validateEmployeeId(req.body.employeeId);
      if (!employeeValidation.valid) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: employeeValidation.error?.msg ?? '驗證失敗',
          error: employeeValidation.error?.msg ?? '驗證失敗',
          timestamp: new Date().toISOString()
        };
        res.status(employeeValidation.error?.status ?? 400).json(errorResponse);
        return;
      }
    }

    // 準備更新欄位
    const updatedFields = prepareScheduleUpdateFields(req.body);

    // 檢查更新後是否會與現有排班衝突
    const hasConflict = await checkScheduleUpdateConflict(req.params.id, updatedFields, schedule!);
    if (hasConflict) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.ALREADY_EXISTS,
        error: '該員工在此日期和班次已有排班記錄',
        timestamp: new Date().toISOString()
      };
      res.status(400).json(errorResponse);
      return;
    }

    const updatedSchedule = await EmployeeSchedule.findByIdAndUpdate(
      req.params.id,
      { $set: updatedFields },
      { new: true, runValidators: true }
    ).populate('employeeId', 'name department position');

    const response: ApiResponse<typeof updatedSchedule> = {
      success: true,
      data: updatedSchedule,
      message: '員工排班更新成功',
      timestamp: new Date().toISOString()
    };
    res.json(response);
  } catch (err) {
    handleScheduleUpdateError(res, err as Error);
  }
});

// @route   DELETE api/employee-schedules/:id
// @desc    Delete an employee schedule
// @access  Private
router.delete('/employee-schedules/:id', auth, async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '排班ID為必填項',
        timestamp: new Date().toISOString()
      };
      res.status(400).json(errorResponse);
      return;
    }

    // 驗證ID格式是否為有效的ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.INVALID_ID,
        error: '無效的員工ID格式',
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
        error: '找不到此員工資料',
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
router.get('/employee-schedules/by-date', [
  auth,
  check('startDate').isISO8601().withMessage('開始日期格式無效'),
  check('endDate').isISO8601().withMessage('結束日期格式無效')
], async (req: Request, res: Response) => {
  try {
    // Validate request parameters
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
        error: JSON.stringify(errors.array()),
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
    interface ScheduleEntry {
      _id: mongoose.Types.ObjectId;
      date: string;
      shift: string;
      startTime: string;
      endTime: string;
      employeeId: string;
      employee: {
        _id: mongoose.Types.ObjectId;
        name: string;
        department: string;
        position: string;
      };
      leaveType: string | null;
      createdAt: Date;
      updatedAt: Date;
    }
    
    interface GroupedSchedules {
      [date: string]: {
        morning: ScheduleEntry[];
        afternoon: ScheduleEntry[];
        evening: ScheduleEntry[];
      };
    }
    
    const groupedSchedules: GroupedSchedules = {};
    
    schedules.forEach(schedule => {
      const dateStr = schedule.date.toISOString().split('T')[0];
      
      if (!dateStr || !groupedSchedules[dateStr]) {
        if (dateStr) {
          groupedSchedules[dateStr] = {
            morning: [],
            afternoon: [],
            evening: []
          };
        }
      }
      
      // 修正資料結構，讓它符合前端期望的 EmployeeSchedule 介面
      if (dateStr && groupedSchedules[dateStr]) {
        const shiftKey = schedule.shift as keyof typeof groupedSchedules[string];
        if (groupedSchedules[dateStr][shiftKey]) {
          groupedSchedules[dateStr][shiftKey].push({
        _id: schedule._id,
        date: dateStr,
        shift: schedule.shift,
        startTime: (schedule as any).startTime || getDefaultStartTime(schedule.shift),
        endTime: (schedule as any).endTime || getDefaultEndTime(schedule.shift),
        employeeId: (schedule.employeeId as any)._id.toString(), // 修正：使用 employeeId 而不是 employee
        employee: schedule.employeeId as unknown as {
          _id: mongoose.Types.ObjectId;
          name: string;
          department: string;
          position: string;
        },
        leaveType: schedule.leaveType || null,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt
          });
        }
      }
    });
    
    const response: ApiResponse<typeof groupedSchedules> = {
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