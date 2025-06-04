import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPurchaseOrders, fetchSuppliers } from '../redux/actions'; // Assuming actions handle API calls

/**
 * Custom Hook to fetch data required for the Purchase Orders Page (purchase orders and suppliers).
 * It leverages Redux for state management and data fetching logic defined in actions.
 * 
 * @returns {Object} - Contains purchaseOrders, suppliers, loading state, and error state from Redux store.
 */
const usePurchaseOrdersData = () => {
  const dispatch = useDispatch();

  // Select data, loading, and error states from Redux store
  const { purchaseOrders, loading, error } = useSelector(state => state.purchaseOrders);
  const { suppliers } = useSelector(state => state.suppliers || { suppliers: [] }); // Handle initial state if suppliers reducer is separate

  // Fetch data on component mount
  useEffect(() => {
    // Dispatch actions to fetch data. The actions themselves should handle API calls and update the Redux store.
    dispatch(fetchPurchaseOrders());
    dispatch(fetchSuppliers());
  }, [dispatch]); // Dependency array includes dispatch to satisfy ESLint, though dispatch identity is stable

  // Return the data, loading, and error status obtained from Redux
  return { purchaseOrders, suppliers, loading, error };
};

export default usePurchaseOrdersData;

