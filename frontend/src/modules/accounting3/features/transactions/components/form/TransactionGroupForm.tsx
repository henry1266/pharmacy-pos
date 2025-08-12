import React, { useState, useEffect } from 'react';
import { Box, Button, Tooltip } from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zhTW } from 'date-fns/locale';
import { useAppSelector } from '@/hooks/redux';
import {
  TransactionStatusManager,
  TransactionGroupWithEntriesFormData
} from '@pharmacy-pos/shared';
import { accounting3Service } from '../../../../services/accounting3Service';

// 導入 accounting3 專用的 hooks 和組件
import { useTransactionForm3 } from '../../../../core/hooks/useTransactionForm3';
import { BasicInfoSection } from '../../../../components/ui/BasicInfoSection';
import { DoubleEntrySection3 } from '../../../../components/ui/DoubleEntrySection3';
import { EnhancedDoubleEntrySection } from '../../../../components/ui/EnhancedDoubleEntrySection';
import { FundingSourceSelector3 } from '../../../../components/ui/FundingSourceSelector3';

interface TransactionGroupFormProps {
  initialData?: Partial<TransactionGroupWithEntriesFormData>;
  onSubmit: (data: TransactionGroupWithEntriesFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit' | 'view';
  defaultAccountId?: string;
  defaultOrganizationId?: string;
  isCopyMode?: boolean;
  transactionId?: string;
  currentStatus?: 'draft' | 'confirmed' | 'cancelled';
  onStatusChange?: (newStatus: 'draft' | 'confirmed' | 'cancelled') => void;
}

/**
 * 交易群組表單組件
 * 
 * 功能：
 * - 建立/編輯/檢視交易群組
 * - 支援複式記帳分錄
 * - 支援資金來源追蹤
 * - 支援交易狀態管理
 */
export const TransactionGroupForm: React.FC<TransactionGroupFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create',
  defaultAccountId,
  defaultOrganizationId,
  isCopyMode = false,
  transactionId,
  currentStatus = 'draft',
  onStatusChange
}) => {
  const { organizations } = useAppSelector(state => state.organization);
  const { accounts } = useAppSelector(state => state.account2 || { accounts: [] });

  // 使用 accounting3 專用的 Hook
  const {
    formData,
    validation,
    handleBasicInfoChange,
    handleEntriesChange,
    validateForm,
    resetForm
  } = useTransactionForm3({
    initialData: initialData || {},
    defaultAccountId: defaultAccountId || '',
    defaultOrganizationId: defaultOrganizationId || '',
    isCopyMode,
    mode
  });

  // 對話框狀態
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [quickStartOpen, setQuickStartOpen] = useState(false);
  const [fundingSourceDialogOpen, setFundingSourceDialogOpen] = useState(false);
  const [confirmingTransaction, setConfirmingTransaction] = useState(false);

  // 資金來源追蹤狀態
  const [enableFundingTracking, setEnableFundingTracking] = useState(false);
  const [selectedFundingSources, setSelectedFundingSources] = useState<Array<{
    _id: string;
    groupNumber: string;
    description: string;
    transactionDate: Date;
    totalAmount: number;
    availableAmount: number;
    fundingType: string;
  }>>([]);

  // 載入已選的資金來源（編輯/檢視模式）
  useEffect(() => {
    const loadSelectedFundingSources = async () => {
      // 只在編輯/檢視模式且有 linkedTransactionIds 時載入
      if ((mode === 'edit' || mode === 'view') &&
          initialData?.linkedTransactionIds &&
          initialData.linkedTransactionIds.length > 0) {
        
        try {
          console.log('🔍 [Accounting3] 載入已選資金來源:', initialData.linkedTransactionIds);
          
          // 設置資金追蹤為啟用狀態
          setEnableFundingTracking(true);
          
          // 載入每個關聯交易的詳細資料
          const fundingSourcePromises = initialData.linkedTransactionIds.map(async (transactionId) => {
            try {
              const response = await accounting3Service.transactions.getById(transactionId);
              if (response.success && response.data) {
                return {
                  _id: response.data._id,
                  groupNumber: response.data.groupNumber,
                  description: response.data.description,
                  transactionDate: new Date(response.data.transactionDate),
                  totalAmount: response.data.totalAmount || 0,
                  availableAmount: response.data.totalAmount || 0, // 假設全額可用
                  fundingType: response.data.fundingType || 'original'
                };
              }
              return null;
            } catch (error) {
              console.error(`❌ [Accounting3] 載入資金來源 ${transactionId} 失敗:`, error);
              return null;
            }
          });
          
          const fundingSources = await Promise.all(fundingSourcePromises);
          const validFundingSources = fundingSources.filter((source): source is NonNullable<typeof source> => source !== null);
          
          console.log('✅ [Accounting3] 載入的資金來源:', validFundingSources);
          setSelectedFundingSources(validFundingSources);
          
        } catch (error) {
          console.error('❌ [Accounting3] 載入資金來源失敗:', error);
        }
      }
    };

    loadSelectedFundingSources();
  }, [mode, initialData?.linkedTransactionIds]);

  // 提交表單
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    console.log('🚀 [Accounting3] 開始提交表單:', {
      mode,
      isCopyMode,
      formDataKeys: Object.keys(formData),
      entriesCount: formData.entries?.length || 0,
      organizationId: formData.organizationId
    });
    
    if (!validateForm()) {
      console.warn('⚠️ [Accounting3] 表單驗證失敗，停止提交');
      return;
    }

    try {
      // 檢查分錄是否完整且有效
      const hasValidEntries = formData.entries &&
        formData.entries.length >= 2 &&
        formData.entries.every(entry =>
          entry.accountId &&
          (entry.debitAmount > 0 || entry.creditAmount > 0) &&
          !(entry.debitAmount > 0 && entry.creditAmount > 0)
        );

      // 檢查借貸平衡
      const totalDebit = formData.entries?.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0) || 0;
      const totalCredit = formData.entries?.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0) || 0;
      const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

      console.log('📊 [Accounting3] 表單資料驗證:', {
        hasValidEntries,
        isBalanced,
        totalDebit,
        totalCredit,
        entriesDetail: formData.entries?.map(entry => ({
          accountId: entry.accountId,
          debitAmount: entry.debitAmount,
          creditAmount: entry.creditAmount,
          description: entry.description
        }))
      });

      if (!hasValidEntries) {
        console.error('❌ [Accounting3] 分錄資料無效');
        throw new Error('分錄資料無效：請確保每筆分錄都有選擇科目且填入正確的借方或貸方金額');
      }

      if (!isBalanced) {
        console.error('❌ [Accounting3] 借貸不平衡');
        throw new Error(`借貸不平衡：借方 ${totalDebit.toFixed(2)}，貸方 ${totalCredit.toFixed(2)}`);
      }

      // 清理表單資料
      const cleanedFormData: any = {
        description: formData.description?.trim() || '',
        transactionDate: formData.transactionDate,
        receiptUrl: formData.receiptUrl?.trim() || '',
        invoiceNo: formData.invoiceNo?.trim() || '',
        organizationId: formData.organizationId && formData.organizationId.trim() !== ''
          ? formData.organizationId.trim()
          : null,
        linkedTransactionIds: enableFundingTracking && formData.linkedTransactionIds && formData.linkedTransactionIds.length > 0
          ? formData.linkedTransactionIds
          : undefined,
        sourceTransactionId: enableFundingTracking ? formData.sourceTransactionId : undefined,
        fundingType: enableFundingTracking && formData.linkedTransactionIds && formData.linkedTransactionIds.length > 0
          ? 'extended'
          : 'original',
        entries: formData.entries
      };

      console.log('📤 [Accounting3] 準備提交的清理後資料:', {
        ...cleanedFormData,
        entries: cleanedFormData.entries?.map((entry: any) => ({
          accountId: entry.accountId,
          debitAmount: entry.debitAmount,
          creditAmount: entry.creditAmount,
          description: entry.description
        }))
      });
      
      await onSubmit(cleanedFormData);
      console.log('✅ [Accounting3] 表單提交成功');
    } catch (error) {
      console.error('❌ [Accounting3] 提交交易群組失敗:', error);
      console.error('❌ [Accounting3] 錯誤詳情:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        formData: {
          description: formData.description,
          organizationId: formData.organizationId,
          entriesCount: formData.entries?.length,
          totalDebit: formData.entries?.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0),
          totalCredit: formData.entries?.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0)
        }
      });
      
      // 重新拋出錯誤，讓上層處理
      throw error;
    }
  };

  // 確認交易
  const handleConfirmTransaction = async () => {
    if (!transactionId) {
      console.error('❌ [Accounting3] 無法確認交易：缺少交易ID');
      return;
    }

    setConfirmingTransaction(true);
    try {
      const result = await accounting3Service.transactions.confirm(transactionId);
      
      if (result.success) {
        if (onStatusChange) {
          onStatusChange('confirmed');
        }
      }
    } catch (error) {
      console.error('❌ [Accounting3] 確認交易失敗:', error);
    } finally {
      setConfirmingTransaction(false);
    }
  };

  // 處理資金追蹤開關
  const handleFundingTrackingToggle = (enabled: boolean) => {
    setEnableFundingTracking(enabled);
    
    if (!enabled) {
      if (mode === 'create') {
        handleBasicInfoChange('linkedTransactionIds', undefined);
        handleBasicInfoChange('sourceTransactionId', undefined);
        handleBasicInfoChange('fundingType', 'original');
        setSelectedFundingSources([]);
      }
    }
  };

  // 處理資金來源選擇（帶同步功能）
  const handleFundingSourceSelectWithSync = (transaction: any, syncToEntries: boolean) => {
    console.log('🔍 [Accounting3] 選擇資金來源（同步模式）:', { transaction, syncToEntries });
    
    // 先執行原有的交易群組層級邏輯
    handleFundingSourceSelect(transaction);
    
    // 如果啟用同步，為所有借方分錄設定相同的資金來源
    if (syncToEntries && formData.entries) {
      const updatedEntries = formData.entries.map(entry => {
        // 只為借方分錄（debitAmount > 0）設定資金來源
        if (entry.debitAmount && entry.debitAmount > 0) {
          return {
            ...entry,
            sourceTransactionId: transaction._id
          };
        }
        return entry;
      });
      
      handleEntriesChange(updatedEntries);
      console.log('✅ [Accounting3] 已同步資金來源到借方分錄');
    }
  };

  // 處理資金來源選擇（原有功能）
  const handleFundingSourceSelect = (transaction: any) => {
    console.log('🔍 [Accounting3] 選擇資金來源:', transaction);
    
    // 更新選中的資金來源列表
    const newFundingSource = {
      _id: transaction._id,
      groupNumber: transaction.groupNumber,
      description: transaction.description,
      transactionDate: transaction.transactionDate,
      totalAmount: transaction.totalAmount,
      availableAmount: transaction.totalAmount, // 假設全額可用
      fundingType: transaction.fundingType || 'original'
    };
    
    setSelectedFundingSources(prev => {
      // 避免重複添加
      if (prev.some(source => source._id === transaction._id)) {
        return prev;
      }
      return [...prev, newFundingSource];
    });
    
    // 更新表單資料
    const currentLinkedIds = formData.linkedTransactionIds || [];
    if (!currentLinkedIds.includes(transaction._id)) {
      const newLinkedIds = [...currentLinkedIds, transaction._id];
      handleBasicInfoChange('linkedTransactionIds', newLinkedIds);
      handleBasicInfoChange('fundingType', 'extended');
    }
    
    setFundingSourceDialogOpen(false);
  };

  // 快速平衡功能
  const quickBalance = () => {
    if (formData.entries.length < 2) return;

    const newEntries = [...formData.entries];
    const lastEntry = newEntries[newEntries.length - 1];
    
    // 計算借貸總額
    const totalDebit = newEntries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
    const totalCredit = newEntries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
    
    if (totalDebit > totalCredit) {
      if (lastEntry) {
        lastEntry.creditAmount = totalDebit - (totalCredit - (lastEntry.creditAmount || 0));
        lastEntry.debitAmount = 0;
      }
    } else if (totalCredit > totalDebit && lastEntry) {
      lastEntry.debitAmount = totalCredit - (totalDebit - (lastEntry.debitAmount || 0));
      lastEntry.creditAmount = 0;
    }

    handleEntriesChange(newEntries);
  };

  // 借貸對調功能
  const swapDebitCredit = () => {
    const newEntries = formData.entries.map(entry => ({
      ...entry,
      debitAmount: entry.creditAmount,
      creditAmount: entry.debitAmount
    }));
    handleEntriesChange(newEntries);
  };

  // 計算平衡資訊
  const balanceInfo = React.useMemo(() => {
    const totalDebit = formData.entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
    const totalCredit = formData.entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
    const difference = Math.abs(totalDebit - totalCredit);
    const isBalanced = difference < 0.01;

    return {
      totalDebit,
      totalCredit,
      difference,
      isBalanced
    };
  }, [formData.entries]);

  // 過濾可用的會計科目
  const availableAccounts = accounts.filter(account =>
    account.isActive && (!formData.organizationId || account.organizationId === formData.organizationId)
  );

  // 使用 shared 的狀態管理工具
  const statusInfo = TransactionStatusManager.getDisplayInfo(currentStatus);
  const permissions = TransactionStatusManager.getPermissions(currentStatus);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
      <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
        
        {/* 基本資訊區塊 */}
        <BasicInfoSection
          formData={formData}
          onFormDataChange={handleBasicInfoChange}
          errors={validation.errors}
          organizations={organizations}
          permissions={permissions}
          mode={mode}
          isCopyMode={isCopyMode}
          currentStatus={currentStatus}
          statusInfo={{
            label: statusInfo.label,
            color: statusInfo.color === 'default' ? 'warning' : statusInfo.color as 'warning' | 'success' | 'error',
            bgColor: statusInfo.bgColor
          }}
          enableFundingTracking={enableFundingTracking}
          onFundingTrackingToggle={handleFundingTrackingToggle}
          selectedFundingSources={selectedFundingSources}
          onRemoveFundingSource={(sourceId: string) => {
            setSelectedFundingSources(prev => prev.filter(s => s._id !== sourceId));
            const newIds = formData.linkedTransactionIds?.filter(linkedId => linkedId !== sourceId);
            handleBasicInfoChange('linkedTransactionIds', newIds);
            handleBasicInfoChange('fundingType', newIds && newIds.length > 0 ? 'extended' : 'original');
          }}
          onOpenFundingSourceDialog={() => setFundingSourceDialogOpen(true)}
          uploadingReceipt={false}
          onReceiptUpload={() => {}}
        />

        {/* 增強版借貸分錄區塊 - 支援簡易模式 */}
        <EnhancedDoubleEntrySection
          entries={formData.entries}
          onEntriesChange={handleEntriesChange}
          organizationId={formData.organizationId || ''}
          isCopyMode={isCopyMode}
          mode={mode}
          permissions={permissions}
          errors={validation.errors}
          balanceError={validation.balanceError}
          onOpenTemplateDialog={() => setTemplateDialogOpen(true)}
          onOpenQuickStartDialog={() => setQuickStartOpen(true)}
          onSwapDebitCredit={swapDebitCredit}
          onQuickBalance={quickBalance}
          balanceInfo={balanceInfo}
          availableAccounts={availableAccounts}
        />

        {/* 操作按鈕 */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={isLoading || confirmingTransaction}
            startIcon={<CancelIcon />}
          >
            {mode === 'view' ? '關閉' : '取消'}
          </Button>
          
          {/* 確認交易按鈕 */}
          {mode === 'edit' && permissions.canConfirm && transactionId && (
            <Tooltip title={TransactionStatusManager.getStatusChangeMessage('draft', 'confirmed')}>
              <Button
                variant="outlined"
                color="success"
                onClick={handleConfirmTransaction}
                disabled={
                  confirmingTransaction ||
                  isLoading ||
                  !!validation.balanceError ||
                  formData.entries.length < 2 ||
                  Object.keys(validation.errors).length > 0
                }
                startIcon={confirmingTransaction ? <SaveIcon /> : <CheckCircleIcon />}
                sx={{
                  borderColor: 'success.main',
                  color: 'success.main',
                  '&:hover': {
                    borderColor: 'success.dark',
                    backgroundColor: 'success.light',
                    color: 'success.dark'
                  }
                }}
              >
                {confirmingTransaction ? '確認中...' : '確認交易'}
              </Button>
            </Tooltip>
          )}
          
          {mode !== 'view' && (
            <Tooltip
              title={
                !permissions.canEdit ? '已確認的交易無法修改' :
                isLoading ? '處理中...' :
                !!validation.balanceError ? validation.balanceError :
                mode === 'create' && formData.entries.length === 0 ? '請先新增分錄' :
                mode === 'create' && formData.entries.length < 2 ? '至少需要兩筆分錄' :
                Object.keys(validation.errors).length > 0 ? '請修正表單錯誤' :
                mode === 'create' ? '點擊建立交易' : '點擊更新交易'
              }
            >
              <span>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={
                    !permissions.canEdit ||
                    isLoading ||
                    confirmingTransaction ||
                    !!validation.balanceError ||
                    (mode === 'create' && formData.entries.length < 2) ||
                    Object.keys(validation.errors).length > 0
                  }
                  startIcon={<SaveIcon />}
                >
                  {isLoading ? '儲存中...' : mode === 'create' ? '建立交易' : '更新交易'}
                </Button>
              </span>
            </Tooltip>
          )}
        </Box>

        {/* 資金來源選擇對話框 */}
        <FundingSourceSelector3
          open={fundingSourceDialogOpen}
          onClose={() => setFundingSourceDialogOpen(false)}
          onSelect={handleFundingSourceSelect}
          onSelectWithSync={handleFundingSourceSelectWithSync}
          showSyncOption={true}
          organizationId={formData.organizationId || ''}
          excludeTransactionIds={transactionId ? [transactionId] : []}
        />

      </Box>
    </LocalizationProvider>
  );
};

export default TransactionGroupForm;