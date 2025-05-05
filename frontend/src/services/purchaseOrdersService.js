import axios from 'axios';

// Assuming API_BASE_URL is defined elsewhere or use relative paths
// If API_BASE_URL is needed, it should be imported or configured globally
const API_URL = '/api/purchase-orders'; // Adjust if your base URL is different

// Helper function to get auth config
const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'x-auth-token': token
    }
  };
};

/**
 * Fetches a single purchase order by its ID.
 * Used for the preview functionality.
 * @param {string} id - The ID of the purchase order.
 * @returns {Promise<object>} The purchase order data.
 */
export const getPurchaseOrderById = async (id) => {
  try {
    // Note: The original code had .replace('/api/api', '/api'), ensure the base URL is correct
    const response = await axios.get(`${API_URL}/${id}`, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error(`Error fetching purchase order with ID ${id}:`, error);
    // Re-throw the error to be handled by the caller (e.g., the component or hook)
    throw error;
  }
};

/**
 * Imports basic purchase order data from a CSV file.
 * @param {FormData} formData - The form data containing the CSV file and type.
 * @returns {Promise<object>} The response data from the server.
 */
export const importPurchaseOrdersBasic = async (formData) => {
  try {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'x-auth-token': token,
        'Content-Type': 'multipart/form-data'
      }
    };
    // Note: The original code had .replace('/api/api', '/api'), ensure the base URL is correct
    const response = await axios.post(`${API_URL}/import/basic`, formData, config);
    return response.data;
  } catch (error) {
    console.error('Error importing basic purchase orders CSV:', error);
    throw error; // Re-throw for handling in the component
  }
};

/**
 * Imports purchase order items data from a CSV file.
 * @param {FormData} formData - The form data containing the CSV file and type.
 * @returns {Promise<object>} The response data from the server.
 */
export const importPurchaseOrderItems = async (formData) => {
  try {
    const token = localStorage.getItem('token');
    const config = {
      headers: {
        'x-auth-token': token,
        'Content-Type': 'multipart/form-data'
      }
    };
    // Note: The original code had .replace('/api/api', '/api'), ensure the base URL is correct
    const response = await axios.post(`${API_URL}/import/items`, formData, config);
    return response.data;
  } catch (error) {
    console.error('Error importing purchase order items CSV:', error);
    throw error; // Re-throw for handling in the component
  }
};

// Note: Functions like fetchPurchaseOrders, deletePurchaseOrder, searchPurchaseOrders 
// are currently handled via Redux actions in the original code.
// If the goal is to move *all* API calls to services, those actions would need to be refactored
// to call functions defined here, rather than making direct axios calls themselves (if they do).
// For now, this service only includes the API calls made directly from PurchaseOrdersPage.js.




/**
 * Updates an existing purchase order by its ID.
 * @param {string} id - The ID of the purchase order to update.
 * @param {object} data - The data to update the purchase order with.
 * @returns {Promise<object>} The updated purchase order data.
 */
export const updatePurchaseOrder = async (id, data) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, data, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error(`Error updating purchase order with ID ${id}:`, error);
    throw error;
  }
};




/**
 * Adds a new purchase order.
 * @param {object} data - The data for the new purchase order.
 * @returns {Promise<object>} The newly created purchase order data.
 */
export const addPurchaseOrder = async (data) => {
  try {
    const response = await axios.post(API_URL, data, getAuthConfig());
    return response.data;
  } catch (error) {
    console.error('Error adding purchase order:', error);
    throw error;
  }
};

