import express, { Request, Response, Router } from 'express';
import { check, validationResult } from 'express-validator';
import auth from '../middleware/auth';
import { ApiResponse, ErrorResponse } from '@pharmacy-pos/shared/types/api';
import { API_CONSTANTS, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants';

const router: Router = express.Router();

// 定義介面
interface AuthRequest extends Request {
  user?: {
    id: string;
  };
}

// 暫時的模擬資料結構（實際應用中應該有對應的 MongoDB 模型）
interface UserTheme {
  _id?: string;
  userId: string;
  primaryColor: string;
  themeName: string;
  generatedPalette: any;
  mode: 'light' | 'dark' | 'auto';
  customSettings: any;
  createdAt?: Date;
  updatedAt?: Date;
}

// 模擬資料存儲（實際應用中應該使用 MongoDB）
const mockThemes: UserTheme[] = [];

// @route   GET api/user-themes/user/:userId
// @desc    獲取指定用戶的所有主題
// @access  Private
router.get('/user/:userId', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    // 檢查權限：只能獲取自己的主題
    if (req.user?.id !== userId) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '無權限存取其他用戶的主題',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.FORBIDDEN).json(errorResponse);
      return;
    }

    // 模擬獲取用戶主題（實際應用中從資料庫查詢）
    const userThemes = mockThemes.filter(theme => theme.userId === userId);
    
    const response: ApiResponse<UserTheme[]> = {
      success: true,
      message: '用戶主題獲取成功',
      data: userThemes,
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

// @route   GET api/user-themes/user/:userId/default
// @desc    獲取指定用戶的預設主題
// @access  Private
router.get('/user/:userId/default', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    // 檢查權限
    if (req.user?.id !== userId) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '無權限存取其他用戶的主題',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.FORBIDDEN).json(errorResponse);
      return;
    }

    // 模擬獲取預設主題（最新的一個）
    const userThemes = mockThemes
      .filter(theme => theme.userId === userId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
    
    const defaultTheme = userThemes[0];
    
    if (!defaultTheme) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '找不到預設主題',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }
    
    const response: ApiResponse<UserTheme> = {
      success: true,
      message: '預設主題獲取成功',
      data: defaultTheme,
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

// @route   GET api/user-themes/:id
// @desc    根據 ID 獲取特定主題
// @access  Private
router.get('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const theme = mockThemes.find(t => t._id === id);
    
    if (!theme) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '找不到指定的主題',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }
    
    // 檢查權限
    if (req.user?.id !== theme.userId) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '無權限存取此主題',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.FORBIDDEN).json(errorResponse);
      return;
    }
    
    const response: ApiResponse<UserTheme> = {
      success: true,
      message: '主題獲取成功',
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

// @route   POST api/user-themes
// @desc    建立新主題
// @access  Private
router.post(
  '/',
  [
    auth,
    check('userId', '用戶 ID 為必填').not().isEmpty(),
    check('primaryColor', '主要顏色為必填').not().isEmpty(),
    check('themeName', '主題名稱為必填').optional().not().isEmpty()
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
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
      const { userId, primaryColor, themeName, mode, customSettings } = req.body;
      
      // 檢查權限
      if (req.user?.id !== userId) {
        const errorResponse: ErrorResponse = {
          success: false,
          message: '無權限為其他用戶建立主題',
          timestamp: new Date()
        };
        res.status(API_CONSTANTS.HTTP_STATUS.FORBIDDEN).json(errorResponse);
        return;
      }

      // 建立新主題
      const newTheme: UserTheme = {
        _id: Date.now().toString(), // 模擬 ID
        userId,
        primaryColor,
        themeName: themeName || `主題 ${Date.now()}`,
        generatedPalette: {
          primary: { main: primaryColor, light: primaryColor, dark: primaryColor },
          secondary: { main: '#f50057', light: '#f50057', dark: '#f50057' }
        },
        mode: mode || 'light',
        customSettings: customSettings || { borderRadius: 8, elevation: 2, fontScale: 1 },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockThemes.push(newTheme);
      
      const response: ApiResponse<UserTheme> = {
        success: true,
        message: '主題建立成功',
        data: newTheme,
        timestamp: new Date()
      };
      
      res.status(API_CONSTANTS.HTTP_STATUS.CREATED).json(response);
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

// @route   PUT api/user-themes/:id
// @desc    更新主題
// @access  Private
router.put('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const themeIndex = mockThemes.findIndex(t => t._id === id);
    
    if (themeIndex === -1) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '找不到指定的主題',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }
    
    const theme = mockThemes[themeIndex];
    
    // 檢查權限
    if (req.user?.id !== theme.userId) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '無權限修改此主題',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.FORBIDDEN).json(errorResponse);
      return;
    }
    
    // 更新主題
    mockThemes[themeIndex] = {
      ...theme,
      ...updateData,
      updatedAt: new Date()
    };
    
    const response: ApiResponse<UserTheme> = {
      success: true,
      message: '主題更新成功',
      data: mockThemes[themeIndex],
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

// @route   DELETE api/user-themes/:id
// @desc    刪除主題
// @access  Private
router.delete('/:id', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const themeIndex = mockThemes.findIndex(t => t._id === id);
    
    if (themeIndex === -1) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '找不到指定的主題',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.NOT_FOUND).json(errorResponse);
      return;
    }
    
    const theme = mockThemes[themeIndex];
    
    // 檢查權限
    if (req.user?.id !== theme.userId) {
      const errorResponse: ErrorResponse = {
        success: false,
        message: '無權限刪除此主題',
        timestamp: new Date()
      };
      res.status(API_CONSTANTS.HTTP_STATUS.FORBIDDEN).json(errorResponse);
      return;
    }
    
    // 刪除主題
    mockThemes.splice(themeIndex, 1);
    
    const response = {
      success: true,
      message: '主題刪除成功'
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

// @route   GET api/user-themes/colors/defaults
// @desc    獲取預設顏色選項
// @access  Private
router.get('/colors/defaults', auth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const defaultColors = {
      blue: '#1976d2',
      purple: '#9c27b0',
      green: '#388e3c',
      orange: '#f57c00',
      red: '#d32f2f',
      teal: '#00796b',
      indigo: '#303f9f',
      pink: '#c2185b'
    };
    
    const response: ApiResponse<typeof defaultColors> = {
      success: true,
      message: '預設顏色獲取成功',
      data: defaultColors,
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