import React, { useState } from 'react';
import { Box, Button, Tooltip } from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zhTW } from 'date-fns/locale';
import { useAppSelector } from '../../hooks/redux';
import {
  TransactionStatusManager,
  TransactionGroupWithEntriesFormData
} from '@pharmacy-pos/shared';
import { transactionGroupWithEntriesService } from '../../services/transactionGroupWithEntriesService';

// 導入重構後的模組
import { useTransactionForm } from './hooks/useTransactionForm';
import { BasicInfoSection } from './components/BasicInfoSection';
import { DoubleEntrySection } from './components/DoubleEntrySection';

interface TransactionGroupFormWithEntriesProps {
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

export const TransactionGroupFormWithEntries: React.FC<TransactionGroupFormWithEntriesProps> = ({
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

  // 使用重構後的 Hook
  const {
    formData,
    validation,
    handleBasicInfoChange,
    handleEntriesChange,
    validateForm,
    resetForm
  } = useTransactionForm({
    initialData,
    defaultAccountId,
    defaultOrganizationId,
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

  // 提交表單
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // 清理表單資料
      const cleanedFormData: any = {
        description: formData.description,
        transactionDate: formData.transactionDate,
        receiptUrl: formData.receiptUrl,
        invoiceNo: formData.invoiceNo,
        organizationId: formData.organizationId && formData.organizationId.trim() !== ''
          ? formData.organizationId
          : null,
        linkedTransactionIds: enableFundingTracking && formData.linkedTransactionIds && formData.linkedTransactionIds.length > 0
          ? formData.linkedTransactionIds
          : undefined,
        sourceTransactionId: enableFundingTracking ? formData.sourceTransactionId : undefined,
        fundingType: enableFundingTracking && formData.linkedTransactionIds && formData.linkedTransactionIds.length > 0
          ? 'extended'
          : 'original'
      };

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

      if (mode === 'create') {
        cleanedFormData.entries = formData.entries;
      } else if (mode === 'edit' && hasValidEntries && isBalanced) {
        cleanedFormData.entries = formData.entries;
      }
      
      await onSubmit(cleanedFormData);
    } catch (error) {
      console.error('❌ 提交交易群組失敗:', error);
    }
  };

  // 確認交易
  const handleConfirmTransaction = async () => {
    if (!transactionId) {
      console.error('❌ 無法確認交易：缺少交易ID');
      return;
    }

    setConfirmingTransaction(true);
    try {
      const result = await transactionGroupWithEntriesService.confirm(transactionId);
      
      if (result.success) {
        if (onStatusChange) {
          onStatusChange('confirmed');
        }
      }
    } catch (error) {
      console.error('❌ 確認交易失敗:', error);
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

        {/* 借貸分錄區塊 */}
        <DoubleEntrySection
          entries={formData.entries}
          errors={validation.errors}
          balanceError={validation.balanceError}
          permissions={permissions}
          mode={mode}
          organizationId={formData.organizationId}
          isCopyMode={isCopyMode}
          onEntriesChange={handleEntriesChange}
          onOpenTemplateDialog={() => setTemplateDialogOpen(true)}
          onOpenQuickStartDialog={() => setQuickStartOpen(true)}
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

        {/* TODO: 對話框組件將在下一步實作 */}
        {/* 快速範本對話框 */}
        {/* 快速入門對話框 */}
        {/* 資金來源選擇對話框 */}

      </Box>
    </LocalizationProvider>
  );
};

export default TransactionGroupFormWithEntries;