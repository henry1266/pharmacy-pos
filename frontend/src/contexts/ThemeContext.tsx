/**
 * 主題 Context - 管理應用程式的主題狀態
 * 整合 Material-UI 主題系統與用戶自定義主題
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ThemeProvider, createTheme, Theme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import {
  UserTheme,
  DEFAULT_THEME_COLORS,
  DEFAULT_CUSTOM_SETTINGS
} from '@pharmacy-pos/shared';
import { generateThemePalette } from '@pharmacy-pos/shared/utils/colorUtils';
import {
  getCurrentUserDefaultTheme,
  getCurrentUserThemes,
  createThemeForCurrentUser,
  themeServiceV2
} from '../services/themeServiceV2';

/**
 * 主題 Context 狀態介面
 */
interface ThemeContextState {
  // 當前主題
  currentTheme: UserTheme | null;
  // 用戶所有主題
  userThemes: UserTheme[];
  // Material-UI 主題物件
  muiTheme: Theme;
  // 載入狀態
  loading: boolean;
  // 錯誤狀態
  error: string | null;
  
  // 操作方法
  switchTheme: (themeId: string) => Promise<void>;
  createNewTheme: (primaryColor: string, themeName: string) => Promise<void>;
  updateCurrentTheme: (updates: Partial<UserTheme>) => Promise<void>;
  deleteTheme: (themeId: string) => Promise<void>;
  refreshThemes: () => Promise<void>;
  resetToDefault: () => Promise<void>;
}

/**
 * 預設 Context 值
 */
const defaultContextValue: ThemeContextState = {
  currentTheme: null,
  userThemes: [],
  muiTheme: createTheme(),
  loading: false,
  error: null,
  switchTheme: async () => {},
  createNewTheme: async () => {},
  updateCurrentTheme: async () => {},
  deleteTheme: async () => {},
  refreshThemes: async () => {},
  resetToDefault: async () => {},
};

/**
 * 主題 Context
 */
const ThemeContext = createContext<ThemeContextState>(defaultContextValue);

/**
 * 將用戶主題轉換為 Material-UI 主題
 */
const createMuiThemeFromUserTheme = (userTheme: UserTheme): Theme => {
  const { generatedPalette, mode, customSettings } = userTheme;
  
  return createTheme({
    palette: {
      mode: mode === 'auto' ? 'light' : mode, // 簡化處理，實際可根據系統偏好
      primary: {
        main: generatedPalette.primary.main,
        light: generatedPalette.primary.light,
        dark: generatedPalette.primary.dark,
        contrastText: generatedPalette.primary.contrastText || '#ffffff',
      },
      secondary: {
        main: generatedPalette.secondary.main,
        light: generatedPalette.secondary.light,
        dark: generatedPalette.secondary.dark,
        contrastText: generatedPalette.secondary.contrastText || '#ffffff',
      },
      success: {
        main: generatedPalette.success.main,
        light: generatedPalette.success.light,
        dark: generatedPalette.success.dark,
        contrastText: generatedPalette.success.contrastText || '#ffffff',
      },
      warning: {
        main: generatedPalette.warning.main,
        light: generatedPalette.warning.light,
        dark: generatedPalette.warning.dark,
        contrastText: generatedPalette.warning.contrastText || '#ffffff',
      },
      error: {
        main: generatedPalette.error.main,
        light: generatedPalette.error.light,
        dark: generatedPalette.error.dark,
        contrastText: generatedPalette.error.contrastText || '#ffffff',
      },
      info: {
        main: generatedPalette.info.main,
        light: generatedPalette.info.light,
        dark: generatedPalette.info.dark,
        contrastText: generatedPalette.info.contrastText || '#ffffff',
      },
    },
    shape: {
      borderRadius: customSettings.borderRadius,
    },
    typography: {
      fontSize: 14 * customSettings.fontScale,
    },
    shadows: Array(25).fill('none').map((_, index) => {
      if (index === 0) return 'none';
      const elevation = Math.min(index * customSettings.elevation, 24);
      return `0px ${elevation}px ${elevation * 2}px rgba(0,0,0,0.12)`;
    }) as any,
  });
};

/**
 * 建立預設主題
 */
const createDefaultTheme = async (): Promise<UserTheme> => {
  const defaultTheme: UserTheme = {
    userId: localStorage.getItem('userId') || 'default-user',
    primaryColor: DEFAULT_THEME_COLORS.blue,
    themeName: '預設主題',
    generatedPalette: generateThemePalette(DEFAULT_THEME_COLORS.blue),
    mode: 'light',
    customSettings: DEFAULT_CUSTOM_SETTINGS,
  };
  
  try {
    return await createThemeForCurrentUser(defaultTheme);
  } catch (error) {
    console.warn('無法建立預設主題，使用本地預設值:', error);
    return defaultTheme;
  }
};

/**
 * 主題 Provider 組件
 */
interface ThemeContextProviderProps {
  children: ReactNode;
}

