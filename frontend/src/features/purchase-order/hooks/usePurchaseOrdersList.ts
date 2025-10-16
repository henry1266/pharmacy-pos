import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import purchaseOrderApiClient, { purchaseOrdersContractClient } from '../api/client';
import type { PurchaseOrderDetail } from '../types/list';
import {
  PurchaseOrder,
  FilteredRow,
  SnackbarState,
  SearchParams,
  Supplier,
} from '../types/list';

const PAYMENT_STATUS_CACHE_KEY = 'purchaseOrderPaymentStatuses';
const PAYMENT_STATUS_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

const formatDateValue = (value: unknown): string | undefined => {
  if (!value) {
    return undefined;
  }
  if (typeof value === 'string') {
    return value;
  }
  const date = value instanceof Date ? value : new Date(value as string);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString().split('T')[0];
};

const resolveSupplierName = (order: PurchaseOrder): string => {
  if (typeof order.supplier === 'string' && order.supplier.trim().length > 0) {
    return order.supplier;
  }
  if (order.supplier && typeof order.supplier === 'object' && 'name' in order.supplier) {
    return ((order.supplier as Record<string, unknown>).name as string) ?? order.posupplier ?? '';
  }
  return order.posupplier ?? '';
};

const buildFilteredRow = (
  order: PurchaseOrder,
  paymentStatusCache: Map<string, boolean>,
): FilteredRow => {
  const pobilldate = formatDateValue(order.pobilldate ?? order.orderDate);
  const updatedAt = formatDateValue(order.updatedAt ?? order.pobilldate ?? order.orderDate);

  return {
    id: order._id,
    _id: order._id,
    poid: order.poid ?? order.orderNumber ?? '',
    pobill: order.pobill ?? '',
    pobilldate,
    posupplier: resolveSupplierName(order),
    totalAmount: Number(order.totalAmount ?? 0),
    status: order.status,
    paymentStatus: order.paymentStatus,
    relatedTransactionGroupId: order.relatedTransactionGroupId,
    accountingEntryType: order.accountingEntryType,
    selectedAccountIds: order.selectedAccountIds,
    updatedAt,
    hasPaidAmount: paymentStatusCache.get(order._id) ?? false,
  };
};

const matchesText = (value: string | undefined, term: string): boolean => {
  if (!value) {
    return false;
  }
  return value.toLowerCase().includes(term);
};

const withinDateRange = (
  value: string | undefined,
  start: Date | null,
  end: Date | null,
): boolean => {
  if (!value) {
    return true;
  }
  const candidate = new Date(value);
  if (Number.isNaN(candidate.getTime())) {
    return true;
  }
  if (start && candidate < start) {
    return false;
  }
  if (end && candidate > end) {
    return false;
  }
  return true;
};

const filterRows = (
  rows: FilteredRow[],
  params: SearchParams,
  selectedSuppliers: string[],
): FilteredRow[] => {
  const supplierFiltered = selectedSuppliers.length > 0
    ? rows.filter((row) => selectedSuppliers.includes(row.posupplier ?? ''))
    : rows;

  const detailFiltered = supplierFiltered.filter((row) => {
    if (params.poid && !matchesText(row.poid, params.poid.toLowerCase())) {
      return false;
    }
    if (params.pobill && !matchesText(row.pobill, params.pobill.toLowerCase())) {
      return false;
    }
    if (params.posupplier && !matchesText(row.posupplier, params.posupplier.toLowerCase())) {
      return false;
    }
    if (!withinDateRange(row.pobilldate, params.startDate, params.endDate)) {
      return false;
    }
    return true;
  });

  if (!params.searchTerm?.trim()) {
    return detailFiltered;
  }

  const term = params.searchTerm.toLowerCase().trim();

  return detailFiltered.filter((row) => {
    return (
      matchesText(row.poid, term) ||
      matchesText(row.pobill, term) ||
      matchesText(row.pobilldate, term) ||
      matchesText(row.posupplier, term) ||
      matchesText(row._id, term) ||
      matchesText(row.status, term) ||
      matchesText(row.paymentStatus, term)
    );
  });
};

