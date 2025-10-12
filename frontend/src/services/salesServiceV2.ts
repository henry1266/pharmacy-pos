import type { Sale } from '@pharmacy-pos/shared/types/entities';
import {
  type SaleCreateRequest,
  type SaleQueryParams,
  type SaleStatsResponseDto,
  type SaleRefundRequestDto,
  type SaleRefundResponseDto,
} from '@/features/sale/api/dto';
import { createSalesContractClientWithAuth } from '@/features/sale/api/client';

type SuccessEnvelope<T> = {
  success: true;
  data?: T;
  message?: string;
  timestamp?: string;
};

type ErrorEnvelope = {
  success?: false;
  message?: string;
  statusCode?: number;
};

type ContractResult<T> = {
  status: number;
  body: SuccessEnvelope<T> | ErrorEnvelope | T | undefined;
};

const salesClient = createSalesContractClientWithAuth();

const isSuccessEnvelope = <T>(body: unknown): body is SuccessEnvelope<T> => (
  typeof body === 'object'
  && body !== null
  && 'success' in body
  && (body as { success?: boolean }).success === true
);

const isErrorEnvelope = (body: unknown): body is ErrorEnvelope => (
  typeof body === 'object'
  && body !== null
  && 'success' in body
  && (body as { success?: boolean }).success === false
);

const createContractError = (result: ContractResult<unknown>, fallback: string): Error => {
  const body = result.body as Record<string, unknown> | undefined;
  const message = typeof body?.message === 'string' ? body.message : fallback;
  const error = new Error(message);
  (error as any).status = result.status;
  (error as any).body = result.body;
  return error;
};

const assertSuccessBody = <T>(
  result: ContractResult<T>,
  fallback: string,
): SuccessEnvelope<T> => {
  if (result.status >= 200 && result.status < 300) {
    const body = result.body;

    if (isSuccessEnvelope<T>(body)) {
      return body;
    }

    if (isErrorEnvelope(body)) {
      throw createContractError(result, fallback);
    }

    return {
      success: true,
      data: body as T,
    };
  }

  throw createContractError(result, fallback);
};

const assertSuccessData = <T>(
  result: ContractResult<T>,
  fallback: string,
  defaultValue?: T,
): T => {
  const envelope = assertSuccessBody<T>(result, fallback);
  if (envelope.data !== undefined) {
    return envelope.data as T;
  }
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  throw createContractError(result, fallback);
};

const toSalesArray = (payload: unknown): Sale[] => {
  if (Array.isArray(payload)) {
    return payload as Sale[];
  }
  if (!payload) {
    return [];
  }
  return [payload as Sale];
};

const buildListSalesArgs = (params?: SaleQueryParams) => {
  if (params && Object.keys(params).length > 0) {
    return { query: params } as Parameters<typeof salesClient.listSales>[0];
  }
  return {} as Parameters<typeof salesClient.listSales>[0];
};

const sum = (values: number[]): number => values.reduce((acc, value) => acc + value, 0);

