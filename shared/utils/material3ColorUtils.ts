/**
 * Material 3 顏色工具函數
 * 整合 @material/material-color-utilities 提供 Material Design 3 調色系統
 */

import {
  argbFromHex,
  hexFromArgb,
  CorePalette,
  SchemeContent,
  SchemeFidelity,
  SchemeMonochrome,
  SchemeNeutral,
  SchemeTonalSpot,
  SchemeVibrant,
  TonalPalette,
  Hct
} from '@material/material-color-utilities';

import {
  Material3TonalPalette,
  Material3CorePalette,
  Material3ColorScheme,
  Material3ThemeData,
  EnhancedGeneratedPalette,
  GeneratedPalette
} from '../types/theme';

/**
 * 將 TonalPalette 轉換為我們的 Material3TonalPalette 格式
 */
function tonalPaletteToMaterial3(palette: TonalPalette): Material3TonalPalette {
  return {
    0: hexFromArgb(palette.tone(0)),
    10: hexFromArgb(palette.tone(10)),
    20: hexFromArgb(palette.tone(20)),
    30: hexFromArgb(palette.tone(30)),
    40: hexFromArgb(palette.tone(40)),
    50: hexFromArgb(palette.tone(50)),
    60: hexFromArgb(palette.tone(60)),
    70: hexFromArgb(palette.tone(70)),
    80: hexFromArgb(palette.tone(80)),
    90: hexFromArgb(palette.tone(90)),
    95: hexFromArgb(palette.tone(95)),
    99: hexFromArgb(palette.tone(99)),
    100: hexFromArgb(palette.tone(100))
  };
}

/**
 * 將 CorePalette 轉換為我們的 Material3CorePalette 格式
 */
function corePaletteToMaterial3(corePalette: CorePalette): Material3CorePalette {
  return {
    primary: tonalPaletteToMaterial3(corePalette.a1),
    secondary: tonalPaletteToMaterial3(corePalette.a2),
    tertiary: tonalPaletteToMaterial3(corePalette.a3),
    neutral: tonalPaletteToMaterial3(corePalette.n1),
    neutralVariant: tonalPaletteToMaterial3(corePalette.n2),
    error: tonalPaletteToMaterial3(corePalette.error)
  };
}

/**
 * 將 Material Color Utilities 的 Scheme 轉換為我們的 Material3ColorScheme 格式
 */
function schemeToMaterial3ColorScheme(scheme: any): Material3ColorScheme {
  return {
    primary: hexFromArgb(scheme.primary),
    onPrimary: hexFromArgb(scheme.onPrimary),
    primaryContainer: hexFromArgb(scheme.primaryContainer),
    onPrimaryContainer: hexFromArgb(scheme.onPrimaryContainer),
    secondary: hexFromArgb(scheme.secondary),
    onSecondary: hexFromArgb(scheme.onSecondary),
    secondaryContainer: hexFromArgb(scheme.secondaryContainer),
    onSecondaryContainer: hexFromArgb(scheme.onSecondaryContainer),
    tertiary: hexFromArgb(scheme.tertiary),
    onTertiary: hexFromArgb(scheme.onTertiary),
    tertiaryContainer: hexFromArgb(scheme.tertiaryContainer),
    onTertiaryContainer: hexFromArgb(scheme.onTertiaryContainer),
    error: hexFromArgb(scheme.error),
    onError: hexFromArgb(scheme.onError),
    errorContainer: hexFromArgb(scheme.errorContainer),
    onErrorContainer: hexFromArgb(scheme.onErrorContainer),
    background: hexFromArgb(scheme.background),
    onBackground: hexFromArgb(scheme.onBackground),
    surface: hexFromArgb(scheme.surface),
    onSurface: hexFromArgb(scheme.onSurface),
    surfaceVariant: hexFromArgb(scheme.surfaceVariant),
    onSurfaceVariant: hexFromArgb(scheme.onSurfaceVariant),
    outline: hexFromArgb(scheme.outline),
    outlineVariant: hexFromArgb(scheme.outlineVariant),
    shadow: hexFromArgb(scheme.shadow),
    scrim: hexFromArgb(scheme.scrim),
    inverseSurface: hexFromArgb(scheme.inverseSurface),
    inverseOnSurface: hexFromArgb(scheme.inverseOnSurface),
    inversePrimary: hexFromArgb(scheme.inversePrimary)
  };
}

/**
 * Material 3 調色方案類型
 */
export type Material3SchemeType = 
  | 'content'      // 內容導向：保持原色忠實度
  | 'fidelity'     // 忠實度：平衡色彩忠實度與可用性
  | 'monochrome'   // 單色：黑白灰調色板
  | 'neutral'      // 中性：低飽和度調色板
  | 'tonalSpot'    // 色調點：預設方案
  | 'vibrant';     // 鮮豔：高飽和度調色板

/**
 * 根據主色生成 Material 3 主題資料
 */
