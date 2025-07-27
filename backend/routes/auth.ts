import express, { Request, Response, Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from 'config';
import { check, validationResult } from 'express-validator';
import auth from '../middleware/auth';
import { ApiResponse, ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { API_CONSTANTS, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';
import { UserTheme, DEFAULT_THEME_COLORS, DEFAULT_CUSTOM_SETTINGS } from '@pharmacy-pos/shared/types/theme';
import { generateThemePalette } from '@pharmacy-pos/shared/utils/colorUtils';

import User from '../models/User';


const router: Router = express.Router();

// 定義介面
interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

interface LoginRequest {
  username?: string;
  email?: string;
  password: string;
}

interface UpdateUserRequest {
  username?: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}

interface UserValidationResult {
  valid: boolean;
  error?: string;
  user?: any;
}

interface PasswordUpdateResult {
  success: boolean;
  error?: string;
}

interface UsernameUpdateResult {
  success: boolean;
  error?: string;
}

interface EmailUpdateResult {
  success: boolean;
  error?: string;
}

// @route   GET api/auth
// @desc    獲取已登入用戶
// @access  Private
router.get('/', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Find user by ID from token payload and exclude password
    const user = await User.findOne({ _id: req.user.id.toString() }).select('-password');
    if (!user) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '找不到用戶',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }
    
    const response: ApiResponse<any> = {
      success: true,
      message: '用戶資料獲取成功',
      data: user,
      timestamp: new Date()
    };
    res.json(response);
  } catch (err: any) {
    console.error(err.message);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   POST api/auth
// @desc    用戶登入 & 獲取 token 和用戶資訊
// @access  Public
router.post(
  '/',
  [
    check('password', '密碼為必填欄位').exists(),
  ],
  async (req: Request<{}, {}, LoginRequest>, res: Response): Promise<void> => {
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

    const { username, email, password } = req.body;

    if (!username && !email) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '請提供用戶名或電子郵件',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
      return;
    }

    try {
      // 檢查用戶是否存在 - 支持用戶名或電子郵件登入
      let user: any = null;
      
      // 使用參數化查詢，避免 SQL 注入風險
      if (username) {
        const usernameToFind = username.toString();
        user = await User.findOne({ username: usernameToFind });
      } else if (email) {
        const emailToFind = email.toString();
        user = await User.findOne({ email: emailToFind });
      }

      if (!user) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS,
          timestamp: new Date()
        };
        res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
        return;
      }

      // 比對密碼
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS,
          timestamp: new Date()
        };
        res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
        return;
      }

      // 準備 JWT Payload
      const payload = {
        user: {
          id: user.id,
          // Optionally include role in payload if needed frequently, but be mindful of security
          // role: user.role 
        },
      };

      // 簽發 JWT
      // 使用 as any 來完全繞過 TypeScript 的型別檢查
      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: config.get('jwtExpiration') },
        (err: Error | null, token?: string) => {
          if (err) throw err;
          
          const response: ApiResponse<{
            token: string;
            user: {
              id: string;
              name?: string;
              username: string;
              email?: string;
              role: string;
            };
          }> = {
            success: true,
            message: '登入成功',
            data: {
              token: token,
              user: {
                id: user.id,
                name: user.name,
                username: user.username,
                email: user.email,
                role: user.role,
              }
            },
            timestamp: new Date()
          };
          
          res.json(response);
        }
      );
    } catch (err: any) {
      console.error(err.message);
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
    }
  }
);

// 驗證用戶存在
const validateUserExists = async (userId: string): Promise<UserValidationResult> => {
  const user = await User.findById(userId);
  if (!user) {
    return { valid: false, error: '找不到用戶' };
  }
  return { valid: true, user: user };
};

// 更新密碼
const updatePassword = async (
  user: any,
  currentPassword?: string, 
  newPassword?: string
): Promise<PasswordUpdateResult> => {
  if (!currentPassword) {
    return { success: false, error: '請提供當前密碼' };
  }

  if (!newPassword) {
    return { success: false, error: '請提供新密碼' };
  }

  // 驗證當前密碼
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return { success: false, error: '當前密碼不正確' };
  }

  // 加密新密碼
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  return { success: true };
};

// 更新用戶名
const updateUsername = async (
  user: any,
  newUsername?: string
): Promise<UsernameUpdateResult> => {
  if (!newUsername || newUsername === user.username) {
    return { success: true };
  }

  // 檢查用戶名是否已被使用 - 使用參數化查詢
  // 使用安全的方式構建查詢，避免直接使用用戶輸入
  // 使用 mongoose 的參數化查詢，而不是直接將用戶輸入放入查詢對象
  const usernameToCheck = newUsername.toString();
  const existingUser = await User.findOne({ username: usernameToCheck });
  if (existingUser) {
    return { success: false, error: '此用戶名已被使用' };
  }
  
  // 設置新用戶名
  user.username = newUsername;
  return { success: true };
};

