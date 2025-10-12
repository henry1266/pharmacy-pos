/**
 * @file 銷售列表頁面邏輯
 * @description 提供搜尋、刪除、瀏覽與導覽邏輯（整合 RTK Query） */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sale, SnackbarState } from '../types/list';
import type { SaleQueryParams } from '../api/dto';
import TestModeConfig from '@/testMode/config/TestModeConfig';
import { useGetSalesQuery, useDeleteSaleMutation } from '../api/saleApi';

// 銷售列表頁面 hook
export const useSalesList = () => {
  const navigate = useNavigate();
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [wildcardMode, setWildcardMode] = useState<boolean>(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });

  const [previewAnchorEl, setPreviewAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  // 測試模式旗標
  useEffect(() => {
    setIsTestMode(TestModeConfig.isEnabled());
  }, []);

  const [queryParams, setQueryParams] = useState<SaleQueryParams | undefined>(undefined);


  // 取得清單
  const { data: listData, error: listError, isFetching, refetch } = useGetSalesQuery(queryParams);

  useEffect(() => {
    setLoading(isFetching);
    if (listError) {
      const anyErr: any = listError;
      const message = typeof anyErr?.data === 'string' ? anyErr.data : anyErr?.data?.message || '載入銷售資料失敗';
      setError(message);
    } else {
      setError(null);
    }
    if (Array.isArray(listData)) {
      setSales(listData as unknown as Sale[]);
    } else if (!listData) {
      setSales([]);
    }
  }, [listData, listError, isFetching]);

  // 搜尋輸入變更
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  }, []);

  // debounce 搜尋
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchTerm);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, wildcardMode]);

  // 觸發搜尋
  const handleSearch = useCallback((value: string): void => {
    if (!value.trim()) {
      setQueryParams(undefined);
      return;
    }
    setQueryParams(wildcardMode ? { wildcardSearch: value } : { search: value });
  }, [wildcardMode]);

  // 切換萬用字元模式
  const handleWildcardModeChange = useCallback((enabled: boolean): void => {
    setWildcardMode(enabled);
    if (searchTerm.trim()) {
      handleSearch(searchTerm);
    }
  }, [handleSearch, searchTerm]);

  // 計算總金額
  const filteredSales = useMemo(() => sales, [sales]);
  const totalAmount = useMemo(
    () => filteredSales.reduce((sum, sale) => sum + (sale.totalAmount ?? 0), 0),
    [filteredSales],
  );

  // 刪除
  const [deleteSale] = useDeleteSaleMutation();
  const handleTestModeDelete = useCallback((id: string): void => {
    setSales(prev => prev.filter(s => s._id !== id));
    setSnackbar({ open: true, message: '測試模式：銷售記錄已模擬刪除', severity: 'info' });
    setConfirmDeleteId(null);
  }, []);

  const handleProductionDelete = useCallback(async (id: string): Promise<void> => {
    try {
      await deleteSale(id).unwrap();
      await refetch();
      setSnackbar({ open: true, message: '銷售記錄已刪除', severity: 'success' });
    } catch (err) {
      console.error('刪除銷售記錄失敗:', err);
      setSnackbar({ open: true, message: '刪除銷售記錄失敗', severity: 'error' });
    }
    setConfirmDeleteId(null);
  }, [deleteSale, refetch]);

  const handleDeleteSale = useCallback(async (id: string): Promise<void> => {
    if (isTestMode) return handleTestModeDelete(id);
    await handleProductionDelete(id);
  }, [isTestMode, handleTestModeDelete, handleProductionDelete]);

  // 關閉刪除確認對話框
  const handleCloseConfirmDialog = useCallback((): void => {
    setConfirmDeleteId(null);
  }, []);

  // 關閉通知
  const handleCloseSnackbar = useCallback((): void => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // 預覽
  const handlePreviewClick = useCallback((event: React.MouseEvent<HTMLButtonElement> | { currentTarget: any }, sale: Sale): void => {
    const anchor = (event as React.MouseEvent<HTMLButtonElement>).currentTarget ?? null;
    setPreviewAnchorEl(anchor);
    setSelectedSale(sale);
    setPreviewLoading(false);
    setPreviewError(null);
  }, []);

  const handlePreviewClose = useCallback((): void => {
    setPreviewAnchorEl(null);
    setSelectedSale(null);
  }, []);

  // 導航
  const handleAddNewSale = useCallback((): void => { navigate('/sales/new'); }, [navigate]);
  const handleEditSale = useCallback((saleId: string): void => { navigate(`/sales/edit/${saleId}`); }, [navigate]);
  const handleViewSale = useCallback((saleId: string): void => { navigate(`/sales/${saleId}`); }, [navigate]);
  const handleBackToHome = useCallback((): void => { navigate('/'); }, [navigate]);

  const isPreviewOpen = Boolean(previewAnchorEl);
  const previewId = isPreviewOpen ? 'sales-preview-popover' : undefined;

  return {
    isTestMode,
    sales: filteredSales,
    loading,
    error,
    searchTerm,
    wildcardMode,
    confirmDeleteId,
    snackbar,
    previewAnchorEl,
    selectedSale,
    previewLoading,
    previewError,
    isPreviewOpen,
    previewId,
    totalAmount,

    // handlers
    handleSearchChange,
    handleWildcardModeChange,
    handleDeleteSale,
    handleCloseConfirmDialog,
    handleCloseSnackbar,
    handlePreviewClick,
    handlePreviewClose,
    handleAddNewSale,
    handleEditSale,
    handleViewSale,
    handleBackToHome
  };
};
