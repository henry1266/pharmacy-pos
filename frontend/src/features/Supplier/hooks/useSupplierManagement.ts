import { useState, useEffect } from 'react';
import { SupplierData, SupplierFormState } from '../types/supplier.types';
import useSupplierData from './useSupplierData';
import testModeDataService from '../../../testMode/services/TestModeDataService';

export const useSupplierManagement = () => {
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  const [localSuppliers, setLocalSuppliers] = useState<SupplierData[]>([]);
  const [localSelectedSupplier, setLocalSelectedSupplier] = useState<SupplierData | null>(null);

  useEffect(() => {
    const testModeActive = localStorage.getItem('isTestMode') === 'true';
    setIsTestMode(testModeActive);
  }, []);

  const {
    suppliers: actualSuppliers,
    loading: actualLoading,
    error: actualError,
    selectedSupplier: actualSelectedSupplier,
    selectSupplier: actualSelectSupplier,
    addSupplier: actualAddSupplier,
    updateSupplier: actualUpdateSupplier,
    deleteSupplier: actualDeleteSupplier,
    setError: setActualError
  } = useSupplierData();

  // 處理供應商數據載入和轉換
  useEffect(() => {
    if (isTestMode) {
      const testSuppliers = testModeDataService.getSuppliers(actualSuppliers as any, actualError);
      const convertedSuppliers = testSuppliers.map(supplier => ({
        ...supplier,
        id: supplier._id || supplier.id
      })) as unknown as SupplierData[];
      setLocalSuppliers(convertedSuppliers);
    } else {
      const convertedSuppliers = (actualSuppliers ?? []).map(supplier => ({
        ...supplier,
        id: supplier._id
      })) as unknown as SupplierData[];
      setLocalSuppliers(convertedSuppliers);
    }
  }, [isTestMode, actualSuppliers, actualError]);

  // 處理選擇供應商邏輯
  useEffect(() => {
    if (isTestMode) {
      if (actualSelectedSupplier) {
        const found = localSuppliers.find(s => s.id === (actualSelectedSupplier as unknown as SupplierData).id);
        setLocalSelectedSupplier(found ?? null);
      } else {
        setLocalSelectedSupplier(null);
      }
    } else {
      setLocalSelectedSupplier(actualSelectedSupplier as unknown as SupplierData ?? null);
    }
  }, [isTestMode, actualSelectedSupplier, localSuppliers]);

  // 清除錯誤的 useEffect
  useEffect(() => {
    if (!isTestMode) {
      setActualError(null);
    }
  }, [setActualError, isTestMode]);

  // 選擇供應商函數
  const selectSupplier = (id: string): void => {
    if (isTestMode) {
      const supplier = localSuppliers.find(s => s.id === id);
      setLocalSelectedSupplier(supplier ?? null);
    } else {
      actualSelectSupplier(id);
    }
  };

  // 刪除供應商函數
  const handleDeleteSupplier = async (id: string): Promise<boolean> => {
    if (window.confirm(isTestMode ? '測試模式：確定要模擬刪除此供應商嗎？' : '確定要刪除此供應商嗎？')) {
      if (isTestMode) {
        setLocalSuppliers(prev => prev.filter(s => s.id !== id));
        if (localSelectedSupplier && localSelectedSupplier.id === id) {
          setLocalSelectedSupplier(null);
        }
        return true;
      }
      return await actualDeleteSupplier(id);
    }
    return false;
  };

  // 保存供應商函數
  const handleSaveSupplier = async (supplierData: SupplierFormState): Promise<boolean> => {
    if (isTestMode) {
      const newSupplier: SupplierData = {
        ...supplierData,
        id: supplierData.id ?? `mockSup${Date.now()}`,
        code: supplierData.code ?? `MKSUP${Date.now().toString().slice(-4)}`
      };

      if (supplierData.id) {
        setLocalSuppliers(prev => prev.map(s => s.id === newSupplier.id ? newSupplier : s));
        if (localSelectedSupplier && localSelectedSupplier.id === newSupplier.id) {
          setLocalSelectedSupplier(newSupplier);
        }
      } else {
        setLocalSuppliers(prev => [...prev, newSupplier]);
      }
      return true;
    } else {
      if (supplierData.id) {
        return await actualUpdateSupplier(supplierData.id, supplierData);
      } else {
        return await actualAddSupplier(supplierData);
      }
    }
  };

  // 返回統一的供應商數據
  const suppliers = localSuppliers;
  const loading = isTestMode ? false : actualLoading;
  const error = isTestMode ? null : actualError;
  const selectedSupplier = isTestMode ? localSelectedSupplier : (actualSelectedSupplier as unknown as SupplierData | null);

  return {
    isTestMode,
    suppliers,
    loading,
    error,
    selectedSupplier,
    selectSupplier,
    handleDeleteSupplier,
    handleSaveSupplier,
    setActualError
  };
};