import { useState, useEffect, useCallback } from 'react';
import { Supplier } from '@pharmacy-pos/shared/types/entities';
import {
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation
} from '../api/supplierApi';

// 與既有使用相容的回傳型別
interface ImportResult {
  total: number;
  success: number;
  failed: number;
  duplicates: number;
  errors: Array<{ error: string }>;
}

const useSupplierData = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // RTK Query 清單
  const { data: listData, isFetching, error: listError, refetch } = useGetSuppliersQuery({});
  useEffect(() => {
    setLoading(isFetching);
    if (listError) {
      const anyErr: any = listError;
      const message = typeof anyErr?.data === 'string' ? anyErr.data : anyErr?.data?.message || '載入供應商資料失敗';
      setError(message);
    } else {
      setError(null);
    }
    if (Array.isArray(listData)) {
      setSuppliers(listData);
    }
  }, [listData, isFetching, listError]);

  // 選取
  const selectSupplier = useCallback((id: string): void => {
    const supplier = (listData ?? []).find(s => (s as any)._id === id || (s as any).id === id) as Supplier | undefined;
    setSelectedSupplier(supplier ?? null);
  }, [listData]);

  // Mutations
  const [createSupplier] = useCreateSupplierMutation();
  const [updateSupplierMut] = useUpdateSupplierMutation();
  const [deleteSupplierMut] = useDeleteSupplierMutation();

  const addSupplier = useCallback(async (supplierData: Partial<Supplier>): Promise<boolean> => {
    try {
      await createSupplier(supplierData as any).unwrap();
      await refetch();
      return true;
    } catch (err: any) {
      console.error('新增供應商失敗(hook):', err);
      setError(`新增供應商失敗: ${err?.data?.message ?? err.message}`);
      return false;
    }
  }, [createSupplier, refetch]);

  const updateSupplier = useCallback(async (id: string, supplierData: Partial<Supplier>): Promise<boolean> => {
    try {
      await updateSupplierMut({ id, data: supplierData as any }).unwrap();
      await refetch();
      if (selectedSupplier && ((selectedSupplier as any)._id === id || (selectedSupplier as any).id === id)) {
        const updated = (listData ?? []).find(s => (s as any)._id === id || (s as any).id === id) as Supplier | undefined;
        setSelectedSupplier(updated ?? null);
      }
      return true;
    } catch (err: any) {
      console.error('更新供應商失敗(hook):', err);
      setError(`更新供應商失敗: ${err?.data?.message ?? err.message}`);
      return false;
    }
  }, [updateSupplierMut, refetch, selectedSupplier, listData]);

  const deleteSupplier = useCallback(async (id: string): Promise<boolean> => {
    try {
      await deleteSupplierMut(id).unwrap();
      await refetch();
      if (selectedSupplier && ((selectedSupplier as any)._id === id || (selectedSupplier as any).id === id)) {
        setSelectedSupplier(null);
      }
      return true;
    } catch (err: any) {
      console.error('刪除供應商失敗(hook):', err);
      setError(`刪除供應商失敗: ${err?.data?.message ?? err.message}`);
      return false;
    }
  }, [deleteSupplierMut, refetch, selectedSupplier]);

  // 匯入/模板：尚未提供 API，回傳統一錯誤
  const importCsv = useCallback(async (_file: File): Promise<ImportResult> => {
    try {
      throw new Error('CSV import not implemented');
    } catch (err: any) {
      console.error('匯入供應商 CSV 失敗 (hook):', err);
      setError(`匯入 CSV 失敗: ${err.message}`);
      return { total: 0, success: 0, failed: 0, duplicates: 0, errors: [{ error: err.message }] };
    }
  }, []);

  const downloadTemplate = useCallback(async (): Promise<Blob | null> => {
    try {
      throw new Error('Template download not implemented');
    } catch (err: any) {
      console.error('下載模板失敗 (hook):', err);
      setError(`下載模板失敗: ${err.message}`);
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

