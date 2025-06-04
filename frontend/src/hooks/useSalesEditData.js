import { useState, useEffect, useCallback } from 'react';
import * as salesService from '../services/salesService';
import * as productService from '../services/productService'; // Corrected: Import from productService
import * as customerService from '../services/customerService'; // Corrected: Import from customerService

export const useSalesEditData = (saleId) => {
  const [initialSaleData, setInitialSaleData] = useState(null);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        salesService.getSaleById(saleId), // Assumes salesService now exports getSaleById
        productService.getProducts(), // Corrected: Use getProducts from productService
        customerService.getCustomers() // Corrected: Use getCustomers from customerService
      ]);

      // Process sale data
      // Ensure saleRes and saleRes.data are valid before accessing properties
      const saleData = saleRes; // salesService.getSaleById now returns data directly
      if (saleData?.items) {
          const formattedItems = saleData.items.map(item => ({
            product: item.product._id || item.product,
            productDetails: item.product,
            name: item.product.name,
            code: item.product.code,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.price * item.quantity,
            productType: item.product.productType
          }));

          setInitialSaleData({
            customer: saleData.customer?._id || saleData.customer,
            items: formattedItems,
            totalAmount: saleData.totalAmount,
            discount: saleData.discount || 0,
            paymentMethod: saleData.paymentMethod || 'cash',
            paymentStatus: saleData.paymentStatus || 'paid',
            note: saleData.note || ''
          });
      } else {
          // Handle case where saleData or saleData.items is not as expected
          console.error('Sale data or items are missing in response:', saleRes);
          setError('Failed to process sale data from response.');
      }
      
      setProducts(productsRes || []); // productService.getProducts returns data directly
      setCustomers(customersRes || []); // customerService.getCustomers returns data directly
      
    } catch (err) {
      console.error('Failed to fetch data for sales edit:', err);
      const errorMessage = err.response?.data?.msg || err.message || 'Failed to load necessary data.';
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
