/**
 * @file 進貨單列表頁面鉤子
 * @description 處理進貨單列表頁面的狀態和邏輯
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { RootState } from '@/redux/reducers';
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

  // 從 Redux store 獲取進貨單數據
  const purchaseOrdersFromStore = useAppSelector((state: RootState) =>
    state.purchaseOrders?.purchaseOrders || []
  );
  const purchaseOrdersLoading = useAppSelector((state: RootState) =>
    state.purchaseOrders?.loading || false
  );
  const purchaseOrdersError = useAppSelector((state: RootState) =>
    state.purchaseOrders?.error || null
  );

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
    // 從 Redux store 獲取進貨單數據
    dispatch(fetchPurchaseOrders());
    
    // 獲取供應商數據
    axios.get(`${API_BASE_URL}/suppliers`)
      .then(response => {
        setSuppliers(response.data);
      })
      .catch(err => {
        console.error('獲取供應商數據失敗:', err);
      });
  }, [dispatch]);
  
  // 當 Redux store 中的進貨單數據更新時，更新本地狀態
  useEffect(() => {
    // 無論 purchaseOrdersFromStore 是否為空，都更新本地狀態
    // 這樣可以確保當 Redux store 中的數據為空時，本地狀態也會更新
    if (purchaseOrdersFromStore.length > 0) {
      // 將 Redux store 中的數據轉換為本地類型
      const convertedPurchaseOrders = purchaseOrdersFromStore.map(po => ({
        ...po,
        poid: po.poid || po.orderNumber || '',
        pobill: po.pobill || '',
        pobilldate: po.pobilldate || po.orderDate || new Date().toISOString(),
        posupplier: typeof po.supplier === 'string' ? po.supplier : (po.supplier as any)?.name || po.posupplier || '',
        totalAmount: po.totalAmount || 0,
        status: po.status || '',
        paymentStatus: po.paymentStatus || ''
      })) as PurchaseOrder[];
      
      setPurchaseOrders(convertedPurchaseOrders);
    } else {
      // 如果 Redux store 中的數據為空，則設置本地狀態為空數組
      setPurchaseOrders([]);
    }
    
    // 無論如何都更新 loading 和 error 狀態
    setLoading(purchaseOrdersLoading);
    setError(purchaseOrdersError);
  }, [purchaseOrdersFromStore, purchaseOrdersLoading, purchaseOrdersError]);

  // 重新載入數據
  const reloadData = useCallback(() => {
    dispatch(fetchPurchaseOrders());
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
    
    try {
      // 1. 只檢查當前頁面顯示的進貨單
      const currentPageOrders = purchaseOrders.slice(
        paginationModel.page * paginationModel.pageSize,
        (paginationModel.page + 1) * paginationModel.pageSize
      );
      
      console.log('🔄 開始批量檢查付款狀態，當前頁面進貨單數量:', currentPageOrders.length);
      
      // 2. 從本地存儲中獲取緩存的付款狀態
      const cachedStatusesStr = localStorage.getItem('purchaseOrderPaymentStatuses');
      let cachedStatuses: Record<string, { status: boolean; timestamp: number }> = {};
      
      if (cachedStatusesStr) {
        try {
          cachedStatuses = JSON.parse(cachedStatusesStr);
        } catch (e) {
          console.error('解析緩存的付款狀態失敗:', e);
        }
      }
      
      // 3. 過濾出需要檢查的進貨單（未緩存或緩存已過期）
      const cacheExpirationTime = 30 * 60 * 1000; // 30分鐘緩存過期時間
      const now = Date.now();
      const ordersToCheck = currentPageOrders.filter(po => {
        const cached = cachedStatuses[po._id];
        return !cached || (now - cached.timestamp > cacheExpirationTime);
      });
      
      if (ordersToCheck.length === 0) {
        console.log('✅ 所有進貨單的付款狀態都在緩存中且未過期，跳過檢查');
        
        // 從緩存中恢復付款狀態
        const statusMap = new Map<string, boolean>();
        Object.entries(cachedStatuses).forEach(([id, data]) => {
          statusMap.set(id, data.status);
        });
        setPaymentStatusMap(statusMap);
        return;
      }
      
      console.log('🔍 需要檢查的進貨單數量:', ordersToCheck.length);
      
      // 4. 提取需要檢查的進貨單 ID
      const purchaseOrderIds = ordersToCheck.map(po => po._id);
      
      // 5. 使用批量 API 檢查付款狀態
      const response = await axios.post(`${API_BASE_URL}/accounting2/transactions/purchase-orders/batch-payment-status`, {
        purchaseOrderIds
      });
      
      if (response.data.success) {
        // 處理批量查詢結果
        const paymentStatuses = response.data.data;
        const statusMap = new Map<string, boolean>();
        
        // 先從緩存中恢復所有付款狀態
        Object.entries(cachedStatuses).forEach(([id, data]) => {
          statusMap.set(id, data.status);
        });
        
        // 然後更新新檢查的付款狀態
        paymentStatuses.forEach((status: { purchaseOrderId: string; hasPaidAmount: boolean }) => {
          statusMap.set(status.purchaseOrderId, status.hasPaidAmount);
          
          // 更新緩存
          cachedStatuses[status.purchaseOrderId] = {
            status: status.hasPaidAmount,
            timestamp: now
          };
        });
        
        // 保存更新後的緩存
        localStorage.setItem('purchaseOrderPaymentStatuses', JSON.stringify(cachedStatuses));
        
        setPaymentStatusMap(statusMap);
      } else {
        throw new Error(response.data.message || '批量檢查付款狀態失敗');
      }
    } catch (error) {
      console.error('❌ 批量檢查付款狀態失敗:', error);
      // 如果批量 API 失敗，使用緩存的數據（如果有）
      const cachedStatusesStr = localStorage.getItem('purchaseOrderPaymentStatuses');
      if (cachedStatusesStr) {
        try {
          const cachedStatuses = JSON.parse(cachedStatusesStr);
          const statusMap = new Map<string, boolean>();
          
          Object.entries(cachedStatuses).forEach(([id, data]: [string, any]) => {
            statusMap.set(id, data.status);
          });
          
          setPaymentStatusMap(statusMap);
          console.log('✅ 使用緩存的付款狀態數據');
        } catch (e) {
          console.error('解析緩存的付款狀態失敗:', e);
        }
      }
    } finally {
      setIsCheckingPaymentStatus(false);
    }
  }, [isCheckingPaymentStatus, paginationModel, API_BASE_URL]);

  // 當進貨單數據載入完成後或分頁變更時，檢查付款狀態
  useEffect(() => {
    // 初始化一個空的清理函數
    let cleanupFunction = () => {};
    
    if (purchaseOrders && purchaseOrders.length > 0 && !loading && !isCheckingPaymentStatus) {
      // 使用 setTimeout 延遲檢查，先讓 UI 渲染完成
      const timer = setTimeout(() => {
        checkAllPaymentStatuses(purchaseOrders);
      }, 500);
      
      // 更新清理函數
      cleanupFunction = () => clearTimeout(timer);
    }
    
    // 確保所有代碼路徑都返回清理函數
    return cleanupFunction;
  }, [purchaseOrders, loading, checkAllPaymentStatuses, isCheckingPaymentStatus, paginationModel]);

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

  // 使用 purchaseOrders、selectedSuppliers 和 searchTerm 進行過濾
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
        hasPaidAmount: paymentStatusMap.get(po._id) || false,
        // 更新時間欄位
        updatedAt: po.updatedAt ?? po.pobilldate ?? new Date().toISOString()
      })) as FilteredRow[];
      
      // 根據選擇的供應商進行過濾
      let filteredBySupplier = rows;
      if (selectedSuppliers.length > 0) {
        filteredBySupplier = rows.filter(row => {
          return selectedSuppliers.includes(row.posupplier || '');
        });
      }
      
      // 根據搜尋條件進行過濾
      let filteredBySearch = filteredBySupplier;
      if (searchParams.searchTerm?.trim()) {
        const searchTerm = searchParams.searchTerm.toLowerCase().trim();
        filteredBySearch = filteredBySupplier.filter(row => {
          // 搜尋多個欄位
          return (
            (row.poid && row.poid.toLowerCase().includes(searchTerm)) ||
            (row.pobill && row.pobill.toLowerCase().includes(searchTerm)) ||
            (row.pobilldate && row.pobilldate.toLowerCase().includes(searchTerm)) ||
            (row.posupplier && row.posupplier.toLowerCase().includes(searchTerm)) ||
            (row._id && row._id.toLowerCase().includes(searchTerm))
          );
        });
      }
      
      // 更新本地的 filteredRows
      setFilteredRows(filteredBySearch);
      
    } catch (err) {
      console.error('過濾進貨單時出錯:', err);
    }
  }, [purchaseOrders, selectedSuppliers, paymentStatusMap, searchParams.searchTerm]);

  // 搜尋處理 - 使用前端過濾
  const handleSearch = useCallback(() => {
    if (!searchParams.searchTerm?.trim()) {
      // 如果搜尋條件為空，重新載入所有記錄
      reloadData();
      return;
    }

    // 使用前端過濾功能
    const searchTerm = searchParams.searchTerm.toLowerCase().trim();
    
    // 如果需要重新獲取數據，則調用 reloadData
    if (purchaseOrders.length === 0) {
      reloadData();
    }
    
    // 過濾邏輯將在 useEffect 中處理，因為 purchaseOrders 更新後會觸發 useEffect
    console.log('搜尋條件:', searchTerm);
  }, [reloadData, searchParams.searchTerm, purchaseOrders.length]);

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
    reloadData();
  }, [reloadData]);

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
        reloadData();
        
        showSnackbar('進貨單已解鎖並改為待處理狀態', 'success');
      } else {
        throw new Error(response.data.message || '更新失敗');
      }
    } catch (error: any) {
      console.error('❌ 解鎖進貨單時發生錯誤:', error);
      const errorMessage = error.response?.data?.message || error.message || '解鎖進貨單失敗，請稍後再試';
      showSnackbar(errorMessage, 'error');
    }
  }, [reloadData, showSnackbar]);

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
      
      // 刪除後重新載入數據
      setTimeout(() => {
        reloadData();
      }, 500);
    }
  }, [dispatch, purchaseOrderToDelete, showSnackbar, reloadData]);

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