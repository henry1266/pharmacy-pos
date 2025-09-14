import { useMemo } from 'react';
import { useGetCustomerByIdQuery } from '../api/customerApi';

const useCustomerDetailData = (customerId: string | undefined) => {
  const { data, isLoading, error, refetch } = useGetCustomerByIdQuery(customerId as string, { skip: !customerId });
  const customer = useMemo(() => (data ? data : null), [data]);
  const errorMsg = error ? ((error as any).data?.message || (error as any).message || '載入客戶詳情失敗') : null;

  return {
    customer,
    loading: isLoading,
    error: errorMsg,
    refetchData: refetch
  };
};

export default useCustomerDetailData;

