import apiService from '../utils/apiService'; // Use the centralized apiService

const API_PATH = '/api/purchase-orders'; // Path relative to base URL in apiService

// Mock data for test mode
const mockPurchaseOrderData = {
  _id: "64b2f8e3cd68fbdbcea9427f", // Default mock ID, can be overridden by specific requests
  orderId: "PO-VMOCK-001",
  purchaseOrderNumber: "PO-VMOCK-001",
  supplier: { _id: "supplier_mock_id_1", name: "虛擬供應商A" },
  status: "處理中", // Possible values: Pending, Approved, Shipped, Received, Cancelled
  items: [
    {
      _id: "item_mock_id_1",
      did: "T10001",
      dname: "虛擬藥品A",
      dquantity: 100,
      unitPrice: 15.50,
      dtotalCost: 1550.00,
    },
    {
      _id: "item_mock_id_2",
      did: "T10002",
      dname: "虛擬藥品B",
      dquantity: 50,
      unitPrice: 30.00,
      dtotalCost: 1500.00,
    },
  ],
  totalAmount: 3050.00,
  orderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
  expectedDeliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
  notes: "這是測試模式下加載的虛擬採購訂單數據。",
  paymentTerm: "Net 30",
  shippingAddress: "虛擬市測試路123號",
  billingAddress: "虛擬市測試路123號",
  createdBy: { _id: "user_mock_id", name: "測試管理員" },
  createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
};

// Helper to check if in test mode
const isTestMode = () => localStorage.getItem('isTestMode') === 'true';

/**
 * Fetches a single purchase order by its ID.
 * @param {string} id - The ID of the purchase order.
 * @returns {Promise<object>} The purchase order data.
 */
export const getPurchaseOrderById = async (id) => {
  if (isTestMode()) {
    console.log(`[Test Mode] Fetching virtual purchase order with ID: ${id}`);
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ ...mockPurchaseOrderData, _id: id, orderId: `PO-VMOCK-${id.slice(-4)}`, purchaseOrderNumber: `PO-VMOCK-${id.slice(-4)}` });
      }, 300);
    });
  }

  try {
    const response = await apiService.get(`${API_PATH}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching purchase order with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Updates an existing purchase order by its ID.
 * @param {string} id - The ID of the purchase order to update.
 * @param {object} data - The data to update the purchase order with.
 * @returns {Promise<object>} The updated purchase order data.
 */
export const updatePurchaseOrder = async (id, data) => {
  if (isTestMode()) {
    console.log(`[Test Mode] Updating virtual purchase order with ID: ${id}`, data);
    return new Promise(resolve => {
      setTimeout(() => {
        const updatedMockData = {
          ...mockPurchaseOrderData, // Base mock data
          ...data,                 // Submitted changes
          _id: id,                 // Ensure ID is correct
          updatedAt: new Date().toISOString(),
        };
        console.log("[Test Mode] Virtual data after update:", updatedMockData);
        resolve(updatedMockData);
      }, 300);
    });
  }

  try {
    const response = await apiService.put(`${API_PATH}/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating purchase order with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Imports basic purchase order data from a CSV file.
 * @param {FormData} formData - The form data containing the CSV file and type.
 * @returns {Promise<object>} The response data from the server.
 */
export const importPurchaseOrdersBasic = async (formData) => {
  if (isTestMode()) {
    console.log("[Test Mode] Simulating import of basic purchase orders CSV:", formData.get('file')?.name || 'N/A');
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ message: "虛擬匯入成功 (基本資料)", importedCount: 10, errors: [] });
      }, 300);
    });
  }
  try {
    const response = await apiService.post(`${API_PATH}/import/basic`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    console.error('Error importing basic purchase orders CSV:', error);
    throw error;
  }
};

/**
 * Imports purchase order items data from a CSV file.
 * @param {FormData} formData - The form data containing the CSV file and type.
 * @returns {Promise<object>} The response data from the server.
 */
export const importPurchaseOrderItems = async (formData) => {
  if (isTestMode()) {
    console.log("[Test Mode] Simulating import of purchase order items CSV:", formData.get('file')?.name || 'N/A');
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ message: "虛擬匯入成功 (項目資料)", importedCount: 50, errors: [] });
      }, 300);
    });
  }
  try {
    const response = await apiService.post(`${API_PATH}/import/items`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (error) {
    console.error('Error importing purchase order items CSV:', error);
    throw error;
  }
};

/**
 * Adds a new purchase order.
 * @param {object} data - The data for the new purchase order.
 * @returns {Promise<object>} The newly created purchase order data.
 */
export const addPurchaseOrder = async (data) => {
  if (isTestMode()) {
    console.log("[Test Mode] Adding virtual purchase order:", data);
    return new Promise(resolve => {
      setTimeout(() => {
        const newMockOrder = {
          ...data,
          _id: `mock_id_${Date.now()}`,
          orderId: `PO-VMOCK-${Date.now().toString().slice(-4)}`,
          purchaseOrderNumber: `PO-VMOCK-${Date.now().toString().slice(-4)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: data.status || "Pending",
        };
        resolve(newMockOrder);
      }, 300);
    });
  }
  try {
    const response = await apiService.post(API_PATH, data);
    return response.data;
  } catch (error) {
    console.error('Error adding purchase order:', error);
    throw error;
  }
};

