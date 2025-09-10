/**
 * @file FIFO 相關工具函數
 * @description 處理 FIFO 毛利計算和顯示相關的工具函數
 */

import { Sale, FifoData, CollapsibleDetail, DetailIconType } from '../types/detail';

/**
 * 獲取可收合的明細資料
 *
 * @param sale - 銷售記錄
 * @param fifoLoading - 是否正在載入 FIFO 數據
 * @param fifoError - FIFO 數據載入錯誤信息
 * @param fifoData - FIFO 數據
 * @returns 可收合的明細資料陣列
 */
export const getCollapsibleDetails = (
  sale: Sale,
  fifoLoading: boolean,
  fifoError: string | null,
  fifoData: FifoData | null
): any[] => {
  const details: CollapsibleDetail[] = [];
  
  // 小計
  details.push({
    label: '小計',
    value: (sale.totalAmount + (sale.discount || 0) - (sale.tax || 0)),
    iconType: 'ReceiptLong',
    iconColor: 'action',
    condition: true,
    valueFormatter: val => val.toFixed(2)
  });

  // 折扣
  if (sale.discount && sale.discount > 0) {
    details.push({
      label: '折扣',
      value: -sale.discount,
      iconType: 'Percent',
      iconColor: 'secondary',
      color: 'secondary.main',
      condition: true,
      valueFormatter: val => val.toFixed(2)
    });
  }

  // FIFO 相關資料
  if (!fifoLoading && fifoData?.summary) {
    details.push({
      label: '總成本',
      value: fifoData.summary.totalCost,
      iconType: 'MonetizationOn',
      iconColor: 'action',
      condition: true,
      valueFormatter: val => typeof val === 'number' ? val.toFixed(2) : 'N/A'
    });
    
    const isPositiveProfit = (fifoData.summary.totalProfit || fifoData.summary.grossProfit || 0) >= 0;
    details.push({
      label: '總毛利',
      value: fifoData.summary.totalProfit || fifoData.summary.grossProfit || 0,
      iconType: 'TrendingUp',
      iconColor: isPositiveProfit ? 'success' : 'error',
      color: isPositiveProfit ? 'success.main' : 'error.main',
      fontWeight: 'bold',
      condition: true,
      valueFormatter: val => typeof val === 'number' ? val.toFixed(2) : 'N/A'
    });
    
    const isPositiveMargin = parseFloat(fifoData.summary.totalProfitMargin) >= 0;
    details.push({
      label: '毛利率',
      value: fifoData.summary.totalProfitMargin,
      iconType: 'Percent',
      iconColor: isPositiveMargin ? 'success' : 'error',
      color: isPositiveMargin ? 'success.main' : 'error.main',
      fontWeight: 'bold',
      condition: true
    });
  } else if (fifoLoading) {
    details.push({
      label: '毛利資訊',
      value: '',
      customContent: { type: 'loading', message: '計算中...' },
      condition: true
    });
  } else if (fifoError) {
    details.push({
      label: '毛利資訊',
      value: '',
      customContent: { type: 'error', message: fifoError },
      condition: true
    });
  }

  return details;
};