// 更新電子郵件
const updateEmail = async (
  user: any,
  newEmail?: string
): Promise<EmailUpdateResult> => {
  if (newEmail === undefined || newEmail === user.email) {
    return { success: true };
  }

  if (newEmail && newEmail.trim() !== '') {
    // 檢查電子郵件是否已被使用 - 使用參數化查詢
    // 使用安全的方式構建查詢，避免直接使用用戶輸入
    // 使用 mongoose 的參數化查詢，而不是直接將用戶輸入放入查詢對象
    const emailToCheck = newEmail.toString();
    const existingUser = await User.findOne({ email: emailToCheck });
    if (existingUser) {
      return { success: false, error: '此電子郵件已被使用' };
    }
    // 設置新電子郵件
    user.email = newEmail;
  } else {
    // 如果email為空或空字符串，則從用戶文檔中移除email字段
    user.email = undefined;
    // 直接從數據庫中移除email字段，不需要檢查user.email是否為undefined
    await User.updateOne(
      { _id: user._id },
      { $unset: { email: 1 } }
    );
  }
  
  return { success: true };
};

// @route   PUT api/auth/update
// @desc    更新當前用戶資訊
// @access  Private
router.put(
  '/update',
  auth,
  [
    check('username', '用戶名不能為空').optional().not().isEmpty(),
    check('email', '請提供有效的電子郵件').optional().isEmail(),
    check('newPassword', '新密碼長度至少需要4個字符').optional().isLength({ min: 4 })
  ],
  async (req: AuthRequest & Request<{}, {}, UpdateUserRequest>, res: Response): Promise<void> => {
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

    const { username, email, currentPassword, newPassword } = req.body;

    try {
      // 驗證用戶存在
      const userValidation = await validateUserExists(req.user.id);
      if (!userValidation.valid) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: userValidation.error || '找不到用戶',
          timestamp: new Date()
        };
        res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
        return;
      }
      
      const user = userValidation.user;

      // 更新密碼
      if (newPassword) {
        const passwordUpdate = await updatePassword(user, currentPassword, newPassword);
        if (!passwordUpdate.success) {
          const errorResponse: ErrorResponse = {
            success: false,
            message: passwordUpdate.error || '密碼更新失敗',
            timestamp: new Date()
          };
          res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
          return;
        }
      }

      // 更新用戶名
      const usernameUpdate = await updateUsername(user, username);
      if (!usernameUpdate.success) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: usernameUpdate.error || '用戶名更新失敗',
          timestamp: new Date()
        };
        res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
        return;
      }

      // 更新電子郵件
      const emailUpdate = await updateEmail(user, email);
      if (!emailUpdate.success) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: emailUpdate.error || '電子郵件更新失敗',
          timestamp: new Date()
        };
        res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
        return;
      }

      // 保存更新
      await user.save();

      // 返回更新後的用戶資訊（不含密碼）
      const updatedUser = await User.findById(user.id).select('-password');
      
      const response: ApiResponse<any> = {
        success: true,
        message: '用戶資料更新成功',
        data: updatedUser,
        timestamp: new Date()
      };
      
      res.json(response);
    } catch (err: any) {
      console.error(err.message);
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
    }
  }
);

// @route   PUT api/auth/settings
// @desc    更新當前用戶設定
// @access  Private
router.put(
  '/settings',
  auth,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { settings } = req.body;

      if (!settings || typeof settings !== 'object') {
        const errorResponse: ErrorResponse = {
          success: false,
          message: '請提供有效的設定資料',
          timestamp: new Date()
        };
        res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json(errorResponse);
        return;
      }

      // 驗證用戶存在
      const userValidation = await validateUserExists(req.user.id);
      if (!userValidation.valid) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: userValidation.error || '找不到用戶',
          timestamp: new Date()
        };
        res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
        return;
      }

      const user = userValidation.user;

      // 更新設定
      user.settings = { ...user.settings, ...settings };
      await user.save();

      // 返回更新後的用戶資訊（不含密碼）
      const updatedUser = await User.findById(user.id).select('-password');
      
      const response: ApiResponse<any> = {
        success: true,
        message: '用戶設定更新成功',
        data: updatedUser,
        timestamp: new Date()
      };
      
      res.json(response);
    } catch (err: any) {
      console.error(err.message);
      const errorResponse: ErrorResponse = {
        success: false,
        message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
    }
  }
);

