import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from './redux';
import { fetchShippingOrders, deleteShippingOrder, searchShippingOrders, fetchSuppliers } from '../redux/actions';
import { getShippingOrderById } from '../services/shippingOrdersService';
import { RootState, ShippingOrdersState, SuppliersState } from '../types/store';
import { ShippingOrder, Supplier } from '../types/entities';

/**
 * 擴展的出貨單介面 (包含前端特有屬性)
 */
interface ShippingOrderExtended extends ShippingOrder {
  soid?: string;
  sobill?: string;
  sobilldate?: string | Date;
  sosupplier?: string | { _id: string; name?: string };
  paymentStatus?: string;
}

/**
 * 搜尋參數介面
 */
interface SearchParams {
  soid: string;
  sobill: string;
  sosupplier: string;
  startDate: Date | null;
  endDate: Date | null;
  [key: string]: string | Date | null; // 添加索引簽名以符合 Record<string, string>
}

/**
 * 過濾後的出貨單行介面
 */
interface FilteredRow {
  id: string;
  _id: string;
  soid: string;
  sobill: string;
  sobilldate: string | Date;
  sosupplier: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
}

/**
 * 出貨單數據 Hook 返回值介面
 */
interface ShippingOrdersDataResult {
  // 數據
  shippingOrders: ShippingOrderExtended[]; // 來自 Redux 的原始列表
  suppliers: Supplier[];
  filteredRows: FilteredRow[]; // 處理後的表格行
  // 加載狀態
  listLoading: boolean;
  suppliersLoading: boolean;
  previewLoading: boolean;
  // 錯誤狀態
  listError: string | null;
  suppliersError: string | null;
  previewError: string | null;
  // 搜尋和過濾狀態與處理函數
  searchParams: SearchParams;
  selectedSuppliers: string[];
  handleSearch: () => void;
  handleClearSearch: () => void;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleDateChange: (name: string, date: Date | null) => void;
  handleSupplierFilterChange: (suppliers: string[]) => void;
  // 預覽狀態與處理函數
  previewShippingOrder: ShippingOrderExtended | null;
  fetchPreviewData: (id: string) => Promise<void>;
  clearPreviewData: () => void;
  // 刪除處理函數
  handleDelete: (id: string) => void;
}

/**
 * 自定義 Hook 用於管理出貨單頁面數據和邏輯。
 * 獲取出貨單和供應商，處理過濾、搜尋、預覽和刪除。
 */
