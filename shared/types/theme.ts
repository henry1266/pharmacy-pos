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
  generatedPalette: GeneratedPalette;
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