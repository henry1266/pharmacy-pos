/**
 * 主題路由 V2 - 統一的主題管理 API
 * 基於用戶認證系統的主題管理
 */

import express, { Request, Response, Router } from 'express';
import { check, validationResult } from 'express-validator';
import auth from '../middleware/auth';
import { ApiResponse, ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { API_CONSTANTS, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';
import { UserTheme, DEFAULT_THEME_COLORS, DEFAULT_CUSTOM_SETTINGS } from '@pharmacy-pos/shared/types/theme';
import { generateThemePalette } from '@pharmacy-pos/shared/utils/colorUtils';
import { enhancePaletteWithMaterial3 } from '@pharmacy-pos/shared/utils';
import User from '../models/User';

const router: Router = express.Router();

// 定義介面
interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

// 驗證用戶存在
const validateUserExists = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('找不到用戶');
  }
  return user;
};

// @route   GET /api/themes
// @desc    獲取當前用戶的主題列表
// @access  Private
router.get('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await validateUserExists(req.user!.id);
    const themes = user.settings?.theme?.themes || [];

    const response: ApiResponse<UserTheme[]> = {
      success: true,
      message: '主題列表獲取成功',
      data: themes,
      timestamp: new Date()
    };

    res.json(response);
  } catch (err: any) {
    console.error('獲取主題列表錯誤:', err.message);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   GET /api/themes/default-colors
// @desc    獲取預設顏色
// @access  Private
router.get('/default-colors', auth, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const response: ApiResponse<typeof DEFAULT_THEME_COLORS> = {
      success: true,
      message: '預設顏色獲取成功',
      data: DEFAULT_THEME_COLORS,
      timestamp: new Date()
    };

    res.json(response);
  } catch (err: any) {
    console.error('獲取預設顏色錯誤:', err.message);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   GET /api/themes/current
// @desc    獲取當前主題
// @access  Private
router.get('/current', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await validateUserExists(req.user!.id);
    const currentThemeId = user.settings?.theme?.currentThemeId;
    
    if (!currentThemeId || !user.settings?.theme?.themes) {
      const response: ApiResponse<null> = {
        success: true,
        message: '沒有設定當前主題',
        data: null,
        timestamp: new Date()
      };
      res.json(response);
      return;
    }

    const currentTheme = user.settings.theme.themes.find(
      (theme: UserTheme) => theme._id === currentThemeId
    );

    const response: ApiResponse<UserTheme | null> = {
      success: true,
      message: '當前主題獲取成功',
      data: currentTheme || null,
      timestamp: new Date()
    };

    res.json(response);
  } catch (err: any) {
    console.error('獲取當前主題錯誤:', err.message);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   POST /api/themes
// @desc    建立新主題
// @access  Private
router.post('/', auth, [
  check('themeName', '主題名稱為必填欄位').not().isEmpty(),
  check('primaryColor', '主色為必填欄位').not().isEmpty(),
  check('mode', '主題模式為必填欄位').isIn(['light', 'dark', 'auto'])
], async (req: AuthRequest, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
      error: JSON.stringify(errors.array()),
      timestamp: new Date()
    };
    res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
    return;
  }

  try {
    const { themeName, primaryColor, mode, customSettings } = req.body;
    const user = await validateUserExists(req.user!.id);

    // 初始化用戶設定
    if (!user.settings) {
      user.settings = {};
    }
    
    if (!user.settings.theme) {
      user.settings.theme = { themes: [] };
    }

    // 建立新主題
    const newTheme: UserTheme = {
      _id: Date.now().toString(),
      userId: user.id,
      primaryColor,
      themeName,
      generatedPalette: req.body.generatedPalette || generateThemePalette(primaryColor),
      mode: mode || 'light',
      customSettings: customSettings || DEFAULT_CUSTOM_SETTINGS,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 添加到用戶主題列表
    user.settings.theme.themes.push(newTheme);

    // 如果這是第一個主題，設為當前主題
    if (user.settings.theme.themes.length === 1) {
      user.settings.theme.currentThemeId = newTheme._id;
    }

    // 標記嵌套物件已修改
    user.markModified('settings');
    await user.save();

    console.log('新主題已建立並保存到資料庫:', newTheme);

    const response: ApiResponse<UserTheme> = {
      success: true,
      message: '主題建立成功',
      data: newTheme,
      timestamp: new Date()
    };

    res.json(response);
  } catch (err: any) {
    console.error('建立主題錯誤:', err.message);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   PUT /api/themes/current/:themeId
// @desc    設定當前主題
// @access  Private
router.put('/current/:themeId', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { themeId } = req.params;
    const user = await validateUserExists(req.user!.id);

    if (!user.settings?.theme?.themes) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '找不到主題',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }

    const theme = user.settings.theme.themes.find((theme: UserTheme) => theme._id === themeId);
    if (!theme) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '找不到指定的主題',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }

    // 設定當前主題
    user.settings.theme.currentThemeId = themeId;
    
    // 標記嵌套物件已修改
    user.markModified('settings');
    await user.save();

    console.log('當前主題已設定並保存到資料庫:', themeId);

    const response: ApiResponse<UserTheme> = {
      success: true,
      message: '當前主題設定成功',
      data: theme,
      timestamp: new Date()
    };

    res.json(response);
  } catch (err: any) {
    console.error('設定當前主題錯誤:', err.message);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   PUT /api/themes/:themeId
// @desc    更新主題
// @access  Private
router.put('/:themeId', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { themeId } = req.params;
    const updateData = req.body;
    const user = await validateUserExists(req.user!.id);

    if (!user.settings?.theme?.themes) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '找不到主題',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }

    const themeIndex = user.settings.theme.themes.findIndex((theme: UserTheme) => theme._id === themeId);
    if (themeIndex === -1) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '找不到指定的主題',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }

    // 如果更新了主色，重新生成調色板（除非已提供 generatedPalette）
    let finalUpdateData = { ...updateData };
    if (updateData.primaryColor && !updateData.generatedPalette) {
      finalUpdateData.generatedPalette = generateThemePalette(updateData.primaryColor);
    }

    // 更新主題
    user.settings.theme.themes[themeIndex] = {
      ...user.settings.theme.themes[themeIndex],
      ...finalUpdateData,
      updatedAt: new Date()
    };

    // 標記嵌套物件已修改，確保 MongoDB 能正確保存
    user.markModified('settings.theme.themes');
    await user.save();

    console.log('主題已更新並保存到資料庫:', user.settings.theme.themes[themeIndex]);

    const response: ApiResponse<UserTheme> = {
      success: true,
      message: '主題更新成功',
      data: user.settings.theme.themes[themeIndex],
      timestamp: new Date()
    };

    res.json(response);
  } catch (err: any) {
    console.error('更新主題錯誤:', err.message);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   DELETE /api/themes/:themeId
// @desc    刪除主題
// @access  Private
router.delete('/:themeId', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { themeId } = req.params;
    const user = await validateUserExists(req.user!.id);

    if (!user.settings?.theme?.themes) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '找不到主題',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }

    const themeIndex = user.settings.theme.themes.findIndex((theme: UserTheme) => theme._id === themeId);
    if (themeIndex === -1) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '找不到指定的主題',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }

    // 如果刪除的是當前主題，清除當前主題 ID
    if (user.settings.theme.currentThemeId === themeId) {
      user.settings.theme.currentThemeId = undefined;
    }

    // 刪除主題
    user.settings.theme.themes.splice(themeIndex, 1);
    
    // 標記嵌套物件已修改
    user.markModified('settings');
    await user.save();

    console.log('主題已刪除並保存到資料庫:', themeId);

    const response: ApiResponse<{ message: string }> = {
      success: true,
      message: '主題刪除成功',
      data: { message: '主題已成功刪除' },
      timestamp: new Date()
    };

    res.json(response);
  } catch (err: any) {
    console.error('刪除主題錯誤:', err.message);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

export default router;