export const ThemeContextProvider: React.FC<ThemeContextProviderProps> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState<UserTheme | null>(null);
  const [userThemes, setUserThemes] = useState<UserTheme[]>([]);
  const [muiTheme, setMuiTheme] = useState<Theme>(createTheme());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 初始化主題
   */
  const initializeTheme = async () => {
    try {
      setLoading(true);
      setError(null);

      // 嘗試獲取用戶預設主題
      let defaultTheme = await getCurrentUserDefaultTheme();
      
      // 如果沒有預設主題，建立一個
      if (!defaultTheme) {
        defaultTheme = await createDefaultTheme();
      }

      // 獲取用戶所有主題
      const themes = await getCurrentUserThemes();

      setCurrentTheme(defaultTheme);
      setUserThemes(themes);
      setMuiTheme(createMuiThemeFromUserTheme(defaultTheme));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '初始化主題失敗';
      setError(errorMessage);
      console.error('主題初始化失敗:', err);
      
      // 使用預設主題作為後備
      const fallbackTheme = await createDefaultTheme();
      setCurrentTheme(fallbackTheme);
      setMuiTheme(createMuiThemeFromUserTheme(fallbackTheme));
    } finally {
      setLoading(false);
    }
  };

  /**
   * 切換主題
   */
  const switchTheme = async (themeId: string) => {
    try {
      const theme = userThemes.find(t => t._id === themeId);
      if (!theme) {
        throw new Error('找不到指定的主題');
      }

      setCurrentTheme(theme);
      setMuiTheme(createMuiThemeFromUserTheme(theme));
      
      // 儲存到本地存儲
      localStorage.setItem('selectedThemeId', themeId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '切換主題失敗';
      setError(errorMessage);
      console.error('切換主題失敗:', err);
    }
  };

  /**
   * 建立新主題
   */
  const createNewTheme = async (primaryColor: string, themeName: string) => {
    try {
      const newTheme = await createThemeForCurrentUser({
        primaryColor,
        themeName,
        mode: 'light',
        customSettings: DEFAULT_CUSTOM_SETTINGS,
      });

      setUserThemes(prev => [newTheme, ...prev]);
      
      // 自動切換到新主題
      await switchTheme(newTheme._id!);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '建立主題失敗';
      setError(errorMessage);
      console.error('建立主題失敗:', err);
    }
  };

  /**
   * 更新當前主題
   */
  const updateCurrentTheme = async (updates: Partial<UserTheme>) => {
    if (!currentTheme?._id) return;

    try {
      // 這裡需要調用更新 API
      // const updatedTheme = await updateTheme(currentTheme._id, updates);
      
      // 暫時本地更新
      const updatedTheme = { ...currentTheme, ...updates };
      setCurrentTheme(updatedTheme);
      setMuiTheme(createMuiThemeFromUserTheme(updatedTheme));
      
      // 更新主題列表
      setUserThemes(prev => 
        prev.map(theme => 
          theme._id === currentTheme._id ? updatedTheme : theme
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新主題失敗';
      setError(errorMessage);
      console.error('更新主題失敗:', err);
    }
  };

  /**
   * 刪除主題
   */
  const deleteTheme = async (themeId: string) => {
    try {
      // 這裡需要調用刪除 API
      // await deleteTheme(themeId);
      
      setUserThemes(prev => prev.filter(theme => theme._id !== themeId));
      
      // 如果刪除的是當前主題，切換到第一個可用主題
      if (currentTheme?._id === themeId) {
        const remainingThemes = userThemes.filter(theme => theme._id !== themeId);
        if (remainingThemes.length > 0) {
          await switchTheme(remainingThemes[0]._id!);
        } else {
          // 建立新的預設主題
          await createNewTheme(DEFAULT_THEME_COLORS.blue, '預設主題');
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '刪除主題失敗';
      setError(errorMessage);
      console.error('刪除主題失敗:', err);
    }
  };

  /**
   * 重新整理主題列表
   */
  const refreshThemes = async () => {
    try {
      const themes = await getCurrentUserThemes();
      setUserThemes(themes);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '重新整理主題失敗';
      setError(errorMessage);
      console.error('重新整理主題失敗:', err);
    }
  };

  /**
   * 重設為預設主題
   */
  const resetToDefault = async () => {
    try {
      const defaultTheme = await createDefaultTheme();
      setCurrentTheme(defaultTheme);
      setMuiTheme(createMuiThemeFromUserTheme(defaultTheme));
      localStorage.removeItem('selectedThemeId');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '重設主題失敗';
      setError(errorMessage);
      console.error('重設主題失敗:', err);
    }
  };

  // 初始化
  useEffect(() => {
    initializeTheme();
  }, []);

  const contextValue: ThemeContextState = {
    currentTheme,
    userThemes,
    muiTheme,
    loading,
    error,
    switchTheme,
    createNewTheme,
    updateCurrentTheme,
    deleteTheme,
    refreshThemes,
    resetToDefault,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

/**
 * 使用主題 Hook
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeContextProvider');
  }
  return context;
};

/**
 * 預設匯出
 */
export default ThemeContext;