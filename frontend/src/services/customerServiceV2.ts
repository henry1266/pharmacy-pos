import type { CustomerCreateRequest, CustomerUpdateRequest } from '@/features/customer/api/dto';
import { createCustomerContractClient } from '@/features/customer/api/client';
import type { Customer } from '@pharmacy-pos/shared/types/entities';
import type { CustomerQueryParams } from '@pharmacy-pos/shared';

type SuccessEnvelope<T> = {
  success: true;
  message?: string;
  data?: T;
  timestamp?: string;
};

type TsRestResult<T> = {
  status: number;
  body: SuccessEnvelope<T> | { success: false; message?: string } | unknown;
};

const customerClient = createCustomerContractClient();

type ListCustomersArgs = Parameters<typeof customerClient.listCustomers>[0];

const createContractError = (result: TsRestResult<unknown>, fallback: string): Error => {
  const body = result.body as Record<string, unknown> | undefined;
  const message = typeof body?.message === 'string' ? body.message : fallback;
  const error = new Error(message);
  (error as any).status = result.status;
  (error as any).body = result.body;
  return error;
};

const assertSuccessBody = <T>(result: TsRestResult<T>, fallback: string): SuccessEnvelope<T> => {
  const body = result.body as SuccessEnvelope<T> | { success?: boolean } | undefined;
  if (
    result.status >= 200 &&
    result.status < 300 &&
    body &&
    typeof body === 'object' &&
    (body as SuccessEnvelope<T>).success === true
  ) {
    return body as SuccessEnvelope<T>;
  }

  throw createContractError(result, fallback);
};

const assertSuccessData = <T>(
  result: TsRestResult<T>,
  fallback: string,
  defaultValue?: T,
): T => {
  const body = assertSuccessBody<T>(result, fallback);
  return (body.data ?? defaultValue) as T;
};

const rethrow = (error: unknown, fallback: string): never => {
  if (error instanceof Error) {
    throw error;
  }
  throw new Error(fallback);
};

export const getAllCustomers = async (
  params?: CustomerQueryParams,
): Promise<Customer[]> => {
  try {
    const queryParams = (params ?? undefined) as ListCustomersArgs['query'];
    const requestArgs: ListCustomersArgs = { query: queryParams };
    const result = await customerClient.listCustomers(requestArgs);
    return assertSuccessData<Customer[]>(result, 'Failed to fetch customers', []);
  } catch (error) {
    return rethrow(error, 'Failed to fetch customers');
  }
};

export const getCustomerById = async (id: string): Promise<Customer> => {
  try {
    const result = await customerClient.getCustomerById({ params: { id } });
    return assertSuccessData<Customer>(result, 'Failed to fetch customer');
  } catch (error) {
    return rethrow(error, 'Failed to fetch customer');
  }
};

export const createCustomer = async (
  payload: CustomerCreateRequest,
): Promise<Customer> => {
  try {
    const result = await customerClient.createCustomer({ body: payload });
    return assertSuccessData<Customer>(result, 'Failed to create customer');
  } catch (error) {
    return rethrow(error, 'Failed to create customer');
  }
};

export const updateCustomer = async (
  id: string,
  payload: CustomerUpdateRequest,
): Promise<Customer> => {
  try {
    const result = await customerClient.updateCustomer({ params: { id }, body: payload });
    return assertSuccessData<Customer>(result, 'Failed to update customer');
  } catch (error) {
    return rethrow(error, 'Failed to update customer');
  }
};

export const deleteCustomer = async (
  id: string,
): Promise<{ success: boolean; message?: string }> => {
  try {
    const result = await customerClient.deleteCustomer({ params: { id } });
    const body = assertSuccessBody<{ id: string }>(result, 'Failed to delete customer');
    const message = body.message;
    return {
      success: true,
      ...(message ? { message } : {}),
    };
  } catch (error) {
    return rethrow(error, 'Failed to delete customer');
  }
};

export const searchCustomers = async (
  query: string,
): Promise<Customer[]> => {
  return getAllCustomers({ search: query });
};

export const getActiveCustomers = async (): Promise<Customer[]> => {
  const customers = await getAllCustomers();
  return customers.filter((customer) => (customer as any)?.isActive !== false);
};

export const getCustomerPurchaseHistory = async (
  customerId: string,
): Promise<any[]> => {
  try {
    const response = await fetch(`/api/customers/${customerId}/purchases`, {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch purchase history (${response.status})`);
    }

    const payload = await response.json();
    if (payload && typeof payload === 'object' && 'data' in payload) {
      return (payload as { data: any[] }).data;
    }
    return Array.isArray(payload) ? payload : [];
  } catch (error) {
    return rethrow(error, 'Failed to fetch customer purchase history');
  }
};

export type { CustomerQueryParams };












