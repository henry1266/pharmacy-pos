/**
 * Dashboard Slice
 * 管理儀表板模組的 UI/跨頁狀態
 * 注意：避免把 server state 塞進 Redux，而是用 selector 封裝讀取
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../../app/store';
import { FormData } from '@pharmacy-pos/shared/types/accounting';

/**
 * 日期選擇狀態
 */
export interface DateSelectionState {
  selectedDate: string;
  viewMode: 'day' | 'week' | 'month';
}

/**
 * 儀表板視圖狀態
 */
export interface DashboardViewState {
  activePanel: 'sales' | 'purchase' | 'shipping' | 'accounting' | 'schedule';
  expandedPanels: string[];
  refreshTimestamp: number;
}

/**
 * 記帳編輯狀態
 */
export interface AccountingEditState {
  formData: FormData;
  isEditing: boolean;
  currentId: string | null;
  formLoading: boolean;
  showConfirmDialog: boolean;
  confirmDialogType: 'save' | 'cancel' | 'delete';
}

/**
 * 儀表板模組 UI 狀態
 */
export interface DashboardState {
  // 日期選擇相關狀態
  dateSelection: DateSelectionState;
  
  // 儀表板視圖相關狀態
  view: DashboardViewState;
  
  // 記帳編輯相關狀態
  accountingEdit: AccountingEditState;
  
  // 通用 UI 狀態
  ui: {
    sidebarOpen: boolean;
    mobileDrawerOpen: boolean;
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
const initialState: DashboardState = {
  dateSelection: {
    selectedDate: new Date().toISOString().split('T')[0], // 今天的日期，格式為 'YYYY-MM-DD'
    viewMode: 'day',
  },
  view: {
    activePanel: 'sales',
    expandedPanels: ['sales', 'accounting'],
    refreshTimestamp: Date.now(),
  },
  accountingEdit: {
    formData: {
      date: new Date(),
      shift: '',
      status: 'pending',
      items: [
        { amount: 0, category: '掛號費', note: '' },
        { amount: 0, category: '部分負擔', note: '' }
      ],
      unaccountedSales: []
    },
    isEditing: false,
    currentId: null,
    formLoading: false,
    showConfirmDialog: false,
    confirmDialogType: 'save',
  },
  ui: {
    sidebarOpen: false,
    mobileDrawerOpen: false,
    notification: {
      open: false,
      message: '',
      type: 'info',
    },
  },
};

/**
 * 創建 Dashboard Slice
 */
export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    // 日期選擇相關 reducers
    setSelectedDate: (state, action: PayloadAction<string>) => {
      state.dateSelection.selectedDate = action.payload;
    },
    setViewMode: (state, action: PayloadAction<'day' | 'week' | 'month'>) => {
      state.dateSelection.viewMode = action.payload;
    },
    
    // 儀表板視圖相關 reducers
    setActivePanel: (state, action: PayloadAction<'sales' | 'purchase' | 'shipping' | 'accounting' | 'schedule'>) => {
      state.view.activePanel = action.payload;
    },
    togglePanelExpansion: (state, action: PayloadAction<string>) => {
      const panelId = action.payload;
      if (state.view.expandedPanels.includes(panelId)) {
        state.view.expandedPanels = state.view.expandedPanels.filter(id => id !== panelId);
      } else {
        state.view.expandedPanels.push(panelId);
      }
    },
    refreshDashboard: (state) => {
      state.view.refreshTimestamp = Date.now();
    },
    
    // 記帳編輯相關 reducers
    setFormData: (state, action: PayloadAction<FormData>) => {
      state.accountingEdit.formData = action.payload;
    },
    updateFormData: (state, action: PayloadAction<Partial<FormData>>) => {
      state.accountingEdit.formData = { ...state.accountingEdit.formData, ...action.payload };
    },
    setIsEditing: (state, action: PayloadAction<boolean>) => {
      state.accountingEdit.isEditing = action.payload;
    },
    setCurrentId: (state, action: PayloadAction<string | null>) => {
      state.accountingEdit.currentId = action.payload;
    },
    setFormLoading: (state, action: PayloadAction<boolean>) => {
      state.accountingEdit.formLoading = action.payload;
    },
    setShowConfirmDialog: (state, action: PayloadAction<boolean>) => {
      state.accountingEdit.showConfirmDialog = action.payload;
    },
    setConfirmDialogType: (state, action: PayloadAction<'save' | 'cancel' | 'delete'>) => {
      state.accountingEdit.confirmDialogType = action.payload;
    },
    resetAccountingForm: (state) => {
      state.accountingEdit = initialState.accountingEdit;
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
  setSelectedDate,
  setViewMode,
  setActivePanel,
  togglePanelExpansion,
  refreshDashboard,
  setFormData,
  updateFormData,
  setIsEditing,
  setCurrentId,
  setFormLoading,
  setShowConfirmDialog,
  setConfirmDialogType,
  resetAccountingForm,
  setSidebarOpen,
  toggleSidebar,
  setMobileDrawerOpen,
  toggleMobileDrawer,
  showNotification,
  hideNotification,
  resetState,
} = dashboardSlice.actions;

// 導出 selectors
export const selectSelectedDate = (state: RootState) => state.dashboard2.dateSelection.selectedDate;
export const selectViewMode = (state: RootState) => state.dashboard2.dateSelection.viewMode;
export const selectActivePanel = (state: RootState) => state.dashboard2.view.activePanel;
export const selectExpandedPanels = (state: RootState) => state.dashboard2.view.expandedPanels;
export const selectRefreshTimestamp = (state: RootState) => state.dashboard2.view.refreshTimestamp;
export const selectFormData = (state: RootState) => state.dashboard2.accountingEdit.formData;
export const selectIsEditing = (state: RootState) => state.dashboard2.accountingEdit.isEditing;
export const selectCurrentId = (state: RootState) => state.dashboard2.accountingEdit.currentId;
export const selectFormLoading = (state: RootState) => state.dashboard2.accountingEdit.formLoading;
export const selectShowConfirmDialog = (state: RootState) => state.dashboard2.accountingEdit.showConfirmDialog;
export const selectConfirmDialogType = (state: RootState) => state.dashboard2.accountingEdit.confirmDialogType;
export const selectSidebarOpen = (state: RootState) => state.dashboard2.ui.sidebarOpen;
export const selectMobileDrawerOpen = (state: RootState) => state.dashboard2.ui.mobileDrawerOpen;
export const selectNotification = (state: RootState) => state.dashboard2.ui.notification;

// 導出 reducer
export default dashboardSlice.reducer;