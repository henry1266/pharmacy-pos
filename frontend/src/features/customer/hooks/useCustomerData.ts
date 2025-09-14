import { useState, useEffect, useCallback } from 'react';
import {
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation
} from '../api/customerApi';

// 顯示用型別（維持原用法）
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

export type CustomerDisplayOmitFields = 'id' | 'code' | 'level';

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

const mapMembershipLevel = (level: string): string => {
  const levelMap: Record<string, string> = {
    regular: '一般會員',
    gold: '金卡會員',
    platinum: '白金會員'
  };
  return levelMap[level] || '一般會員';
};

const useCustomerData = (): UseCustomerDataReturn => {
  const [customers, setCustomers] = useState<CustomerDisplay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { data, isFetching, error: listError, refetch } = useGetCustomersQuery({});
  const fetchCustomers = useCallback(async (): Promise<void> => { await refetch(); }, [refetch]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);
  useEffect(() => {
    setLoading(isFetching);
    if (listError) {
      const anyErr: any = listError;
      const message = typeof anyErr?.data === 'string' ? anyErr.data : anyErr?.data?.message || '載入會員資料失敗';
      setError(message);
    } else {
      setError(null);
    }
    if (Array.isArray(data)) {
      const formatted: CustomerDisplay[] = data.map((c: any) => ({
        id: c._id || c.id,
        code: c.code ?? '',
        name: c.name,
        phone: c.phone ?? '',
        email: c.email ?? '',
        address: c.address ?? '',
        idCardNumber: c.idCardNumber ?? '',
        birthdate: c.birthdate ? String(c.birthdate) : null,
        notes: c.notes ?? '',
        level: mapMembershipLevel(c.membershipLevel ?? 'regular'),
        membershipLevel: c.membershipLevel ?? 'regular'
      }));
      setCustomers(formatted);
    }
  }, [data, isFetching, listError]);

  const [createCustomer] = useCreateCustomerMutation();
  const [updateCustomerMut] = useUpdateCustomerMutation();
  const [deleteCustomerMut] = useDeleteCustomerMutation();

  const addCustomer = useCallback(async (customerData: Omit<CustomerDisplay, 'id' | 'code' | 'level'>): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const payload = {
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email,
        address: customerData.address,
        notes: customerData.notes,
        idCardNumber: customerData.idCardNumber,
        birthdate: customerData.birthdate,
        membershipLevel: customerData.membershipLevel
      };
      await createCustomer(payload as any).unwrap();
      await fetchCustomers();
    } catch (err: any) {
      const msg = `添加會員失敗: ${err?.data?.message ?? err.message}`;
      setError(msg);
      throw new Error(msg);
    } finally { setLoading(false); }
  }, [createCustomer, fetchCustomers]);

  const updateCustomer = useCallback(async (id: string, customerData: Omit<CustomerDisplay, 'id' | 'code' | 'level'>): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const payload = {
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email,
        address: customerData.address,
        notes: customerData.notes,
        idCardNumber: customerData.idCardNumber,
        birthdate: customerData.birthdate,
        membershipLevel: customerData.membershipLevel
      };
      await updateCustomerMut({ id, data: payload as any }).unwrap();
      await fetchCustomers();
    } catch (err: any) {
      const msg = `更新會員失敗: ${err?.data?.message ?? err.message}`;
      setError(msg);
      throw new Error(msg);
    } finally { setLoading(false); }
  }, [updateCustomerMut, fetchCustomers]);

  const deleteCustomer = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await deleteCustomerMut(id).unwrap();
      await fetchCustomers();
    } catch (err: any) {
      const msg = `刪除會員失敗: ${err?.data?.message ?? err.message}`;
      setError(msg);
      throw new Error(msg);
    } finally { setLoading(false); }
  }, [deleteCustomerMut, fetchCustomers]);

  return {
    customers,
    loading,
    error,
    fetchCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    mapMembershipLevel
  };
};

export default useCustomerData;