export function generateMaterial3Theme(
  primaryColorHex: string,
  schemeType: Material3SchemeType = 'tonalSpot'
): Material3ThemeData {
  const primaryArgb = argbFromHex(primaryColorHex);
  const corePalette = CorePalette.of(primaryArgb);

  // 根據方案類型選擇適當的 Scheme
  let lightScheme: any;
  let darkScheme: any;

  switch (schemeType) {
    case 'content':
      lightScheme = new SchemeContent(Hct.fromInt(primaryArgb), false, 0.0);
      darkScheme = new SchemeContent(Hct.fromInt(primaryArgb), true, 0.0);
      break;
    case 'fidelity':
      lightScheme = new SchemeFidelity(Hct.fromInt(primaryArgb), false, 0.0);
      darkScheme = new SchemeFidelity(Hct.fromInt(primaryArgb), true, 0.0);
      break;
    case 'monochrome':
      lightScheme = new SchemeMonochrome(Hct.fromInt(primaryArgb), false, 0.0);
      darkScheme = new SchemeMonochrome(Hct.fromInt(primaryArgb), true, 0.0);
      break;
    case 'neutral':
      lightScheme = new SchemeNeutral(Hct.fromInt(primaryArgb), false, 0.0);
      darkScheme = new SchemeNeutral(Hct.fromInt(primaryArgb), true, 0.0);
      break;
    case 'vibrant':
      lightScheme = new SchemeVibrant(Hct.fromInt(primaryArgb), false, 0.0);
      darkScheme = new SchemeVibrant(Hct.fromInt(primaryArgb), true, 0.0);
      break;
    case 'tonalSpot':
    default:
      lightScheme = new SchemeTonalSpot(Hct.fromInt(primaryArgb), false, 0.0);
      darkScheme = new SchemeTonalSpot(Hct.fromInt(primaryArgb), true, 0.0);
      break;
  }

  return {
    corePalette: corePaletteToMaterial3(corePalette),
    lightScheme: schemeToMaterial3ColorScheme(lightScheme),
    darkScheme: schemeToMaterial3ColorScheme(darkScheme)
  };
}

/**
 * 從 HCT 顏色空間生成主題（更精確的顏色控制）
 */
export function generateMaterial3ThemeFromHct(
  hue: number,
  chroma: number,
  tone: number,
  schemeType: Material3SchemeType = 'tonalSpot'
): Material3ThemeData {
  const hct = Hct.from(hue, chroma, tone);
  const primaryColorHex = hexFromArgb(hct.toInt());
  return generateMaterial3Theme(primaryColorHex, schemeType);
}

/**
 * 獲取顏色的 HCT 值
 */
export function getHctFromHex(hex: string): { hue: number; chroma: number; tone: number } {
  const argb = argbFromHex(hex);
  const hct = Hct.fromInt(argb);
  return {
    hue: hct.hue,
    chroma: hct.chroma,
    tone: hct.tone
  };
}

/**
 * 調整顏色的色相、彩度或明度
 */
export function adjustHct(
  hex: string,
  adjustments: {
    hue?: number;
    chroma?: number;
    tone?: number;
  }
): string {
  const hct = getHctFromHex(hex);
  const newHct = Hct.from(
    adjustments.hue ?? hct.hue,
    adjustments.chroma ?? hct.chroma,
    adjustments.tone ?? hct.tone
  );
  return hexFromArgb(newHct.toInt());
}

/**
 * 生成和諧色彩組合
 */
export function generateHarmoniousColors(
  baseColorHex: string,
  count: number = 5
): string[] {
  const baseHct = getHctFromHex(baseColorHex);
  const colors: string[] = [baseColorHex];

  // 生成互補色、三角色等和諧配色
  const hueStep = 360 / count;
  
  for (let i = 1; i < count; i++) {
    const newHue = (baseHct.hue + (hueStep * i)) % 360;
    const harmonicColor = Hct.from(newHue, baseHct.chroma, baseHct.tone);
    colors.push(hexFromArgb(harmonicColor.toInt()));
  }

  return colors;
}

/**
 * 獲取顏色的可讀性評分（基於對比度）
 */
export function getColorAccessibilityScore(
  foregroundHex: string,
  backgroundHex: string
): {
  score: number;
  level: 'AAA' | 'AA' | 'A' | 'FAIL';
  ratio: number;
} {
  const foregroundArgb = argbFromHex(foregroundHex);
  const backgroundArgb = argbFromHex(backgroundHex);
  
  // 簡化的對比度計算（實際應使用 WCAG 標準）
  const foregroundHct = Hct.fromInt(foregroundArgb);
  const backgroundHct = Hct.fromInt(backgroundArgb);
  
  const toneDiff = Math.abs(foregroundHct.tone - backgroundHct.tone);
  const ratio = (toneDiff + 5) / 5; // 簡化計算
  
  let level: 'AAA' | 'AA' | 'A' | 'FAIL';
  if (ratio >= 7) level = 'AAA';
  else if (ratio >= 4.5) level = 'AA';
  else if (ratio >= 3) level = 'A';
  else level = 'FAIL';

  return {
    score: Math.min(100, (ratio / 7) * 100),
    level,
    ratio
  };
}

/**
 * 建議最佳的文字顏色
 */
export function suggestTextColor(
  backgroundHex: string,
  preferredTone?: 'light' | 'dark'
): string {
  const backgroundHct = getHctFromHex(backgroundHex);
  
  // 根據背景明度決定文字顏色
  if (preferredTone) {
    return preferredTone === 'light' ? '#FFFFFF' : '#000000';
  }
  
  // 自動選擇最佳對比度
  return backgroundHct.tone > 50 ? '#000000' : '#FFFFFF';
}

/**
 * 將現有的 GeneratedPalette 升級為 EnhancedGeneratedPalette
 */
export function enhancePaletteWithMaterial3(
  originalPalette: GeneratedPalette,
  primaryColorHex: string,
  schemeType: Material3SchemeType = 'tonalSpot'
): EnhancedGeneratedPalette {
  const material3Data = generateMaterial3Theme(primaryColorHex, schemeType);
  
  return {
    ...originalPalette,
    material3: material3Data
  };
}