import { useState, useEffect, useCallback } from 'react';
import { getSaleById } from '@/services/salesServiceV2';
import { productServiceV2 } from '@/services/productServiceV2';
import { getAllCustomers } from '@/services/customerServiceV2';
import { Product, Customer } from '@pharmacy-pos/shared/types/entities';
import { SaleData } from '../types/edit';
import { formatSaleData } from '../utils/editUtils';

/**
 * 銷售編輯數據 Hook
 * 用於獲取銷售編輯所需的數據，包括銷售記錄、產品列表和客戶列表
 * 
 * @param saleId 銷售記錄ID
 * @returns 銷售編輯所需的數據和狀態
 */
export const useSalesEditData = (saleId: string) => {
  const [initialSaleData, setInitialSaleData] = useState<SaleData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 定義 fetchData 使用 useCallback 以確保穩定性並可用於重新獲取
  const fetchData = useCallback(async () => {
    if (!saleId) {
      setLoading(false);
      setError("Sale ID is not provided.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      
      // 並行獲取所有數據
      const [saleRes, productsRes, customersRes] = await Promise.all([
        getSaleById(saleId),
        productServiceV2.getAllProducts(),
        getAllCustomers()
      ]);

      // 處理銷售數據
      // 確保 saleRes 和 saleRes.data 在訪問屬性前是有效的
      const saleData = saleRes; // salesService.getSaleById 現在直接返回數據
      if (saleData?.items) {
        // 使用工具函數格式化銷售數據
        const formattedSaleData = formatSaleData(saleData);
        setInitialSaleData(formattedSaleData);
      } else {
        // 處理 saleData 或 saleData.items 不符合預期的情況
        console.error('Sale data or items are missing in response:', saleRes);
        setError('Failed to process sale data from response.');
      }
      
      setProducts(productsRes ?? []); // productService.getProducts 直接返回數據
      setCustomers(customersRes ?? []); // customerService.getCustomers 直接返回數據
      
    } catch (err: any) {
      console.error('Failed to fetch data for sales edit:', err);
      const errorMessage = err.response?.data?.msg ?? err.message ?? 'Failed to load necessary data.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [saleId]); // useCallback 的依賴數組

  useEffect(() => {
    fetchData();
  }, [fetchData]); // useEffect 依賴於穩定的 fetchData 函數

  return { initialSaleData, products, customers, loading, error, refetchData: fetchData };
};
