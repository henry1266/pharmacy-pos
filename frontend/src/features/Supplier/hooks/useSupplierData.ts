import { useState, useEffect, useCallback } from 'react';
import {
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation
} from '../api/supplierApi';
import type {
  SupplierResponseDto,
  SupplierCreateRequest,
  SupplierUpdateRequest
} from '../api/dto';
import type { SupplierFormState, ImportResult } from '../types/supplier.types';

const ensureSupplierId = (supplier: SupplierResponseDto): string => {
  const candidate = (supplier as SupplierResponseDto & { id?: unknown }).id;
  if (typeof candidate === 'string' && candidate.length > 0) {
    return candidate;
  }
  return supplier._id;
};

const normalizeOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const toSupplierCreatePayload = (form: SupplierFormState): SupplierCreateRequest => ({
  name: form.name.trim(),
  code: normalizeOptionalString(form.code),
  shortCode: normalizeOptionalString(form.shortCode),
  contactPerson: normalizeOptionalString(form.contactPerson),
  phone: normalizeOptionalString(form.phone),
  email: normalizeOptionalString(form.email),
  address: normalizeOptionalString(form.address),
  taxId: normalizeOptionalString(form.taxId),
  paymentTerms: normalizeOptionalString(form.paymentTerms),
  notes: normalizeOptionalString(form.notes),
  isActive: typeof form.isActive === 'boolean' ? form.isActive : undefined
});

const toSupplierUpdatePayload = (form: SupplierFormState): SupplierUpdateRequest => ({
  ...toSupplierCreatePayload(form)
});

const extractErrorMessage = (error: unknown): string | null => {
  if (!error) {
    return null;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object') {
    const errorObject = error as { message?: unknown; data?: unknown };
    if (typeof errorObject.message === 'string' && errorObject.message.length > 0) {
      return errorObject.message;
    }
    if (typeof errorObject.data === 'string' && errorObject.data.length > 0) {
      return errorObject.data;
    }
    if (typeof errorObject.data === 'object' && errorObject.data !== null) {
      const dataRecord = errorObject.data as Record<string, unknown>;
      const messageValue = dataRecord['message'];
      if (typeof messageValue === 'string' && messageValue.length > 0) {
        return messageValue;
      }
      const errorValue = dataRecord['error'];
      if (typeof errorValue === 'string' && errorValue.length > 0) {
        return errorValue;
      }
    }
  }
  return null;
};

const buildActionErrorMessage = (error: unknown, action: string): string => {
  const detail = extractErrorMessage(error);
  return detail ? `${action}: ${detail}` : action;
};

const useSupplierData = () => {
  const [suppliers, setSuppliers] = useState<SupplierResponseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierResponseDto | null>(null);

  const {
    data: listData,
    isFetching,
    error: listError,
    refetch
  } = useGetSuppliersQuery({});

  useEffect(() => {
    setLoading(isFetching);
    if (listError) {
      setError(buildActionErrorMessage(listError, 'Load suppliers failed'));
    } else {
      setError(null);
    }
    if (Array.isArray(listData)) {
      setSuppliers(listData);
    }
  }, [listData, isFetching, listError]);

  const selectSupplier = useCallback((id: string): void => {
    const candidate = (listData ?? []).find((supplier) => ensureSupplierId(supplier) === id) ?? null;
    setSelectedSupplier(candidate);
  }, [listData]);

  const [createSupplier] = useCreateSupplierMutation();
  const [updateSupplierMut] = useUpdateSupplierMutation();
  const [deleteSupplierMut] = useDeleteSupplierMutation();

  const addSupplier = useCallback(async (formState: SupplierFormState): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const payload = toSupplierCreatePayload(formState);
      await createSupplier(payload).unwrap();
      await refetch();
      return true;
    } catch (caughtError) {
      const message = buildActionErrorMessage(caughtError, 'Create supplier failed');
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [createSupplier, refetch]);

  const updateSupplier = useCallback(async (id: string, formState: SupplierFormState): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const payload = toSupplierUpdatePayload(formState);
      await updateSupplierMut({ id, data: payload }).unwrap();
      await refetch();
      if (selectedSupplier && ensureSupplierId(selectedSupplier) === id) {
        const updated = (listData ?? []).find((supplier) => ensureSupplierId(supplier) === id) ?? null;
        setSelectedSupplier(updated);
      }
      return true;
    } catch (caughtError) {
      const message = buildActionErrorMessage(caughtError, 'Update supplier failed');
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [updateSupplierMut, refetch, selectedSupplier, listData]);

  const deleteSupplier = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      await deleteSupplierMut(id).unwrap();
      await refetch();
      if (selectedSupplier && ensureSupplierId(selectedSupplier) === id) {
        setSelectedSupplier(null);
      }
      return true;
    } catch (caughtError) {
      const message = buildActionErrorMessage(caughtError, 'Delete supplier failed');
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [deleteSupplierMut, refetch, selectedSupplier]);

  const importCsv = useCallback(async (_file: File): Promise<ImportResult> => {
    try {
      throw new Error('CSV import not implemented');
    } catch (caughtError: any) {
      const message = buildActionErrorMessage(caughtError, 'Import supplier CSV failed');
      setError(message);
      return { total: 0, success: 0, failed: 0, duplicates: 0, errors: [{ error: message }] };
    }
  }, []);

  const downloadTemplate = useCallback(async (): Promise<Blob | null> => {
    try {
      throw new Error('Supplier template download not implemented');
    } catch (caughtError: any) {
      const message = buildActionErrorMessage(caughtError, 'Download supplier template failed');
      setError(message);
      return null;
    }
  }, []);

  return {
    suppliers,
    loading,
    error,
    selectedSupplier,
    fetchSuppliers: refetch,
    selectSupplier,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    importCsv,
    downloadTemplate,
    setError
  };
};

export default useSupplierData;