// @route   GET api/auth/themes
// @desc    獲取當前用戶的主題列表
// @access  Private
router.get('/themes', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userValidation = await validateUserExists(req.user.id);
    if (!userValidation.valid) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: userValidation.error || '找不到用戶',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }

    const user = userValidation.user;
    const themes = user.settings?.theme?.themes || [];

    const response: ApiResponse<UserTheme[]> = {
      success: true,
      message: '主題列表獲取成功',
      data: themes,
      timestamp: new Date()
    };

    res.json(response);
  } catch (err: any) {
    console.error(err.message);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   POST api/auth/themes
// @desc    建立新主題
// @access  Private
router.post('/themes', auth, [
  check('themeName', '主題名稱為必填欄位').not().isEmpty(),
  check('primaryColor', '主色為必填欄位').not().isEmpty(),
  check('mode', '主題模式為必填欄位').isIn(['light', 'dark'])
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

    const userValidation = await validateUserExists(req.user.id);
    if (!userValidation.valid) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: userValidation.error || '找不到用戶',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }

    const user = userValidation.user;

    // 初始化用戶設定（如果不存在）
    if (!user.settings) {
      user.settings = {};
    }
    
    // 初始化主題設定（如果不存在）
    if (!user.settings.theme) {
      user.settings.theme = { themes: [] };
    }

    // 建立新主題
    const newTheme: UserTheme = {
      _id: Date.now().toString(),
      userId: user.id,
      primaryColor,
      themeName,
      generatedPalette: generateThemePalette(primaryColor),
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

    await user.save();

    const response: ApiResponse<UserTheme> = {
      success: true,
      message: '主題建立成功',
      data: newTheme,
      timestamp: new Date()
    };

    res.json(response);
  } catch (err: any) {
    console.error(err.message);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   GET api/auth/themes/default-colors
// @desc    獲取預設顏色
// @access  Private
router.get('/themes/default-colors', auth, async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const response: ApiResponse<typeof DEFAULT_THEME_COLORS> = {
      success: true,
      message: '預設顏色獲取成功',
      data: DEFAULT_THEME_COLORS,
      timestamp: new Date()
    };

    res.json(response);
  } catch (err: any) {
    console.error(err.message);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   PUT api/auth/themes/current/:themeId
// @desc    設定當前主題
// @access  Private
router.put('/themes/current/:themeId', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { themeId } = req.params;

    const userValidation = await validateUserExists(req.user.id);
    if (!userValidation.valid) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: userValidation.error || '找不到用戶',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }

    const user = userValidation.user;

    // 初始化用戶設定（如果不存在）
    if (!user.settings) {
      user.settings = {};
    }
    
    if (!user.settings.theme?.themes) {
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
    await user.save();

    const response: ApiResponse<UserTheme> = {
      success: true,
      message: '當前主題設定成功',
      data: theme,
      timestamp: new Date()
    };

    res.json(response);
  } catch (err: any) {
    console.error(err.message);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   PUT api/auth/themes/:themeId
// @desc    更新主題
// @access  Private
router.put('/themes/:themeId', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { themeId } = req.params;
    const updateData = req.body;

    const userValidation = await validateUserExists(req.user.id);
    if (!userValidation.valid) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: userValidation.error || '找不到用戶',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }

    const user = userValidation.user;

    // 初始化用戶設定（如果不存在）
    if (!user.settings) {
      user.settings = {};
    }
    
    if (!user.settings.theme?.themes) {
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

    // 如果更新了主色，重新生成調色板
    let finalUpdateData = { ...updateData };
    if (updateData.primaryColor) {
      finalUpdateData.generatedPalette = generateThemePalette(updateData.primaryColor);
    }

    // 更新主題
    user.settings.theme.themes[themeIndex] = {
      ...user.settings.theme.themes[themeIndex],
      ...finalUpdateData,
      updatedAt: new Date()
    };

    await user.save();

    const response: ApiResponse<UserTheme> = {
      success: true,
      message: '主題更新成功',
      data: user.settings.theme.themes[themeIndex],
      timestamp: new Date()
    };

    res.json(response);
  } catch (err: any) {
    console.error(err.message);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

// @route   DELETE api/auth/themes/:themeId
// @desc    刪除主題
// @access  Private
router.delete('/themes/:themeId', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { themeId } = req.params;

    const userValidation = await validateUserExists(req.user.id);
    if (!userValidation.valid) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: userValidation.error || '找不到用戶',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }

    const user = userValidation.user;

    // 初始化用戶設定（如果不存在）
    if (!user.settings) {
      user.settings = {};
    }
    
    if (!user.settings.theme?.themes) {
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

    await user.save();

    const response: ApiResponse<{ message: string }> = {
      success: true,
      message: '主題刪除成功',
      data: { message: '主題已成功刪除' },
      timestamp: new Date()
    };

    res.json(response);
  } catch (err: any) {
    console.error(err.message);
    const errorResponse: ErrorResponse = {
      success: false,
      message: ERROR_MESSAGES.GENERIC.SERVER_ERROR,
      timestamp: new Date()
    };
    res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
});

export default router;