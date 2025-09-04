/**
 * Sale Slice
 * 管理銷售模組的 UI/跨頁狀態
 * 注意：避免把 server state 塞進 Redux，而是用 selector 封裝讀取
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../../app/store';
import { SaleQueryParams } from '../api/dto';

/**
 * 銷售列表篩選條件
 */
export interface SaleListFilter extends SaleQueryParams {
  startDate?: string;
  endDate?: string;
  customer?: string;
  paymentMethod?: string;
  paymentStatus?: string;
  status?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

/**
 * 銷售列表排序
 */
export interface SaleListSort {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * 銷售列表分頁
 */
export interface SaleListPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * 銷售編輯表單狀態
 */
export interface SaleEditFormState {
  isDirty: boolean;
  isSubmitting: boolean;
  validationErrors: Record<string, string>;
}

/**
 * 銷售模組 UI 狀態
 */
export interface SaleState {
  // 列表相關狀態
  list: {
    filter: SaleListFilter;
    sort: SaleListSort;
    pagination: SaleListPagination;
    selectedIds: string[];
    viewMode: 'list' | 'grid' | 'calendar';
  };
  
  // 編輯相關狀態
  edit: {
    formState: SaleEditFormState;
    activeTab: number;
    showConfirmDialog: boolean;
    confirmDialogType: 'save' | 'cancel' | 'delete';
  };
  
