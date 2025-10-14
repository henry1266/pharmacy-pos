import { useState, useEffect, useCallback } from 'react';
import {
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation
} from '../api/supplierApi';
import type { SupplierResponseDto } from '../api/dto';
import type { SupplierFormState, ImportResult } from '../types';
import {
  buildActionErrorMessage,
  ensureSupplierId,
  toSupplierCreatePayload,
  toSupplierUpdatePayload
} from '../utils';

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
