import { useState, useEffect } from 'react';
import * as salesService from '../services/salesService';
import * as productService from '../services/productService';
import * as customerService from '../services/customerService';

export const useSalesEditData = (saleId) => {
  const [initialSaleData, setInitialSaleData] = useState(null);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all data concurrently
        const [saleRes, productsRes, customersRes] = await Promise.all([
          salesService.getSaleById(saleId),
          productService.getAllProducts(), // Assuming a function to get all products exists
          customerService.getAllCustomers() // Assuming a function to get all customers exists
        ]);

        // Process sale data
        const saleData = saleRes.data;
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
          customer: saleData.customer?._id || saleData.customer || '',
          items: formattedItems,
          totalAmount: saleData.totalAmount,
          discount: saleData.discount || 0,
          paymentMethod: saleData.paymentMethod || 'cash',
          paymentStatus: saleData.paymentStatus || 'paid',
          note: saleData.note || ''
        });
        
        setProducts(productsRes.data || []);
        setCustomers(customersRes.data || []);
        
      } catch (err) {
        console.error('Failed to fetch data for sales edit:', err);
        const errorMessage = err.response?.data?.msg || err.message || 'Failed to load necessary data.';
        setError(errorMessage);
        // Consider setting a specific error message for each failed request if needed
      } finally {
        setLoading(false);
      }
    };

    if (saleId) {
      fetchData();
    }

  }, [saleId]);

  return { initialSaleData, products, customers, loading, error, refetchData: () => fetchData() }; // Added refetchData for potential future use
};
