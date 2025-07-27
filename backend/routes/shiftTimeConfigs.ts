import express, { Request, Response } from 'express';
import { check, validationResult } from 'express-validator';
import mongoose from 'mongoose';
import ShiftTimeConfig, { IShiftTimeConfigDocument } from '../models/ShiftTimeConfig';
import auth from '../middleware/auth';
import { AuthenticatedRequest } from '../src/types/express';

// 導入 shared 類型和常量
import {
  ApiResponse,
  ErrorResponse,
  ERROR_MESSAGES
} from '@pharmacy-pos/shared';

const router: express.Router = express.Router();

/**
 * 班次時間配置數據介面
 */
interface ShiftTimeConfigData {
  shift: 'morning' | 'afternoon' | 'evening';
  startTime: string;
  endTime: string;
  description?: string;
}

/**
 * 班次時間配置更新數據介面
 */
interface ShiftTimeConfigUpdateData {
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
  description?: string;
}

// @route   GET api/shift-time-configs
// @desc    Get all shift time configurations
// @access  Private
router.get('/', auth, async (_req: Request, res: Response) => {
  try {
    const configs = await ShiftTimeConfig.find({ isActive: true })
      .sort({ shift: 1 })
      .lean();

    const response: ApiResponse<typeof configs> = {
      success: true,
      data: configs,
      message: '班次時間配置獲取成功',
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

// @route   GET api/shift-time-configs/:shift
// @desc    Get specific shift time configuration
// @access  Private
router.get('/:shift', [
  auth,
  check('shift').isIn(['morning', 'afternoon', 'evening']).withMessage('無效的班次類型')
], async (req: Request, res: Response) => {
  try {
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

    const config = await ShiftTimeConfig.findOne({ 
      shift: req.params.shift,
      isActive: true 
    }).lean();

    if (!config) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        timestamp: new Date().toISOString()
      };
      res.status(404).json(errorResponse);
      return;
    }

    const response: ApiResponse<typeof config> = {
      success: true,
      data: config,
      message: '班次時間配置獲取成功',
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

// @route   POST api/shift-time-configs
// @desc    Create or update shift time configuration
// @access  Private (Admin only)
router.post('/', [
  auth,
  check('shift').isIn(['morning', 'afternoon', 'evening']).withMessage('無效的班次類型'),
  check('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('開始時間格式無效 (HH:MM)'),
  check('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('結束時間格式無效 (HH:MM)'),
  check('description').optional().isLength({ max: 200 }).withMessage('描述不能超過200字元')
], async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  try {
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

    const { shift, startTime, endTime, description }: ShiftTimeConfigData = req.body;

    // 驗證時間邏輯 - 開始時間應該早於結束時間
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    
    if (startMinutes >= endMinutes) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '開始時間必須早於結束時間',
        timestamp: new Date().toISOString()
      };
      res.status(400).json(errorResponse);
      return;
    }

    // 檢查是否已存在該班次的配置
    const existingConfig = await ShiftTimeConfig.findOne({ shift });

    let config: IShiftTimeConfigDocument;

    if (existingConfig) {
      // 更新現有配置
      existingConfig.startTime = startTime;
      existingConfig.endTime = endTime;
      if (description !== undefined) {
        existingConfig.description = description;
      }
      existingConfig.updatedBy = new mongoose.Types.ObjectId(authReq.user.id);
      existingConfig.isActive = true;
      
      config = await existingConfig.save();
    } else {
      // 創建新配置
      const newConfig = new ShiftTimeConfig({
        shift,
        startTime,
        endTime,
        description,
        createdBy: new mongoose.Types.ObjectId(authReq.user.id),
        isActive: true
      });
      
      config = await newConfig.save();
    }

    const response: ApiResponse<typeof config> = {
      success: true,
      data: config,
      message: existingConfig ? '班次時間配置更新成功' : '班次時間配置創建成功',
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

// @route   PUT api/shift-time-configs/:shift
// @desc    Update specific shift time configuration
// @access  Private (Admin only)
router.put('/:shift', [
  auth,
  check('shift').isIn(['morning', 'afternoon', 'evening']).withMessage('無效的班次類型'),
  check('startTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('開始時間格式無效 (HH:MM)'),
  check('endTime').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('結束時間格式無效 (HH:MM)'),
  check('isActive').optional().isBoolean().withMessage('isActive 必須為布林值'),
  check('description').optional().isLength({ max: 200 }).withMessage('描述不能超過200字元')
], async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  try {
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

    const { startTime, endTime, isActive, description }: ShiftTimeConfigUpdateData = req.body;

    // 如果同時提供了開始和結束時間，驗證時間邏輯
    if (startTime && endTime) {
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(endTime);
      
      if (startMinutes >= endMinutes) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: '開始時間必須早於結束時間',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(errorResponse);
        return;
      }
    }

    const config = await ShiftTimeConfig.findOne({ shift: req.params.shift });

    if (!config) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        timestamp: new Date().toISOString()
      };
      res.status(404).json(errorResponse);
      return;
    }

    // 如果只提供了其中一個時間，需要與現有時間進行驗證
    if (startTime && !endTime) {
      const startMinutes = timeToMinutes(startTime);
      const endMinutes = timeToMinutes(config.endTime);
      
      if (startMinutes >= endMinutes) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: '開始時間必須早於結束時間',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(errorResponse);
        return;
      }
    }

    if (endTime && !startTime) {
      const startMinutes = timeToMinutes(config.startTime);
      const endMinutes = timeToMinutes(endTime);
      
      if (startMinutes >= endMinutes) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: '開始時間必須早於結束時間',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(errorResponse);
        return;
      }
    }

    // 更新配置
    if (startTime !== undefined) config.startTime = startTime;
    if (endTime !== undefined) config.endTime = endTime;
    if (isActive !== undefined) config.isActive = isActive;
    if (description !== undefined) config.description = description;
    config.updatedBy = new mongoose.Types.ObjectId(authReq.user.id);

    const updatedConfig = await config.save();

    const response: ApiResponse<typeof updatedConfig> = {
      success: true,
      data: updatedConfig,
      message: '班次時間配置更新成功',
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

// @route   DELETE api/shift-time-configs/:shift
// @desc    Deactivate shift time configuration
// @access  Private (Admin only)
router.delete('/:shift', [
  auth,
  check('shift').isIn(['morning', 'afternoon', 'evening']).withMessage('無效的班次類型')
], async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  try {
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

    const config = await ShiftTimeConfig.findOne({ shift: req.params.shift });

    if (!config) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.NOT_FOUND,
        timestamp: new Date().toISOString()
      };
      res.status(404).json(errorResponse);
      return;
    }

    // 軟刪除 - 設為非活躍狀態
    config.isActive = false;
    config.updatedBy = new mongoose.Types.ObjectId(authReq.user.id);
    await config.save();

    const response: ApiResponse<null> = {
      success: true,
      data: null,
      message: '班次時間配置已停用',
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

/**
 * 將時間字串轉換為分鐘數
 * @param timeStr - 時間字串 (HH:MM)
 * @returns 分鐘數
 */
function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

export default router;