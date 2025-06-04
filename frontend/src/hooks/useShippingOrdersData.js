import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// Remove direct axios import if no longer needed
// import axios from 'axios'; 
import { fetchShippingOrders, deleteShippingOrder, searchShippingOrders, fetchSuppliers } from '../redux/actions';
// Import the service function
import { getShippingOrderById } from '../services/shippingOrdersService';

/**
 * Custom Hook for managing Shipping Orders page data and logic.
 * Fetches shipping orders and suppliers, handles filtering, search, preview, and deletion.
 */
const useShippingOrdersData = () => {
  const dispatch = useDispatch();
  const { shippingOrders, loading: listLoading, error: listError } = useSelector(state => state.shippingOrders);
  const { suppliers, loading: suppliersLoading, error: suppliersError } = useSelector(state => state.suppliers || { suppliers: [], loading: false, error: null });

  const [searchParams, setSearchParams] = useState({
    soid: '',
    sobill: '',
    sosupplier: '',
    startDate: null,
    endDate: null
  });

  // Supplier filter state
  const [selectedSuppliers, setSelectedSuppliers] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);

  // Preview state
  const [previewShippingOrder, setPreviewShippingOrder] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchShippingOrders());
    dispatch(fetchSuppliers());
  }, [dispatch]);

  // Filter rows based on shippingOrders and selectedSuppliers
  useEffect(() => {
    if (shippingOrders.length > 0) {
      let filtered = [...shippingOrders];
      if (selectedSuppliers.length > 0) {
        filtered = filtered.filter(so => selectedSuppliers.includes(so.sosupplier));
      }
      const formattedRows = filtered.map(so => ({
        id: so._id,
        _id: so._id,
        soid: so.soid,
        sobill: so.sobill,
        sobilldate: so.sobilldate,
        sosupplier: so.sosupplier,
        totalAmount: so.totalAmount,
        status: so.status,
        paymentStatus: so.paymentStatus
      }));
      setFilteredRows(formattedRows);
    } else {
      setFilteredRows([]);
    }
  }, [shippingOrders, selectedSuppliers]);

  // --- Search and Filter Logic ---
  const handleSearch = useCallback(() => {
    dispatch(searchShippingOrders(searchParams));
  }, [dispatch, searchParams]);

  const handleClearSearch = useCallback(() => {
    setSearchParams({
      soid: '',
      sobill: '',
      sosupplier: '',
      startDate: null,
      endDate: null
    });
    dispatch(fetchShippingOrders());
  }, [dispatch]);

  const handleInputChange = useCallback((e) => {
    setSearchParams(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }, []);

  const handleDateChange = useCallback((name, date) => {
    setSearchParams(prev => ({
      ...prev,
      [name]: date
    }));
  }, []);

  const handleSupplierFilterChange = useCallback((suppliers) => {
    setSelectedSuppliers(suppliers);
  }, []);

  // --- Preview Logic ---
  const fetchPreviewData = useCallback(async (id) => {
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      // Check existing data first
      const existingSO = shippingOrders.find(so => so._id === id);
      if (existingSO?.items) {
        setPreviewShippingOrder(existingSO);
        setPreviewLoading(false);
        return;
      }
      // Fetch from API using the service function if not found or incomplete
      const data = await getShippingOrderById(id);
      setPreviewShippingOrder(data);
    } catch (err) {
      console.error('獲取出貨單預覽失敗 (hook):', err);
      setPreviewError('獲取出貨單預覽失敗');
    } finally {
      setPreviewLoading(false);
    }
  }, [shippingOrders]); // Depend on shippingOrders to potentially use cached data

  const clearPreviewData = useCallback(() => {
    setPreviewShippingOrder(null);
  }, []);

  // --- Deletion Logic ---
  const handleDelete = useCallback((id) => {
    dispatch(deleteShippingOrder(id));
    // Note: Snackbar logic remains in the component for UI feedback
  }, [dispatch]);

  return {
    // Data
    shippingOrders, // Raw list from Redux
    suppliers,
    filteredRows, // Processed rows for the table
    // Loading States
    listLoading,
    suppliersLoading,
    previewLoading,
    // Error States
    listError,
    suppliersError,
    previewError,
    // Search & Filter State & Handlers
    searchParams,
    selectedSuppliers,
    handleSearch,
    handleClearSearch,
    handleInputChange,
    handleDateChange,
    handleSupplierFilterChange,
    // Preview State & Handlers
    previewShippingOrder,
    fetchPreviewData,
    clearPreviewData,
    // Deletion Handler
    handleDelete,
  };
};

export default useShippingOrdersData;