const computeSalesStats = (sales: Sale[]): SaleStatsResponseDto => {
  const totalSales = sales.length;
  const totalAmount = sum(sales.map((sale) => sale.totalAmount ?? 0));
  const averageAmount = totalSales > 0 ? totalAmount / totalSales : 0;

  const dailyMap = new Map<string, { count: number; amount: number }>();
  const paymentMethodMap = new Map<string, { count: number; amount: number }>();
  const productMap = new Map<string, { productName: string; count: number; amount: number }>();
  const customerMap = new Map<string, { customerName: string; count: number; amount: number }>();

  for (const sale of sales) {
    const saleDate = sale.date ?? sale.createdAt ?? sale.updatedAt ?? new Date();
    const dayKey = new Date(saleDate).toISOString().split('T')[0];
    const dailyEntry = dailyMap.get(dayKey) ?? { count: 0, amount: 0 };
    dailyEntry.count += 1;
    dailyEntry.amount += sale.totalAmount ?? 0;
    dailyMap.set(dayKey, dailyEntry);

    const paymentMethod = sale.paymentMethod ?? 'unknown';
    const paymentEntry = paymentMethodMap.get(paymentMethod) ?? { count: 0, amount: 0 };
    paymentEntry.count += 1;
    paymentEntry.amount += sale.totalAmount ?? 0;
    paymentMethodMap.set(paymentMethod, paymentEntry);

    const saleItems = Array.isArray(sale.items) ? sale.items : [];
    for (const item of saleItems) {
      const subtotal = item.subtotal ?? (item.quantity ?? 0) * (item.price ?? 0);
      const quantity = item.quantity ?? 0;
      const productValue = item.product;
      const productObject = typeof productValue === 'object' && productValue !== null
        ? (productValue as { _id?: string; id?: string; name?: string })
        : undefined;
      const productId = typeof productValue === 'string'
        ? productValue
        : productObject?._id ?? productObject?.id ?? 'unknown';
      const productName = productObject?.name ?? productId;

      const productEntry = productMap.get(productId) ?? {
        productName,
        count: 0,
        amount: 0,
      };
      productEntry.count += quantity;
      productEntry.amount += subtotal;
      productMap.set(productId, productEntry);
    }

    const customerValue = sale.customer;
    const customerObject = typeof customerValue === 'object' && customerValue !== null
      ? (customerValue as { _id?: string; id?: string; name?: string })
      : undefined;
    const customerId = typeof customerValue === 'string'
      ? customerValue
      : customerObject?._id ?? customerObject?.id;

    if (customerId) {
      const customerName = customerObject?.name ?? customerId;

      const customerEntry = customerMap.get(customerId) ?? {
        customerName,
        count: 0,
        amount: 0,
      };
      customerEntry.count += 1;
      customerEntry.amount += sale.totalAmount ?? 0;
      customerMap.set(customerId, customerEntry);
    }
  }

  const dailySales = Array.from(dailyMap.entries())
    .map(([date, { count, amount }]) => ({ date, count, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const paymentMethodStats = Array.from(paymentMethodMap.entries())
    .map(([method, { count, amount }]) => ({ method, count, amount }))
    .sort((a, b) => b.amount - a.amount);

  const topProducts = Array.from(productMap.entries())
    .map(([productId, entry]) => ({
      productId,
      productName: entry.productName,
      count: entry.count,
      amount: entry.amount,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  const topCustomersRaw = Array.from(customerMap.entries())
    .map(([customerId, entry]) => ({
      customerId,
      customerName: entry.customerName,
      count: entry.count,
      amount: entry.amount,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  return {
    totalSales,
    totalAmount,
    averageAmount,
    dailySales,
    paymentMethodStats,
    topProducts,
    ...(topCustomersRaw.length > 0 ? { topCustomers: topCustomersRaw } : {}),
  };
};

export const getAllSales = async (params?: SaleQueryParams): Promise<Sale[]> => {
  try {
    const args = buildListSalesArgs(params);
    const result = await salesClient.listSales(args);
    const data = assertSuccessData<unknown>(result as ContractResult<unknown>, 'Failed to fetch sales', []);
    return toSalesArray(data);
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to fetch sales');
  }
};

export const getSaleById = async (id: string): Promise<Sale> => {
  try {
    const result = await salesClient.getSaleById({
      params: { id },
    } as Parameters<typeof salesClient.getSaleById>[0]);

    return assertSuccessData<Sale>(result as ContractResult<Sale>, 'Failed to fetch sale');
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to fetch sale');
  }
};

export const createSale = async (payload: SaleCreateRequest): Promise<Sale> => {
  try {
    const result = await salesClient.createSale({
      body: payload,
    } as Parameters<typeof salesClient.createSale>[0]);

    return assertSuccessData<Sale>(result as ContractResult<Sale>, 'Failed to create sale');
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to create sale');
  }
};

export const updateSale = async (
  id: string,
  payload: SaleCreateRequest,
): Promise<Sale> => {
  try {
    const result = await salesClient.updateSale({
      params: { id },
      body: payload,
    } as Parameters<typeof salesClient.updateSale>[0]);

    return assertSuccessData<Sale>(result as ContractResult<Sale>, 'Failed to update sale');
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to update sale');
  }
};

export const deleteSale = async (
  id: string,
): Promise<{ success: boolean; message?: string }> => {
  try {
    const result = await salesClient.deleteSale({
      params: { id },
    } as Parameters<typeof salesClient.deleteSale>[0]);

    const body = assertSuccessBody<{ id?: string }>(result as ContractResult<{ id?: string }>, 'Failed to delete sale');

    return {
      success: true,
      ...(body.message ? { message: body.message } : {}),
    };
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to delete sale');
  }
};

export const getTodaySales = async (): Promise<Sale[]> => {
  try {
    const result = await salesClient.getTodaySales(
      undefined as Parameters<typeof salesClient.getTodaySales>[0],
    );
    const data = assertSuccessData<unknown>(result as ContractResult<unknown>, 'Failed to fetch today sales', []);
    return toSalesArray(data);
  } catch (error) {
    throw error instanceof Error ? error : new Error('Failed to fetch today sales');
  }
};

export const getCustomerSales = async (
  customerId: string,
  params?: SaleQueryParams,
): Promise<Sale[]> => {
  const query: SaleQueryParams = {
    ...(params ?? {}),
    customer: customerId,
  };
  return getAllSales(query);
};

export const getMonthlySales = async (
  year: number,
  month: number,
  params?: SaleQueryParams,
): Promise<Sale[]> => {
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];
  const query: SaleQueryParams = {
    ...(params ?? {}),
    startDate,
    endDate,
  };
  return getAllSales(query);
};

export const getSalesStats = async (
  params?: { startDate?: string; endDate?: string },
): Promise<SaleStatsResponseDto> => {
  const sales = await getAllSales(params);
  return computeSalesStats(sales);
};

export const processRefund = async (
  _saleId: string,
  _payload: SaleRefundRequestDto,
): Promise<SaleRefundResponseDto> => {
  throw new Error('Sale refund operation is not supported via ts-rest contract yet.');
};
