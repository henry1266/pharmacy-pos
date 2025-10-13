/**
 * @file 付款工具函式
 * @description 提供付款方式與付款狀態的顯示工具。
 */

import { PaymentStatusInfo } from '../types/detail';
import type { PaymentMethod, PaymentStatus } from '@pharmacy-pos/shared/schemas/zod/sale';
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_META,
  parsePaymentMethod,
  parsePaymentStatus,
} from '../constants/payment';

export const getPaymentMethodText = (method: string): string => {
  const parsed = parsePaymentMethod(method);
  if (parsed) {
    return PAYMENT_METHOD_LABELS[parsed as PaymentMethod];
  }
  return method;
};

export const getPaymentStatusInfo = (status: string): PaymentStatusInfo => {
  const parsed = parsePaymentStatus(status);
  if (parsed) {
    return PAYMENT_STATUS_META[parsed as PaymentStatus];
  }
  return { text: status, color: 'default', iconType: 'Info' };
};
