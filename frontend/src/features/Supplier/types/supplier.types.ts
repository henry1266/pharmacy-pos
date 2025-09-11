import { AlertProps } from '@mui/material';

// 定義供應商資料介面
export interface SupplierData {
  id: string;
  _id?: string;
  code: string;
  shortCode?: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  taxId?: string;
  paymentTerms?: string;
  notes?: string;
  [key: string]: any;
}

// 定義供應商表單狀態介面
export interface SupplierFormState {
  id: string | null;
  code: string;
  shortCode: string;
  name: string;
  contactPerson: string;
  phone: string;
  taxId: string;
  paymentTerms: string;
  notes: string;
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