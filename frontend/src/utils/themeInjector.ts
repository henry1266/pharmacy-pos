/**
 * 動態主題注入器
 * 將 Material 3 主題顏色注入到 CSS 變數中
 */

import { UserTheme } from '@pharmacy-pos/shared/types/theme';

/**
 * 從 hex 顏色提取 RGB 分量
 */
function extractRgbFromHex(hex: string): { r: string; g: string; b: string } {
  // 移除 # 符號
  const cleanHex = hex.replace('#', '');
  
  // 處理 3 位數的 hex (如 #fff)
  const fullHex = cleanHex.length === 3
    ? cleanHex.split('').map(char => char + char).join('')
    : cleanHex;
  
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);
  
  return {
    r: r.toString(),
    g: g.toString(),
    b: b.toString()
  };
}

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
  
  // Material 3 RGB 分量變數
  '--primary-r': string;
  '--primary-g': string;
  '--primary-b': string;
  '--secondary-r': string;
  '--secondary-g': string;
  '--secondary-b': string;
  '--success-r': string;
  '--success-g': string;
  '--success-b': string;
  '--error-r': string;
  '--error-g': string;
  '--error-b': string;
  '--warning-r': string;
  '--warning-g': string;
  '--warning-b': string;
  '--info-r': string;
  '--info-g': string;
  '--info-b': string;
  '--surface-r': string;
  '--surface-g': string;
  '--surface-b': string;
  '--background-r': string;
  '--background-g': string;
  '--background-b': string;
  '--on-surface-r': string;
  '--on-surface-g': string;
  '--on-surface-b': string;
  '--on-surface-variant-r': string;
  '--on-surface-variant-g': string;
  '--on-surface-variant-b': string;
  '--outline-r': string;
  '--outline-g': string;
  '--outline-b': string;
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
    
    // 提取所有顏色的 RGB 分量
    const primaryRgb = extractRgbFromHex(material3Scheme.primary);
    const secondaryRgb = extractRgbFromHex(material3Scheme.secondary);
    const tertiaryRgb = extractRgbFromHex(material3Scheme.tertiary);
    const errorRgb = extractRgbFromHex(material3Scheme.error);
    const backgroundRgb = extractRgbFromHex(material3Scheme.background);
    const surfaceRgb = extractRgbFromHex(material3Scheme.surface);
    const onBackgroundRgb = extractRgbFromHex(material3Scheme.onBackground);
    const onSurfaceVariantRgb = extractRgbFromHex(material3Scheme.onSurfaceVariant);
    const outlineRgb = extractRgbFromHex(material3Scheme.outline);

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

      // RGB 分量 - Primary
      '--primary-r': primaryRgb.r,
      '--primary-g': primaryRgb.g,
      '--primary-b': primaryRgb.b,

      // RGB 分量 - Secondary
      '--secondary-r': secondaryRgb.r,
      '--secondary-g': secondaryRgb.g,
      '--secondary-b': secondaryRgb.b,

      // RGB 分量 - Success (使用 tertiary)
      '--success-r': tertiaryRgb.r,
      '--success-g': tertiaryRgb.g,
      '--success-b': tertiaryRgb.b,

      // RGB 分量 - Error
      '--error-r': errorRgb.r,
      '--error-g': errorRgb.g,
      '--error-b': errorRgb.b,

      // RGB 分量 - Warning (使用 tertiary)
      '--warning-r': tertiaryRgb.r,
      '--warning-g': tertiaryRgb.g,
      '--warning-b': tertiaryRgb.b,

      // RGB 分量 - Info (使用 primary)
      '--info-r': primaryRgb.r,
      '--info-g': primaryRgb.g,
      '--info-b': primaryRgb.b,

      // RGB 分量 - Surface
      '--surface-r': surfaceRgb.r,
      '--surface-g': surfaceRgb.g,
      '--surface-b': surfaceRgb.b,

      // RGB 分量 - Background
      '--background-r': backgroundRgb.r,
      '--background-g': backgroundRgb.g,
      '--background-b': backgroundRgb.b,

      // RGB 分量 - On Surface
      '--on-surface-r': onBackgroundRgb.r,
      '--on-surface-g': onBackgroundRgb.g,
      '--on-surface-b': onBackgroundRgb.b,

      // RGB 分量 - On Surface Variant
      '--on-surface-variant-r': onSurfaceVariantRgb.r,
      '--on-surface-variant-g': onSurfaceVariantRgb.g,
      '--on-surface-variant-b': onSurfaceVariantRgb.b,

      // RGB 分量 - Outline
      '--outline-r': outlineRgb.r,
      '--outline-g': outlineRgb.g,
      '--outline-b': outlineRgb.b,
    };
  } else {
    // 使用傳統調色板
    // 提取所有顏色的 RGB 分量
    const primaryRgb = extractRgbFromHex(generatedPalette.primary.main);
    const secondaryRgb = extractRgbFromHex(generatedPalette.secondary.main);
    const successRgb = extractRgbFromHex(generatedPalette.success.main);
    const errorRgb = extractRgbFromHex(generatedPalette.error.main);
    const warningRgb = extractRgbFromHex(generatedPalette.warning.main);
    const infoRgb = extractRgbFromHex(generatedPalette.info.main);
    
    const bgPrimary = actualMode === 'dark' ? '#121212' : '#f5f4f8';
    const bgSecondary = actualMode === 'dark' ? '#1e1e1e' : '#ffffff';
    const bgSidebar = actualMode === 'dark' ? '#2d2d2d' : '#0f172a';
    const textPrimary = actualMode === 'dark' ? '#ffffff' : '#1e293b';
    const textSecondary = actualMode === 'dark' ? '#b3b3b3' : '#64748b';
    const textMuted = actualMode === 'dark' ? '#808080' : '#94a3b8';
    const borderColor = actualMode === 'dark' ? '#404040' : '#e2e8f0';
    
    const bgPrimaryRgb = extractRgbFromHex(bgPrimary);
    const bgSecondaryRgb = extractRgbFromHex(bgSecondary);
    const textPrimaryRgb = extractRgbFromHex(textPrimary);
    const textSecondaryRgb = extractRgbFromHex(textSecondary);
    const borderRgb = extractRgbFromHex(borderColor);

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
      '--bg-primary': bgPrimary,
      '--bg-secondary': bgSecondary,
      '--bg-sidebar': bgSidebar,
      
      // 文字顏色
      '--text-primary': textPrimary,
      '--text-secondary': textSecondary,
      '--text-muted': textMuted,
      '--text-light': '#ffffff',
      
      // 邊框
      '--border-color': borderColor,

      // RGB 分量 - Primary
      '--primary-r': primaryRgb.r,
      '--primary-g': primaryRgb.g,
      '--primary-b': primaryRgb.b,

      // RGB 分量 - Secondary
      '--secondary-r': secondaryRgb.r,
      '--secondary-g': secondaryRgb.g,
      '--secondary-b': secondaryRgb.b,

      // RGB 分量 - Success
      '--success-r': successRgb.r,
      '--success-g': successRgb.g,
      '--success-b': successRgb.b,

      // RGB 分量 - Error
      '--error-r': errorRgb.r,
      '--error-g': errorRgb.g,
      '--error-b': errorRgb.b,

      // RGB 分量 - Warning
      '--warning-r': warningRgb.r,
      '--warning-g': warningRgb.g,
      '--warning-b': warningRgb.b,

      // RGB 分量 - Info
      '--info-r': infoRgb.r,
      '--info-g': infoRgb.g,
      '--info-b': infoRgb.b,

      // RGB 分量 - Surface (使用 bgSecondary)
      '--surface-r': bgSecondaryRgb.r,
      '--surface-g': bgSecondaryRgb.g,
      '--surface-b': bgSecondaryRgb.b,

      // RGB 分量 - Background
      '--background-r': bgPrimaryRgb.r,
      '--background-g': bgPrimaryRgb.g,
      '--background-b': bgPrimaryRgb.b,

      // RGB 分量 - On Surface
      '--on-surface-r': textPrimaryRgb.r,
      '--on-surface-g': textPrimaryRgb.g,
      '--on-surface-b': textPrimaryRgb.b,

      // RGB 分量 - On Surface Variant
      '--on-surface-variant-r': textSecondaryRgb.r,
      '--on-surface-variant-g': textSecondaryRgb.g,
      '--on-surface-variant-b': textSecondaryRgb.b,

      // RGB 分量 - Outline
      '--outline-r': borderRgb.r,
      '--outline-g': borderRgb.g,
      '--outline-b': borderRgb.b,
    };
  }
};

