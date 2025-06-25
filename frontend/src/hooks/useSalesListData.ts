import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// API 回應型別定義
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// 定義類型
interface SaleItem {
  product?: {
    name: string;
    _id?: string;
    id?: string;
  };
  name?: string;
  quantity: number;
  price: number;
  unitPrice?: number;
  amount?: number;
  subtotal?: number;
}

interface User {
  _id: string;
  name: string;
}

interface Customer {
  _id: string;
  name: string;
}

// 銷售記錄類型
interface Sale {
  _id: string;
  saleNumber?: string;
  date?: string | Date;
  customer?: Customer | { name: string; _id?: string };
  items: SaleItem[];
  totalAmount?: number;
  paymentMethod: 'cash' | 'credit_card' | 'debit_card' | 'mobile_payment' | 'other';
  paymentStatus: 'paid' | 'pending' | 'partial' | 'cancelled';
  status?: 'completed' | 'pending' | 'cancelled';
  user?: User;
  notes?: string;
  createdBy?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// Mock data for test mode
const mockSalesData: Sale[] = [
  {
    _id: 'mockSale001',
    saleNumber: 'TS-2025001',
    date: new Date().toISOString(),
    customer: { _id: 'mockCust001', name: '測試客戶A' },
    items: [
      { product: { _id: 'mockProd001', name: '測試藥品X' }, name: '測試藥品X', quantity: 2, price: 150, unitPrice: 150, subtotal: 300 },
      { product: { _id: 'mockProd002', name: '測試藥品Y' }, name: '測試藥品Y', quantity: 1, price: 250, unitPrice: 250, subtotal: 250 },
    ],
    totalAmount: 550,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    user: { _id: 'mockUser001', name: '測試使用者' },
    notes: '這是一筆測試銷售記錄。'
  },
  {
    _id: 'mockSale002',
    saleNumber: 'TS-2025002',
    date: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString(),
    customer: { _id: 'mockCust002', name: '測試客戶B' },
    items: [
      { product: { _id: 'mockProd003', name: '測試保健品Z' }, name: '測試保健品Z', quantity: 3, price: 300, unitPrice: 300, subtotal: 900 },
    ],
    totalAmount: 900,
    paymentMethod: 'credit_card',
    paymentStatus: 'pending',
    user: { _id: 'mockUser001', name: '測試使用者' },
    notes: '這是另一筆測試銷售記錄，待付款。'
  },
];

/**
 * Custom Hook to manage sales list data with refresh capability
 */
const useSalesListData = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isTestMode, setIsTestMode] = useState<boolean>(false);

  useEffect(() => {
    const testModeActive = localStorage.getItem('isTestMode') === 'true';
    setIsTestMode(testModeActive);
  }, []);

  // 獲取銷售數據
  const fetchSales = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    if (isTestMode) {
      await fetchTestModeSales();
    } else {
      await fetchProductionSales();
    }
  }, [isTestMode]);

  // 測試模式下獲取銷售數據
  const fetchTestModeSales = async (): Promise<void> => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500)); 
      const response = await axios.get<ApiResponse<Sale[]>>('/api/sales');
      const salesData = response.data.data ?? [];
      if (Array.isArray(salesData) && salesData.length > 0) {
          setSales(salesData);
      } else {
          console.log("Test Mode: No actual sales data, using mock data.");
          setSales(mockSalesData);
      }
    } catch (err) {
      console.warn('Test Mode: Failed to fetch actual sales, using mock data.', err);
      setSales(mockSalesData);
    } finally {
      setLoading(false);
    }
  };

  // 生產模式下獲取銷售數據
  const fetchProductionSales = async (): Promise<void> => {
    try {
      const response = await axios.get<ApiResponse<Sale[]>>('/api/sales');
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
    } finally {
      setLoading(false);
    }
  };

  // 初始載入
  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  // 刷新銷售清單
  const refreshSales = useCallback(() => {
    fetchSales();
  }, [fetchSales]);

  return {
    sales,
    loading,
    error,
    isTestMode,
    refreshSales
  };
};

export default useSalesListData;
export type { Sale, SaleItem, User, Customer };