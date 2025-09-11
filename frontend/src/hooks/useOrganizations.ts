import { useState, useEffect } from 'react';
import { Organization } from '@pharmacy-pos/shared/types/organization';
import organizationService from '../features/accounting3/services/organizationService';

interface UseOrganizationsReturn {
  organizations: Organization[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * 獲取組織列表的 Hook
 */
export const useOrganizations = (): UseOrganizationsReturn => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await organizationService.getOrganizations({
        limit: 100 // 獲取所有活躍的組織
      });
      setOrganizations(response.data);
    } catch (err) {
      console.error('獲取組織列表失敗:', err);
      setError(err instanceof Error ? err.message : '獲取組織列表失敗');
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  return {
    organizations,
    loading,
    error,
    refetch: fetchOrganizations
  };
};