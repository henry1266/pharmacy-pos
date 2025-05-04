import axios from 'axios';

// Base API URL for customers
const API_URL = '/api/customers';

// Helper function to get auth config
const getAuthConfig = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('Authentication token not found.');
    // Optionally redirect to login or throw a specific error
    throw new Error('Authentication required.');
  }
  return {
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token,
    },
  };
};

/**
 * Fetches all customers.
 * @returns {Promise<Array>} A promise that resolves to an array of customer objects.
 */
export const getCustomers = async () => {
  try {
    const token = localStorage.getItem('token'); // Get token directly
    if (!token) throw new Error('Authentication required.');
    const config = { headers: { 'x-auth-token': token } }; // Config for GET
    const response = await axios.get(API_URL, config);
    return response.data;
  } catch (error) {
    console.error('Error fetching customers:', error.response?.data || error.message);
    throw error; // Re-throw for handling in the hook/component
  }
};

/**
 * Adds a new customer.
 * @param {object} customerData - The data for the new customer.
 * @returns {Promise<object>} A promise that resolves to the newly created customer object.
 */
export const addCustomer = async (customerData) => {
  try {
    const config = getAuthConfig(); // Get full config with Content-Type
    // Ensure empty strings are handled if needed by backend, or remove this logic if backend handles null/undefined
    const dataToSend = {
        ...customerData,
        email: customerData.email === '' ? ' ' : customerData.email, // Keep original logic for now
        address: customerData.address === '' ? ' ' : customerData.address, // Keep original logic for now
    };
    const response = await axios.post(API_URL, dataToSend, config);
    return response.data;
  } catch (error) {
    console.error('Error adding customer:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Updates an existing customer.
 * @param {string} id - The ID of the customer to update.
 * @param {object} customerData - The updated data for the customer.
 * @returns {Promise<object>} A promise that resolves to the updated customer object.
 */
export const updateCustomer = async (id, customerData) => {
  try {
    const config = getAuthConfig(); // Get full config with Content-Type
     // Ensure empty strings are handled if needed by backend
    const dataToSend = {
        ...customerData,
        email: customerData.email === '' ? ' ' : customerData.email, // Keep original logic for now
        address: customerData.address === '' ? ' ' : customerData.address, // Keep original logic for now
    };
    const response = await axios.put(`${API_URL}/${id}`, dataToSend, config);
    return response.data;
  } catch (error) {
    console.error('Error updating customer:', error.response?.data || error.message);
    throw error;
  }
};

/**
 * Deletes a customer.
 * @param {string} id - The ID of the customer to delete.
 * @returns {Promise<void>} A promise that resolves when the customer is deleted.
 */
export const deleteCustomer = async (id) => {
  try {
    const token = localStorage.getItem('token'); // Get token directly
    if (!token) throw new Error('Authentication required.');
    // DELETE requests typically don't need Content-Type, just the auth token
    const config = { headers: { 'x-auth-token': token } };
    await axios.delete(`${API_URL}/${id}`, config);
  } catch (error) {
    console.error('Error deleting customer:', error.response?.data || error.message);
    throw error;
  }
};

// Export all functions individually or as an object
const customerService = {
  getCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
};

export default customerService;

