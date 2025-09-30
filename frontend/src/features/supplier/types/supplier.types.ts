import { AlertProps } from '@mui/material';
import type { SupplierResponseDto, SupplierCreateRequest } from '../api/dto';

type SupplierResponseOptional = {
  [K in keyof SupplierResponseDto]?: SupplierResponseDto[K] | undefined;
};

export type SupplierData = SupplierResponseOptional & {
  id: string;
  [key: string]: unknown;
};

export interface SupplierFormState extends SupplierCreateRequest {
  id: string | null;
  [key: string]: unknown;
}

// 定義 Snackbar 狀態介面
export interface SnackbarState {
  open: boolean;
  message: string;
  severity: AlertProps['severity'];
}

// 定義匯入結果介面
export interface ImportResult {
  total: number;
  success: number;
  failed: number;
  duplicates: number;
  errors: Array<{
    row?: number;
    error: string;
  }>;
}
