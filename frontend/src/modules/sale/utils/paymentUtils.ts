/**
 * @file 付款相關工具函數
 * @description 處理付款方式和付款狀態的顯示和轉換
 */

import { PaymentStatusInfo, PaymentStatusIconType } from '../types/detail';

/**
 * 獲取付款方式的顯示文字
 *
 * @param method - 付款方式代碼
 * @returns 付款方式的顯示文字
 */
export const getPaymentMethodText = (method: string): string => {
  const methodMap: Record<string, string> = {
    'cash': '現金',
    'credit_card': '信用卡',
    'debit_card': '金融卡',
    'mobile_payment': '行動支付',
    'other': '其他'
  };
  return methodMap[method] || method;
};

/**
 * 獲取付款狀態的顯示信息
 *
 * @param status - 付款狀態代碼
 * @returns 付款狀態的顯示信息，包含文字、顏色和圖標類型
 */
export const getPaymentStatusInfo = (status: string): PaymentStatusInfo => {
  const statusMap: Record<string, PaymentStatusInfo> = {
    'paid': { text: '已付款', color: 'success', iconType: 'CheckCircle' },
    'pending': { text: '待付款', color: 'warning', iconType: 'Pending' },
    'partial': { text: '部分付款', color: 'info', iconType: 'AccountBalanceWallet' },
    'cancelled': { text: '已取消', color: 'error', iconType: 'Cancel' }
  };
  return statusMap[status] || { text: status, color: 'default', iconType: 'Info' };
};