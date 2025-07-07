import { useState, useEffect, useCallback } from 'react';
import { Account2 } from '../../../../../shared/types/accounting2';
import { Organization } from '../../../services/organizationService';
import accounting3Service from '../../../services/accounting3Service';
import organizationService from '../../../services/organizationService';
import { doubleEntryService, AccountingEntryDetail } from '../../../services/doubleEntryService';

// 通知狀態介面
interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

// 統計資料介面
interface AccountStatistics {
  totalEntries: number;
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

// Hook 回傳值介面
interface UseAccountManagementReturn {
  // 資料狀態
  accounts: Account2[];
  organizations: Organization[];
  selectedAccount: Account2 | null;
  entries: AccountingEntryDetail[];
  statistics: AccountStatistics;
  accountBalances: Record<string, number>;
  
  // 載入狀態
  loading: boolean;
  balanceLoading: boolean;
  entriesLoading: boolean;
  
  // 錯誤狀態
  error: string | null;
  
  // 通知狀態
  notification: NotificationState;
  
  // 搜尋與篩選狀態
  searchTerm: string;
  selectedAccountType: string;
  selectedOrganizationId: string;
  
  // 樹狀結構狀態
  expandedNodes: Record<string, boolean>;
  
  // 動作函數
  setSelectedAccount: (account: Account2 | null) => void;
  setSearchTerm: (term: string) => void;
  setSelectedAccountType: (type: string) => void;
  setSelectedOrganizationId: (id: string) => void;
  setExpandedNodes: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  
  // 載入函數
  loadAccounts: () => Promise<void>;
  loadOrganizations: () => Promise<void>;
  loadAccountBalances: () => Promise<void>;
  loadDoubleEntries: (accountId: string) => Promise<void>;
  
  // 通知函數
  showNotification: (message: string, severity: NotificationState['severity']) => void;
  closeNotification: () => void;
  
