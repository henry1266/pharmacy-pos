import { Product } from '@pharmacy-pos/shared/types/entities';
import { ProductPackageUnit } from '@pharmacy-pos/shared/types/package';
import { RefObject, SyntheticEvent } from 'react';

// 使用 shared Product 類型並添加類型斷言
export type ProductType = Product & {
  shortCode?: string;
  healthInsuranceCode?: string;
  barcode?: string;
  purchasePrice?: string | number;
  packageUnits?: ProductPackageUnit[];
  [key: string]: any;
};

// 定義當前項目介面
export interface CurrentItem {
  product?: string;
  dquantity?: string | number;
  packageQuantity?: string | number;
  boxQuantity?: string | number;
  batchNumber?: string;
  [key: string]: any;
}

// 定義組件 props 的介面
export interface ProductItemFormProps {
  currentItem: CurrentItem;
  handleItemInputChange: (event: { target: { name: string; value: string } }) => void;
  handleProductChange: (event: SyntheticEvent, product: Product | null) => void;
  handleAddItem: () => void;
  products: Product[];
  productInputRef: RefObject<HTMLInputElement>;
  isTestMode?: boolean;
}

// 圖表數據相關類型
export interface ChartDataItem {
  purchaseOrderNumber: string;
  shippingOrderNumber: string;
  saleNumber: string;
  type: string;
  quantity: number;
  price: number;
  cumulativeStock: number;
  cumulativeProfitLoss: number;
}

// 庫存數據相關類型
export interface InventoryRecord {
  saleNumber?: string;
  purchaseOrderNumber?: string;
  shippingOrderNumber?: string;
  quantity: number;
  totalAmount?: number;
  batchNumber?: string | undefined;
  product?: Product;
  type?: 'sale' | 'purchase' | 'ship';
  totalQuantity?: number;
  currentStock?: number;
}

// 庫存數據處理結果類型
export interface ProcessedInventoryData {
  chartTransactions: ChartDataItem[];
  processedInventories: InventoryRecord[];
}