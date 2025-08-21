import { Product, Customer } from '@pharmacy-pos/shared/types/entities';

/**
 * 銷售項目介面 (前端使用的格式，與後端 SaleItem 介面有些差異)
 */
export interface SaleItem {
  product: string;                // 產品ID
  productDetails?: Product;       // 前端特有，用於存儲產品詳細資訊
  name: string;                   // 前端特有，產品名稱
  code: string;                   // 前端特有，產品代碼
  price: number;                  // 與後端一致
  quantity: number;               // 與後端一致
  subtotal: number;               // 與後端一致
  productType?: string;           // 前端特有，產品類型
  discount?: number;              // 與後端一致，可選折扣
}

/**
 * 銷售資料介面 (前端使用的格式，與後端 Sale 介面有些差異)
 */
export interface SaleData {
  customer: string;
  items: SaleItem[];
  totalAmount: number;
  discount: number; // 前端特有，用於處理整體折扣
  paymentMethod: 'cash' | 'card' | 'transfer' | 'other' | 'credit_card' | 'debit_card' | 'mobile_payment';
  paymentStatus: 'paid' | 'pending' | 'cancelled'; // 對應後端的 status: 'completed' | 'pending' | 'cancelled'
  note: string; // 對應後端的 notes
}

/**
 * Snackbar 狀態介面
 */
export interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

/**
 * 輸入模式類型
 */
export type InputMode = 'price' | 'subtotal';

/**
 * SaleEditInfoCard 組件屬性介面
 */
export interface SaleEditInfoCardProps {
  barcode: string;
  handleBarcodeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleBarcodeSubmit: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  barcodeInputRef: React.RefObject<HTMLInputElement>;
}

/**
 * SalesEditItemsTable 組件屬性介面
 */
export interface SalesEditItemsTableProps {
  items: SaleItem[];
  inputModes: InputMode[];
  handleQuantityChange: (index: number, quantity: number | string) => void;
  handlePriceChange: (index: number, price: string) => void;
  handlePriceBlur: (index: number) => void;
  handleSubtotalChange: (index: number, subtotal: number) => void;
  toggleInputMode: (index: number) => void;
  handleRemoveItem: (index: number) => void;
  onQuantityInputComplete?: () => void;
}

/**
 * SaleEditDetailsCard 組件屬性介面
 */
export interface SaleEditDetailsCardProps {
  customers: Customer[];
  currentSale: SaleData;
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
}

/**
 * HeaderSection 組件屬性介面
 */
export interface HeaderSectionProps {
  id?: string | undefined;
  isMobile: boolean;
  onBack: () => void;
}

/**
 * LoadingState 組件屬性介面
 */
export interface LoadingStateProps {
  message?: string;
}

/**
 * ErrorState 組件屬性介面
 */
export interface ErrorStateProps {
  error: string;
  onBack: () => void;
}

/**
 * NotificationSnackbar 組件屬性介面
 */
export interface NotificationSnackbarProps {
  snackbar: SnackbarState;
  handleCloseSnackbar: () => void;
}