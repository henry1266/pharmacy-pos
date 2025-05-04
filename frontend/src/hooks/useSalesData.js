import { useState, useEffect } from 'react';
import { getProducts } from '../services/productService';
import { getCustomers } from '../services/customerService';

/**
 * Custom Hook to fetch data required for the Sales Page (products and customers).
 * 
 * @returns {Object} - Contains products, customers, loading state, and error state.
 */
const useSalesData = () => {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch products and customers concurrently
        const [productsResponse, customersResponse] = await Promise.all([
          getProducts(), // Assuming getProducts fetches all necessary product data
          getCustomers() // Assuming getCustomers fetches all necessary customer data
        ]);
        
        // Assuming the API returns data in a specific structure, adjust as needed
        setProducts(productsResponse.data || productsResponse || []); 
        setCustomers(customersResponse.data || customersResponse || []);
        
      } catch (err) {
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