  // 清除函數
  clearFilters: () => void;
}

export const useAccountManagement = (): UseAccountManagementReturn => {
  // 資料狀態
  const [accounts, setAccounts] = useState<Account2[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account2 | null>(null);
  const [entries, setEntries] = useState<AccountingEntryDetail[]>([]);
  const [accountBalances, setAccountBalances] = useState<Record<string, number>>({});
  
  // 載入狀態
  const [loading, setLoading] = useState(false);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [entriesLoading, setEntriesLoading] = useState(false);
  
  // 錯誤狀態
  const [error, setError] = useState<string | null>(null);
  
  // 搜尋與篩選狀態
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccountType, setSelectedAccountType] = useState<string>('');
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>('');
  
  // 樹狀結構展開狀態
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  
  // 統計資料
  const [statistics, setStatistics] = useState<AccountStatistics>({
    totalEntries: 0,
    totalDebit: 0,
    totalCredit: 0,
    balance: 0
  });
  
  // 通知狀態
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info'
  });

  // 載入機構列表
  const loadOrganizations = useCallback(async () => {
    try {
      console.log('🏢 開始載入機構列表...');
      const response = await organizationService.getOrganizations();
      if (response.success && response.data) {
        setOrganizations(response.data);
      }
    } catch (error) {
      console.error('❌ 載入機構列表失敗:', error);
      setError('載入機構列表失敗');
    }
  }, []);

  // 載入科目餘額
  const loadAccountBalances = useCallback(async () => {
    if (accounts.length > 0) {
      try {
        setBalanceLoading(true);
        console.log('💰 開始載入科目餘額...');
        
        const balancePromises = accounts.map(async (account) => {
          try {
            const response = await accounting3Service.accounts.getById(account._id);
            return {
              accountId: account._id,
              balance: response.success ? response.data?.balance || 0 : 0
            };
          } catch (error) {
            console.warn(`獲取科目 ${account._id} 餘額失敗:`, error);
            return { accountId: account._id, balance: 0 };
          }
        });
        
        const balanceResults = await Promise.all(balancePromises);
        const balanceMap: Record<string, number> = {};
        balanceResults.forEach(result => {
          balanceMap[result.accountId] = result.balance;
        });
        
        setAccountBalances(balanceMap);
        console.log('💰 科目餘額載入完成:', balanceMap);
      } catch (error) {
        console.error('❌ 載入科目餘額失敗:', error);
      } finally {
        setBalanceLoading(false);
      }
    }
  }, [accounts]);

  // 載入分錄明細
  const loadDoubleEntries = useCallback(async (accountId: string) => {
    try {
      setEntriesLoading(true);
      console.log('📋 開始載入分錄明細，科目ID:', accountId);
      
      const response = await doubleEntryService.getByAccount(accountId, {
        organizationId: selectedOrganizationId,
        limit: 1000
      });
      
      console.log('📊 API 回應:', response);
      
      if (response.success && response.data) {
        const entriesData = response.data.entries || [];
        const statsData = response.data.statistics || {
          totalDebit: 0,
          totalCredit: 0,
          balance: 0,
          recordCount: 0
        };
        
        setEntries(entriesData);
        setStatistics({
          totalEntries: statsData.recordCount || entriesData.length,
          totalDebit: statsData.totalDebit || 0,
          totalCredit: statsData.totalCredit || 0,
          balance: statsData.balance || 0
        });
        
        console.log('📋 分錄明細載入完成:', {
          entriesCount: entriesData.length,
          statistics: statsData
        });
      } else {
        throw new Error('載入分錄失敗');
      }
    } catch (error) {
      console.error('❌ 載入分錄明細失敗:', error);
      setEntries([]);
      setStatistics({
        totalEntries: 0,
        totalDebit: 0,
        totalCredit: 0,
        balance: 0
      });
    } finally {
      setEntriesLoading(false);
    }
  }, [selectedOrganizationId]);

  // 載入會計科目
  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📊 載入會計科目，機構ID:', selectedOrganizationId);
      
      const response = await accounting3Service.accounts.getAll(selectedOrganizationId);
      
      if (response.success && response.data) {
        setAccounts(response.data);
        console.log('📊 會計科目載入完成:', response.data.length);
      } else {
        throw new Error('載入會計科目失敗');
      }
    } catch (error) {
      console.error('❌ 載入會計科目失敗:', error);
      setError('載入會計科目失敗');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  }, [selectedOrganizationId]);

  // 通知函數
  const showNotification = useCallback((message: string, severity: NotificationState['severity']) => {
    setNotification({
      open: true,
      message,
      severity
    });
  }, []);

  const closeNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  // 清除篩選
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedAccountType('');
    setSelectedOrganizationId('');
  }, []);

  // 初始化載入
  useEffect(() => {
    loadOrganizations();
    loadAccounts();
  }, [loadOrganizations, loadAccounts]);

  // 當科目載入完成後，載入餘額
  useEffect(() => {
    if (accounts.length > 0 && !balanceLoading) {
      loadAccountBalances();
    }
  }, [accounts.length, selectedOrganizationId, loadAccountBalances, balanceLoading]);

  // 機構選擇變更時重新載入資料
  useEffect(() => {
    console.log('🔄 機構選擇變更，selectedOrganizationId:', selectedOrganizationId);
    if (organizations.length > 0) {
      loadAccounts();
    }
  }, [selectedOrganizationId, organizations.length, loadAccounts]);

  // 監聽錯誤狀態
  useEffect(() => {
    if (error) {
      showNotification(error, 'error');
    }
  }, [error, showNotification]);

  return {
    // 資料狀態
    accounts,
    organizations,
    selectedAccount,
    entries,
    statistics,
    accountBalances,
    
    // 載入狀態
    loading,
    balanceLoading,
    entriesLoading,
    
    // 錯誤狀態
    error,
    
    // 通知狀態
    notification,
    
    // 搜尋與篩選狀態
    searchTerm,
    selectedAccountType,
    selectedOrganizationId,
    
    // 樹狀結構狀態
    expandedNodes,
    
    // 動作函數
    setSelectedAccount,
    setSearchTerm,
    setSelectedAccountType,
    setSelectedOrganizationId,
    setExpandedNodes,
    
    // 載入函數
    loadAccounts,
    loadOrganizations,
    loadAccountBalances,
    loadDoubleEntries,
    
    // 通知函數
    showNotification,
    closeNotification,
    
    // 清除函數
    clearFilters
  };
};