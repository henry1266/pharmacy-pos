import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  Fade,
  Chip
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Settings as AdvancedIcon,
  SwapHoriz as SwapHorizIcon,
  Balance as BalanceIcon,
  AccountBalance as AccountIcon
} from '@mui/icons-material';
import { EmbeddedAccountingEntry3FormData } from '@pharmacy-pos/shared/types/accounting3';
import { AccountSelector3 } from '../../features/accounts/components/AccountSelector/AccountSelector';
import { DoubleEntryFormWithEntries3 } from '../../features/transactions/DoubleEntryFormWithEntries3';
import { SimpleTransactionFlow } from './SimpleTransactionFlow';

// 型別定義
interface AccountOption {
  _id: string;
  name: string;
  code: string;
  accountType: string;
  normalBalance: 'debit' | 'credit';
  organizationId?: string;
  parentId?: string;
}

interface Permissions {
  canEdit: boolean;
}

interface BalanceInfo {
  isBalanced: boolean;
  totalDebit: number;
  totalCredit: number;
  difference: number;
}

export interface EnhancedDoubleEntrySectionProps {
  // 分錄資料
  entries: EmbeddedAccountingEntry3FormData[];
  onEntriesChange: (entries: EmbeddedAccountingEntry3FormData[]) => void;
  
  // 表單設定
  organizationId?: string;
  isCopyMode?: boolean;
  
  // 模式和權限
  mode: 'create' | 'edit' | 'view';
  permissions: Permissions;
  
  // 錯誤處理
  errors: Record<string, string>;
  balanceError: string;
  
  // 對話框控制
  onOpenTemplateDialog: () => void;
  onOpenQuickStartDialog: () => void;
  
  // 借貸對調功能
  onSwapDebitCredit: () => void;
  
  // 快速平衡功能
  onQuickBalance: () => void;
  balanceInfo: BalanceInfo;
  
  // 可用科目
  availableAccounts: AccountOption[];
}

/**
 * 增強版雙分錄區塊組件
 * 
 * 功能：
 * - 支援簡易模式和進階模式切換
 * - 簡易模式：一借一貸的快速輸入
 * - 進階模式：完整的雙分錄功能
 * - 自動判斷適合的模式
 */
