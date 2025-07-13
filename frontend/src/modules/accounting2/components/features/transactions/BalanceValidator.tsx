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


  return (
    <Box sx={{ mt: 2 }}>


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

    </Box>
  );
};

export default BalanceValidator;