// 主題注入防護機制
let themeInjectionLock = false;
let lastThemeHash = '';

/**
 * 計算主題變數的雜湊值
 */
const calculateThemeHash = (variables: ThemeVariables): string => {
  const sortedEntries = Object.entries(variables).sort();
  return btoa(JSON.stringify(sortedEntries)).slice(0, 16);
};

/**
 * 注入主題變數到 CSS（帶防重複機制）
 */
export const injectThemeVariables = (theme: UserTheme): void => {
  // 防止同時注入
  if (themeInjectionLock) {
    console.log('🔒 主題注入已鎖定，跳過重複操作');
    return;
  }

  const variables = convertThemeToCSSVariables(theme);
  const currentThemeHash = calculateThemeHash(variables);
  
  // 檢查是否為相同主題
  if (currentThemeHash === lastThemeHash) {
    console.log('🎨 主題變數未變更，跳過注入');
    return;
  }

  themeInjectionLock = true;
  
  try {
    const root = document.documentElement;
    
    // 批次設定所有 CSS 變數
    Object.entries(variables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
    
    lastThemeHash = currentThemeHash;
    console.log('🎨 已注入 Material 3 主題變數:', theme.themeName);
  } finally {
    // 延遲解鎖，防止快速重複調用
    setTimeout(() => {
      themeInjectionLock = false;
    }, 100);
  }
};

/**
 * 重置為預設主題
 */
export const resetToDefaultTheme = (): void => {
  // 提取預設顏色的 RGB 分量
  const primaryRgb = extractRgbFromHex('#7a65ff');
  const secondaryRgb = extractRgbFromHex('#6c757d');
  const successRgb = extractRgbFromHex('#00b66a');
  const dangerRgb = extractRgbFromHex('#e53f3c');
  const warningRgb = extractRgbFromHex('#f5a623');
  const infoRgb = extractRgbFromHex('#30b1aa');
  const bgPrimaryRgb = extractRgbFromHex('#f5f4f8');
  const bgSecondaryRgb = extractRgbFromHex('#ffffff');
  const textPrimaryRgb = extractRgbFromHex('#1e293b');
  const textSecondaryRgb = extractRgbFromHex('#64748b');
  const borderRgb = extractRgbFromHex('#e2e8f0');

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

    // RGB 分量 - Primary
    '--primary-r': primaryRgb.r,
    '--primary-g': primaryRgb.g,
    '--primary-b': primaryRgb.b,

    // RGB 分量 - Secondary
    '--secondary-r': secondaryRgb.r,
    '--secondary-g': secondaryRgb.g,
    '--secondary-b': secondaryRgb.b,

    // RGB 分量 - Success
    '--success-r': successRgb.r,
    '--success-g': successRgb.g,
    '--success-b': successRgb.b,

    // RGB 分量 - Error
    '--error-r': dangerRgb.r,
    '--error-g': dangerRgb.g,
    '--error-b': dangerRgb.b,

    // RGB 分量 - Warning
    '--warning-r': warningRgb.r,
    '--warning-g': warningRgb.g,
    '--warning-b': warningRgb.b,

    // RGB 分量 - Info
    '--info-r': infoRgb.r,
    '--info-g': infoRgb.g,
    '--info-b': infoRgb.b,

    // RGB 分量 - Surface (使用 bgSecondary)
    '--surface-r': bgSecondaryRgb.r,
    '--surface-g': bgSecondaryRgb.g,
    '--surface-b': bgSecondaryRgb.b,

    // RGB 分量 - Background
    '--background-r': bgPrimaryRgb.r,
    '--background-g': bgPrimaryRgb.g,
    '--background-b': bgPrimaryRgb.b,

    // RGB 分量 - On Surface
    '--on-surface-r': textPrimaryRgb.r,
    '--on-surface-g': textPrimaryRgb.g,
    '--on-surface-b': textPrimaryRgb.b,

    // RGB 分量 - On Surface Variant
    '--on-surface-variant-r': textSecondaryRgb.r,
    '--on-surface-variant-g': textSecondaryRgb.g,
    '--on-surface-variant-b': textSecondaryRgb.b,

    // RGB 分量 - Outline
    '--outline-r': borderRgb.r,
    '--outline-g': borderRgb.g,
    '--outline-b': borderRgb.b,
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

    // RGB 分量 - Primary
    '--primary-r': computedStyle.getPropertyValue('--primary-r').trim(),
    '--primary-g': computedStyle.getPropertyValue('--primary-g').trim(),
    '--primary-b': computedStyle.getPropertyValue('--primary-b').trim(),

    // RGB 分量 - Secondary
    '--secondary-r': computedStyle.getPropertyValue('--secondary-r').trim(),
    '--secondary-g': computedStyle.getPropertyValue('--secondary-g').trim(),
    '--secondary-b': computedStyle.getPropertyValue('--secondary-b').trim(),

    // RGB 分量 - Success
    '--success-r': computedStyle.getPropertyValue('--success-r').trim(),
    '--success-g': computedStyle.getPropertyValue('--success-g').trim(),
    '--success-b': computedStyle.getPropertyValue('--success-b').trim(),

    // RGB 分量 - Error
    '--error-r': computedStyle.getPropertyValue('--error-r').trim(),
    '--error-g': computedStyle.getPropertyValue('--error-g').trim(),
    '--error-b': computedStyle.getPropertyValue('--error-b').trim(),

    // RGB 分量 - Warning
    '--warning-r': computedStyle.getPropertyValue('--warning-r').trim(),
    '--warning-g': computedStyle.getPropertyValue('--warning-g').trim(),
    '--warning-b': computedStyle.getPropertyValue('--warning-b').trim(),

    // RGB 分量 - Info
    '--info-r': computedStyle.getPropertyValue('--info-r').trim(),
    '--info-g': computedStyle.getPropertyValue('--info-g').trim(),
    '--info-b': computedStyle.getPropertyValue('--info-b').trim(),

    // RGB 分量 - Surface
    '--surface-r': computedStyle.getPropertyValue('--surface-r').trim(),
    '--surface-g': computedStyle.getPropertyValue('--surface-g').trim(),
    '--surface-b': computedStyle.getPropertyValue('--surface-b').trim(),

    // RGB 分量 - Background
    '--background-r': computedStyle.getPropertyValue('--background-r').trim(),
    '--background-g': computedStyle.getPropertyValue('--background-g').trim(),
    '--background-b': computedStyle.getPropertyValue('--background-b').trim(),

    // RGB 分量 - On Surface
    '--on-surface-r': computedStyle.getPropertyValue('--on-surface-r').trim(),
    '--on-surface-g': computedStyle.getPropertyValue('--on-surface-g').trim(),
    '--on-surface-b': computedStyle.getPropertyValue('--on-surface-b').trim(),

    // RGB 分量 - On Surface Variant
    '--on-surface-variant-r': computedStyle.getPropertyValue('--on-surface-variant-r').trim(),
    '--on-surface-variant-g': computedStyle.getPropertyValue('--on-surface-variant-g').trim(),
    '--on-surface-variant-b': computedStyle.getPropertyValue('--on-surface-variant-b').trim(),

    // RGB 分量 - Outline
    '--outline-r': computedStyle.getPropertyValue('--outline-r').trim(),
    '--outline-g': computedStyle.getPropertyValue('--outline-g').trim(),
    '--outline-b': computedStyle.getPropertyValue('--outline-b').trim(),
  };
};