import { useEffect, useState } from 'react';
import { Product, Customer } from '@pharmacy-pos/shared/types/entities';
import { useGetProductsQuery } from '@/features/product/api/productApi';
import { useGetCustomersQuery } from '@/features/customer/api/customerApi';

/**
 * 使用 RTK Query 聚合銷售頁面需要的商品與顧客資料
 */
const useSalesData = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { data: productsData, isFetching: productsFetching, error: productsError } = useGetProductsQuery({});
  const { data: customersData, isFetching: customersFetching, error: customersError } = useGetCustomersQuery({});

  useEffect(() => {
    setProducts(Array.isArray(productsData) ? (productsData as any) : []);
  }, [productsData]);

  useEffect(() => {
    setCustomers(Array.isArray(customersData) ? (customersData as any) : []);
  }, [customersData]);

  useEffect(() => {
    setLoading(Boolean(productsFetching || customersFetching));
    const err = (productsError as any)?.data?.message || (productsError as any)?.message || (customersError as any)?.data?.message || (customersError as any)?.message || null;
    setError(err);
  }, [productsFetching, customersFetching, productsError, customersError]);

  return { products, customers, loading, error };
};

export default useSalesData;