const useShippingOrdersData = (): ShippingOrdersDataResult => {
  const dispatch = useAppDispatch();
  const { shippingOrders: rawShippingOrders, loading: listLoading, error: listError } = useSelector<RootState, ShippingOrdersState>(
    state => state.shippingOrders
  );
  // 將 ShippingOrder[] 轉換為 ShippingOrderExtended[]
  const shippingOrders = rawShippingOrders as unknown as ShippingOrderExtended[];
  
  const { suppliers, loading: suppliersLoading, error: suppliersError } = useSelector<RootState, SuppliersState>(
    state => state.suppliers ?? { suppliers: [], loading: false, error: null }
  );

  const [searchParams, setSearchParams] = useState<SearchParams>({
    soid: '',
    sobill: '',
    sosupplier: '',
    startDate: null,
    endDate: null
  });

  // 供應商過濾狀態
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [filteredRows, setFilteredRows] = useState<FilteredRow[]>([]);

  // 預覽狀態
  const [previewShippingOrder, setPreviewShippingOrder] = useState<ShippingOrder | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // 獲取初始數據
  useEffect(() => {
    dispatch(fetchShippingOrders());
    dispatch(fetchSuppliers());
  }, [dispatch]);

  // 根據 shippingOrders 和 selectedSuppliers 過濾行
  useEffect(() => {
    if (shippingOrders.length > 0) {
      let filtered = [...shippingOrders];
      if (selectedSuppliers.length > 0) {
        filtered = filtered.filter(so => {
          // 處理 sosupplier 是字符串的情況
          if (typeof so.sosupplier === 'string') {
            return selectedSuppliers.includes(so.sosupplier);
          }
          // 處理 sosupplier 是對象的情況
          else if (typeof so.sosupplier === 'object' && so.sosupplier?.name) {
            return selectedSuppliers.includes(so.sosupplier.name);
          }
          return false;
        });
      }
      const formattedRows = filtered.map(so => {
        // 提取供應商ID邏輯為獨立語句
        let supplierValue = '';
        if (typeof so.sosupplier === 'string') {
          supplierValue = so.sosupplier;
        } else if (typeof so.sosupplier === 'object' && so.sosupplier) {
          supplierValue = so.sosupplier._id;
        }

        return {
          id: so._id,
          _id: so._id,
          soid: so.soid || '',
          sobill: so.sobill || '',
          sobilldate: so.sobilldate || new Date(),
          sosupplier: supplierValue,
          totalAmount: so.totalAmount || 0,
          status: so.status || '',
          paymentStatus: so.paymentStatus || ''
        };
      });
      setFilteredRows(formattedRows);
    } else {
      setFilteredRows([]);
    }
  }, [shippingOrders, selectedSuppliers]);

  // --- 搜尋和過濾邏輯 ---
  const handleSearch = useCallback(() => {
    // 將 searchParams 轉換為符合 Record<string, string> 類型的對象
    const formattedParams: Record<string, string> = {
      soid: searchParams.soid,
      sobill: searchParams.sobill,
      sosupplier: searchParams.sosupplier,
      startDate: searchParams.startDate ? searchParams.startDate.toISOString() : '',
      endDate: searchParams.endDate ? searchParams.endDate.toISOString() : ''
    };
    dispatch(searchShippingOrders(formattedParams));
  }, [dispatch, searchParams]);

  const handleClearSearch = useCallback(() => {
    setSearchParams({
      soid: '',
      sobill: '',
      sosupplier: '',
      startDate: null,
      endDate: null
    });
    dispatch(fetchShippingOrders());
  }, [dispatch]);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchParams(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }, []);

  const handleDateChange = useCallback((name: string, date: Date | null) => {
    setSearchParams(prev => ({
      ...prev,
      [name]: date
    }));
  }, []);

  const handleSupplierFilterChange = useCallback((suppliers: string[]) => {
    setSelectedSuppliers(suppliers);
  }, []);

  // --- 預覽邏輯 ---
  const fetchPreviewData = useCallback(async (id: string) => {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      // 先檢查現有數據
      const existingSO = shippingOrders.find(so => so._id === id);
      if (existingSO?.items) {
        setPreviewShippingOrder(existingSO);
        setPreviewLoading(false);
        return;
      }
      // 如果未找到或不完整，則使用服務函數從 API 獲取
      const data = await getShippingOrderById(id);
      setPreviewShippingOrder(data);
    } catch (err: any) {
      console.error('獲取出貨單預覽失敗 (hook):', err);
      setPreviewError('獲取出貨單預覽失敗');
    } finally {
      setPreviewLoading(false);
    }
  }, [shippingOrders]); // 依賴 shippingOrders 以便可能使用緩存數據

  const clearPreviewData = useCallback(() => {
    setPreviewShippingOrder(null);
  }, []);

  // --- 刪除邏輯 ---
  const handleDelete = useCallback((id: string) => {
    dispatch(deleteShippingOrder(id));
    // 注意：Snackbar 邏輯保留在組件中用於 UI 反饋
  }, [dispatch]);

  return {
    // 數據
    shippingOrders, // 來自 Redux 的原始列表
    suppliers,
    filteredRows, // 處理後的表格行
    // 加載狀態
    listLoading,
    suppliersLoading,
    previewLoading,
    // 錯誤狀態
    listError,
    suppliersError,
    previewError,
    // 搜尋和過濾狀態與處理函數
    searchParams,
    selectedSuppliers,
    handleSearch,
    handleClearSearch,
    handleInputChange,
    handleDateChange,
    handleSupplierFilterChange,
    // 預覽狀態與處理函數
    previewShippingOrder,
    fetchPreviewData,
    clearPreviewData,
    // 刪除處理函數
    handleDelete,
  };
};

export default useShippingOrdersData;