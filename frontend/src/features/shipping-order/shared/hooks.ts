/**
 * 出貨單模組共用 Hooks
 */

import { useState, useCallback, ChangeEvent, useMemo } from 'react';
import { Item } from './types';
import {
  calculateTotalAmount,
  moveArrayItem,
  deepClone,
  validateItem
} from './utils';
import { FILE_UPLOAD_CONFIG } from './constants';
import { FileProcessingOptions, FileValidationResult, ValidationResult } from '@pharmacy-pos/shared/types/utils';

/**
 * 項目管理 Hook
 */
export const useItemsManagement = (initialItems: Item[] = []) => {
  const [items, setItems] = useState<Item[]>(initialItems);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  // 計算總金額
  const totalAmount = calculateTotalAmount(items);

  // 開始編輯項目
  const handleEditItem = useCallback((index: number) => {
    setEditingItemIndex(index);
    const item = items[index];
    if (item) {
      setEditingItem(deepClone(item));
    }
  }, [items]);

  // 儲存編輯項目
  const handleSaveEditItem = useCallback(() => {
    if (editingItemIndex !== null && editingItem) {
      const validation = validateItem(editingItem);
      if (!validation.isValid) {
        alert(validation.errors.join('\n'));
        return;
      }

      const newItems = [...items];
      newItems[editingItemIndex] = editingItem;
      setItems(newItems);
      setEditingItemIndex(null);
      setEditingItem(null);
    }
  }, [editingItemIndex, editingItem, items]);

  // 取消編輯項目
  const handleCancelEditItem = useCallback(() => {
    setEditingItemIndex(null);
    setEditingItem(null);
  }, []);

  // 移除項目
  const handleRemoveItem = useCallback((index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    
    // 如果正在編輯的項目被刪除，取消編輯狀態
    if (editingItemIndex === index) {
      setEditingItemIndex(null);
      setEditingItem(null);
    } else if (editingItemIndex !== null && editingItemIndex > index) {
      setEditingItemIndex(editingItemIndex - 1);
    }
  }, [items, editingItemIndex]);

  // 移動項目位置
  const handleMoveItem = useCallback((index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = moveArrayItem(items, index, targetIndex);
    setItems(newItems);

    // 更新編輯索引
    if (editingItemIndex === index) {
      setEditingItemIndex(targetIndex);
    } else if (editingItemIndex === targetIndex) {
      setEditingItemIndex(index);
    }
  }, [items, editingItemIndex]);

  // 處理編輯項目變更
  const handleEditingItemChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    if (!editingItem) return;

    const { name, value } = event.target;
    setEditingItem({
      ...editingItem,
      [name]: value
    });
  }, [editingItem]);

  // 添加新項目
  const addItem = useCallback((newItem: Item) => {
    setItems(prevItems => [...prevItems, newItem]);
  }, []);

  // 清空所有項目
  const clearItems = useCallback(() => {
    setItems([]);
    setEditingItemIndex(null);
    setEditingItem(null);
  }, []);

  // 設置項目
  const setItemsData = useCallback((newItems: Item[]) => {
    setItems(newItems);
    setEditingItemIndex(null);
    setEditingItem(null);
  }, []);

  return {
    items,
    editingItemIndex,
    editingItem,
    totalAmount,
    handleEditItem,
    handleSaveEditItem,
    handleCancelEditItem,
    handleRemoveItem,
    handleMoveItem,
    handleEditingItemChange,
    addItem,
    clearItems,
    setItemsData
  };
};

/**
 * CSV 導入 Hook
 */