  // 通用 UI 狀態
  ui: {
    sidebarOpen: boolean;
    mobileDrawerOpen: boolean;
    activeView: 'list' | 'detail' | 'edit' | 'new';
    notification: {
      open: boolean;
      message: string;
      type: 'success' | 'error' | 'warning' | 'info';
    };
  };
}

/**
 * 初始狀態
 */
const initialState: SaleState = {
  list: {
    filter: {
      page: 1,
      limit: 10,
    },
    sort: {
      field: 'createdAt',
      direction: 'desc',
    },
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
    selectedIds: [],
    viewMode: 'list',
  },
  edit: {
    formState: {
      isDirty: false,
      isSubmitting: false,
      validationErrors: {},
    },
    activeTab: 0,
    showConfirmDialog: false,
    confirmDialogType: 'save',
  },
  ui: {
    sidebarOpen: false,
    mobileDrawerOpen: false,
    activeView: 'list',
    notification: {
      open: false,
      message: '',
      type: 'info',
    },
  },
};

/**
 * 創建 Sale Slice
 */
export const saleSlice = createSlice({
  name: 'sale',
  initialState,
  reducers: {
    // 列表相關 reducers
    setFilter: (state, action: PayloadAction<Partial<SaleListFilter>>) => {
      state.list.filter = { ...state.list.filter, ...action.payload };
      // 重置分頁
      state.list.pagination.page = 1;
    },
    resetFilter: (state) => {
      state.list.filter = initialState.list.filter;
      state.list.pagination.page = 1;
    },
    setSort: (state, action: PayloadAction<SaleListSort>) => {
      state.list.sort = action.payload;
    },
    setPagination: (state, action: PayloadAction<Partial<SaleListPagination>>) => {
      state.list.pagination = { ...state.list.pagination, ...action.payload };
    },
    setSelectedIds: (state, action: PayloadAction<string[]>) => {
      state.list.selectedIds = action.payload;
    },
    addSelectedId: (state, action: PayloadAction<string>) => {
      if (!state.list.selectedIds.includes(action.payload)) {
        state.list.selectedIds.push(action.payload);
      }
    },
    removeSelectedId: (state, action: PayloadAction<string>) => {
      state.list.selectedIds = state.list.selectedIds.filter(id => id !== action.payload);
    },
    clearSelectedIds: (state) => {
      state.list.selectedIds = [];
    },
    setViewMode: (state, action: PayloadAction<'list' | 'grid' | 'calendar'>) => {
      state.list.viewMode = action.payload;
    },
    
    // 編輯相關 reducers
    setFormState: (state, action: PayloadAction<Partial<SaleEditFormState>>) => {
      state.edit.formState = { ...state.edit.formState, ...action.payload };
    },
    setFormDirty: (state, action: PayloadAction<boolean>) => {
      state.edit.formState.isDirty = action.payload;
    },
    setFormSubmitting: (state, action: PayloadAction<boolean>) => {
      state.edit.formState.isSubmitting = action.payload;
    },
    setValidationErrors: (state, action: PayloadAction<Record<string, string>>) => {
      state.edit.formState.validationErrors = action.payload;
    },
    clearValidationErrors: (state) => {
      state.edit.formState.validationErrors = {};
    },
    setActiveTab: (state, action: PayloadAction<number>) => {
      state.edit.activeTab = action.payload;
    },
    setShowConfirmDialog: (state, action: PayloadAction<boolean>) => {
      state.edit.showConfirmDialog = action.payload;
    },
    setConfirmDialogType: (state, action: PayloadAction<'save' | 'cancel' | 'delete'>) => {
      state.edit.confirmDialogType = action.payload;
    },
    
    // 通用 UI reducers
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.ui.sidebarOpen = action.payload;
    },
    toggleSidebar: (state) => {
      state.ui.sidebarOpen = !state.ui.sidebarOpen;
    },
    setMobileDrawerOpen: (state, action: PayloadAction<boolean>) => {
      state.ui.mobileDrawerOpen = action.payload;
    },
    toggleMobileDrawer: (state) => {
      state.ui.mobileDrawerOpen = !state.ui.mobileDrawerOpen;
    },
    setActiveView: (state, action: PayloadAction<'list' | 'detail' | 'edit' | 'new'>) => {
      state.ui.activeView = action.payload;
    },
    showNotification: (state, action: PayloadAction<{ message: string; type: 'success' | 'error' | 'warning' | 'info' }>) => {
      state.ui.notification = {
        open: true,
        message: action.payload.message,
        type: action.payload.type,
      };
    },
    hideNotification: (state) => {
      state.ui.notification.open = false;
    },
    
    // 重置狀態
    resetState: () => initialState,
  },
});

// 導出 actions
export const {
  setFilter,
  resetFilter,
  setSort,
  setPagination,
  setSelectedIds,
  addSelectedId,
  removeSelectedId,
  clearSelectedIds,
  setViewMode,
  setFormState,
  setFormDirty,
  setFormSubmitting,
  setValidationErrors,
  clearValidationErrors,
  setActiveTab,
  setShowConfirmDialog,
  setConfirmDialogType,
  setSidebarOpen,
  toggleSidebar,
  setMobileDrawerOpen,
  toggleMobileDrawer,
  setActiveView,
  showNotification,
  hideNotification,
  resetState,
} = saleSlice.actions;

// 導出 selectors
export const selectSaleListFilter = (state: RootState) => state.sale.list.filter;
export const selectSaleListSort = (state: RootState) => state.sale.list.sort;
export const selectSaleListPagination = (state: RootState) => state.sale.list.pagination;
export const selectSaleListSelectedIds = (state: RootState) => state.sale.list.selectedIds;
export const selectSaleListViewMode = (state: RootState) => state.sale.list.viewMode;
// 默認的表單狀態，用於防禦性編程
const defaultFormState: SaleEditFormState = {
  isDirty: false,
  isSubmitting: false,
  validationErrors: {}
};

export const selectSaleEditFormState = (state: RootState) => {
  // 防禦性代碼，處理 state.sale 或 state.sale.edit 為 undefined 的情況
  if (!state.sale || !state.sale.edit) {
    console.warn('state.sale 或 state.sale.edit 為 undefined，返回默認表單狀態');
    return defaultFormState;
  }
  return state.sale.edit.formState;
};
export const selectSaleEditActiveTab = (state: RootState) => state.sale.edit.activeTab;
export const selectSaleEditShowConfirmDialog = (state: RootState) => state.sale.edit.showConfirmDialog;
export const selectSaleEditConfirmDialogType = (state: RootState) => state.sale.edit.confirmDialogType;
export const selectSaleUiSidebarOpen = (state: RootState) => state.sale.ui.sidebarOpen;
export const selectSaleUiMobileDrawerOpen = (state: RootState) => state.sale.ui.mobileDrawerOpen;
export const selectSaleUiActiveView = (state: RootState) => state.sale.ui.activeView;
export const selectSaleUiNotification = (state: RootState) => state.sale.ui.notification;

// 導出 reducer
export default saleSlice.reducer;