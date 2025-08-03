/**
 * 進貨單模組共用型別定義
 */

import { ChangeEvent, SyntheticEvent, ReactNode } from 'react';

// 共用事件類型
export type InputChangeEvent = ChangeEvent<HTMLInputElement>;
export type TabChangeEvent = SyntheticEvent;
export type MouseEvent = React.MouseEvent;

// GridPaginationModel 在 MUI v5.17.26 中不存在，使用自定義型別
interface GridPaginationModel {
  page: number;
  pageSize: number;
}

// 共用的會計分錄相關屬性
export interface AccountingEntryProps {
  relatedTransactionGroupId?: string;
  accountingEntryType?: 'expense-asset' | 'asset-liability';
}

// 共用的基礎項目操作函數類型
export interface ItemHandlers {
  handleEditItem: (index: number) => void;
  handleRemoveItem: (index: number) => void;
  handleMoveItem: (index: number, direction: 'up' | 'down') => void;
}

// 共用的編輯操作函數類型
export interface EditHandlers {
  handleEditingItemChange: (event: InputChangeEvent) => void;
  handleSaveEditItem: () => void;
  handleCancelEditItem: () => void;
}

// 共用的基礎屬性
export interface BaseItemProps {
  item: Item;
  index: number;
}

// 基本項目介面
export interface Item {
  did: string;
  dname: string;
  dquantity: string | number;
  dtotalCost: string | number;
  batchNumber?: string;
  [key: string]: any;
}

// 進貨單介面
export interface PurchaseOrder extends AccountingEntryProps {
  id: string;
  _id: string;
  poid: string;
  pobill: string;
  pobilldate: string;
  posupplier: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  selectedAccountIds?: string[];
  [key: string]: any;
}

// 項目表格 Props
export interface ItemsTableProps extends ItemHandlers, EditHandlers {
  items: Item[];
  editingItemIndex: number | null;
  editingItem: Item | null;
  totalAmount: number;
}

// CSV 導入對話框 Props
export interface CsvImportDialogProps {
  open: boolean;
  onClose: () => void;
  tabValue: number;
  onTabChange: (event: TabChangeEvent, newValue: number) => void;
  csvFile: File | null;
  onFileChange: (event: InputChangeEvent) => void;
  onImport: () => void;
  loading: boolean;
  error?: string;
  success: boolean;
}

// 進貨單表格 Props
export interface PurchaseOrdersTableProps {
  filteredRows?: PurchaseOrder[];
  paginationModel?: GridPaginationModel;
  setPaginationModel?: (model: GridPaginationModel) => void;
  loading?: boolean;
  handleView: (id: string) => void;
  handleEdit: (id: string) => void;
  handleDeleteClick: (row: PurchaseOrder) => void;
  handlePreviewMouseEnter: (e: MouseEvent, id: string) => void;
  handlePreviewMouseLeave: () => void;
  renderSupplierHeader: () => ReactNode;
  handleUnlock?: (id: string) => void;
}

// 表格行編輯 Props
export interface EditableRowProps extends BaseItemProps, EditHandlers {
  editingItem: Item;
}

// 表格行顯示 Props
export interface DisplayRowProps extends BaseItemProps, ItemHandlers {
  isFirst: boolean;
  isLast: boolean;
}

// 操作按鈕組 Props
export interface ActionButtonsProps extends AccountingEntryProps {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPreviewMouseEnter: (e: MouseEvent) => void;
  onPreviewMouseLeave: () => void;
  isDeleteDisabled?: boolean;
  status?: string;
  onUnlock?: () => void;
  onViewAccountingEntry?: () => void;
  hasPaidAmount?: boolean; // 新增：是否有付款記錄
  purchaseOrderId?: string; // 新增：進貨單ID
}

// 檔案上傳 Props
export interface FileUploadProps {
  csvFile: File | null;
  onFileChange: (event: InputChangeEvent) => void;
  loading: boolean;
}

// 狀態訊息 Props
export interface StatusMessageProps {
  error?: string;
  success: boolean;
}