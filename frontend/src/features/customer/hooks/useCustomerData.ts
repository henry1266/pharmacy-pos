import { useState, useEffect, useCallback } from 'react';
import {
  useGetCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} from '../api/customerApi';
import type {
  CustomerCreateRequest,
  CustomerUpdateRequest,
  CustomerResponseDto,
} from '../api/dto';

type MembershipLevel = NonNullable<CustomerCreateRequest['membershipLevel']>;

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
  line: string;
  level: string;
  membershipLevel: MembershipLevel;
}

export type CustomerDisplayOmitFields = 'id' | 'code' | 'level';

type CustomerFormInput = Omit<CustomerDisplay, CustomerDisplayOmitFields | 'membershipLevel'> & { membershipLevel: string };

export interface UseCustomerDataReturn {
  customers: CustomerDisplay[];
  loading: boolean;
  error: string | null;
  fetchCustomers: () => Promise<void>;
  addCustomer: (customerData: CustomerFormInput) => Promise<void>;
  updateCustomer: (id: string, customerData: CustomerFormInput) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  mapMembershipLevel: (level: string) => string;
}

const MEMBERSHIP_LABELS: Record<MembershipLevel, string> = {
  regular: '一般會員',
  silver: '銀卡會員',
  gold: '金卡會員',
  platinum: '白金會員',
};

const isMembershipLevel = (value: string): value is MembershipLevel => Object.prototype.hasOwnProperty.call(MEMBERSHIP_LABELS, value);

const mapMembershipLevel = (level: string): string => {
  const normalized = (level || 'regular').toLowerCase();
  if (isMembershipLevel(normalized)) {
    return MEMBERSHIP_LABELS[normalized];
  }
  return MEMBERSHIP_LABELS.regular;
};

const normalizeOptionalString = (value: string | null | undefined): string | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const toCustomerRequest = (customerData: CustomerFormInput): CustomerCreateRequest => {
  const membershipLevelCandidate = customerData.membershipLevel.trim().toLowerCase();
  const membershipLevel = isMembershipLevel(membershipLevelCandidate)
    ? membershipLevelCandidate
    : 'regular';
  const payload: CustomerCreateRequest = {
    name: customerData.name.trim(),
    phone: customerData.phone.trim(),
    email: normalizeOptionalString(customerData.email),
    address: normalizeOptionalString(customerData.address),
    idCardNumber: normalizeOptionalString(customerData.idCardNumber),
    birthdate: normalizeOptionalString(customerData.birthdate),
    notes: normalizeOptionalString(customerData.notes),
    line: normalizeOptionalString(customerData.line),
    membershipLevel,
  };
  return payload;
};

const toCustomerDisplay = (customer: CustomerResponseDto): CustomerDisplay => {
  const membershipLevelRaw = customer.membershipLevel ?? 'regular';
  const membershipLevelCandidate = membershipLevelRaw.toLowerCase();
  const membershipLevel = isMembershipLevel(membershipLevelCandidate) ? membershipLevelCandidate : 'regular';
  const fallbackId = (customer as CustomerResponseDto & { id?: unknown }).id;
  const id = typeof fallbackId === 'string' ? fallbackId : customer._id;
  return {
    id,
    code: customer.code ?? '',
    name: customer.name,
    phone: customer.phone ?? '',
    email: customer.email ?? '',
    address: customer.address ?? '',
    idCardNumber: customer.idCardNumber ?? '',
    birthdate: customer.birthdate ? String(customer.birthdate) : null,
    notes: customer.notes ?? '',
    line: customer.line ?? '',
    level: mapMembershipLevel(membershipLevel),
    membershipLevel,
  };
};

const extractErrorMessage = (error: unknown): string | null => {
  if (!error) {
    return null;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object') {
    const errorObject = error as { message?: unknown; data?: unknown };
    if (typeof errorObject.message === 'string' && errorObject.message.length > 0) {
      return errorObject.message;
    }
    if (typeof errorObject.data === 'string' && errorObject.data.length > 0) {
      return errorObject.data;
    }
    if (typeof errorObject.data === 'object' && errorObject.data !== null) {
      const dataRecord = errorObject.data as Record<string, unknown>;
      const messageValue = dataRecord['message'];
      if (typeof messageValue === 'string' && messageValue.length > 0) {
        return messageValue;
      }
      const errorValue = dataRecord['error'];
      if (typeof errorValue === 'string' && errorValue.length > 0) {
        return errorValue;
      }
    }
  }
  return null;
};

const buildActionErrorMessage = (error: unknown, action: string): string => {
  const detail = extractErrorMessage(error);
  return detail ? `${action}: ${detail}` : action;
};

const useCustomerData = (): UseCustomerDataReturn => {
  const [customers, setCustomers] = useState<CustomerDisplay[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const { data: customersResponse, isFetching, error: queryError, refetch } = useGetCustomersQuery(undefined);
  const fetchCustomers = useCallback(async (): Promise<void> => {
    await refetch();
  }, [refetch]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    setLoading(isFetching);
    if (queryError) {
      setError(buildActionErrorMessage(queryError, 'Load customers failed'));
    } else {
      setError(null);
    }
    if (customersResponse) {
      setCustomers(customersResponse.map(toCustomerDisplay));
    }
  }, [customersResponse, isFetching, queryError]);

  const [createCustomer] = useCreateCustomerMutation();
  const [updateCustomerMut] = useUpdateCustomerMutation();
  const [deleteCustomerMut] = useDeleteCustomerMutation();

  const addCustomer = useCallback(async (customerData: CustomerFormInput): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const payload = toCustomerRequest(customerData);
      await createCustomer(payload).unwrap();
      await fetchCustomers();
    } catch (caughtError) {
      const message = buildActionErrorMessage(caughtError, 'Create customer failed');
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [createCustomer, fetchCustomers]);

  const updateCustomer = useCallback(async (id: string, customerData: CustomerFormInput): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const payload = toCustomerRequest(customerData);
      const updatePayload: CustomerUpdateRequest = { ...payload };
      await updateCustomerMut({ id, data: updatePayload }).unwrap();
      await fetchCustomers();
    } catch (caughtError) {
      const message = buildActionErrorMessage(caughtError, 'Update customer failed');
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [updateCustomerMut, fetchCustomers]);

  const deleteCustomer = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      await deleteCustomerMut(id).unwrap();
      await fetchCustomers();
    } catch (caughtError) {
      const message = buildActionErrorMessage(caughtError, 'Delete customer failed');
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, [deleteCustomerMut, fetchCustomers]);

  return {
    customers,
    loading,
    error,
    fetchCustomers,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    mapMembershipLevel,
  };
};

export default useCustomerData;