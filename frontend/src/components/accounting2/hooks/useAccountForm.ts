import { useState, useCallback } from 'react';
import { Account2, Account2FormData } from '../../../../../shared/types/accounting2';
import { Organization } from '../../../services/organizationService';
import accounting3Service from '../../../services/accounting3Service';

interface UseAccountFormProps {
  organizations: Organization[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onAccountsChange: () => void;
}

interface UseAccountFormReturn {
  // 對話框狀態
  openDialog: boolean;
  editingAccount: Account2 | null;
  
  // 表單狀態
  formData: Account2FormData;
  loading: boolean;
  
  // 表單操作
  handleOpenDialog: (account?: Account2) => void;
  handleCloseDialog: () => void;
  setFormData: React.Dispatch<React.SetStateAction<Account2FormData>>;
  saveAccount: () => Promise<void>;
  
  // 表單預設值設定
  setFormDefaults: (defaults: Partial<Account2FormData>) => void;
}

export const useAccountForm = ({
  organizations,
  onSuccess,
  onError,
  onAccountsChange,
}: UseAccountFormProps): UseAccountFormReturn => {
  // 對話框狀態
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account2 | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 表單狀態
  const [formData, setFormData] = useState<Account2FormData>({
    code: '',
    name: '',
    accountType: 'asset',
    type: 'other',
    initialBalance: 0,
    currency: 'TWD',
    description: '',
    organizationId: ''
  });

  // 生成科目代碼
  const generateAccountCode = useCallback(() => {
    const timestamp = Date.now().toString().slice(-6);
    const typePrefix = formData.accountType === 'asset' ? '1' :
                      formData.accountType === 'liability' ? '2' :
                      formData.accountType === 'equity' ? '3' :
                      formData.accountType === 'revenue' ? '4' : '5';
    return `${typePrefix}${timestamp}`;
  }, [formData.accountType]);

  // 開啟對話框
  const handleOpenDialog = useCallback((account?: Account2) => {
    if (account) {
      setEditingAccount(account);
      setFormData({
        code: account.code,
        name: account.name,
        accountType: account.accountType,
        type: account.type,
        parentId: account.parentId,
        initialBalance: account.initialBalance,
        currency: account.currency,
        description: account.description || '',
        organizationId: account.organizationId || ''
      });
    } else {
      setEditingAccount(null);
      setFormData({
        code: '',
        name: '',
        accountType: 'asset',
        type: 'other',
        initialBalance: 0,
        currency: 'TWD',
        description: '',
        organizationId: ''
      });
    }
    setOpenDialog(true);
  }, []);

  // 關閉對話框
  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setEditingAccount(null);
  }, []);

  // 設定表單預設值
  const setFormDefaults = useCallback((defaults: Partial<Account2FormData>) => {
    setFormData(prev => ({
      ...prev,
      ...defaults
    }));
  }, []);

  // 儲存會計科目
  const saveAccount = useCallback(async () => {
    try {
      setLoading(true);

      // 建立提交資料，包含必要的 code 欄位
      const submitData = {
        code: editingAccount?.code || generateAccountCode(), // 編輯時保留原代碼，新增時生成
        name: formData.name,
        type: formData.type,
        accountType: formData.accountType,
        initialBalance: formData.initialBalance,
        currency: formData.currency,
        description: formData.description,
        organizationId: formData.organizationId || undefined,
        parentId: formData.parentId || undefined
      };

      console.log('📤 提交會計科目資料:', submitData);

      let response;
      if (editingAccount) {
        response = await accounting3Service.accounts.update(editingAccount._id, submitData);
        if (response.success) {
          onSuccess('會計科目更新成功');
        } else {
          throw new Error('更新會計科目失敗');
        }
      } else {
        response = await accounting3Service.accounts.create(submitData);
        if (response.success) {
          onSuccess('會計科目新增成功');
        } else {
          throw new Error('新增會計科目失敗');
        }
      }
      
      handleCloseDialog();
      
      // 重新載入資料
      await onAccountsChange();
      
    } catch (error) {
      console.error('❌ 儲存會計科目失敗:', error);
      onError('儲存會計科目失敗');
    } finally {
      setLoading(false);
    }
  }, [
    editingAccount,
    formData,
    generateAccountCode,
    handleCloseDialog,
    onSuccess,
    onError,
    onAccountsChange
  ]);

  return {
    // 對話框狀態
    openDialog,
    editingAccount,
    
    // 表單狀態
    formData,
    loading,
    
    // 表單操作
    handleOpenDialog,
    handleCloseDialog,
    setFormData,
    saveAccount,
    
    // 表單預設值設定
    setFormDefaults,
  };
};

export default useAccountForm;