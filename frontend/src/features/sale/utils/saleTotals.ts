import type { SaleItem as SharedSaleItem } from '@pharmacy-pos/shared/schemas/zod/sale';

export interface SaleTotals {
  grossAmount: number;
  discountAmount: number;
  netAmount: number;
}

const clampCurrency = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.round(value * 100) / 100;
};

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export const calculateSaleTotals = (
  items: Array<Pick<SharedSaleItem, 'subtotal'>>,
  discountInput: number,
): SaleTotals => {
  const grossRaw = items.reduce((sum, item) => sum + toNumber(item.subtotal), 0);
  const grossAmount = clampCurrency(grossRaw);

  const sanitizedDiscount = discountInput > 0 && Number.isFinite(discountInput)
    ? discountInput
    : 0;

  const discountAmount = clampCurrency(Math.min(sanitizedDiscount, grossAmount));
  const netAmount = clampCurrency(grossAmount - discountAmount);

  return {
    grossAmount,
    discountAmount,
    netAmount,
  };
};

export default calculateSaleTotals;
