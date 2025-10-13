import type { Product, Customer, SaleItem as SharedSaleItem } from '@pharmacy-pos/shared/types/entities';
import type { PaymentMethod, PaymentStatus } from '@pharmacy-pos/shared/schemas/zod/sale';

/**
 * Sales form item representation aligned with shared schema.
 */
export type SaleItem = Omit<SharedSaleItem, 'product'> & {
  product: string;
  productDetails?: Product;
  name: string;
  code: string;
  subtotal: number;
  productType?: string;
  packageName?: string;
};

export interface SaleData {
  saleNumber?: string;
  customer: string;
  items: SaleItem[];
  totalAmount: number;
  discount: number;
  discountAmount?: number;
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  notes: string;
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
  items: SaleItem[] | import('../api/dto').SaleItemWithDetailsDto[];
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
  currentSale: SaleData | import('../api/dto').SaleDataDto;
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