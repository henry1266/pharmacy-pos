/**
 * 主題系統相關的 TypeScript 型別定義
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface ColorPalette {
  main: string;
  light: string;
  dark: string;
  contrastText?: string;
}

export interface GeneratedPalette {
  primary: ColorPalette;
  secondary: ColorPalette;
  success: ColorPalette;
  warning: ColorPalette;
  error: ColorPalette;
  info: ColorPalette;
}

// Material 3 調色系統型別定義
export interface Material3TonalPalette {
  0: string;   // 黑色
  10: string;  // 最深色調
  20: string;
  30: string;
  40: string;
  50: string;  // 基準色
  60: string;
  70: string;
  80: string;
  90: string;
  95: string;
  99: string;  // 最淺色調
  100: string; // 白色
}

export interface Material3CorePalette {
  primary: Material3TonalPalette;
  secondary: Material3TonalPalette;
  tertiary: Material3TonalPalette;
  neutral: Material3TonalPalette;
  neutralVariant: Material3TonalPalette;
  error: Material3TonalPalette;
}

export interface Material3ColorScheme {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  error: string;
  onError: string;
  errorContainer: string;
  onErrorContainer: string;
  background: string;
  onBackground: string;
  surface: string;
  onSurface: string;
  surfaceVariant: string;
  onSurfaceVariant: string;
  outline: string;
  outlineVariant: string;
  shadow: string;
  scrim: string;
  inverseSurface: string;
  inverseOnSurface: string;
  inversePrimary: string;
}

export interface Material3ThemeData {
  corePalette: Material3CorePalette;
  lightScheme: Material3ColorScheme;
  darkScheme: Material3ColorScheme;
}

export interface EnhancedGeneratedPalette extends GeneratedPalette {
  material3?: Material3ThemeData;
}

export interface CustomThemeSettings {
  borderRadius: number;
  elevation: number;
  fontScale: number;
}

export interface UserTheme {
  _id?: string;
  userId: string;
  primaryColor: string;
  themeName: string;
  generatedPalette: EnhancedGeneratedPalette;
  mode: 'light' | 'dark' | 'auto';
  customSettings: CustomThemeSettings;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateUserThemeRequest {
  userId: string;
  primaryColor: string;
  themeName?: string;
  mode?: 'light' | 'dark' | 'auto';
  customSettings?: Partial<CustomThemeSettings>;
}

export interface UpdateUserThemeRequest extends Partial<CreateUserThemeRequest> {
  _id: string;
}

export interface UserThemeQueryParams {
  userId?: string;
  mode?: 'light' | 'dark' | 'auto';
  search?: string;
  page?: number;
  limit?: number;
}

export interface DuplicateThemeRequest {
  newThemeName: string;
}

// 預設主題配色
export const DEFAULT_THEME_COLORS = {
  blue: '#1976d2',
  purple: '#9c27b0',
  green: '#388e3c',
  orange: '#f57c00',
  red: '#d32f2f',
  teal: '#00796b',
  indigo: '#303f9f',
  pink: '#c2185b'
} as const;

export type DefaultThemeColor = keyof typeof DEFAULT_THEME_COLORS;

// 預設自定義設定
export const DEFAULT_CUSTOM_SETTINGS: CustomThemeSettings = {
  borderRadius: 8,
  elevation: 2,
  fontScale: 1
};