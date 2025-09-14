import { useState, useEffect } from 'react';
import { productServiceV2 } from '@/services/productServiceV2';
import { getAllCustomers } from '@/services/customerServiceV2';
import { Product, Customer } from '@pharmacy-pos/shared/types/entities';

/**
 * Custom Hook to fetch data required for the Sales Page (products and customers).
 * 
 * @returns {Object} - Contains products, customers, loading state, and error state.
 */
const useSalesData = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch products and customers concurrently
        const [productsData, customersData] = await Promise.all([
          productServiceV2.getAllProducts(), // Using V2 service
          getAllCustomers() // Using V2 service
        ]);
        
        // 直接設置資料，假設 API 已經返回正確的陣列
        setProducts(Array.isArray(productsData) ? productsData : []);
        setCustomers(Array.isArray(customersData) ? customersData : []);
        
      } catch (err: any) {
        console.error('Failed to fetch sales data:', err);
        setError('無法載入銷售頁面所需資料，請稍後再試。'); // User-friendly error message
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // Empty dependency array means this runs once on mount

  return { products, customers, loading, error };
};

export default useSalesData;
