import React, { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  Typography,
  TextField,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  Fade
} from '@mui/material';
import {
  SwapHoriz as SwapIcon,
  ArrowForward as ArrowForwardIcon,
  AccountBalance as AccountIcon,
  Settings as AdvancedIcon,
  Speed as QuickIcon
} from '@mui/icons-material';
import { EmbeddedAccountingEntry3FormData } from '@pharmacy-pos/shared/types/accounting3';

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

interface SimpleTransactionFlowProps {
  // 基本資料
  entries: EmbeddedAccountingEntry3FormData[];
  availableAccounts: AccountOption[];
  amount: number;
  description: string;
  
  // 事件處理
  onEntriesChange: (entries: EmbeddedAccountingEntry3FormData[]) => void;
  onAmountChange: (amount: number) => void;
  onDescriptionChange: (description: string) => void;
  onOpenAccountSelector: (position: 'from' | 'to') => void;
  onToggleAdvancedMode: () => void;
  
  // 狀態
  disabled?: boolean;
  errors?: Record<string, string>;
}

/**
 * 簡易交易流向組件
 * 
 * 特點：
 * - 只顯示流向圖的兩端（來源科目 → 目標科目）
 * - 中間有一鍵借貸對調按鈕
 * - 只需填寫一個金額（自動平衡）
 * - 可切換到進階模式
 */
