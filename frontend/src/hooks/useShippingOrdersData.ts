import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from './redux';
import { fetchShippingOrders, deleteShippingOrder, searchShippingOrders, fetchSuppliers } from '../redux/actions';
import { shippingOrderServiceV2 } from '../services/shippingOrderServiceV2';
import { RootState, ShippingOrdersState, SuppliersState } from '../types/store';
import { ShippingOrder, Supplier } from '@pharmacy-pos/shared/types/entities';

/**
 * 擴展的出貨單介面 (包含前端特有屬性)
 */
interface ShippingOrderExtended extends Omit<ShippingOrder, 'sosupplier' | 'paymentStatus'> {
  soid?: string;
  sobill?: string;
  sobilldate?: string | Date;
  sosupplier?: string | { _id: string; name?: string };
  paymentStatus?: string;  // 允許更寬泛的 string 型別
}

/**
 * 搜尋參數介面
 */
interface SearchParams {
  searchTerm: string;
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
  totalCost?: number;
  totalProfit?: number;
  status: string;
  paymentStatus: string;
  updatedAt?: string | Date;
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
    searchTerm: ''
  });

  // 供應商過濾狀態
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [filteredRows, setFilteredRows] = useState<FilteredRow[]>([]);

  // 預覽狀態
  const [previewShippingOrder, setPreviewShippingOrder] = useState<ShippingOrderExtended | null>(null);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // 獲取初始數據
  useEffect(() => {
    dispatch(fetchShippingOrders());
    dispatch(fetchSuppliers());
  }, [dispatch]);

  // 根據 shippingOrders、selectedSuppliers 和 searchParams 過濾行
  useEffect(() => {
    if (shippingOrders.length > 0) {
      // 先根據搜索詞過濾
      let filtered = [...shippingOrders];
      const searchTermRaw = searchParams.searchTerm.trim();
      
      if (searchTermRaw) {
        // 將搜尋詞分割為多個關鍵字（以空格分隔）
        const searchTerms = searchTermRaw.split(' ').filter(term => term.length > 0);
        
        filtered = filtered.filter(so => {
          // 收集所有可搜尋欄位
          const searchableFields: string[] = [
            typeof so.sosupplier === 'string' ? so.sosupplier : so.sosupplier?.name || '',
            so.soid || '',
            so.sobill || '',
            so._id || '',
            so.status || '',
            so.paymentStatus || ''
          ];
          
          // 檢查是否符合任一搜尋詞（OR 關係）
          return searchTerms.some(term => {
            // 轉換為小寫以進行不區分大小寫的比較
            const termLower = term.toLowerCase();
            
            // 檢查是否為萬用搜尋模式
            if (term.includes('*')) {
              // 將 * 轉換為正則表達式的 .*
              const regexPattern = termLower.replace(/\*/g, '.*');
              const regex = new RegExp(regexPattern);
              
              // 檢查任一欄位是否符合正則表達式
              return searchableFields.some(field =>
                regex.test(String(field).toLowerCase())
              );
            }
            // 檢查是否為尾部匹配（如果搜尋詞只有一個字符）
            else if (term.length === 1) {
              return searchableFields.some(field =>
                String(field).toLowerCase().endsWith(termLower)
              );
            }
            // 一般包含搜尋
            else {
              return searchableFields.some(field =>
                String(field).toLowerCase().includes(termLower)
              );
            }
          });
        });
      }
      
      // 再根據供應商過濾
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
      
      // 使用 Promise.all 來並行獲取所有出貨單的詳細信息
      const getDetailedShippingOrders = async () => {
        try {
          const detailedOrders = await Promise.all(
            filtered.map(async (so) => {
              // 如果已經有 items 且不為空，則直接使用
              if (so.items && Array.isArray(so.items) && so.items.length > 0) {
                return so;
              }
              
              // 否則從 API 獲取詳細信息
              try {
                const detailedOrder = await shippingOrderServiceV2.getShippingOrderById(so._id);
                return { ...so, items: detailedOrder.items };
              } catch (error) {
                console.error(`獲取出貨單 ${so._id} 詳細信息失敗:`, error);
                return so;
              }
            })
          );
          
          const formattedRows = detailedOrders.map(so => {
            // 提取供應商ID邏輯為獨立語句
            let supplierValue = '';
            if (typeof so.sosupplier === 'string') {
              supplierValue = so.sosupplier;
            } else if (typeof so.sosupplier === 'object' && so.sosupplier) {
              supplierValue = so.sosupplier._id;
            }
    
            // 計算總成本和總毛利
            let totalCost = 0;
            if (so.items && Array.isArray(so.items)) {
              totalCost = so.items.reduce((sum, item) => {
                return sum + (item.dtotalCost || 0);
              }, 0);
            }
            
            const totalAmount = so.totalAmount ?? 0;
            const totalProfit = totalAmount - totalCost;
    
            return {
              id: so._id,
              _id: so._id,
              soid: so.soid ?? '',
              sobill: so.sobill ?? '',
              sobilldate: so.sobilldate ?? new Date(),
              sosupplier: supplierValue,
              totalAmount: totalAmount,
              totalCost: totalCost,
              totalProfit: totalProfit,
              status: so.status ?? '',
              paymentStatus: so.paymentStatus ?? '',
              updatedAt: so.updatedAt ?? new Date()
            };
          });
          
          setFilteredRows(formattedRows);
        } catch (error) {
          console.error('獲取詳細出貨單失敗:', error);
          // 如果獲取詳細信息失敗，則使用原始數據
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
              soid: so.soid ?? '',
              sobill: so.sobill ?? '',
              sobilldate: so.sobilldate ?? new Date(),
              sosupplier: supplierValue,
              totalAmount: so.totalAmount ?? 0,
              totalCost: 0,
              totalProfit: 0,
              status: so.status ?? '',
              paymentStatus: so.paymentStatus ?? '',
              updatedAt: so.updatedAt ?? new Date()
            };
          });
          
          setFilteredRows(formattedRows);
        }
      };
      
      // 調用函數獲取詳細信息
      getDetailedShippingOrders();
      // 注意：setFilteredRows 已經在 getDetailedShippingOrders 函數中調用
    } else {
      setFilteredRows([]);
    }
  }, [shippingOrders, selectedSuppliers, searchParams.searchTerm]);

  // --- 搜尋和過濾邏輯 ---
  const handleSearch = useCallback(() => {
    // 不再調用 API，只更新 searchParams 即可
    // 過濾邏輯已經在 useEffect 中實現
    console.log('搜尋詞:', searchParams.searchTerm);
  }, [searchParams]);

  const handleClearSearch = useCallback(() => {
    setSearchParams({
      searchTerm: ''
    });
    // 不需要重新獲取數據，只需清空搜索詞
  }, []);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchParams(prev => ({
      ...prev,
      [e.target.name]: e.target.value
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
      const data = await shippingOrderServiceV2.getShippingOrderById(id);
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