export const EnhancedDoubleEntrySection: React.FC<EnhancedDoubleEntrySectionProps> = ({
  entries,
  onEntriesChange,
  organizationId,
  isCopyMode = false,
  mode,
  permissions,
  errors,
  balanceError,
  onOpenTemplateDialog,
  onOpenQuickStartDialog,
  onSwapDebitCredit,
  onQuickBalance,
  balanceInfo,
  availableAccounts
}) => {
  // 模式狀態 - 預設為簡易模式
  const [isSimpleMode, setIsSimpleMode] = useState(true);
  const [accountSelectorOpen, setAccountSelectorOpen] = useState(false);
  const [accountSelectorPosition, setAccountSelectorPosition] = useState<'from' | 'to'>('from');
  
  // 簡易模式的狀態
  const [simpleAmount, setSimpleAmount] = useState(0);
  const [simpleDescription, setSimpleDescription] = useState('');

  // 判斷是否適合簡易模式
  const isSimpleModeCompatible = useMemo(() => {
    if (entries.length !== 2) return false;
    
    const debitEntries = entries.filter(entry => (entry.debitAmount || 0) > 0);
    const creditEntries = entries.filter(entry => (entry.creditAmount || 0) > 0);
    
    // 如果是簡易模式，允許更寬鬆的條件
    if (isSimpleMode) {
      // 簡易模式下，只要有兩個分錄就可以
      return true;
    }
    
    // 進階模式下的嚴格檢查
    return debitEntries.length === 1 && creditEntries.length === 1;
  }, [entries, isSimpleMode]);

  // 自動初始化簡易模式狀態
  useEffect(() => {
    if (isSimpleMode && isSimpleModeCompatible) {
      const debitEntry = entries.find(entry => (entry.debitAmount || 0) > 0);
      const creditEntry = entries.find(entry => (entry.creditAmount || 0) > 0);
      
      if (debitEntry && creditEntry) {
        setSimpleAmount(debitEntry.debitAmount || creditEntry.creditAmount || 0);
        setSimpleDescription(debitEntry.description || creditEntry.description || '');
      }
    }
  }, [isSimpleMode, isSimpleModeCompatible, entries]);

  // 初始化分錄（如果為空）
  useEffect(() => {
    if (entries.length === 0) {
      const defaultEntries: EmbeddedAccountingEntry3FormData[] = [
        {
          accountId: '',
          debitAmount: 0,
          creditAmount: 0,
          description: ''
        },
        {
          accountId: '',
          debitAmount: 0,
          creditAmount: 0,
          description: ''
        }
      ];
      onEntriesChange(defaultEntries);
    }
  }, [entries.length, onEntriesChange]);

  // 切換到簡易模式
  const handleSwitchToSimple = () => {
    if (!isSimpleModeCompatible) {
      // 如果當前不相容，重置為基本的一借一貸結構
      const defaultEntries: EmbeddedAccountingEntry3FormData[] = [
        {
          accountId: '',
          debitAmount: 0,
          creditAmount: 0,
          description: ''
        },
        {
          accountId: '',
          debitAmount: 0,
          creditAmount: 0,
          description: ''
        }
      ];
      onEntriesChange(defaultEntries);
    }
    setIsSimpleMode(true);
  };

  // 切換到進階模式
  const handleSwitchToAdvanced = () => {
    setIsSimpleMode(false);
  };

  // 處理簡易模式的科目選擇
  const handleSimpleAccountSelect = (position: 'from' | 'to') => {
    setAccountSelectorPosition(position);
    setAccountSelectorOpen(true);
  };

  // 處理科目選擇確認
  const handleAccountSelectConfirm = (account: AccountOption) => {
    const newEntries = [...entries];
    
    // 確保至少有兩個分錄
    while (newEntries.length < 2) {
      newEntries.push({
        accountId: '',
        debitAmount: 0,
        creditAmount: 0,
        description: ''
      });
    }
    
    if (accountSelectorPosition === 'from') {
      // 設定來源科目 - 需要根據科目類型決定是借方還是貸方
      const accountType = account.accountType;
      
      if (accountType === 'revenue' || accountType === 'liability' || accountType === 'equity') {
        // 收入、負債、權益類科目作為來源時，通常是貸方
        newEntries[0] = {
          ...newEntries[0],
          accountId: account._id,
          creditAmount: simpleAmount,
          debitAmount: 0,
          description: simpleDescription
        };
        // 確保目標科目是借方
        if (newEntries[1].accountId) {
          newEntries[1] = {
            ...newEntries[1],
            debitAmount: simpleAmount,
            creditAmount: 0,
            description: simpleDescription
          };
        }
      } else {
        // 資產、費用類科目作為來源時，通常是借方（但在轉帳情況下可能是貸方）
        newEntries[0] = {
          ...newEntries[0],
          accountId: account._id,
          creditAmount: simpleAmount,
          debitAmount: 0,
          description: simpleDescription
        };
        // 確保目標科目是借方
        if (newEntries[1]?.accountId) {
          newEntries[1] = {
            ...newEntries[1],
            accountId: newEntries[1].accountId,
            debitAmount: simpleAmount,
            creditAmount: 0,
            description: simpleDescription
          };
        }
      }
    } else {
      // 設定目標科目 - 需要根據科目類型決定是借方還是貸方
      const accountType = account.accountType;
      
      if (accountType === 'asset' || accountType === 'expense') {
        // 資產、費用類科目作為目標時，通常是借方
        newEntries[1] = {
          ...newEntries[1],
          accountId: account._id,
          debitAmount: simpleAmount,
          creditAmount: 0,
          description: simpleDescription
        };
        // 確保來源科目是貸方
        if (newEntries[0]?.accountId) {
          newEntries[0] = {
            ...newEntries[0],
            accountId: newEntries[0].accountId,
            creditAmount: simpleAmount,
            debitAmount: 0,
            description: simpleDescription
          };
        }
      } else {
        // 收入、負債、權益類科目作為目標時，通常是貸方
        newEntries[1] = {
          ...newEntries[1],
          accountId: account._id,
          creditAmount: simpleAmount,
          debitAmount: 0,
          description: simpleDescription
        };
        // 確保來源科目是借方
        if (newEntries[0]?.accountId) {
          newEntries[0] = {
            ...newEntries[0],
            accountId: newEntries[0].accountId,
            debitAmount: simpleAmount,
            creditAmount: 0,
            description: simpleDescription
          };
        }
      }
    }
    
    console.log('🔍 科目選擇確認:', {
      position: accountSelectorPosition,
      account: account.name,
      accountType: account.accountType,
      accountId: account._id,
      newEntries
    });
    
    onEntriesChange(newEntries);
    setAccountSelectorOpen(false);
  };

  // 處理簡易模式的金額變更
  const handleSimpleAmountChange = (amount: number) => {
    setSimpleAmount(amount);
    
    const newEntries = [...entries];
    if (newEntries.length >= 2) {
      // 保持現有的借貸方向，只更新金額
      if ((newEntries[0]?.creditAmount || 0) > 0 || (newEntries[0]?.debitAmount || 0) === 0) {
        newEntries[0] = {
          ...newEntries[0],
          accountId: newEntries[0]?.accountId || '',
          creditAmount: amount,
          debitAmount: 0,
          description: simpleDescription
        };
      } else {
        newEntries[0] = {
          ...newEntries[0],
          accountId: newEntries[0]?.accountId || '',
          debitAmount: amount,
          creditAmount: 0,
          description: simpleDescription
        };
      }
      
      if ((newEntries[1]?.debitAmount || 0) > 0 || (newEntries[1]?.creditAmount || 0) === 0) {
        newEntries[1] = {
          ...newEntries[1],
          accountId: newEntries[1]?.accountId || '',
          debitAmount: amount,
          creditAmount: 0,
          description: simpleDescription
        };
      } else {
        newEntries[1] = {
          ...newEntries[1],
          accountId: newEntries[1]?.accountId || '',
          creditAmount: amount,
          debitAmount: 0,
          description: simpleDescription
        };
      }
      
      onEntriesChange(newEntries);
    }
  };

  // 處理簡易模式的描述變更
  const handleSimpleDescriptionChange = (description: string) => {
    setSimpleDescription(description);
    
    const newEntries = entries.map(entry => ({
      ...entry,
      description
    }));
    
    onEntriesChange(newEntries);
  };

  console.log('[Accounting3] 🔍 EnhancedDoubleEntrySection 渲染:', {
    entriesCount: entries.length,
    mode,
    isSimpleMode,
    isSimpleModeCompatible,
    isBalanced: balanceInfo.isBalanced,
    totalDebit: balanceInfo.totalDebit,
    totalCredit: balanceInfo.totalCredit
  });

  return (
    <Box>
      {/* 模式切換提示 */}
      {!isSimpleMode && isSimpleModeCompatible && mode !== 'view' && (
        <Fade in={true}>
          <Alert 
            severity="info" 
            sx={{ mb: 2 }}
            action={
              <Button
                color="inherit"
                size="small"
                startIcon={<SpeedIcon />}
                onClick={handleSwitchToSimple}
              >
                切換簡易模式
              </Button>
            }
          >
            此交易適合使用簡易模式，可以更快速地完成輸入。
          </Alert>
        </Fade>
      )}

      {/* 簡易模式 */}
      {isSimpleMode ? (
        <SimpleTransactionFlow
          entries={entries}
          availableAccounts={availableAccounts}
          amount={simpleAmount}
          description={simpleDescription}
          onEntriesChange={onEntriesChange}
          onAmountChange={handleSimpleAmountChange}
          onDescriptionChange={handleSimpleDescriptionChange}
          onOpenAccountSelector={handleSimpleAccountSelect}
          onToggleAdvancedMode={handleSwitchToAdvanced}
          disabled={!permissions.canEdit}
          errors={errors}
        />
      ) : (
        /* 進階模式 */
        <Card sx={{ mb: 3, boxShadow: 2 }}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6">借貸分錄</Typography>
                {mode !== 'view' && (
                  <Chip 
                    label="進階模式" 
                    size="small" 
                    color="secondary" 
                    variant="outlined"
                  />
                )}
              </Box>
            }
            action={
              mode !== 'view' && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {/* 切換到簡易模式按鈕 */}
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<SpeedIcon />}
                    onClick={handleSwitchToSimple}
                    disabled={!permissions.canEdit}
                    sx={{
                      color: 'primary.contrastText',
                      borderColor: 'primary.contrastText',
                      '&:hover': {
                        borderColor: 'primary.contrastText',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                  >
                    簡易模式
                  </Button>
                  
                  {/* 快速平衡按鈕 */}
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<BalanceIcon />}
                    onClick={onQuickBalance}
                    disabled={!permissions.canEdit || entries.length < 2 || balanceInfo.isBalanced}
                    sx={{
                      color: 'primary.contrastText',
                      borderColor: 'primary.contrastText',
                      '&:hover': {
                        borderColor: 'primary.contrastText',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                      },
                      '&:disabled': {
                        color: 'rgba(255, 255, 255, 0.3)',
                        borderColor: 'rgba(255, 255, 255, 0.3)'
                      }
                    }}
                  >
                    快速平衡
                  </Button>
                  
                  {/* 借貸對調按鈕 */}
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<SwapHorizIcon />}
                    onClick={onSwapDebitCredit}
                    disabled={!permissions.canEdit || entries.length < 2 || entries.every(entry => entry.debitAmount === 0 && entry.creditAmount === 0)}
                    sx={{
                      color: 'primary.contrastText',
                      borderColor: 'primary.contrastText',
                      '&:hover': {
                        borderColor: 'primary.contrastText',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                      },
                      '&:disabled': {
                        color: 'rgba(255, 255, 255, 0.3)',
                        borderColor: 'rgba(255, 255, 255, 0.3)'
                      }
                    }}
                  >
                    借貸對調
                  </Button>
                </Box>
              )
            }
            sx={{
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '& .MuiCardHeader-subheader': {
                color: 'primary.contrastText',
                opacity: 0.8
              }
            }}
          />
          <CardContent sx={{ pt: 3 }}>
            {/* 分錄錯誤訊息 */}
            {errors.entries && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.entries}
              </Alert>
            )}
            
            {/* 借貸平衡錯誤訊息 */}
            {balanceError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {balanceError}
              </Alert>
            )}

            {/* 借貸分錄表單 */}
            <DoubleEntryFormWithEntries3
              entries={entries}
              onChange={onEntriesChange}
              organizationId={organizationId}
              isCopyMode={isCopyMode}
              disabled={!permissions.canEdit}
            />
          </CardContent>
        </Card>
      )}

      {/* 科目選擇對話框 */}
      <Dialog
        open={accountSelectorOpen}
        onClose={() => setAccountSelectorOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            height: '80vh',
            maxHeight: '600px'
          }
        }}
      >
        <DialogTitle>
          <Typography variant="h6" component="div">
            選擇{accountSelectorPosition === 'from' ? '來源' : '目標'}科目
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          <AccountSelector3
            selectedAccountId=""
            organizationId={organizationId}
            onAccountSelect={handleAccountSelectConfirm}
            onCancel={() => setAccountSelectorOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default EnhancedDoubleEntrySection;