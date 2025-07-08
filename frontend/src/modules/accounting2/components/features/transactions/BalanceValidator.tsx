import React from 'react';
import {
  Box,
  Alert,
  Typography,
  Button,
  Chip,
  Paper
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  SwapHoriz as SwapIcon,
  Balance as BalanceIcon
} from '@mui/icons-material';
import { EmbeddedAccountingEntryFormData } from '@pharmacy-pos/shared';

// 平衡資訊介面
interface BalanceInfo {
  totalDebit: number;
  totalCredit: number;
  difference: number;
  isBalanced: boolean;
}

// 驗證結果介面
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// BalanceValidator Props 介面
interface BalanceValidatorProps {
  entries: EmbeddedAccountingEntryFormData[];
  balanceInfo: BalanceInfo;
  validationResult: ValidationResult;
  disabled?: boolean;
  onQuickBalance?: () => void;
  onSwapDebitCredit?: () => void;
}

/**
 * 借貸平衡驗證組件
 * 
 * 職責：
 * - 顯示借貸平衡狀態
 * - 提供快速平衡功能
 * - 顯示驗證錯誤訊息
 * - 提供借貸對調功能
 */
export const BalanceValidator: React.FC<BalanceValidatorProps> = ({
  entries,
  balanceInfo,
  validationResult,
  disabled = false,
  onQuickBalance,
  onSwapDebitCredit
}) => {
  // 計算平衡狀態的顏色和圖示
  const getBalanceStatus = () => {
    if (balanceInfo.isBalanced) {
      return {
        color: 'success.main' as const,
        icon: <CheckCircleIcon sx={{ fontSize: 20 }} />,
        text: '借貸平衡'
      };
    } else {
      return {
        color: 'error.main' as const,
        icon: <ErrorIcon sx={{ fontSize: 20 }} />,
        text: `不平衡 (差額: NT$ ${balanceInfo.difference.toLocaleString()})`
      };
    }
  };

  const balanceStatus = getBalanceStatus();

  return (
    <Box sx={{ mt: 2 }}>
      {/* 平衡狀態顯示 */}
      <Paper sx={{ p: 2, mb: 2, bgcolor: balanceInfo.isBalanced ? 'success.50' : 'error.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ color: balanceStatus.color }}>
              {balanceStatus.icon}
            </Box>
            <Typography variant="h6" color={balanceStatus.color}>
              {balanceStatus.text}
            </Typography>
          </Box>

          {/* 平衡操作按鈕 */}
          {!disabled && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {!balanceInfo.isBalanced && onQuickBalance && entries.length >= 2 && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<BalanceIcon />}
                  onClick={onQuickBalance}
                  color="primary"
                >
                  快速平衡
                </Button>
              )}
              
              {onSwapDebitCredit && entries.some(e => e.debitAmount > 0 || e.creditAmount > 0) && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SwapIcon />}
                  onClick={onSwapDebitCredit}
                  color="secondary"
                >
                  借貸對調
                </Button>
              )}
            </Box>
          )}
        </Box>

        {/* 詳細金額資訊 */}
        <Box sx={{ mt: 1, display: 'flex', gap: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              借方總額:
            </Typography>
            <Chip
              label={`NT$ ${balanceInfo.totalDebit.toLocaleString()}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              貸方總額:
            </Typography>
            <Chip
              label={`NT$ ${balanceInfo.totalCredit.toLocaleString()}`}
              size="small"
              color="secondary"
              variant="outlined"
            />
          </Box>
        </Box>
      </Paper>

      {/* 驗證錯誤提示 */}
      {!validationResult.isValid && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            分錄驗證失敗：
          </Typography>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            {validationResult.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      {/* 提示訊息 */}
      {entries.length === 1 && !disabled && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          複式記帳需要至少兩筆分錄，請新增更多分錄
        </Alert>
      )}
      
      {/* 已確認狀態提示 */}
      {disabled && (
        <Alert severity="info" sx={{ mb: 2 }}>
          此交易已確認，無法修改分錄內容
        </Alert>
      )}

      {/* 平衡建議 */}
      {!balanceInfo.isBalanced && !disabled && entries.length >= 2 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            💡 平衡建議：
          </Typography>
          <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.5rem' }}>
            <li>檢查所有分錄的金額是否正確</li>
            <li>確認借方和貸方分錄的對應關係</li>
            <li>使用「快速平衡」功能自動調整最後一筆分錄</li>
            {balanceInfo.difference > 0 && (
              <li>目前借方多出 NT$ {balanceInfo.difference.toLocaleString()}，需要增加貸方金額</li>
            )}
            {balanceInfo.difference < 0 && (
              <li>目前貸方多出 NT$ {Math.abs(balanceInfo.difference).toLocaleString()}，需要增加借方金額</li>
            )}
          </ul>
        </Alert>
      )}
    </Box>
  );
};

export default BalanceValidator;