export const usePurchaseOrdersList = (initialSupplierId: string | null = null) => {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  const supplierIdFromRoute = initialSupplierId ?? params.id ?? null;

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredRows, setFilteredRows] = useState<FilteredRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<SearchParams>({
    poid: '',
    pobill: '',
    posupplier: '',
    startDate: null,
    endDate: null,
    searchTerm: '',
  });
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [purchaseOrderToDelete, setPurchaseOrderToDelete] = useState<PurchaseOrder | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);
  const [previewAnchorEl, setPreviewAnchorEl] = useState<HTMLElement | null>(null);
  const [previewPurchaseOrder, setPreviewPurchaseOrder] = useState<PurchaseOrderDetail | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [paginationModel, setPaginationModel] = useState({ pageSize: 50, page: 0 });
  const [paymentStatusMap, setPaymentStatusMap] = useState<Map<string, boolean>>(new Map());
  const [isCheckingPaymentStatus, setIsCheckingPaymentStatus] = useState<boolean>(false);

  const fetchSuppliers = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : undefined;
      const response = await axios.get('/api/suppliers', {
        headers: token ? { 'x-auth-token': token, Authorization: `Bearer ${token}` } : undefined,
      });

      const payload = response.data;
      if (payload?.success && Array.isArray(payload.data)) {
        setSuppliers(payload.data as Supplier[]);
      } else if (Array.isArray(payload)) {
        setSuppliers(payload as Supplier[]);
      } else {
        setSuppliers([]);
      }
    } catch (err) {
      console.error('Failed to load suppliers', err);
    }
  }, []);

  const fetchPurchaseOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await purchaseOrdersContractClient.listPurchaseOrders({ query: undefined });
      if (response.status === 200 && response.body?.data) {
        setPurchaseOrders(response.body.data);
        setError(null);
      } else {
        const message = response.body?.message ?? 'Failed to load purchase orders';
        setPurchaseOrders([]);
        setError(message);
      }
    } catch (err) {
      console.error('Failed to fetch purchase orders', err);
      const message = err instanceof Error ? err.message : 'Failed to load purchase orders';
      setPurchaseOrders([]);
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPurchaseOrders();
    void fetchSuppliers();
  }, [fetchPurchaseOrders, fetchSuppliers]);

  useEffect(() => {
    setShowFilters(selectedSuppliers.length > 0);
  }, [selectedSuppliers.length]);

  useEffect(() => {
    if (supplierIdFromRoute && suppliers.length > 0) {
      const supplier = suppliers.find((item) => item._id === supplierIdFromRoute);
      if (supplier) {
        setSelectedSuppliers([supplier.name]);
      }
    }
  }, [supplierIdFromRoute, suppliers]);

  useEffect(() => {
    const rows = purchaseOrders.map((order) => buildFilteredRow(order, paymentStatusMap));
    setFilteredRows(filterRows(rows, searchParams, selectedSuppliers));
  }, [purchaseOrders, paymentStatusMap, searchParams, selectedSuppliers]);

  const checkPaymentStatus = useCallback(async (purchaseOrderId: string): Promise<boolean> => {
    try {
      const token = typeof window !== 'undefined' ? window.localStorage.getItem('token') : undefined;
      const response = await axios.get<{ hasPaidAmount?: boolean }>(
        `/api/accounting2/transactions/purchase-order/${purchaseOrderId}/payment-status`,
        {
          headers: token ? { 'x-auth-token': token, Authorization: `Bearer ${token}` } : undefined,
        },
      );
      return Boolean(response.data?.hasPaidAmount);
    } catch (err) {
      console.error('Failed to check purchase order payment status', err);
      return false;
    }
  }, []);

  const checkAllPaymentStatuses = useCallback(async (orders: PurchaseOrder[]) => {
    if (isCheckingPaymentStatus) {
      return;
    }

    setIsCheckingPaymentStatus(true);

    try {
      const start = paginationModel.page * paginationModel.pageSize;
      const end = start + paginationModel.pageSize;
      const currentPageOrders = orders.slice(start, end);

      const cachedRaw = typeof window !== 'undefined'
        ? window.localStorage.getItem(PAYMENT_STATUS_CACHE_KEY)
        : null;
      let cached: Record<string, { status: boolean; timestamp: number }> = {};
      if (cachedRaw) {
        try {
          cached = JSON.parse(cachedRaw) as Record<string, { status: boolean; timestamp: number }>;
        } catch {
          cached = {};
        }
      }

      const now = Date.now();
      const ordersToCheck = currentPageOrders.filter((order) => {
        const entry = cached[order._id];
        if (!entry) {
          return true;
        }
        return now - entry.timestamp > PAYMENT_STATUS_CACHE_TTL;
      });

      if (ordersToCheck.length > 0) {
        const results = await Promise.all(
          ordersToCheck.map(async (order) => {
            const status = await checkPaymentStatus(order._id);
            return { id: order._id, status };
          }),
        );

        results.forEach(({ id, status }) => {
          cached[id] = { status, timestamp: now };
        });

        if (typeof window !== 'undefined') {
          window.localStorage.setItem(PAYMENT_STATUS_CACHE_KEY, JSON.stringify(cached));
        }
      }

      const nextMap = new Map(paymentStatusMap);
      currentPageOrders.forEach((order) => {
        const cachedEntry = cached[order._id];
        if (cachedEntry) {
          nextMap.set(order._id, cachedEntry.status);
        }
      });
      setPaymentStatusMap(nextMap);
    } catch (err) {
      console.error('Failed to batch check payment status', err);
    } finally {
      setIsCheckingPaymentStatus(false);
    }
  }, [checkPaymentStatus, isCheckingPaymentStatus, paginationModel.page, paginationModel.pageSize, paymentStatusMap]);

  useEffect(() => {
    if (purchaseOrders.length > 0) {
      void checkAllPaymentStatuses(purchaseOrders);
    }
  }, [purchaseOrders, paginationModel.page, paginationModel.pageSize, checkAllPaymentStatuses]);

  const showSnackbar = useCallback((message: string, severity: SnackbarState['severity'] = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  }, []);

  const handleSearch = useCallback(() => {
    const hasFilters =
      searchParams.searchTerm?.trim() ||
      searchParams.poid?.trim() ||
      searchParams.pobill?.trim() ||
      searchParams.posupplier?.trim() ||
      searchParams.startDate ||
      searchParams.endDate;

    if (!hasFilters) {
      void fetchPurchaseOrders();
      return;
    }

    if (purchaseOrders.length === 0) {
      void fetchPurchaseOrders();
    }
  }, [fetchPurchaseOrders, purchaseOrders.length, searchParams]);

  const handleClearSearch = useCallback(() => {
    setSearchParams({
      poid: '',
      pobill: '',
      posupplier: '',
      startDate: null,
      endDate: null,
      searchTerm: '',
    });
    void fetchPurchaseOrders();
  }, [fetchPurchaseOrders]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setSearchParams((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleDateChange = useCallback((name: string, date: Date | null) => {
    setSearchParams((prev) => ({ ...prev, [name]: date }));
  }, []);

  const handleAddNew = useCallback(() => navigate('/purchase-orders/new'), [navigate]);

  const handleEdit = useCallback((id: string) => navigate(`/purchase-orders/edit/${id}`), [navigate]);

  const handleView = useCallback((id: string) => navigate(`/purchase-orders/${id}`), [navigate]);

  const handleSupplierFilterChange = useCallback((values: string[]) => {
    setSelectedSuppliers(values);
  }, []);

  const handleViewAccountingEntry = useCallback((transactionGroupId: string) => {
    navigate(`/accounting3/transaction/${transactionGroupId}`);
  }, [navigate]);

  const handleUnlock = useCallback(async (id: string): Promise<void> => {
    try {
      const response = await purchaseOrderApiClient.put(`/${id}`, { status: 'pending' });
      if (response.data?.success) {
        showSnackbar('採購單已解鎖並改為待處理', 'success');
        void fetchPurchaseOrders();
      } else {
        throw new Error(response.data?.message ?? '解鎖失敗');
      }
    } catch (err) {
      console.error('Failed to unlock purchase order', err);
      const message = err instanceof Error ? err.message : '解鎖失敗，請稍後再試';
      showSnackbar(message, 'error');
    }
  }, [fetchPurchaseOrders, showSnackbar]);

  const handlePreviewMouseEnter = useCallback(async (event: React.MouseEvent<HTMLElement>, id: string) => {
    setPreviewAnchorEl(event.currentTarget);
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewError(null);

    try {
      const response = await purchaseOrdersContractClient.getPurchaseOrderById({ params: { id } });
      if (response.status === 200 && response.body?.data) {
        setPreviewPurchaseOrder(response.body.data);
      } else {
        const message = response.body?.message ?? '無法取得採購單詳細內容';
        setPreviewError(message);
      }
    } catch (err) {
      console.error('Failed to load purchase order detail', err);
      const message = err instanceof Error ? err.message : '無法取得採購單詳細內容';
      setPreviewError(message);
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const handlePreviewMouseLeave = useCallback(() => {
    setPreviewOpen(false);
    setPreviewAnchorEl(null);
    setPreviewPurchaseOrder(null);
    setPreviewError(null);
  }, []);

  const handleDeleteClick = useCallback((order: PurchaseOrder) => {
    setPurchaseOrderToDelete(order);
    setDeleteDialogOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!purchaseOrderToDelete) {
      return;
    }

    try {
      const response = await purchaseOrderApiClient.delete(`/${purchaseOrderToDelete._id}`);
      if (response.data?.success === false) {
        const message = response.data?.message ?? '刪除採購單失敗';
        showSnackbar(message, 'error');
        return;
      }

      setPurchaseOrders((prev) => prev.filter((order) => order._id !== purchaseOrderToDelete._id));
      setDeleteDialogOpen(false);
      setPurchaseOrderToDelete(null);
      showSnackbar('採購單已刪除', 'success');
    } catch (err) {
      console.error('Failed to delete purchase order', err);
      const message = err instanceof Error ? err.message : '刪除採購單失敗，請稍後再試';
      showSnackbar(message, 'error');
    }
  }, [purchaseOrderToDelete, showSnackbar]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteDialogOpen(false);
    setPurchaseOrderToDelete(null);
  }, []);

  const totalAmount = useMemo(() => {
    return filteredRows.reduce((sum, row) => sum + (row.totalAmount ?? 0), 0);
  }, [filteredRows]);

  return {
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
    showSnackbar,
  };
};

export default usePurchaseOrdersList;
