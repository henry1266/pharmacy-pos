/**
 * @file 進貨單列表頁面鉤子
 * @description 處理進貨單列表頁面的狀態和邏輯
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch } from '@/hooks/redux';
import { 
  PurchaseOrder, 
  FilteredRow, 
  SnackbarState, 
  SearchParams, 
  Supplier 
} from '../types/list';
import { 
  deletePurchaseOrder, 
  searchPurchaseOrders, 
  fetchPurchaseOrders, 
  API_BASE_URL 
} from '@/redux/actions';
import { purchaseOrderServiceV2 } from '@/services/purchaseOrderServiceV2';

/**
 * 進貨單列表頁面鉤子
 * 處理進貨單列表頁面的狀態和邏輯
 */
export const usePurchaseOrdersList = (initialSupplierId: string | null = null) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  
  // 從路由參數或 props 獲取供應商 ID
  const supplierIdFromRoute = initialSupplierId ?? params.id;

  // 狀態
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<SearchParams>({
    poid: '',
    pobill: '',
    posupplier: '',
    startDate: null,
    endDate: null,
    searchTerm: ''
  });
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [filteredRows, setFilteredRows] = useState<FilteredRow[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [purchaseOrderToDelete, setPurchaseOrderToDelete] = useState<PurchaseOrder | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [previewAnchorEl, setPreviewAnchorEl] = useState<HTMLElement | null>(null);
  const [previewPurchaseOrder, setPreviewPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [paginationModel, setPaginationModel] = useState({ pageSize: 50, page: 0 });
  const [paymentStatusMap, setPaymentStatusMap] = useState<Map<string, boolean>>(new Map());
  const [isCheckingPaymentStatus, setIsCheckingPaymentStatus] = useState<boolean>(false);

  // 初始化數據
  useEffect(() => {
    fetchData();
  }, []);

  // 獲取數據
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 使用 Redux action 獲取進貨單數據
      try {
        const action = await dispatch(fetchPurchaseOrders() as any);
        if (action?.payload) {
          setPurchaseOrders(action.payload);
        }
      } catch (err: any) {
        console.error('獲取進貨單數據失敗:', err);
        setError('獲取進貨單數據失敗');
      }

      // 獲取供應商數據
      try {
        const response = await axios.get(`${API_BASE_URL}/suppliers`);
        setSuppliers(response.data);
      } catch (err) {
        console.error('獲取供應商數據失敗:', err);
      }
    } catch (err) {
      console.error('初始化數據失敗:', err);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  // 檢查進貨單付款狀態的函數
  const checkPaymentStatus = useCallback(async (purchaseOrderId: string): Promise<boolean> => {
    try {
      console.log('🔍 檢查進貨單付款狀態:', purchaseOrderId);
      const response = await axios.get(`${API_BASE_URL}/accounting2/transactions/purchase-order/${purchaseOrderId}/payment-status`);
      console.log('✅ 付款狀態檢查結果:', response.data);
      return response.data.hasPaidAmount || false;
    } catch (error) {
      console.error('❌ 檢查付款狀態失敗:', error);
      return false;
    }
  }, []);

  // 批量檢查付款狀態 - 使用批量 API 優化性能
  const checkAllPaymentStatuses = useCallback(async (purchaseOrders: PurchaseOrder[]) => {
    if (isCheckingPaymentStatus) {
      console.log('⏸️ 付款狀態檢查已在進行中，跳過此次調用');
      return;
    }
    
    setIsCheckingPaymentStatus(true);
    console.log('🔄 開始批量檢查付款狀態，進貨單數量:', purchaseOrders.length);
    
    try {
      const statusMap = new Map<string, boolean>();
      
      // 提取所有進貨單 ID
      const purchaseOrderIds = purchaseOrders.map(po => po._id);
      
      // 使用批量 API 一次性檢查所有進貨單的付款狀態
      const response = await axios.post(`${API_BASE_URL}/accounting2/transactions/purchase-orders/batch-payment-status`, {
        purchaseOrderIds
      });
      
      if (response.data.success) {
        // 處理批量查詢結果
        const paymentStatuses = response.data.data;
        
        paymentStatuses.forEach((status: { purchaseOrderId: string; hasPaidAmount: boolean }) => {
          statusMap.set(status.purchaseOrderId, status.hasPaidAmount);
        });
        
        setPaymentStatusMap(statusMap);
      } else {
        throw new Error(response.data.message || '批量檢查付款狀態失敗');
      }
    } catch (error) {
      console.error('❌ 批量檢查付款狀態失敗:', error);
      // 如果批量 API 失敗，回退到逐一檢查（但限制數量避免當機）
      if (purchaseOrders.length <= 50) {
        const statusMap = new Map<string, boolean>();
        const promises = purchaseOrders.map(async (po) => {
          try {
            const hasPaidAmount = await checkPaymentStatus(po._id);
            statusMap.set(po._id, hasPaidAmount);
            return { id: po._id, hasPaidAmount };
          } catch (err) {
            console.error(`檢查進貨單 ${po._id} 付款狀態失敗:`, err);
            statusMap.set(po._id, false);
            return { id: po._id, hasPaidAmount: false };
          }
        });
        
        await Promise.all(promises);
        setPaymentStatusMap(statusMap);
      } else {
        console.warn('⚠️ 進貨單數量過多，跳過付款狀態檢查以避免性能問題');
      }
    } finally {
      setIsCheckingPaymentStatus(false);
    }
  }, [isCheckingPaymentStatus, checkPaymentStatus]);

  // 當進貨單數據載入完成後，檢查付款狀態
  useEffect(() => {
    if (purchaseOrders && purchaseOrders.length > 0 && !loading && !isCheckingPaymentStatus) {
      checkAllPaymentStatuses(purchaseOrders);
    }
  }, [purchaseOrders, loading, checkAllPaymentStatuses, isCheckingPaymentStatus]);

  // 根據路由參數設置初始供應商篩選
  useEffect(() => {
    if (supplierIdFromRoute && suppliers && suppliers.length > 0) {
      const supplier = suppliers.find(s => s._id === supplierIdFromRoute);
      if (supplier) {
        setSelectedSuppliers([supplier.name]);
        // 顯示篩選器，讓用戶知道目前有篩選條件
        setShowFilters(true);
      }
    }
  }, [supplierIdFromRoute, suppliers]);

  // 使用 purchaseOrders 和 selectedSuppliers 進行過濾
  useEffect(() => {
    try {
      // 首先將 purchaseOrders 轉換為 FilteredRow 類型
      const rows = purchaseOrders.map(po => ({
        id: po._id,
        _id: po._id,
        poid: po.poid ?? '',
        pobill: po.pobill ?? '',
        pobilldate: typeof po.pobilldate === 'string' ? po.pobilldate : 
                   new Date().toISOString().split('T')[0],
        posupplier: typeof po.supplier === 'string' ? po.supplier : (po.supplier as any)?.name ?? po.posupplier ?? '',
        totalAmount: po.totalAmount ?? 0,
        status: po.status ?? '',
        paymentStatus: po.paymentStatus ?? '',
        // 會計分錄相關欄位
        relatedTransactionGroupId: po.relatedTransactionGroupId,
        accountingEntryType: po.accountingEntryType,
        selectedAccountIds: po.selectedAccountIds,
        // 付款狀態
        hasPaidAmount: paymentStatusMap.get(po._id) || false
      })) as FilteredRow[];
      
      // 然後根據選擇的供應商進一步過濾
      let filteredBySupplier = rows;
      if (selectedSuppliers.length > 0) {
        filteredBySupplier = rows.filter(row => {
          return selectedSuppliers.includes(row.posupplier || '');
        });
      }
      
      // 更新本地的 filteredRows
      setFilteredRows(filteredBySupplier);
      
    } catch (err) {
      console.error('過濾進貨單時出錯:', err);
    }
  }, [purchaseOrders, selectedSuppliers, paymentStatusMap]);

  // 搜尋處理
  const handleSearch = useCallback(async () => {
    if (!searchParams.searchTerm?.trim()) {
      // 如果搜尋條件為空，重新載入所有記錄
      fetchData();
      return;
    }

    try {
      // 創建搜尋參數對象
      const searchObj = { search: searchParams.searchTerm };
      const action = await dispatch(searchPurchaseOrders(searchObj as any) as any);
      if (action?.payload) {
        setPurchaseOrders(action.payload);
      }
    } catch (err: any) {
      console.error('搜尋進貨單失敗:', err);
      setError('搜尋進貨單失敗');
    }
  }, [dispatch, fetchData, searchParams.searchTerm]);

  // 清除搜尋
  const handleClearSearch = useCallback(() => {
    setSearchParams({
      poid: '',
      pobill: '',
      posupplier: '',
      startDate: null,
      endDate: null,
      searchTerm: ''
    });
    fetchData();
  }, [fetchData]);

  // 處理輸入框變更
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({ ...prev, [name]: value }));
  }, []);

  // 處理日期變更
  const handleDateChange = useCallback((name: string, date: Date | null) => {
    setSearchParams(prev => ({ ...prev, [name]: date }));
  }, []);

  // Snackbar 處理
  const showSnackbar = useCallback((message: string, severity: SnackbarState['severity'] = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // 處理關閉 Snackbar
  const handleCloseSnackbar = useCallback(() => {
    setSnackbar(prev => ({ ...prev, open: false }));
  }, []);

  // 導航處理函數
  const handleAddNew = useCallback(() => navigate('/purchase-orders/new'), [navigate]);
  const handleEdit = useCallback((id: string) => navigate(`/purchase-orders/edit/${id}`), [navigate]);
  const handleView = useCallback((id: string) => navigate(`/purchase-orders/${id}`), [navigate]);
  
  // 供應商篩選處理
  const handleSupplierFilterChange = useCallback((suppliers: string[]) => {
    setSelectedSuppliers(suppliers);
  }, []);

  // 會計分錄查看處理函數
  const handleViewAccountingEntry = useCallback((transactionGroupId: string) => {
    // 導航到會計模組的交易群組詳情頁面
    console.log('🔗 導航到會計分錄:', transactionGroupId);
    navigate(`/accounting3/transaction/${transactionGroupId}`);
  }, [navigate]);

  // 解鎖處理函數
  const handleUnlock = useCallback(async (id: string): Promise<void> => {
    try {
      // 直接使用 axios 調用 API，將狀態改為 pending
      const response = await axios.put(`${API_BASE_URL}/purchase-orders/${id}`, {
        status: 'pending'
      });
      
      if (response.data.success) {
        // 重新載入資料
        dispatch(fetchPurchaseOrders());
        
        showSnackbar('進貨單已解鎖並改為待處理狀態', 'success');
      } else {
        throw new Error(response.data.message || '更新失敗');
      }
    } catch (error: any) {
      console.error('❌ 解鎖進貨單時發生錯誤:', error);
      const errorMessage = error.response?.data?.message || error.message || '解鎖進貨單失敗，請稍後再試';
      showSnackbar(errorMessage, 'error');
    }
  }, [dispatch, showSnackbar]);

  // 預覽處理函數
  const handlePreviewMouseEnter = useCallback(async (event: React.MouseEvent<HTMLElement>, id: string) => {
    setPreviewAnchorEl(event.currentTarget);
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const existingPO = purchaseOrders.find(po => po._id === id);
      if (existingPO?.items) {
        setPreviewPurchaseOrder(existingPO);
      } else {
        const data = await purchaseOrderServiceV2.getPurchaseOrderById(id);
        setPreviewPurchaseOrder(data as unknown as PurchaseOrder);
      }
    } catch (err: any) {
      console.error('獲取進貨單預覽失敗:', err);
      setPreviewError('獲取進貨單預覽失敗');
    } finally {
      setPreviewLoading(false);
    }
  }, [purchaseOrders]);

  // 關閉預覽
  const handlePreviewMouseLeave = useCallback(() => {
    setPreviewOpen(false);
    setPreviewAnchorEl(null);
    setPreviewPurchaseOrder(null);
  }, []);

  // 刪除處理函數
  const handleDeleteClick = useCallback((purchaseOrder: PurchaseOrder) => {
    setPurchaseOrderToDelete(purchaseOrder);
    setDeleteDialogOpen(true);
  }, []);

  // 確認刪除
  const handleDeleteConfirm = useCallback(() => {
    if (purchaseOrderToDelete) {
      dispatch(deletePurchaseOrder(purchaseOrderToDelete._id));
      setDeleteDialogOpen(false);
      setPurchaseOrderToDelete(null);
      showSnackbar('進貨單已成功刪除', 'success');
    }
  }, [dispatch, purchaseOrderToDelete, showSnackbar]);

  // 取消刪除
  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setPurchaseOrderToDelete(null);
  }, []);

  // 計算總金額
  const totalAmount = useMemo(() => {
    return filteredRows.reduce((sum, row) => sum + (row.totalAmount || 0), 0);
  }, [filteredRows]);

  return {
    // 狀態
    purchaseOrders,
    suppliers,
    filteredRows,
    loading,
    error,
    searchParams,
    selectedSuppliers,
    showFilters,
    deleteDialogOpen,
    purchaseOrderToDelete,
    snackbar,
    previewOpen,
    previewAnchorEl,
    previewPurchaseOrder,
    previewLoading,
    previewError,
    paginationModel,
    paymentStatusMap,
    isCheckingPaymentStatus,
    totalAmount,

    // 處理函數
    handleSearch,
    handleClearSearch,
    handleInputChange,
    handleDateChange,
    handleAddNew,
    handleEdit,
    handleView,
    handleSupplierFilterChange,
    handleViewAccountingEntry,
    handleUnlock,
    handlePreviewMouseEnter,
    handlePreviewMouseLeave,
    handleDeleteClick,
    handleDeleteConfirm,
    handleDeleteCancel,
    handleCloseSnackbar,
    setPaginationModel,
    showSnackbar
  };
};