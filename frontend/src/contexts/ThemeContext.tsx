import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider, createTheme, Theme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { UserTheme, DEFAULT_THEME_COLORS, DEFAULT_CUSTOM_SETTINGS } from '@pharmacy-pos/shared/types/theme';
import { generateThemePalette } from '@pharmacy-pos/shared/utils/colorUtils';
import { themeServiceV2 } from '../services/themeServiceV2';

// 主題上下文介面
interface ThemeContextType {
  currentTheme: UserTheme | null;
  userThemes: UserTheme[];
  loading: boolean;
  error: string | null;
  switchTheme: (theme: UserTheme) => Promise<void>;
  createTheme: (themeData: Partial<UserTheme>) => Promise<UserTheme>;
  updateCurrentTheme: (themeId: string, updates: Partial<UserTheme>) => Promise<UserTheme>;
  deleteTheme: (themeId: string) => Promise<void>;
  refreshThemes: () => Promise<void>;
  getDefaultColors: () => Promise<Record<string, string>>;
}

// 建立上下文
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Hook 來使用主題上下文
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeContextProvider');
  }
  return context;
};

/**
 * 將 UserTheme 轉換為 Material-UI Theme
 */
const convertToMuiTheme = (userTheme: UserTheme): Theme => {
  const { generatedPalette, mode, customSettings } = userTheme;
  
  return createTheme({
    palette: {
      mode: mode === 'auto' ? 'light' : mode,
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
const createDefaultTheme = (): Theme => {
  return createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: DEFAULT_THEME_COLORS?.blue || '#1976d2',
      },
    },
  });
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
  const [muiTheme, setMuiTheme] = useState<Theme>(createDefaultTheme());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 應用主題到 Material-UI
   */
  const applyTheme = (theme: UserTheme) => {
    const newMuiTheme = convertToMuiTheme(theme);
    setMuiTheme(newMuiTheme);
  };

  /**
   * 載入用戶主題
   */
  const loadUserThemes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 獲取用戶資料和主題列表
      const [user, themes] = await Promise.all([
        themeServiceV2.getCurrentUser(),
        themeServiceV2.getUserThemes()
      ]);
      
      console.log('載入的主題列表:', themes);
      setUserThemes(themes);
      
      // 獲取當前主題
      const currentThemeId = user.settings?.theme?.currentThemeId;
      let themeToApply: UserTheme | null = null;
      
      if (currentThemeId) {
        themeToApply = themes.find(theme => theme._id === currentThemeId) || null;
        if (!themeToApply) {
          console.warn(`當前主題 ID ${currentThemeId} 不存在於主題列表中`);
        }
      }
      
      // 如果沒有當前主題但有主題列表，使用第一個主題
      if (!themeToApply && themes.length > 0) {
        themeToApply = themes[0];
        console.log('使用第一個可用主題:', themeToApply);
        // 自動設定為當前主題
        try {
          await themeServiceV2.setCurrentTheme(themes[0]._id!);
        } catch (error) {
          console.error('設定當前主題失敗:', error);
        }
      }
      
      if (themeToApply) {
        setCurrentTheme(themeToApply);
        applyTheme(themeToApply);
        console.log('已應用主題:', themeToApply.themeName);
      } else {
        // 如果沒有任何主題，建立預設主題
        console.log('沒有可用主題，建立預設主題');
        try {
          const defaultTheme = await createThemeForUser();
          setCurrentTheme(defaultTheme);
          setUserThemes([defaultTheme]);
          applyTheme(defaultTheme);
          console.log('已建立並應用預設主題:', defaultTheme);
        } catch (error) {
          console.error('建立預設主題失敗:', error);
          setError('無法載入主題設定');
        }
      }
    } catch (error: any) {
      console.error('載入用戶主題失敗:', error);
      setError('載入主題失敗: ' + error.message);
      
      // 如果載入失敗，嘗試使用本地儲存的主題
      try {
        const savedTheme = localStorage.getItem('currentTheme');
        if (savedTheme) {
          const parsedTheme = JSON.parse(savedTheme);
          console.log('使用本地儲存的主題:', parsedTheme);
          setCurrentTheme(parsedTheme);
          applyTheme(parsedTheme);
        }
      } catch (localError) {
        console.error('載入本地主題失敗:', localError);
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * 建立用戶預設主題
   */
  const createThemeForUser = async (): Promise<UserTheme> => {
    const defaultThemeData = {
      themeName: '預設主題',
      primaryColor: DEFAULT_THEME_COLORS?.blue || '#1976d2',
      mode: 'light' as const,
      customSettings: DEFAULT_CUSTOM_SETTINGS
    };
    
    return await themeServiceV2.createTheme(defaultThemeData);
  };

  /**
   * 切換主題
   */
  const switchTheme = async (theme: UserTheme) => {
    try {
      // 設定為當前主題（後端）
      await themeServiceV2.setCurrentTheme(theme._id);
      
      // 更新本地狀態
      setCurrentTheme(theme);
      applyTheme(theme);
      
      // 儲存到 localStorage（備用）
      localStorage.setItem('currentTheme', JSON.stringify(theme));
    } catch (error) {
      console.error('切換主題失敗:', error);
      setError('切換主題失敗');
      // 即使後端失敗，仍然應用本地主題
      setCurrentTheme(theme);
      applyTheme(theme);
      localStorage.setItem('currentTheme', JSON.stringify(theme));
    }
  };

  /**
   * 建立新主題
   */
  const createNewTheme = async (themeData: Partial<UserTheme>): Promise<UserTheme> => {
    try {
      const newTheme = await themeServiceV2.createTheme(themeData);
      
      // 更新本地狀態
      setUserThemes(prev => [...prev, newTheme]);
      
      return newTheme;
    } catch (error) {
      console.error('建立主題失敗:', error);
      setError('建立主題失敗');
      throw error;
    }
  };

  /**
   * 更新當前主題
   */
  const updateCurrentTheme = async (themeId: string, updates: Partial<UserTheme>): Promise<UserTheme> => {
    try {
      setLoading(true);
      setError(null);
      
      // 檢查主題是否存在於本地狀態
      const existingTheme = userThemes.find(theme => theme._id === themeId);
      if (!existingTheme) {
        console.warn('主題不存在，重新載入主題列表');
        await loadUserThemes();
        throw new Error('主題不存在，請重新整理頁面');
      }

      console.log('正在更新主題:', themeId, updates);
      const updatedTheme = await themeServiceV2.updateTheme(themeId, updates);
      console.log('後端返回的更新主題:', updatedTheme);
      
      // 更新本地狀態
      setUserThemes(prev =>
        prev.map(theme => theme._id === themeId ? updatedTheme : theme)
      );
      
      // 如果更新的是當前主題，重新應用並儲存
      if (currentTheme?._id === themeId) {
        setCurrentTheme(updatedTheme);
        applyTheme(updatedTheme);
        
        // 儲存到本地儲存
        localStorage.setItem('currentTheme', JSON.stringify(updatedTheme));
        console.log('已更新並應用主題:', updatedTheme.themeName);
      }
      
      return updatedTheme;
    } catch (error: any) {
      console.error('更新主題失敗:', error);
      
      // 如果是 404 錯誤，表示主題不存在，重新載入主題列表
      if (error.message?.includes('404') || error.message?.includes('Not Found')) {
        console.warn('主題不存在於後端，重新載入主題列表');
        await loadUserThemes();
        setError('主題已過期，已重新載入主題列表');
      } else {
        setError('更新主題失敗: ' + error.message);
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * 刪除主題
   */
  const deleteTheme = async (themeId: string) => {
    try {
      await themeServiceV2.deleteTheme(themeId);
      
      // 更新本地狀態
      const remainingThemes = userThemes.filter(theme => theme._id !== themeId);
      setUserThemes(remainingThemes);
      
      // 如果刪除的是當前主題，切換到第一個可用主題
      if (currentTheme?._id === themeId) {
        if (remainingThemes.length > 0) {
          await switchTheme(remainingThemes[0]);
        } else {
          // 如果沒有剩餘主題，建立新的預設主題
          const defaultTheme = await createThemeForUser();
          setCurrentTheme(defaultTheme);
          setUserThemes([defaultTheme]);
          applyTheme(defaultTheme);
        }
      }
    } catch (error) {
      console.error('刪除主題失敗:', error);
      setError('刪除主題失敗');
      throw error;
    }
  };

  /**
   * 重新整理主題列表
   */
  const refreshThemes = async () => {
    await loadUserThemes();
  };

  /**
   * 獲取預設顏色
   */
  const getDefaultColors = async (): Promise<Record<string, string>> => {
    try {
      return await themeServiceV2.getDefaultColors();
    } catch (error) {
      console.error('獲取預設顏色失敗:', error);
      return DEFAULT_THEME_COLORS;
    }
  };

  // 初始化
  useEffect(() => {
    loadUserThemes();
  }, []);

  // 上下文值
  const contextValue: ThemeContextType = {
    currentTheme,
    userThemes,
    loading,
    error,
    switchTheme,
    createTheme: createNewTheme,
    updateCurrentTheme,
    deleteTheme,
    refreshThemes,
    getDefaultColors,
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

export default ThemeContext;