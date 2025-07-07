import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../hooks/redux';
import { Account2, AccountingRecord2 } from '../../../../../shared/types/accounting2';
import { Organization } from '../../../services/organizationService';
import accounting3Service from '../../../services/accounting3Service';
import organizationService from '../../../services/organizationService';
import { AccountingEntryDetail } from '../../../services/doubleEntryService';
import { transactionGroupWithEntriesService } from '../../../services/transactionGroupWithEntriesService';

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

// Store Hook 回傳值介面
interface UseAccountStoreReturn {
  // Redux 狀態
  accounts: Account2[];
  loading: boolean;
  error: string | null;
  
  // 本地狀態
  organizations: Organization[];
  selectedAccount: Account2 | null;
  entries: AccountingEntryDetail[];
  statistics: AccountStatistics;
  accountBalances: Record<string, number>;
  
  // 載入狀態
  balanceLoading: boolean;
  entriesLoading: boolean;
  
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
  
  // 篩選後的資料
  filteredAccounts: Account2[];
}

export const useAccountStore = (): UseAccountStoreReturn => {
  const dispatch = useAppDispatch();
  
  // Redux 狀態
  const { accounts, loading, error } = useAppSelector(state => state.account2);
  const { organizations: reduxOrganizations } = useAppSelector(state => state.organization);
  
  // 本地狀態 - 使用 useState 管理非 Redux 狀態
  const [localState, setLocalState] = useState({
    organizations: [] as Organization[],
    selectedAccount: null as Account2 | null,
    entries: [] as AccountingEntryDetail[],
    accountBalances: {} as Record<string, number>,
    balanceLoading: false,
    entriesLoading: false,
    searchTerm: '',
    selectedAccountType: '',
    selectedOrganizationId: '',
    expandedNodes: {} as Record<string, boolean>,
    statistics: {
      totalEntries: 0,
      totalDebit: 0,
      totalCredit: 0,
      balance: 0
    } as AccountStatistics,
    notification: {
      open: false,
      message: '',
      severity: 'info' as const
    } as NotificationState
  });

  // 載入機構列表
  const loadOrganizations = useCallback(async () => {
    try {
      console.log('🏢 開始載入機構列表...');
      const response = await organizationService.getOrganizations();
      if (response.success && response.data) {
        setLocalState(prev => ({
          ...prev,
          organizations: response.data
        }));
        
        // 同時更新 Redux 狀態
        dispatch({
          type: 'FETCH_ORGANIZATIONS2_SUCCESS',
          payload: response.data
        });
      }
    } catch (error) {
      console.error('❌ 載入機構列表失敗:', error);
      setLocalState(prev => ({
        ...prev,
        notification: {
          open: true,
          message: '載入機構列表失敗',
          severity: 'error'
        }
      }));
    }
  }, [dispatch]);

  // 載入科目餘額 - 基於 transactionGroups 計算
  const loadAccountBalances = useCallback(async () => {
    if (accounts.length > 0) {
      try {
        setLocalState(prev => ({ ...prev, balanceLoading: true }));
        console.log('💰 開始載入科目餘額（基於 transactionGroups）...');
        
        // 載入所有 transactionGroups
        const response = await transactionGroupWithEntriesService.getAll({
          organizationId: localState.selectedOrganizationId
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
          
          setLocalState(prev => ({
            ...prev,
            accountBalances: balanceMap,
            balanceLoading: false
          }));
          console.log('💰 科目餘額載入完成（基於 transactionGroups）:', balanceMap);
        } else {
          // 如果沒有 transactionGroups，所有餘額設為 0
          const balanceMap: Record<string, number> = {};
          accounts.forEach(account => {
            balanceMap[account._id] = 0;
          });
          setLocalState(prev => ({
            ...prev,
            accountBalances: balanceMap,
            balanceLoading: false
          }));
        }
      } catch (error) {
        console.error('❌ 載入科目餘額失敗:', error);
        // 錯誤時設置所有餘額為 0
        const balanceMap: Record<string, number> = {};
        accounts.forEach(account => {
          balanceMap[account._id] = 0;
        });
        setLocalState(prev => ({
          ...prev,
          accountBalances: balanceMap,
          balanceLoading: false
        }));
      }
    }
  }, [accounts, localState.selectedOrganizationId]);

  // 載入分錄明細
  const loadDoubleEntries = useCallback(async (accountId: string) => {
    try {
      setLocalState(prev => ({ ...prev, entriesLoading: true }));
      console.log('📋 開始載入分錄明細，科目ID:', accountId);
      
      // 使用 transactionGroupWithEntriesService 載入 transactionGroups
      const response = await transactionGroupWithEntriesService.getAll({
        organizationId: localState.selectedOrganizationId
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
        
        setLocalState(prev => ({
          ...prev,
          entries,
          statistics: {
            totalEntries: statsData.recordCount,
            totalDebit: statsData.totalDebit,
            totalCredit: statsData.totalCredit,
            balance: statsData.balance
          },
          entriesLoading: false
        }));
        
        console.log('📋 分錄明細載入完成:', {
          entriesCount: entries.length,
          statistics: statsData
        });
      } else {
        setLocalState(prev => ({
          ...prev,
          entries: [],
          statistics: {
            totalEntries: 0,
            totalDebit: 0,
            totalCredit: 0,
            balance: 0
          },
          entriesLoading: false
        }));
      }
    } catch (error) {
      console.error('❌ 載入分錄明細失敗:', error);
      setLocalState(prev => ({
        ...prev,
        entries: [],
        statistics: {
          totalEntries: 0,
          totalDebit: 0,
          totalCredit: 0,
          balance: 0
        },
        entriesLoading: false
      }));
    }
  }, [localState.selectedOrganizationId]);

  // 載入會計科目
  const loadAccounts = useCallback(async () => {
    try {
      dispatch({ type: 'FETCH_ACCOUNTS2_REQUEST' });
      console.log('📊 載入會計科目，機構ID:', localState.selectedOrganizationId);
      
      const response = await accounting3Service.accounts.getAll(localState.selectedOrganizationId);
      
      if (response.success && response.data) {
        dispatch({
          type: 'FETCH_ACCOUNTS2_SUCCESS',
          payload: response.data
        });
        console.log('📊 會計科目載入完成:', response.data.length);
      } else {
        throw new Error('載入會計科目失敗');
      }
    } catch (error) {
      console.error('❌ 載入會計科目失敗:', error);
      dispatch({
        type: 'FETCH_ACCOUNTS2_FAILURE',
        payload: '載入會計科目失敗'
      });
    }
  }, [dispatch, localState.selectedOrganizationId]);

  // 通知函數
  const showNotification = useCallback((message: string, severity: NotificationState['severity']) => {
    setLocalState(prev => ({
      ...prev,
      notification: {
        open: true,
        message,
        severity
      }
    }));
  }, []);

  const closeNotification = useCallback(() => {
    setLocalState(prev => ({
      ...prev,
      notification: { ...prev.notification, open: false }
    }));
  }, []);

  // 清除篩選
  const clearFilters = useCallback(() => {
    setLocalState(prev => ({
      ...prev,
      searchTerm: '',
      selectedAccountType: '',
      selectedOrganizationId: ''
    }));
  }, []);

  // 設定函數
  const setSelectedAccount = useCallback((account: Account2 | null) => {
    setLocalState(prev => ({ ...prev, selectedAccount: account }));
  }, []);

  const setSearchTerm = useCallback((term: string) => {
    setLocalState(prev => ({ ...prev, searchTerm: term }));
  }, []);

  const setSelectedAccountType = useCallback((type: string) => {
    setLocalState(prev => ({ ...prev, selectedAccountType: type }));
  }, []);

  const setSelectedOrganizationId = useCallback((id: string) => {
    setLocalState(prev => ({ ...prev, selectedOrganizationId: id }));
  }, []);

  const setExpandedNodes = useCallback((nodes: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => {
    setLocalState(prev => ({
      ...prev,
      expandedNodes: typeof nodes === 'function' ? nodes(prev.expandedNodes) : nodes
    }));
  }, []);

  // 篩選後的科目
  const filteredAccounts = useMemo(() => {
    return accounts.filter(account => {
      const matchesSearch = !localState.searchTerm || 
        account.name.toLowerCase().includes(localState.searchTerm.toLowerCase()) ||
        account.code.toLowerCase().includes(localState.searchTerm.toLowerCase());
      
      const matchesType = !localState.selectedAccountType || 
        account.accountType === localState.selectedAccountType;
      
      const matchesOrganization = !localState.selectedOrganizationId || 
        account.organizationId === localState.selectedOrganizationId;
      
      return matchesSearch && matchesType && matchesOrganization;
    });
  }, [accounts, localState.searchTerm, localState.selectedAccountType, localState.selectedOrganizationId]);

  // 初始化載入
  useEffect(() => {
    const initializeData = async () => {
      await loadOrganizations();
      await loadAccounts();
    };
    initializeData();
  }, []); // 只在組件掛載時執行一次

  // 當科目載入完成後，載入餘額
  useEffect(() => {
    if (accounts.length > 0 && !localState.balanceLoading) {
      loadAccountBalances();
    }
  }, [accounts.length, loadAccountBalances]); // 移除 balanceLoading 依賴項避免循環依賴

  // 機構選擇變更時重新載入資料
  useEffect(() => {
    if (localState.selectedOrganizationId && localState.organizations.length > 0) {
      console.log('🔄 機構選擇變更，selectedOrganizationId:', localState.selectedOrganizationId);
      loadAccounts();
    }
  }, [localState.selectedOrganizationId, loadAccounts]);

  // 監聽錯誤狀態
  useEffect(() => {
    if (error) {
      setLocalState(prev => ({
        ...prev,
        notification: {
          open: true,
          message: error,
          severity: 'error'
        }
      }));
    }
  }, [error]);

  return {
    // Redux 狀態
    accounts,
    loading,
    error,
    
    // 本地狀態
    organizations: localState.organizations,
    selectedAccount: localState.selectedAccount,
    entries: localState.entries,
    statistics: localState.statistics,
    accountBalances: localState.accountBalances,
    
    // 載入狀態
    balanceLoading: localState.balanceLoading,
    entriesLoading: localState.entriesLoading,
    
    // 通知狀態
    notification: localState.notification,
    
    // 搜尋與篩選狀態
    searchTerm: localState.searchTerm,
    selectedAccountType: localState.selectedAccountType,
    selectedOrganizationId: localState.selectedOrganizationId,
    
    // 樹狀結構狀態
    expandedNodes: localState.expandedNodes,
    
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
    clearFilters,
    
    // 篩選後的資料
    filteredAccounts
  };
};

export default useAccountStore;