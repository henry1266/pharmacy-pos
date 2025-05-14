import apiService from "../utils/apiService";

const API_PATH = "/api/purchase-orders";

// Mock data for test mode
const mockPurchaseOrderData = {
  _id: "64b2f8e3cd68fbdbcea9427f",
  orderId: "PO-VMOCK-001",
  purchaseOrderNumber: "PO-VMOCK-001",
  supplier: { _id: "supplier_mock_id_1", name: "虛擬供應商 Alpha" },
  status: "Pending",
  items: [
    {
      _id: "item_mock_id_1",
      product: { _id: "product_mock_id_A", name: "虛擬藥品 X", category: "止痛藥" },
      quantity: 100,
      unitPrice: 15.50,
      totalPrice: 1550.00,
    },
    {
      _id: "item_mock_id_2",
      product: { _id: "product_mock_id_B", name: "虛擬藥品 Y", category: "維他命" },
      quantity: 50,
      unitPrice: 30.00,
      totalPrice: 1500.00,
    },
  ],
  totalAmount: 3050.00,
  orderDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  expectedDeliveryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
  notes: "這是測試模式下加載的虛擬採購訂單數據。",
  paymentTerm: "Net 30",
  shippingAddress: "虛擬市測試路123號",
  billingAddress: "虛擬市測試路123號",
  createdBy: { _id: "user_mock_id", name: "測試管理員" },
  createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
};

const isTestMode = () => localStorage.getItem("isTestMode") === "true";

export const getPurchaseOrderById = async (id) => {
  if (isTestMode()) {
    console.log(`[Test Mode] Fetching virtual purchase order with ID: ${id}`);
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ ...mockPurchaseOrderData, _id: id, orderId: `PO-VMOCK-${id.slice(-4)}`, purchaseOrderNumber: `PO-VMOCK-${id.slice(-4)}` });
      }, 300);
    });
  }
  // Production mode: Use apiService
  try {
    const response = await apiService.get(`${API_PATH}/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching purchase order with ID ${id}:`, error);
    throw error;
  }
};

export const updatePurchaseOrder = async (id, data) => {
  if (isTestMode()) {
    console.log(`[Test Mode] Updating virtual purchase order with ID: ${id}`, data);
    return new Promise(resolve => {
      setTimeout(() => {
        const updatedMockData = {
          ...mockPurchaseOrderData,
          ...data,
          _id: id,
          updatedAt: new Date().toISOString(),
        };
        console.log("[Test Mode] Virtual data after update:", updatedMockData);
        resolve(updatedMockData);
      }, 300);
    });
  }
  // Production mode: Use apiService
  try {
    const response = await apiService.put(`${API_PATH}/${id}`, data);
    return response.data;
  } catch (error) {
    console.error(`Error updating purchase order with ID ${id}:`, error);
    throw error;
  }
};

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
  // Production mode: Use apiService
  try {
    const response = await apiService.post(API_PATH, data);
    return response.data;
  } catch (error) {
    console.error("Error adding purchase order:", error);
    throw error;
  }
};

export const importPurchaseOrdersBasic = async (formData) => {
  if (isTestMode()) {
    console.log("[Test Mode] Simulating import of basic purchase orders CSV:", formData.get("file")?.name || "N/A");
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ message: "虛擬匯入成功 (基本資料)", importedCount: 10, errors: [] });
      }, 300);
    });
  }
  // Production mode: Use apiService
  try {
    const response = await apiService.post(`${API_PATH}/import/basic`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("Error importing basic purchase orders CSV:", error);
    throw error;
  }
};

export const importPurchaseOrderItems = async (formData) => {
  if (isTestMode()) {
    console.log("[Test Mode] Simulating import of purchase order items CSV:", formData.get("file")?.name || "N/A");
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({ message: "虛擬匯入成功 (項目資料)", importedCount: 50, errors: [] });
      }, 300);
    });
  }
  // Production mode: Use apiService
  try {
    const response = await apiService.post(`${API_PATH}/import/items`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("Error importing purchase order items CSV:", error);
    throw error;
  }
};

