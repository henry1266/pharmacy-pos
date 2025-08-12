import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Chip,
  Stack,
  Divider
} from '@mui/material';
import {
  Balance as BalanceIcon,
  SwapHoriz as SwapIcon,
  AutoFixHigh as AutoFixIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { EmbeddedAccountingEntryFormData } from '@pharmacy-pos/shared';

interface BalanceInfo {
  totalDebit: number;
  totalCredit: number;
  difference: number;
  isBalanced: boolean;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface BalanceValidatorProps {
  entries: EmbeddedAccountingEntryFormData[];
  balanceInfo: BalanceInfo;
  validationResult: ValidationResult;
  disabled?: boolean;
  onQuickBalance: () => void;
  onSwapDebitCredit: () => void;
}

/**
 * 平衡驗證器組件
 * 
 * 功能：
 * - 顯示借貸平衡狀態
 * - 提供快速平衡功能
 * - 提供借貸對調功能
 * - 顯示驗證錯誤和警告
 */
export const BalanceValidator: React.FC<BalanceValidatorProps> = ({
  entries,
  balanceInfo,
  validationResult,
  disabled = false,
  onQuickBalance,
  onSwapDebitCredit
}) => {
  // 格式化金額
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD'
    }).format(amount);
  };

  // 取得平衡狀態顏色
  const getBalanceColor = () => {
    if (balanceInfo.isBalanced) return 'success';
    if (balanceInfo.difference > 0) return 'error';
    return 'warning';
  };

  // 取得平衡狀態圖示
  const getBalanceIcon = () => {
    if (balanceInfo.isBalanced) return <CheckIcon />;
    return <ErrorIcon />;
  };

  // 檢查是否可以快速平衡
  const canQuickBalance = () => {
    return !balanceInfo.isBalanced && entries.length >= 2 && !disabled;
  };

  // 檢查是否可以借貸對調
  const canSwapDebitCredit = () => {
    return entries.length >= 2 && entries.some(entry => 
      (entry.debitAmount && entry.debitAmount > 0) || (entry.creditAmount && entry.creditAmount > 0)
    ) && !disabled;
  };

  return (
    <Card variant="outlined" sx={{ mt: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <BalanceIcon />
          <Typography variant="h6">
            借貸平衡驗證
          </Typography>
        </Box>

        {/* 平衡狀態顯示 */}
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
            <Chip
              icon={getBalanceIcon()}
              label={balanceInfo.isBalanced ? '已平衡' : '未平衡'}
              color={getBalanceColor()}
              variant={balanceInfo.isBalanced ? 'filled' : 'outlined'}
            />
            
            {!balanceInfo.isBalanced && (
              <Typography variant="body2" color="error">
                差額: {formatCurrency(balanceInfo.difference)}
              </Typography>
            )}
          </Stack>

          <Stack direction="row" spacing={3} sx={{ mt: 1 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                借方總額
              </Typography>
              <Typography variant="body1" fontWeight="bold" color="primary.main">
                {formatCurrency(balanceInfo.totalDebit)}
              </Typography>
            </Box>
            
            <Box>
              <Typography variant="caption" color="text.secondary">
                貸方總額
              </Typography>
              <Typography variant="body1" fontWeight="bold" color="secondary.main">
                {formatCurrency(balanceInfo.totalCredit)}
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* 快速操作按鈕 */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AutoFixIcon />}
            onClick={onQuickBalance}
            disabled={!canQuickBalance()}
          >
            快速平衡
          </Button>
          
          <Button
            variant="outlined"
            size="small"
            startIcon={<SwapIcon />}
            onClick={onSwapDebitCredit}
            disabled={!canSwapDebitCredit()}
          >
            借貸對調
          </Button>
        </Box>

        {/* 驗證錯誤和警告 */}
        {validationResult.errors.length > 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              發現錯誤：
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {validationResult.errors.map((error, index) => (
                <li key={index}>
                  <Typography variant="body2">{error}</Typography>
                </li>
              ))}
            </ul>
          </Alert>
        )}

        {validationResult.warnings.length > 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              注意事項：
            </Typography>
            <ul style={{ margin: 0, paddingLeft: 20 }}>
              {validationResult.warnings.map((warning, index) => (
                <li key={index}>
                  <Typography variant="body2">{warning}</Typography>
                </li>
              ))}
            </ul>
          </Alert>
        )}

        {/* 平衡成功提示 */}
        {balanceInfo.isBalanced && validationResult.isValid && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2">
              ✅ 借貸平衡正確，可以儲存交易
            </Typography>
          </Alert>
        )}

      </CardContent>
    </Card>
  );
};

export default BalanceValidator;