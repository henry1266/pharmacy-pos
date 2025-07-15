/**
 * 出貨單模組共用型別定義
 */

import { ChangeEvent, SyntheticEvent, ReactNode } from 'react';
// GridPaginationModel 在 MUI v5.17.26 中不存在，使用自定義型別
interface GridPaginationModel {
  page: number;
  pageSize: number;
}

// 基本項目介面
export interface Item {
  did: string;
  dname: string;
  dquantity: string | number;
  dtotalCost: string | number;
  [key: string]: any;
}

// 出貨單介面
export interface ShippingOrder {
  id: string;
  _id: string;
  soid: string;
  sosupplier: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  [key: string]: any;
}

// 項目表格 Props
export interface ItemsTableProps {
  items: Item[];
  editingItemIndex: number | null;
  editingItem: Item | null;
  handleEditItem: (index: number) => void;
  handleSaveEditItem: () => void;
  handleCancelEditItem: () => void;
  handleRemoveItem: (index: number) => void;
  handleMoveItem: (index: number, direction: 'up' | 'down') => void;
  handleEditingItemChange: (event: ChangeEvent<HTMLInputElement>) => void;
  totalAmount: number;
}

// CSV 導入對話框 Props
export interface CsvImportDialogProps {
  open: boolean;
  onClose: () => void;
  tabValue: number;
  onTabChange: (event: SyntheticEvent, newValue: number) => void;
  csvFile: File | null;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onImport: () => void;
  loading: boolean;
  error?: string;
  success: boolean;
}

// 出貨單表格 Props
export interface ShippingOrdersTableProps {
  filteredRows?: ShippingOrder[];
  paginationModel?: GridPaginationModel;
  setPaginationModel?: (model: GridPaginationModel) => void;
  loading?: boolean;
  handleView: (id: string) => void;
  handleEdit: (id: string) => void;
  handleDeleteClick: (row: ShippingOrder) => void;
  handlePreviewMouseEnter: (e: React.MouseEvent, id: string) => void;
  handlePreviewMouseLeave: () => void;
  renderSupplierHeader: () => ReactNode;
  handleUnlock?: (id: string) => void;
}

// 表格行編輯 Props
export interface EditableRowProps {
  item: Item;
  index: number;
  editingItem: Item;
  handleEditingItemChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handleSaveEditItem: () => void;
  handleCancelEditItem: () => void;
}

// 表格行顯示 Props
export interface DisplayRowProps {
  item: Item;
  index: number;
  handleEditItem: (index: number) => void;
  handleRemoveItem: (index: number) => void;
  handleMoveItem: (index: number, direction: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
}

// 操作按鈕組 Props
export interface ActionButtonsProps {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPreviewMouseEnter: (e: React.MouseEvent) => void;
  onPreviewMouseLeave: () => void;
  isDeleteDisabled?: boolean;
  status?: string;
  onUnlock?: () => void;
}

// 檔案上傳 Props
export interface FileUploadProps {
  csvFile: File | null;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
}

// 狀態訊息 Props
export interface StatusMessageProps {
  error?: string;
  success: boolean;
}