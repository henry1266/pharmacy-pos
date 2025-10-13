import {
  paymentMethodSchema,
  paymentStatusSchema,
} from '@pharmacy-pos/shared/schemas/zod/sale';
import type {
  PaymentMethod,
  PaymentStatus,
} from '@pharmacy-pos/shared/schemas/zod/sale';
import type { PaymentStatusIconType } from '../types/detail';

export const PAYMENT_METHOD_OPTIONS = [...paymentMethodSchema.options] as readonly PaymentMethod[];
export const PAYMENT_STATUS_OPTIONS = [...paymentStatusSchema.options] as readonly PaymentStatus[];

export const DEFAULT_PAYMENT_METHOD: PaymentMethod = PAYMENT_METHOD_OPTIONS[0];
export const DEFAULT_PAYMENT_STATUS: PaymentStatus = PAYMENT_STATUS_OPTIONS[0];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: '現金',
  card: '刷卡',
  transfer: '轉帳',
  other: '其他',
  credit_card: '信用卡',
  debit_card: '簽帳金融卡',
  mobile_payment: '行動支付',
};

export type PaymentStatusColor = 'success' | 'warning' | 'info' | 'error' | 'default';

export type PaymentStatusMeta = {
  text: string;
  color: PaymentStatusColor;
  iconType: PaymentStatusIconType;
};

export const PAYMENT_STATUS_META: Record<PaymentStatus, PaymentStatusMeta> = {
  paid: { text: '已付款', color: 'success', iconType: 'CheckCircle' },
  pending: { text: '待付款', color: 'warning', iconType: 'Pending' },
  partial: { text: '部分付款', color: 'info', iconType: 'AccountBalanceWallet' },
  cancelled: { text: '已取消', color: 'error', iconType: 'Cancel' },
};

export const parsePaymentMethod = (value: unknown): PaymentMethod | undefined => {
  const result = paymentMethodSchema.safeParse(value);
  return result.success ? result.data : undefined;
};

export const parsePaymentStatus = (value: unknown): PaymentStatus | undefined => {
  const result = paymentStatusSchema.safeParse(value);
  return result.success ? result.data : undefined;
};

export const ensurePaymentMethod = (
  value: unknown,
  fallback: PaymentMethod = DEFAULT_PAYMENT_METHOD,
): PaymentMethod => parsePaymentMethod(value) ?? fallback;

export const ensurePaymentStatus = (
  value: unknown,
  fallback: PaymentStatus = DEFAULT_PAYMENT_STATUS,
): PaymentStatus => parsePaymentStatus(value) ?? fallback;
