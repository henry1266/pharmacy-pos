import { useState, useEffect, useCallback } from 'react';
import { getAllCustomers, createCustomer, updateCustomer as updateCustomerService, deleteCustomer as deleteCustomerService } from '../services/customerServiceV2';
import { Customer } from '@pharmacy-pos/shared/types/entities';

// 擴展 Customer 類型以包含前端需要的額外屬性
export interface ExtendedCustomer extends Omit<Customer, '_id' | 'membershipLevel' | 'birthdate'> {
  _id: string;
  code?: string;
  idCardNumber?: string;
  birthdate?: string | null;
  membershipLevel?: string;
}

// 定義客戶資料介面（用於前端顯示）
export interface CustomerDisplay {
  id: string;
  code: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  idCardNumber: string;
  birthdate: string | null;
  notes: string;
  level: string;
  membershipLevel: string;
}

// 定義客戶資料欄位排除類型
export type CustomerDisplayOmitFields = 'id' | 'code' | 'level';

// 定義 Hook 返回值介面
export interface UseCustomerDataReturn {
  customers: CustomerDisplay[];
  loading: boolean;
  error: string | null;
  fetchCustomers: () => Promise<void>;
  addCustomer: (customerData: Omit<CustomerDisplay, CustomerDisplayOmitFields>) => Promise<void>;
  updateCustomer: (id: string, customerData: Omit<CustomerDisplay, CustomerDisplayOmitFields>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  mapMembershipLevel: (level: string) => string;
}

// Helper function to map membership level (can be moved to utils if used elsewhere)
const mapMembershipLevel = (level: string): string => {
  const levelMap: Record<string, string> = {
    'regular': '一般會員',
    'gold': '金卡會員',
    'platinum': '白金會員'
  };
  return levelMap[level] || '一般會員';
};

/**
 * Custom hook for managing customer data.
 * Handles fetching, adding, updating, and deleting customers.
 */
const useCustomerData = (): UseCustomerDataReturn => {
  const [customers, setCustomers] = useState<CustomerDisplay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch customers data
  const fetchCustomers = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllCustomers();
      const formattedCustomers: CustomerDisplay[] = data.map((customer: Customer) => ({
        id: customer._id,
        code: customer.code ?? '',
        name: customer.name,
        phone: customer.phone ?? '',
        email: customer.email ?? '',
        address: customer.address ?? '',
        idCardNumber: customer.idCardNumber ?? '',
        birthdate: customer.birthdate ? String(customer.birthdate) : null,
        notes: customer.notes ?? '',
        level: mapMembershipLevel(customer.membershipLevel ?? 'regular'),
        membershipLevel: customer.membershipLevel ?? 'regular'
      }));
      setCustomers(formattedCustomers);
    } catch (err: any) {
      console.error('獲取會員數據失敗 (hook):', err);
      setError('獲取會員數據失敗');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Add a new customer
  const addCustomer = useCallback(async (customerData: Omit<CustomerDisplay, 'id' | 'code' | 'level'>): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      // 創建完整的客戶資料物件
      const customerDataToSend = {
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email,
        address: customerData.address,
        notes: customerData.notes,
        idCardNumber: customerData.idCardNumber,
        birthdate: customerData.birthdate,
        membershipLevel: customerData.membershipLevel
      };
      
      await createCustomer(customerDataToSend as any);
      await fetchCustomers(); // Refresh the list after adding
    } catch (err: any) {
      console.error('添加會員失敗 (hook):', err);
      const errorMsg = `添加會員失敗: ${err.response?.data?.message ?? err.message}`;
      setError(errorMsg);
      throw new Error(errorMsg); // Re-throw to be caught in the component for alerts
    } finally {
      setLoading(false);
    }
  }, [fetchCustomers]);

  // Update an existing customer
  const updateCustomer = useCallback(async (id: string, customerData: Omit<CustomerDisplay, 'id' | 'code' | 'level'>): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      // 創建完整的客戶資料物件
      const customerDataToSend = {
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email,
        address: customerData.address,
        notes: customerData.notes,
        idCardNumber: customerData.idCardNumber,
        birthdate: customerData.birthdate,
        membershipLevel: customerData.membershipLevel
      };
      
      await updateCustomerService(id, customerDataToSend as any);
      await fetchCustomers(); // Refresh the list after updating
    } catch (err: any) {
      console.error('更新會員失敗 (hook):', err);
      const errorMsg = `更新會員失敗: ${err.response?.data?.message ?? err.message}`;
      setError(errorMsg);
      throw new Error(errorMsg); // Re-throw for alerts
    } finally {
      setLoading(false);
    }
  }, [fetchCustomers]);

  // Delete a customer
  const deleteCustomer = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await deleteCustomerService(id);
      // Optimistic update or refetch
      // setCustomers(prevCustomers => prevCustomers.filter(customer => customer.id !== id));
      await fetchCustomers(); // Refresh the list after deleting
    } catch (err: any) {
      console.error('刪除會員失敗 (hook):', err);
      const errorMsg = `刪除會員失敗: ${err.response?.data?.message ?? err.message}`;
      setError(errorMsg);
      throw new Error(errorMsg); // Re-throw for alerts
    } finally {
      setLoading(false);
    }
  }, [fetchCustomers]);

  return {
    customers,
    loading,
    error,
    fetchCustomers, // Expose refetch if needed
    addCustomer,
    updateCustomer,
    deleteCustomer,
    mapMembershipLevel // Expose mapping function if needed by UI components
  };
};

export default useCustomerData;