export const useCsvImport = (options?: FileProcessingOptions) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<FileValidationResult | null>(null);

  // 預設檔案處理選項
  const processingOptions = useMemo((): FileProcessingOptions => {
    const defaultOptions: FileProcessingOptions = {
      allowedExtensions: [...FILE_UPLOAD_CONFIG.allowedExtensions],
      maxFileSize: FILE_UPLOAD_CONFIG.maxFileSize,
      maxFiles: 1
    };
    return { ...defaultOptions, ...options };
  }, [options]);

  // 驗證檔案
  const validateFile = useCallback((file: File): FileValidationResult => {
    const errors: string[] = [];
    
    // 檢查檔案擴展名
    if (processingOptions.allowedExtensions) {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!processingOptions.allowedExtensions.includes(fileExtension)) {
        errors.push(`不支援的檔案格式，僅支援: ${processingOptions.allowedExtensions.join(', ')}`);
      }
    }
    
    // 檢查檔案大小
    if (processingOptions.maxFileSize && file.size > processingOptions.maxFileSize) {
      const maxSizeMB = processingOptions.maxFileSize / 1024 / 1024;
      errors.push(`檔案大小超過限制 (${maxSizeMB}MB)`);
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      fileInfo: {
        originalName: file.name,
        size: file.size,
        mimetype: file.type,
        extension: '.' + file.name.split('.').pop()?.toLowerCase() || ''
      }
    };
  }, [processingOptions]);

  // 處理檔案變更
  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setCsvFile(null);
      setValidationResult(null);
      return;
    }

    const validation = validateFile(file);
    setValidationResult(validation);

    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      setCsvFile(null);
      return;
    }

    setCsvFile(file);
    setError('');
    setSuccess(false);
  }, [validateFile]);

  // 執行導入
  const handleImport = useCallback(async (importFunction: (file: File) => Promise<ValidationResult>) => {
    if (!csvFile || !validationResult?.isValid) return;

    setLoading(true);
    setError('');
    
    try {
      const result = await importFunction(csvFile);
      if (result.isValid) {
        setSuccess(true);
      } else {
        const errorMessages = result.errors?.map(err => err.message).join(', ');
        setError(errorMessages || '導入失敗');
        setSuccess(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '導入失敗');
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  }, [csvFile, validationResult]);

  // 重置狀態
  const resetImportState = useCallback(() => {
    setCsvFile(null);
    setValidationResult(null);
    setLoading(false);
    setError('');
    setSuccess(false);
  }, []);

  return {
    csvFile,
    loading,
    error,
    success,
    validationResult,
    handleFileChange,
    handleImport,
    resetImportState
  };
};

/**
 * 表格分頁 Hook
 */
export const useTablePagination = (initialPageSize: number = 10) => {
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: initialPageSize
  });

  const handlePaginationModelChange = useCallback((newModel: typeof paginationModel) => {
    setPaginationModel(newModel);
  }, []);

  const resetPagination = useCallback(() => {
    setPaginationModel({
      page: 0,
      pageSize: initialPageSize
    });
  }, [initialPageSize]);

  return {
    paginationModel,
    setPaginationModel: handlePaginationModelChange,
    resetPagination
  };
};

/**
 * 表格載入狀態 Hook
 */
export const useTableLoading = () => {
  const [loading, setLoading] = useState<boolean>(false);

  const startLoading = useCallback(() => setLoading(true), []);
  const stopLoading = useCallback(() => setLoading(false), []);

  return {
    loading,
    startLoading,
    stopLoading,
    setLoading
  };
};

/**
 * 表格選擇 Hook
 */
export const useTableSelection = <T extends { id: string }>() => {
  const [selectedRows, setSelectedRows] = useState<T[]>([]);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  const handleSelectionChange = useCallback((newSelection: string[], allRows: T[]) => {
    setSelectedRowIds(newSelection);
    setSelectedRows(allRows.filter(row => newSelection.includes(row.id)));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedRows([]);
    setSelectedRowIds([]);
  }, []);

  const selectAll = useCallback((allRows: T[]) => {
    const allIds = allRows.map(row => row.id);
    setSelectedRowIds(allIds);
    setSelectedRows(allRows);
  }, []);

  return {
    selectedRows,
    selectedRowIds,
    handleSelectionChange,
    clearSelection,
    selectAll
  };
};

/**
 * 表格篩選 Hook
 */
export const useTableFilter = () => {
  const [filterModel, setFilterModel] = useState<any>({
    items: []
  });

  const handleFilterModelChange = useCallback((newModel: any) => {
    setFilterModel(newModel);
  }, []);

  const clearFilters = useCallback(() => {
    setFilterModel({ items: [] });
  }, []);

  return {
    filterModel,
    setFilterModel: handleFilterModelChange,
    clearFilters
  };
};

/**
 * 表格排序 Hook
 */
export const useTableSort = () => {
  const [sortModel, setSortModel] = useState<any>([]);

  const handleSortModelChange = useCallback((newModel: any) => {
    setSortModel(newModel);
  }, []);

  const clearSort = useCallback(() => {
    setSortModel([]);
  }, []);

  return {
    sortModel,
    setSortModel: handleSortModelChange,
    clearSort
  };
};