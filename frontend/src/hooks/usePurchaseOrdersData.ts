import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useAppDispatch } from './redux';
import { fetchPurchaseOrders, fetchSuppliers } from '../redux/actions'; // 假設 actions 處理 API 調用
import { RootState, PurchaseOrdersState, SuppliersState } from '../types/store';
import { PurchaseOrder, Supplier } from '../types/entities';

/**
 * 採購訂單數據 Hook 返回值介面
 */
interface PurchaseOrdersDataResult {
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  loading: boolean;
  error: string | null;
}

/**
 * 自定義 Hook 用於獲取採購訂單頁面所需的數據（採購訂單和供應商）。
 * 它利用 Redux 進行狀態管理和在 actions 中定義的數據獲取邏輯。
 * 
 * @returns 包含從 Redux store 中獲取的採購訂單、供應商、加載狀態和錯誤狀態。
 */
const usePurchaseOrdersData = (): PurchaseOrdersDataResult => {
  const dispatch = useAppDispatch();

  // 從 Redux store 中選擇數據、加載和錯誤狀態
  const { purchaseOrders, loading, error } = useSelector<RootState, PurchaseOrdersState>(
    state => state.purchaseOrders
  );
  
  const { suppliers } = useSelector<RootState, SuppliersState>(
    state => state.suppliers ?? { suppliers: [], loading: false, error: null }
  ); // 處理初始狀態，如果 suppliers reducer 是獨立的

  // 在組件掛載時獲取數據
  useEffect(() => {
    // 分發 actions 來獲取數據。actions 本身應該處理 API 調用並更新 Redux store。
    dispatch(fetchPurchaseOrders());
    dispatch(fetchSuppliers());
  }, [dispatch]); // 依賴數組包括 dispatch 以滿足 ESLint，儘管 dispatch 身份是穩定的

  // 返回從 Redux 獲取的數據、加載和錯誤狀態
  return { purchaseOrders, suppliers, loading, error };
};

export default usePurchaseOrdersData;