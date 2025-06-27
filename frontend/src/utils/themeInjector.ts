/**
 * 動態主題注入器
 * 將 Material 3 主題顏色注入到 CSS 變數中
 */

import { UserTheme } from '@pharmacy-pos/shared/types/theme';

interface ThemeVariables {
  // 主要顏色
  '--primary-color': string;
  '--primary-light': string;
  '--secondary-color': string;
  '--success-color': string;
  '--danger-color': string;
  '--warning-color': string;
  '--info-color': string;
  
  // 背景顏色
  '--bg-primary': string;
  '--bg-secondary': string;
  '--bg-sidebar': string;
  
  // 文字顏色
  '--text-primary': string;
  '--text-secondary': string;
  '--text-muted': string;
  '--text-light': string;
  
  // 邊框和其他
  '--border-color': string;
}

/**
 * 將 Material 3 主題轉換為 CSS 變數
 */
export const convertThemeToCSSVariables = (theme: UserTheme): ThemeVariables => {
  const { generatedPalette, mode } = theme;
  const actualMode = mode === 'auto' ? 'light' : mode;
  
  // 檢查是否有 Material 3 調色板
  const hasMaterial3 = generatedPalette.material3?.lightScheme && generatedPalette.material3?.darkScheme;
  
  if (hasMaterial3) {
    // 使用 Material 3 調色板
    const material3Scheme = actualMode === 'dark'
      ? generatedPalette.material3!.darkScheme
      : generatedPalette.material3!.lightScheme;
    
    return {
      // 主要顏色
      '--primary-color': material3Scheme.primary,
      '--primary-light': material3Scheme.primaryContainer,
      '--secondary-color': material3Scheme.secondary,
      '--success-color': material3Scheme.tertiary, // 使用 tertiary 作為 success
      '--danger-color': material3Scheme.error,
      '--warning-color': material3Scheme.tertiary,
      '--info-color': material3Scheme.primary,
      
      // 背景顏色
      '--bg-primary': material3Scheme.background,
      '--bg-secondary': material3Scheme.surface,
      '--bg-sidebar': actualMode === 'dark' ? material3Scheme.surfaceVariant : '#0f172a',
      
      // 文字顏色
      '--text-primary': material3Scheme.onBackground,
      '--text-secondary': material3Scheme.onSurfaceVariant,
      '--text-muted': material3Scheme.outline,
      '--text-light': material3Scheme.onPrimary,
      
      // 邊框
      '--border-color': material3Scheme.outline,
    };
  } else {
    // 使用傳統調色板
    return {
      // 主要顏色
      '--primary-color': generatedPalette.primary.main,
      '--primary-light': generatedPalette.primary.light,
      '--secondary-color': generatedPalette.secondary.main,
      '--success-color': generatedPalette.success.main,
      '--danger-color': generatedPalette.error.main,
      '--warning-color': generatedPalette.warning.main,
      '--info-color': generatedPalette.info.main,
      
      // 背景顏色 (根據模式調整)
      '--bg-primary': actualMode === 'dark' ? '#121212' : '#f5f4f8',
      '--bg-secondary': actualMode === 'dark' ? '#1e1e1e' : '#ffffff',
      '--bg-sidebar': actualMode === 'dark' ? '#2d2d2d' : '#0f172a',
      
      // 文字顏色
      '--text-primary': actualMode === 'dark' ? '#ffffff' : '#1e293b',
      '--text-secondary': actualMode === 'dark' ? '#b3b3b3' : '#64748b',
      '--text-muted': actualMode === 'dark' ? '#808080' : '#94a3b8',
      '--text-light': '#ffffff',
      
      // 邊框
      '--border-color': actualMode === 'dark' ? '#404040' : '#e2e8f0',
    };
  }
};

/**
 * 注入主題變數到 CSS
 */
export const injectThemeVariables = (theme: UserTheme): void => {
  const variables = convertThemeToCSSVariables(theme);
  const root = document.documentElement;
  
  // 設定所有 CSS 變數
  Object.entries(variables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
  
  console.log('🎨 已注入 Material 3 主題變數:', theme.themeName, variables);
};

/**
 * 重置為預設主題
 */
export const resetToDefaultTheme = (): void => {
  const defaultVariables: ThemeVariables = {
    '--primary-color': '#7a65ff',
    '--primary-light': '#e5e1ff',
    '--secondary-color': '#6c757d',
    '--success-color': '#00b66a',
    '--danger-color': '#e53f3c',
    '--warning-color': '#f5a623',
    '--info-color': '#30b1aa',
    '--bg-primary': '#f5f4f8',
    '--bg-secondary': '#ffffff',
    '--bg-sidebar': '#0f172a',
    '--text-primary': '#1e293b',
    '--text-secondary': '#64748b',
    '--text-muted': '#94a3b8',
    '--text-light': '#ffffff',
    '--border-color': '#e2e8f0',
  };
  
  const root = document.documentElement;
  Object.entries(defaultVariables).forEach(([property, value]) => {
    root.style.setProperty(property, value);
  });
  
  console.log('🔄 已重置為預設主題');
};

/**
 * 獲取當前 CSS 變數值
 */
export const getCurrentThemeVariables = (): ThemeVariables => {
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  
  return {
    '--primary-color': computedStyle.getPropertyValue('--primary-color').trim(),
    '--primary-light': computedStyle.getPropertyValue('--primary-light').trim(),
    '--secondary-color': computedStyle.getPropertyValue('--secondary-color').trim(),
    '--success-color': computedStyle.getPropertyValue('--success-color').trim(),
    '--danger-color': computedStyle.getPropertyValue('--danger-color').trim(),
    '--warning-color': computedStyle.getPropertyValue('--warning-color').trim(),
    '--info-color': computedStyle.getPropertyValue('--info-color').trim(),
    '--bg-primary': computedStyle.getPropertyValue('--bg-primary').trim(),
    '--bg-secondary': computedStyle.getPropertyValue('--bg-secondary').trim(),
    '--bg-sidebar': computedStyle.getPropertyValue('--bg-sidebar').trim(),
    '--text-primary': computedStyle.getPropertyValue('--text-primary').trim(),
    '--text-secondary': computedStyle.getPropertyValue('--text-secondary').trim(),
    '--text-muted': computedStyle.getPropertyValue('--text-muted').trim(),
    '--text-light': computedStyle.getPropertyValue('--text-light').trim(),
    '--border-color': computedStyle.getPropertyValue('--border-color').trim(),
  };
};