export const SimpleTransactionFlow: React.FC<SimpleTransactionFlowProps> = ({
  entries,
  availableAccounts,
  amount,
  description,
  onEntriesChange,
  onAmountChange,
  onDescriptionChange,
  onOpenAccountSelector,
  onToggleAdvancedMode,
  disabled = false,
  errors = {}
}) => {
  // 從分錄中提取來源和目標科目
  const { fromAccount, toAccount, isValid } = useMemo(() => {
    if (entries.length < 2) {
      return { fromAccount: null, toAccount: null, isValid: false };
    }

    // 找到借方和貸方分錄
    const debitEntry = entries.find(entry => (entry.debitAmount || 0) > 0) || entries[1];
    const creditEntry = entries.find(entry => (entry.creditAmount || 0) > 0) || entries[0];

    // 找到對應的科目資訊
    const debitAccountInfo = debitEntry?.accountId ?
      availableAccounts.find(acc => acc._id === debitEntry.accountId) : null;
    const creditAccountInfo = creditEntry?.accountId ?
      availableAccounts.find(acc => acc._id === creditEntry.accountId) : null;

    // 判斷資金流向：基於科目類型決定流向
    let fromAccountInfo = null;
    let toAccountInfo = null;

    if (debitAccountInfo && creditAccountInfo) {
      // 根據科目類型判斷資金流向
      const debitAccountType = debitAccountInfo.accountType;
      const creditAccountType = creditAccountInfo.accountType;

      // 資金流向邏輯：
      // 1. 收入類科目 → 資產類科目 (如：利息收入 → 銀行存款)
      // 2. 資產類科目 → 費用類科目 (如：現金 → 辦公費用)
      // 3. 負債/權益類科目 → 資產類科目 (如：應付帳款 → 現金)
      
      if (creditAccountType === 'revenue' && debitAccountType === 'asset') {
        // 收入 → 資產：利息收入 → 銀行
        fromAccountInfo = creditAccountInfo;
        toAccountInfo = debitAccountInfo;
      } else if (creditAccountType === 'asset' && debitAccountType === 'expense') {
        // 資產 → 費用：現金 → 辦公費用
        fromAccountInfo = creditAccountInfo;
        toAccountInfo = debitAccountInfo;
      } else if ((creditAccountType === 'liability' || creditAccountType === 'equity') && debitAccountType === 'asset') {
        // 負債/權益 → 資產：應付帳款 → 現金
        fromAccountInfo = creditAccountInfo;
        toAccountInfo = debitAccountInfo;
      } else if (creditAccountType === 'asset' && debitAccountType === 'asset') {
        // 資產 → 資產：銀行 → 現金 (轉帳)
        fromAccountInfo = creditAccountInfo;
        toAccountInfo = debitAccountInfo;
      } else {
        // 預設：貸方 → 借方
        fromAccountInfo = creditAccountInfo;
        toAccountInfo = debitAccountInfo;
      }
    }

    console.log('🔍 SimpleTransactionFlow 科目解析:', {
      entries,
      debitEntry,
      creditEntry,
      debitAccountInfo,
      creditAccountInfo,
      fromAccountInfo,
      toAccountInfo,
      flowDirection: `${fromAccountInfo?.name || '未知'} → ${toAccountInfo?.name || '未知'}`
    });

    return {
      fromAccount: fromAccountInfo || null,
      toAccount: toAccountInfo || null,
      isValid: !!(fromAccountInfo && toAccountInfo)
    };
  }, [entries, availableAccounts]);

  // 取得科目顯示名稱
  const getAccountDisplayName = (account: AccountOption | null) => {
    if (!account) return '請選擇科目';
    return `${account.name} (${account.code})`;
  };

  // 處理借貸對調
  const handleSwapAccounts = () => {
    if (entries.length < 2 || !isValid) return;

    const newEntries = [...entries];
    
    // 交換借貸方向
    newEntries.forEach(entry => {
      const temp = entry.debitAmount;
      entry.debitAmount = entry.creditAmount;
      entry.creditAmount = temp;
    });

    onEntriesChange(newEntries);
  };

  // 處理金額變更
  const handleAmountChange = (newAmount: number) => {
    onAmountChange(newAmount);
    
    // 更新分錄金額
    if (entries.length >= 2) {
      const newEntries = [...entries];
      
      // 找到借方和貸方分錄
      const debitIndex = newEntries.findIndex(entry => (entry.debitAmount || 0) > 0);
      const creditIndex = newEntries.findIndex(entry => (entry.creditAmount || 0) > 0);
      
      if (debitIndex >= 0 && creditIndex >= 0) {
        newEntries[debitIndex] = {
          ...newEntries[debitIndex],
          accountId: newEntries[debitIndex]?.accountId || '',
          debitAmount: newAmount,
          creditAmount: newEntries[debitIndex]?.creditAmount || 0,
          description: newEntries[debitIndex]?.description || ''
        };
        newEntries[creditIndex] = {
          ...newEntries[creditIndex],
          accountId: newEntries[creditIndex]?.accountId || '',
          creditAmount: newAmount,
          debitAmount: newEntries[creditIndex]?.debitAmount || 0,
          description: newEntries[creditIndex]?.description || ''
        };
        onEntriesChange(newEntries);
      }
    }
  };

  // 處理科目選擇
  const handleAccountSelect = (position: 'from' | 'to') => {
    onOpenAccountSelector(position);
  };

  // 格式化金額顯示
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD'
    }).format(amount);
  };

  return (
    <Card sx={{ mb: 3, boxShadow: 2 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QuickIcon color="primary" />
            <Typography variant="h6">簡易輸入模式</Typography>
            <Chip 
              label="一借一貸" 
              size="small" 
              color="primary" 
              variant="outlined"
            />
          </Box>
        }
        action={
          <Tooltip title="切換到進階模式">
            <Button
              variant="outlined"
              size="small"
              startIcon={<AdvancedIcon />}
              onClick={onToggleAdvancedMode}
              disabled={disabled}
            >
              進階模式
            </Button>
          </Tooltip>
        }
        sx={{
          backgroundColor: 'primary.50',
          '& .MuiCardHeader-title': {
            color: 'primary.main'
          }
        }}
      />
      
      <CardContent sx={{ pt: 3 }}>
        {/* 錯誤提示 */}
        {errors.entries && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.entries}
          </Alert>
        )}

        {/* 輸入列 - 所有輸入控制項在同一列 */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
          {/* 交易流向選擇器 - 占50%寬度 */}
          <Box sx={{ flex: 1 }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              p: 1.5,
              border: '2px solid',
              borderColor: isValid ? 'success.light' : 'grey.300',
              borderRadius: 2,
              
              transition: 'all 0.3s ease',
              minHeight: 56 // 與 TextField 高度一致
            }}>
              {/* 來源科目 */}
              <Box sx={{ flex: 1 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<AccountIcon />}
                  onClick={() => handleAccountSelect('from')}
                  disabled={disabled}
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    minHeight: 32,
                    
                    borderColor: fromAccount ? 'secondary.main' : 'grey.300',
                    color: fromAccount ? 'secondary.main' : 'text.secondary',
                    fontSize: '1rem',
                    '&:hover': {
                      bgcolor: fromAccount ? 'secondary.100' : 'grey.50'
                    }
                  }}
                >
                  <Typography variant="body2" noWrap sx={{ fontSize: '1rem' }}>
                    {fromAccount ? fromAccount.name : '選擇來源'}
                  </Typography>
                </Button>
              </Box>

              {/* 借貸對調按鈕 */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                <Tooltip title="一鍵借貸對調">
                  <IconButton
                    color="primary"
                    onClick={handleSwapAccounts}
                    disabled={disabled || !isValid}
                    size="small"
                    sx={{
                      bgcolor: 'primary.50',
                      border: '2px solid',
                      borderColor: 'primary.main',
                      width: 24,
                      height: 24,
                      '&:hover': {
                        bgcolor: 'primary.100'
                      },
                      '&:disabled': {
                        bgcolor: 'grey.100',
                        borderColor: 'grey.300'
                      }
                    }}
                  >
                    <SwapIcon sx={{ fontSize: 13 }} />
                  </IconButton>
                </Tooltip>
                <ArrowForwardIcon
                  sx={{
                    color: isValid ? 'success.main' : 'grey.400',
                    fontSize: 13
                  }}
                />
              </Box>

              {/* 目標科目 */}
              <Box sx={{ flex: 1 }}>
                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<AccountIcon />}
                  onClick={() => handleAccountSelect('to')}
                  disabled={disabled}
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    minHeight: 32,
                    bgcolor: toAccount ? 'primary.50' : 'background.paper',
                    borderColor: toAccount ? 'primary.main' : 'grey.300',
                    color: toAccount ? 'primary.main' : 'text.secondary',
                    fontSize: '1rem',
                    '&:hover': {
                      bgcolor: toAccount ? 'primary.100' : 'grey.50'
                    }
                  }}
                >
                  <Typography variant="body2" noWrap sx={{ fontSize: '1rem' }}>
                    {toAccount ? toAccount.name : '選擇目標'}
                  </Typography>
                </Button>
              </Box>
            </Box>
          </Box>

          {/* 金額輸入 - 占25%寬度 */}
          <Box sx={{ width: '20%' }}>
            <TextField
              fullWidth
              type="number"
              value={amount || ''}
              onChange={(e) => handleAmountChange(parseFloat(e.target.value) || 0)}
              disabled={disabled}
              error={!!errors.amount}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary', fontSize: '1rem' }}>$</Typography>
              }}
              inputProps={{
                min: 0,
                step: 0.1
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '1rem'
                }
              }}
            />
          </Box>

          {/* 交易描述 - 占25%寬度 */}
          <Box sx={{ width: '25%' }}>
            <TextField
              fullWidth
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              disabled={disabled}
              error={!!errors.description}
              placeholder="交易描述"
              sx={{
                '& .MuiOutlinedInput-root': {
                  fontSize: '0.875rem'
                }
              }}
            />
          </Box>
        </Box>

        {/* 狀態顯示 */}
        <Fade in={isValid && amount > 0}>
          <Box sx={{ 
            p: 2, 
            bgcolor: 'success.50', 
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'success.light'
          }}>
            <Typography variant="body2" color="success.dark" sx={{ fontWeight: 'medium' }}>
              ✓ 交易已平衡：{formatAmount(amount)} 
              <Typography component="span" variant="caption" sx={{ ml: 1 }}>
                ({fromAccount?.name} → {toAccount?.name})
              </Typography>
            </Typography>
          </Box>
        </Fade>
      </CardContent>
    </Card>
  );
};

export default SimpleTransactionFlow;