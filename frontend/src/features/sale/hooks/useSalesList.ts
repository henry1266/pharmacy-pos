/**
 * @file 銷售列表頁面邏輯
 * @description 提供銷售列表搜尋、刪除、導覽等狀態與方法（整合 RTK Query）
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Sale, SnackbarState, ApiResponse } from '../types/list';
import TestModeConfig from '@/testMode/config/TestModeConfig';
import testModeDataService from '@/testMode/services/TestModeDataService';
import { useGetSalesQuery, useDeleteSaleMutation } from '../api/saleApi';

/**
 * 銷售列表頁面 hook
 */
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

  // 初始化測試模式
  useEffect(() => {
    setIsTestMode(TestModeConfig.isEnabled());
  }, []);

  // 查詢參數（RTK Query）
  const [queryParams, setQueryParams] = useState<{ search?: string; wildcardSearch?: string }>({});

  // 生產模式：RTK Query 取得清單
  const { data: listData, error: listError, isFetching, refetch } = useGetSalesQuery(queryParams, {
    skip: isTestMode,
  });

  useEffect(() => {
    if (isTestMode) return;
    setLoading(isFetching);
    if (listError) {
      const anyErr: any = listError;
      const message = typeof anyErr?.data === 'string' ? anyErr.data : anyErr?.data?.message || '取得銷售資料失敗';
      setError(message);
    } else {
      setError(null);
    }
    if (listData && Array.isArray(listData.data)) {
      setSales(listData.data as unknown as Sale[]);
    }
  }, [isTestMode, listData, listError, isFetching]);

  // 測試模式：以 axios 嘗試抓取，失敗則使用測試資料
  useEffect(() => {
    const run = async () => {
      if (!isTestMode) return;
      setLoading(true);
      try {
        await new Promise(r => setTimeout(r, 300));
        const params: Record<string, string> = {};
        if (queryParams?.wildcardSearch) params.wildcardSearch = queryParams.wildcardSearch;
        else if (queryParams?.search) params.search = queryParams.search;
        const response = await axios.get<ApiResponse<Sale[]>>('/api/sales', { params });
        const actualSales = response.data.data ?? [];
        const testSales = testModeDataService.getSales(actualSales, null);
        setSales(testSales);
      } catch (err) {
        const testSales = testModeDataService.getSales(null, 'fetch_failed');
        setSales(testSales);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [isTestMode, queryParams]);

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
      setQueryParams({});
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
  const totalAmount = useMemo(() => filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0), [filteredSales]);

  // 刪除（測試/生產）
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

  // 關閉確定刪除對話框
  const handleCloseConfirmDialog = useCallback((): void => {
    setConfirmDeleteId(null);
  }, []);

  // 關閉通知
  const handleCloseSnackbar = useCallback((): void => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // 預覽
  const handlePreviewClick = useCallback((event: React.MouseEvent<HTMLButtonElement>, sale: Sale): void => {
    setPreviewAnchorEl(event.currentTarget);
    setSelectedSale(sale);
    setPreviewLoading(false);
    setPreviewError(null);
  }, []);

  const handlePreviewClose = useCallback((): void => {
    setPreviewAnchorEl(null);
    setSelectedSale(null);
  }, []);

  // 導航
  const handleAddNewSale = useCallback((): void => { navigate('/sales/new2'); }, [navigate]);
  const handleEditSale = useCallback((saleId: string): void => { navigate(`/sales/edit/${saleId}`); }, [navigate]);
  const handleViewSale = useCallback((saleId: string): void => { navigate(`/sales/${saleId}`); }, [navigate]);
  const handleBackToHome = useCallback((): void => { navigate('/'); }, [navigate]);

  const isPreviewOpen = Boolean(previewAnchorEl);
  const previewId = isPreviewOpen ? 'sales-preview-popover' : undefined;

  return {
    // 狀態
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

    // 方法
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

