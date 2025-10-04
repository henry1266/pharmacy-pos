import type { SupplierCreateRequest, SupplierUpdateRequest } from '@/features/supplier/api/dto';
import { createSupplierContractClient } from '@/features/supplier/api/client';
import type { Supplier } from '@pharmacy-pos/shared/types/entities';
import type { SupplierQueryParams } from '@/features/supplier/api/dto';

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

const supplierClient = createSupplierContractClient();

type ListSuppliersArgs = Parameters<typeof supplierClient.listSuppliers>[0];

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

export const getAllSuppliers = async (
  params?: SupplierQueryParams,
): Promise<Supplier[]> => {
  try {
    const queryParams = (params ?? undefined) as ListSuppliersArgs['query'];
    const requestArgs: ListSuppliersArgs = { query: queryParams };
    const result = await supplierClient.listSuppliers(requestArgs);
    return assertSuccessData<Supplier[]>(result, 'Failed to fetch suppliers', []);
  } catch (error) {
    return rethrow(error, 'Failed to fetch suppliers');
  }
};

export const getSupplierById = async (id: string): Promise<Supplier> => {
  try {
    const result = await supplierClient.getSupplierById({ params: { id } });
    return assertSuccessData<Supplier>(result, 'Failed to fetch supplier');
  } catch (error) {
    return rethrow(error, 'Failed to fetch supplier');
  }
};

export const createSupplier = async (
  payload: SupplierCreateRequest,
): Promise<Supplier> => {
  try {
    const result = await supplierClient.createSupplier({ body: payload });
    return assertSuccessData<Supplier>(result, 'Failed to create supplier');
  } catch (error) {
    return rethrow(error, 'Failed to create supplier');
  }
};

export const updateSupplier = async (
  id: string,
  payload: SupplierUpdateRequest,
): Promise<Supplier> => {
  try {
    const result = await supplierClient.updateSupplier({ params: { id }, body: payload });
    return assertSuccessData<Supplier>(result, 'Failed to update supplier');
  } catch (error) {
    return rethrow(error, 'Failed to update supplier');
  }
};

export const deleteSupplier = async (
  id: string,
): Promise<{ success: boolean; message?: string }> => {
  try {
    const result = await supplierClient.deleteSupplier({ params: { id } });
    const body = assertSuccessBody<{ id: string }>(result, 'Failed to delete supplier');
    const message = body.message;
    return {
      success: true,
      ...(message ? { message } : {}),
    };
  } catch (error) {
    return rethrow(error, 'Failed to delete supplier');
  }
};

export const searchSuppliers = async (
  query: string,
): Promise<Supplier[]> => {
  return getAllSuppliers({ search: query });
};

export const getActiveSuppliers = async (): Promise<Supplier[]> => {
  const suppliers = await getAllSuppliers();
  return suppliers.filter((supplier) => (supplier as any)?.isActive !== false);
};

export type { SupplierQueryParams };
