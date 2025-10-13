/**
 * @file 銷售詳情頁面相關類型定義
 * @description 定義銷售詳情頁面所需的所有類型
 */

import { ReactNode } from 'react';
import { ChipProps } from '@mui/material';
import type { FifoSaleResponse } from '@pharmacy-pos/shared';
import type {
  Sale as SharedSale,
  SaleItem as SharedSaleItem,
  Product as SharedProduct,
  Customer as SharedCustomer,
} from '@pharmacy-pos/shared/types/entities';

export type Product = SharedProduct;
export type Customer = SharedCustomer;

export type SaleItem = Omit<SharedSaleItem, 'product'> & {
  product?: string | SharedProduct | { name: string; _id?: string; id?: string; code?: string };
  amount?: number;
  name?: string;
};

export type Sale = Omit<SharedSale, 'customer' | 'items'> & {
  customer?: Customer;
  items: SaleItem[];
  tax?: number;
};

/**
 * FIFO 毛利類型
 */
type RemoteFifoItem = FifoSaleResponse['items'][number];
type RemoteFifoSummary = FifoSaleResponse['summary'];

export type FifoProfit = NonNullable<RemoteFifoItem['fifoProfit']>;
export type FifoItem = RemoteFifoItem;
export interface FifoData {
  summary?: RemoteFifoSummary;
  items?: RemoteFifoItem[];
}

/**
 * 付款狀態圖標類型
 */
export type PaymentStatusIconType =
  | 'CheckCircle'
  | 'Pending'
  | 'AccountBalanceWallet'
  | 'Cancel'
  | 'Info';

/**
 * 付款狀態信息類型
 */
export interface PaymentStatusInfo {
  text: string;
  color: ChipProps['color'];
  iconType: PaymentStatusIconType;
}

/**
 * 明細項目圖標類型
 */
export type DetailIconType =
  | 'ReceiptLong'
  | 'Percent'
  | 'MonetizationOn'
  | 'TrendingUp';

/**
 * 自定義內容類型
 */
export type CustomContentType =
  | { type: 'loading'; message: string }
  | { type: 'error'; message: string };

/**
 * 可收合明細項目類型
 */
export interface CollapsibleDetail {
  label: string;
  value: any;
  icon?: React.ReactElement;
  iconType?: DetailIconType;
  iconColor?: string;
  color?: string;
  fontWeight?: string;
  condition: boolean;
  valueFormatter?: (val: any) => string;
  customContent?: React.ReactNode | CustomContentType;
}

/**
 * 銷售項目行屬性類型
 */
export interface SalesItemRowProps {
  item: SaleItem;
  fifoLoading: boolean;
  fifoData: FifoData | null;
  showSalesProfitColumns: boolean;
}

/**
 * 銷售項目表格屬性類型
 */
export interface SalesItemsTableProps {
  sale: Sale;
  fifoLoading: boolean;
  fifoData: FifoData | null;
  showSalesProfitColumns: boolean;
}

/**
 * 銷售信息側邊欄屬性類型
 */
export interface SaleInfoSidebarProps {
  sale: Sale;
}

/**
 * 主要內容屬性類型
 */
export interface MainContentProps {
  sale: Sale | null;
  fifoLoading: boolean;
  fifoError: string | null;
  fifoData: FifoData | null;
  showSalesProfitColumns: boolean;
  handleToggleSalesProfitColumns: () => void;
}
