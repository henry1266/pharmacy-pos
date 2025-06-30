import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from './redux';
import { fetchPurchaseOrders, fetchSuppliers } from '../redux/actions';
import { RootState, PurchaseOrdersState, SuppliersState } from '../types/store';
import { PurchaseOrder, Supplier } from '@pharmacy-pos/shared/types/entities';

/**
 * 搜尋參數介面
 */
interface SearchParams {
  searchTerm: string;
  [key: string]: string | Date | null;
}

/**
 * 過濾後的進貨單行介面
 */
interface FilteredRow {
  id: string;
  _id: string;
  poid: string;
  pobill: string;
  pobilldate: string | Date;
  posupplier: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
}

/**
 * 進貨單數據 Hook 返回值介面
 */
interface PurchaseOrdersDataResult {
  // 數據
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  filteredRows: FilteredRow[];
  // 加載狀態
  loading: boolean;
  error: string | null;
  // 搜尋和過濾狀態與處理函數
  searchParams: SearchParams;
  selectedSuppliers: string[];
  handleSearch: () => void;
  handleClearSearch: () => void;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleSupplierFilterChange: (suppliers: string[]) => void;
}

/**
 * 自定義 Hook 用於管理進貨單頁面數據和邏輯。
 * 獲取進貨單和供應商，處理過濾、搜尋。
 */
const usePurchaseOrdersData = (): PurchaseOrdersDataResult => {
  const dispatch = useAppDispatch();

  // 從 Redux store 中選擇數據、加載和錯誤狀態
  const { purchaseOrders, loading, error } = useSelector<RootState, PurchaseOrdersState>(
    state => state.purchaseOrders
  );
  
  const { suppliers } = useSelector<RootState, SuppliersState>(
    state => state.suppliers ?? { suppliers: [], loading: false, error: null }
  );

  // 搜尋參數狀態
  const [searchParams, setSearchParams] = useState<SearchParams>({
    searchTerm: ''
  });

  // 供應商過濾狀態
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [filteredRows, setFilteredRows] = useState<FilteredRow[]>([]);

  // 獲取初始數據
  useEffect(() => {
    dispatch(fetchPurchaseOrders());
    dispatch(fetchSuppliers());
  }, [dispatch]);

  // 根據 purchaseOrders、selectedSuppliers 和 searchParams 過濾行
  useEffect(() => {
    if (purchaseOrders.length > 0) {
      // 先根據搜索詞過濾
      let filtered = [...purchaseOrders];
      const searchTerm = searchParams.searchTerm.trim().toLowerCase();
      
      if (searchTerm) {
        console.log('正在搜尋:', searchTerm);
        filtered = filtered.filter(po => {
          // 收集所有可搜尋欄位
          const searchableFields: string[] = [
            typeof po.supplier === 'string' ? po.supplier : po.supplier?.name || '',
            po.poid || '',
            po.pobill || '',
            po._id || '',
            po.status || '',
            po.paymentStatus || '',
            typeof po.pobilldate === 'string' ? po.pobilldate :
              po.pobilldate ? new Date(po.pobilldate).toISOString().split('T')[0] : '',
            typeof po.orderDate === 'string' ? po.orderDate :
              po.orderDate ? new Date(po.orderDate).toISOString().split('T')[0] : ''
          ];
          
          // 只要任一欄位包含關鍵字即通過
          const match = searchableFields.some(field =>
            String(field).toLowerCase().includes(searchTerm)
          );
          
          if (match) {
            console.log('找到匹配:', po.poid || po._id);
          }
          
          return match;
        });
        
        console.log('過濾後數量:', filtered.length);
      }
      
      // 再根據供應商過濾
      if (selectedSuppliers.length > 0) {
        filtered = filtered.filter(po => {
          const supplierName = typeof po.supplier === 'string' ? po.supplier : po.supplier?.name ?? '';
          return selectedSuppliers.includes(supplierName);
        });
      }
      
      const formattedRows = filtered.map(po => ({
        id: po._id,
        _id: po._id,
        poid: po.poid ?? po.orderNumber ?? '',
        pobill: po.pobill ?? '',
        pobilldate: po.pobilldate ?? po.orderDate ?? '',
        posupplier: typeof po.supplier === 'string' ? po.supplier : po.supplier?.name ?? '',
        totalAmount: po.totalAmount ?? 0,
        status: po.status ?? '',
        paymentStatus: po.paymentStatus ?? ''
      }));
      
      setFilteredRows(formattedRows);
    } else {
      setFilteredRows([]);
    }
  }, [purchaseOrders, selectedSuppliers, searchParams.searchTerm]);

  // --- 搜尋和過濾邏輯 ---
  const handleSearch = useCallback(() => {
    // 強制觸發一次重新渲染，確保過濾邏輯執行
    // 這裡使用一個小技巧，通過設置相同的值來觸發狀態更新
    setSearchParams(prev => ({...prev}));
    console.log('執行搜尋，關鍵詞:', searchParams.searchTerm);
    
    // 如果搜索詞為空，則重新獲取所有數據
    if (!searchParams.searchTerm.trim()) {
      console.log('搜索詞為空，重新獲取所有數據');
    }
  }, [searchParams]);

  const handleClearSearch = useCallback(() => {
    setSearchParams({
      searchTerm: ''
    });
    // 不需要重新獲取數據，只需清空搜索詞
  }, []);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('輸入變更:', e.target.name, newValue);
    
    setSearchParams(prev => ({
      ...prev,
      [e.target.name]: newValue
    }));
    
    // 當用戶輸入時自動執行搜尋，無需點擊搜尋按鈕
    // 使用 setTimeout 避免過於頻繁的更新
    setTimeout(() => {
      console.log('自動搜尋觸發，關鍵詞:', newValue);
    }, 100);
  }, []);

  const handleSupplierFilterChange = useCallback((suppliers: string[]) => {
    setSelectedSuppliers(suppliers);
  }, []);

  return {
    // 數據
    purchaseOrders,
    suppliers,
    filteredRows,
    // 加載狀態
    loading,
    error,
    // 搜尋和過濾狀態與處理函數
    searchParams,
    selectedSuppliers,
    handleSearch,
    handleClearSearch,
    handleInputChange,
    handleSupplierFilterChange,
  };
};

export default usePurchaseOrdersData;