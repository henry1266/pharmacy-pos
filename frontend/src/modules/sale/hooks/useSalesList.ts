/**
 * @file 銷售列表頁面鉤子
 * @description 處理銷售列表頁面的狀態和邏輯
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Sale, SnackbarState, ApiResponse } from '../types/list';
import TestModeConfig from '@/testMode/config/TestModeConfig';
import testModeDataService from '@/testMode/services/TestModeDataService';

/**
 * 銷售列表頁面鉤子
 * 處理銷售列表頁面的狀態和邏輯
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
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const [previewAnchorEl, setPreviewAnchorEl] = useState<HTMLElement | null>(null);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // 初始化
  useEffect(() => {
    const testModeActive = TestModeConfig.isEnabled();
    setIsTestMode(testModeActive);
    fetchSales(testModeActive);
  }, []);

  // 獲取銷售數據
  const fetchSales = useCallback(async (testModeEnabled: boolean, searchParams?: { search?: string; wildcardSearch?: string }): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      let actualSales: Sale[] | null = null;
      let actualError: string | null = null;
      
      if (!testModeEnabled) {
        // 生產模式：直接獲取實際數據
        await fetchProductionSales(searchParams);
        return;
      }
      
      // 測試模式：嘗試獲取實際數據，失敗時使用測試數據
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        const params: Record<string, string> = {};
        
        // 添加搜尋參數
        if (searchParams?.wildcardSearch) {
          params.wildcardSearch = searchParams.wildcardSearch;
        } else if (searchParams?.search) {
          params.search = searchParams.search;
        }
        
        const response = await axios.get<ApiResponse<Sale[]>>('/api/sales', { params });
        actualSales = response.data.data ?? [];
      } catch (err) {
        console.warn('測試模式：獲取實際銷售數據失敗，將使用測試數據', err);
        actualError = err instanceof Error ? err.message : '獲取數據失敗';
      }
      
      // 使用測試數據服務獲取數據
      const testSales = testModeDataService.getSales(actualSales, actualError);
      setSales(testSales);
      
    } catch (err) {
      console.error('獲取銷售數據失敗:', err);
      setError('獲取銷售數據失敗');
      setSnackbar({
        open: true,
        message: '獲取銷售數據失敗',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // 生產模式下獲取銷售數據
  const fetchProductionSales = useCallback(async (searchParams?: { search?: string; wildcardSearch?: string }): Promise<void> => {
    try {
      const params: Record<string, string> = {};
      
      // 添加搜尋參數
      if (searchParams?.wildcardSearch) {
        params.wildcardSearch = searchParams.wildcardSearch;
      } else if (searchParams?.search) {
        params.search = searchParams.search;
      }
      
      const response = await axios.get<ApiResponse<Sale[]>>('/api/sales', { params });
      // 後端回傳的是 ApiResponse 格式: { success, message, data, timestamp }
      const salesData = response.data.data ?? [];
      if (Array.isArray(salesData)) {
        setSales(salesData);
      } else {
        console.warn('API 回傳的資料格式不正確:', response.data);
        setSales([]);
      }
    } catch (err) {
      console.error('獲取銷售數據失敗:', err);
      setError('獲取銷售數據失敗');
      setSnackbar({
        open: true,
        message: '獲取銷售數據失敗',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // 處理搜尋框異動
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  }, []);

  // 使用 useEffect 處理搜尋的 debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchTerm);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [searchTerm, wildcardMode]);

  // 執行搜尋
  const handleSearch = useCallback((searchValue: string): void => {
    if (!searchValue.trim()) {
      // 如果搜尋條件為空，重新載入所有記錄
      fetchSales(isTestMode);
      return;
    }

    const searchParams = wildcardMode
      ? { wildcardSearch: searchValue }
      : { search: searchValue };
    
    fetchSales(isTestMode, searchParams);
  }, [fetchSales, isTestMode, wildcardMode]);

  // 處理萬用字元模式切換
  const handleWildcardModeChange = useCallback((enabled: boolean): void => {
    setWildcardMode(enabled);
    // 如果有搜尋條件，立即重新搜尋
    if (searchTerm.trim()) {
      handleSearch(searchTerm);
    }
  }, [handleSearch, searchTerm]);

  // 為DataGrid準備行數據
  const filteredSales = useMemo(() => {
    return sales;
  }, [sales]);

  // 計算總金額
  const totalAmount = useMemo(() => {
    return filteredSales.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
  }, [filteredSales]);

  // 處理刪除銷售記錄
  const handleDeleteSale = useCallback(async (id: string): Promise<void> => {
    if (isTestMode) {
      handleTestModeDelete(id);
      return;
    }

    await handleProductionDelete(id);
  }, [isTestMode]);

  // 測試模式下的刪除處理
  const handleTestModeDelete = useCallback((id: string): void => {
    setSales(prevSales => prevSales.filter(sale => sale._id !== id));
    setSnackbar({
      open: true,
      message: '測試模式：銷售記錄已模擬刪除',
      severity: 'info'
    });
    setConfirmDeleteId(null);
  }, []);

  // 生產模式下的刪除處理
  const handleProductionDelete = useCallback(async (id: string): Promise<void> => {
    try {
      await axios.delete(`/api/sales/${id}`);
      fetchSales(isTestMode); // Refetch after delete
      setSnackbar({
        open: true,
        message: '銷售記錄已刪除',
        severity: 'success'
      });
    } catch (err) {
      console.error('刪除銷售記錄失敗:', err);
      setSnackbar({
        open: true,
        message: '刪除銷售記錄失敗',
        severity: 'error'
      });
    }
    setConfirmDeleteId(null);
  }, [fetchSales, isTestMode]);

  // 關閉確認對話框
  const handleCloseConfirmDialog = useCallback((): void => {
    setConfirmDeleteId(null);
  }, []);

  // 關閉提示訊息
  const handleCloseSnackbar = useCallback((): void => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // 處理預覽點擊
  const handlePreviewClick = useCallback((event: React.MouseEvent<HTMLButtonElement>, sale: Sale): void => {
    setPreviewAnchorEl(event.currentTarget);
    setSelectedSale(sale);
    setPreviewLoading(false); // Reset loading/error for preview
    setPreviewError(null);
  }, []);

  // 關閉預覽
  const handlePreviewClose = useCallback((): void => {
    setPreviewAnchorEl(null);
    setSelectedSale(null);
  }, []);

  // 導航處理函數
  const handleAddNewSale = useCallback((): void => {
    navigate('/sales/new2');
  }, [navigate]);

  const handleEditSale = useCallback((saleId: string): void => {
    navigate(`/sales/edit/${saleId}`);
  }, [navigate]);
  
  const handleViewSale = useCallback((saleId: string): void => {
    navigate(`/sales/${saleId}`);
  }, [navigate]);

  const handleBackToHome = useCallback((): void => {
    navigate('/');
  }, [navigate]);

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

    // 處理函數
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