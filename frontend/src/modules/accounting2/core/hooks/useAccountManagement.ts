import { useState, useEffect, useCallback } from 'react';
import { Account2, AccountingRecord2 } from '@pharmacy-pos/shared/types/accounting2';
import { Organization } from '@pharmacy-pos/shared/types/organization';
import organizationService from '@services/organizationService';
import { AccountingEntryDetail } from '@services/doubleEntryService';
import { transactionGroupWithEntriesService } from '@services/transactionGroupWithEntriesService';
import { useAccountStore } from '../stores/useAccountStore';
import { AccountApiClient } from '../api-clients/AccountApiClient';
//import { AccountService } from '../services/AccountService';

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
  // 初始化 API 客戶端和 Store
  const accountApiClient = new AccountApiClient();
  const accountStore = useAccountStore();

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

  // 載入科目餘額 - 基於 transactionGroups 計算
  const loadAccountBalances = useCallback(async () => {
    if (accounts.length > 0) {
      try {
        setBalanceLoading(true);
        console.log('💰 開始載入科目餘額（基於 transactionGroups）...');
        
        // 載入所有 transactionGroups
        const response = await transactionGroupWithEntriesService.getAll({
          organizationId: selectedOrganizationId
        });
        
        if (response.success && response.data.groups) {
          const balanceMap: Record<string, number> = {};
          
          // 初始化所有科目餘額為 0
          accounts.forEach(account => {
            balanceMap[account._id] = 0;
          });
          
          // 遍歷所有交易群組和分錄來計算餘額
          response.data.groups.forEach(group => {
            group.entries.forEach(entry => {
              const accountId = typeof entry.accountId === 'string' ? entry.accountId : entry.accountId._id;
              
              if (balanceMap.hasOwnProperty(accountId)) {
                // 借方增加餘額，貸方減少餘額（適用於資產類科目）
                // 對於負債、權益、收入類科目，可能需要相反的邏輯
                const account = accounts.find(acc => acc._id === accountId);
                if (account) {
                  if (account.accountType === 'asset' || account.accountType === 'expense') {
                    // 資產和費用：借方為正，貸方為負
                    balanceMap[accountId] += (entry.debitAmount || 0) - (entry.creditAmount || 0);
                  } else {
                    // 負債、權益、收入：貸方為正，借方為負
                    balanceMap[accountId] += (entry.creditAmount || 0) - (entry.debitAmount || 0);
                  }
                }
              }
            });
          });
          
          setAccountBalances(balanceMap);
          console.log('💰 科目餘額載入完成（基於 transactionGroups）:', balanceMap);
        } else {
          // 如果沒有 transactionGroups，所有餘額設為 0
          const balanceMap: Record<string, number> = {};
          accounts.forEach(account => {
            balanceMap[account._id] = 0;
          });
          setAccountBalances(balanceMap);
        }
      } catch (error) {
        console.error('❌ 載入科目餘額失敗:', error);
        // 錯誤時設置所有餘額為 0
        const balanceMap: Record<string, number> = {};
        accounts.forEach(account => {
          balanceMap[account._id] = 0;
        });
        setAccountBalances(balanceMap);
      } finally {
        setBalanceLoading(false);
      }
    }
  }, [accounts, selectedOrganizationId]);

  // 載入分錄明細
  const loadDoubleEntries = useCallback(async (accountId: string) => {
    try {
      setEntriesLoading(true);
      console.log('📋 開始載入分錄明細，科目ID:', accountId);
      
      // 使用 transactionGroupWithEntriesService 載入 transactionGroups
      const response = await transactionGroupWithEntriesService.getAll({
        organizationId: selectedOrganizationId
      });
      
      console.log('📊 API 回應:', response);
      
      if (response.success && response.data.groups) {
        // 篩選包含指定 accountId 的 transactionGroups 並轉換為 AccountingEntryDetail
        const entries: AccountingEntryDetail[] = [];
        
        response.data.groups.forEach(group => {
          // 篩選該群組中屬於指定帳戶的分錄
          const accountEntries = group.entries.filter(entry => {
            const entryAccountId = typeof entry.accountId === 'string' ? entry.accountId : entry.accountId._id;
            return entryAccountId === accountId;
          });
          
          // 將符合條件的分錄轉換為 AccountingEntryDetail 格式
          accountEntries.forEach(entry => {
            const accountInfo = typeof entry.accountId === 'string'
              ? { _id: entry.accountId, name: '未知科目' }
              : entry.accountId;
              
            entries.push({
              _id: entry._id || `${group._id}-${entry.sequence}`,
              transactionGroupId: group._id,
              groupNumber: group.groupNumber,
              transactionDate: group.transactionDate.toString(),
              groupDescription: group.description,
              status: group.status || 'draft',
              receiptUrl: group.receiptUrl,
              invoiceNo: group.invoiceNo,
              sequence: entry.sequence,
              accountId: accountInfo._id,
              accountName: accountInfo.name,
              accountCode: 'code' in accountInfo ? accountInfo.code : '',
              accountType: 'accountType' in accountInfo ? accountInfo.accountType : 'asset',
              debitAmount: entry.debitAmount || 0,
              creditAmount: entry.creditAmount || 0,
              description: entry.description,
              categoryId: typeof entry.categoryId === 'string' ? entry.categoryId : entry.categoryId?._id,
              categoryName: typeof entry.categoryId === 'string' ? '未知類別' : entry.categoryId?.name,
              counterpartAccounts: [], // 暫時為空陣列，可後續計算對方科目
              createdAt: group.createdAt?.toString() || new Date().toISOString(),
              updatedAt: group.updatedAt?.toString() || new Date().toISOString()
            });
          });
        });

        // 計算統計資料
        const statsData = {
          totalDebit: entries.reduce((sum, entry) => sum + entry.debitAmount, 0),
          totalCredit: entries.reduce((sum, entry) => sum + entry.creditAmount, 0),
          balance: 0,
          recordCount: entries.length
        };
        statsData.balance = statsData.totalDebit - statsData.totalCredit;
        
        setEntries(entries);
        setStatistics({
          totalEntries: statsData.recordCount,
          totalDebit: statsData.totalDebit,
          totalCredit: statsData.totalCredit,
          balance: statsData.balance
        });
        
        console.log('📋 分錄明細載入完成:', {
          entriesCount: entries.length,
          statistics: statsData
        });
      } else {
        setEntries([]);
        setStatistics({
          totalEntries: 0,
          totalDebit: 0,
          totalCredit: 0,
          balance: 0
        });
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
      
      const response = await accountApiClient.getAccounts({
        organizationId: selectedOrganizationId
      });
      
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
  }, [selectedOrganizationId, accountApiClient]);

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
    const initializeData = async () => {
      try {
        console.log('🏢 開始載入機構列表...');
        const orgResponse = await organizationService.getOrganizations();
        if (orgResponse.success && orgResponse.data) {
          setOrganizations(orgResponse.data);
        }
      } catch (error) {
        console.error('❌ 載入機構列表失敗:', error);
        setError('載入機構列表失敗');
      }

      try {
        setLoading(true);
        setError(null);
        console.log('📊 載入會計科目，機構ID:', selectedOrganizationId);
        
        const response = await accountApiClient.getAccounts({
          organizationId: selectedOrganizationId
        });
        
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
    };

    initializeData();
  }, []); // 只在組件掛載時執行一次

  // 當科目載入完成後，載入餘額
  useEffect(() => {
    if (accounts.length > 0 && !balanceLoading) {
      loadAccountBalances();
    }
  }, [accounts.length]); // 移除 balanceLoading 和 loadAccountBalances 依賴項避免循環依賴

  // 機構選擇變更時重新載入資料
  useEffect(() => {
    const reloadAccountsForOrganization = async () => {
      if (selectedOrganizationId && organizations.length > 0) {
        console.log('🔄 機構選擇變更，selectedOrganizationId:', selectedOrganizationId);
        try {
          setLoading(true);
          setError(null);
          console.log('📊 載入會計科目，機構ID:', selectedOrganizationId);
          
          const response = await accountApiClient.getAccounts({
            organizationId: selectedOrganizationId
          });
          
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
      }
    };

    reloadAccountsForOrganization();
  }, [selectedOrganizationId]); // 只依賴 selectedOrganizationId

  // 監聽錯誤狀態
  useEffect(() => {
    if (error) {
      setNotification({
        open: true,
        message: error,
        severity: 'error'
      });
    }
  }, [error]);

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