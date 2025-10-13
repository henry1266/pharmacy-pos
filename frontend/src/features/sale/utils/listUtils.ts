/**
 * @file 銷售列表頁面相關工具函數
 * @description 提供銷售列表頁面所需的各種工具函數
 */

import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { PaymentStatusInfo } from '../types/list';
import type { PaymentMethod, PaymentStatus } from '@pharmacy-pos/shared/schemas/zod/sale';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_META,
  parsePaymentMethod,
  parsePaymentStatus,
} from '../constants/payment';

/**
 * 獲取付款方式的顯示文字
 * @param method 付款方式
 * @returns 付款方式的顯示文字
 */
export const getPaymentMethodText = (method: string): string => {
  const parsed = parsePaymentMethod(method);
  if (parsed) {
    return PAYMENT_METHOD_LABELS[parsed as PaymentMethod];
  }
  return method;
};
/**
 * 獲取付款狀態的顯示信息
 * @param status 付款狀態
 * @returns 付款狀態的顯示信息
 */
export const getPaymentStatusInfo = (status: string): PaymentStatusInfo => {
  const parsed = parsePaymentStatus(status);
  if (parsed) {
    const meta = PAYMENT_STATUS_META[parsed as PaymentStatus];
    return { text: meta.text, color: meta.color };
  }
  return { text: status, color: 'default' };
};

/**
 * 表格本地化文字配置
 */
export const TABLE_LOCALE_TEXT = {
  noRowsLabel: '沒有銷售記錄',
  footerRowSelected: (count: number) => `已選擇 ${count} 個項目`,
  columnMenuLabel: '選單',
  columnMenuShowColumns: '顯示欄位',
  columnMenuFilter: '篩選',
  columnMenuHideColumn: '隱藏',
  columnMenuUnsort: '取消排序',
  columnMenuSortAsc: '升序排列',
  columnMenuSortDesc: '降序排列',
  filterPanelAddFilter: '新增篩選',
  filterPanelDeleteIconLabel: '刪除',
  filterPanelOperator: '運算子',
  filterPanelOperatorAnd: '與',
  filterPanelOperatorOr: '或',
  filterPanelColumns: '欄位',
  filterPanelInputLabel: '值',
  filterPanelInputPlaceholder: '篩選值',
  columnsPanelTextFieldLabel: '尋找欄位',
  columnsPanelTextFieldPlaceholder: '欄位名稱',
  columnsPanelDragIconLabel: '重新排序欄位',
  columnsPanelShowAllButton: '顯示全部',
  columnsPanelHideAllButton: '隱藏全部',
  toolbarDensity: '密度',
  toolbarDensityLabel: '密度',
  toolbarDensityCompact: '緊湊',
  toolbarDensityStandard: '標準',
  toolbarDensityComfortable: '舒適',
  toolbarExport: '匯出',
  toolbarExportLabel: '匯出',
  toolbarExportCSV: '下載CSV',
  toolbarExportPrint: '列印',
  toolbarColumns: '欄位',
  toolbarColumnsLabel: '選擇欄位',
  toolbarFilters: '篩選',
  toolbarFiltersLabel: '顯示篩選',
  toolbarFiltersTooltipHide: '隱藏篩選',
  toolbarFiltersTooltipShow: '顯示篩選',
  toolbarQuickFilterPlaceholder: '搜尋...',
  toolbarQuickFilterLabel: '搜尋',
  toolbarQuickFilterDeleteIconLabel: '清除',
  paginationRowsPerPage: '每頁行數:',
  paginationPageSize: '頁面大小',
  paginationLabelRowsPerPage: '每頁行數:'
} as const;

/**
 * 獲取本地化分頁文字
 * @param from 起始項目索引
 * @param to 結束項目索引
 * @param count 總項目數
 * @returns 本地化分頁文字
 */
export const getLocalizedPaginationText = (from: number, to: number, count: number): string => {
  const countDisplay = count !== -1 ? count.toString() : '超過 ' + to;
  return `${from}-${to} / ${countDisplay}`;
};

/**
 * 格式化日期
 * @param date 日期
 * @returns 格式化後的日期字符串
 */
export const formatDate = (date: string | Date | undefined): string => {
  if (!date) return '';
  
  try {
    // 確保我們有一個有效的日期對象
    const dateObj = typeof date === 'string'
      ? new Date(date)
      : date instanceof Date
        ? date
        : new Date();
        
    // 檢查日期是否有效
    if (isNaN(dateObj.getTime())) {
      console.warn('無效的日期值:', date);
      return String(date);
    }
    
    // 使用指定格式
    return format(dateObj, 'yyyy-MM-dd HH:mm:ss', { locale: zhTW });
  } catch (e) {
    console.error('日期格式化錯誤:', e, date);
    return String(date);
  }
};