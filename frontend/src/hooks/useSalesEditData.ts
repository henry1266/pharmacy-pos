import { useState, useEffect, useCallback } from 'react';
import * as salesService from '../services/salesService';
import * as productService from '../services/productService';
import * as customerService from '../services/customerService';
import { Product, Customer } from '../types/entities';

/**
 * 前端使用的銷售項目介面 (與後端 SaleItem 介面有些差異)
 */
interface SaleItem {
  product: string;                // 產品ID
  productDetails?: Product;       // 前端特有，用於存儲產品詳細資訊
  name: string;                   // 前端特有，產品名稱
  code: string;                   // 前端特有，產品代碼
  price: number;                  // 與後端一致
  quantity: number;               // 與後端一致
  subtotal: number;               // 與後端一致
  productType?: string;           // 前端特有，產品類型
  discount?: number;              // 與後端一致，可選折扣
}

/**
 * 銷售資料介面 (前端使用的格式，與後端 Sale 介面有些差異)
 */
interface SaleData {
  customer: string;
  items: SaleItem[];
  totalAmount: number;
  discount: number; // 前端特有，用於處理整體折扣
  paymentMethod: 'cash' | 'card' | 'transfer' | 'other';
  paymentStatus: 'paid' | 'pending' | 'cancelled'; // 對應後端的 status: 'completed' | 'pending' | 'cancelled'
  note: string; // 對應後端的 notes
}

/**
 * 銷售編輯資料 Hook
 */
export const useSalesEditData = (saleId: string) => {
  const [initialSaleData, setInitialSaleData] = useState<SaleData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Define fetchData using useCallback to be stable and accessible for refetch
  const fetchData = useCallback(async () => {
    if (!saleId) {
      setLoading(false);
      setError("Sale ID is not provided.");
      return;
    }
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all data concurrently
      const [saleRes, productsRes, customersRes] = await Promise.all([
        salesService.getSaleById(saleId),
        productService.getProducts(),
        customerService.getCustomers()
      ]);

      // Process sale data
      // Ensure saleRes and saleRes.data are valid before accessing properties
      const saleData = saleRes; // salesService.getSaleById now returns data directly
      if (saleData?.items) {
          const formattedItems: SaleItem[] = saleData.items.map(item => ({
            product: typeof item.product === 'object' ? item.product._id : item.product,
            productDetails: typeof item.product === 'object' ? item.product : undefined,
            name: typeof item.product === 'object' ? item.product.name : 'Unknown',
            code: typeof item.product === 'object' ? item.product.code : 'Unknown',
            price: item.price,
            quantity: item.quantity,
            subtotal: item.price * item.quantity,
            productType: typeof item.product === 'object' ? (item.product as any).productType : undefined
          }));

          // 確定付款狀態
          let paymentStatus: 'paid' | 'pending' | 'cancelled' = 'pending';
          if (saleData.status === 'completed') {
            paymentStatus = 'paid';
          } else if (saleData.status === 'cancelled') {
            paymentStatus = 'cancelled';
          }

          setInitialSaleData({
            customer: typeof saleData.customer === 'object' ? saleData.customer._id : (saleData.customer || ''),
            items: formattedItems,
            totalAmount: saleData.totalAmount,
            discount: 0, // 在 Sale 介面中沒有 discount 屬性，設為 0
            paymentMethod: saleData.paymentMethod || 'cash',
            paymentStatus: paymentStatus,
            note: saleData.notes || ''
          });
      } else {
          // Handle case where saleData or saleData.items is not as expected
          console.error('Sale data or items are missing in response:', saleRes);
          setError('Failed to process sale data from response.');
      }
      
      setProducts(productsRes || []); // productService.getProducts returns data directly
      setCustomers(customersRes || []); // customerService.getCustomers returns data directly
      
    } catch (err: any) {
      console.error('Failed to fetch data for sales edit:', err);
      const errorMessage = err.response?.data?.msg ?? err.message ?? 'Failed to load necessary data.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [saleId]); // Dependency array for useCallback

  useEffect(() => {
    fetchData();
  }, [fetchData]); // useEffect depends on the stable fetchData function

  return { initialSaleData, products, customers, loading, error, refetchData: fetchData };
};