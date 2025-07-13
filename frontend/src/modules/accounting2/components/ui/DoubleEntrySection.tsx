import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Button,
  Alert
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Help as HelpIcon,
  SwapHoriz as SwapHorizIcon,
  Balance as BalanceIcon
} from '@mui/icons-material';
import { DoubleEntryFormWithEntries } from '../features/transactions/DoubleEntryFormWithEntries';
import { EmbeddedAccountingEntryFormData } from '@pharmacy-pos/shared';

// 型別定義
interface Permissions {
  canEdit: boolean;
}

export interface DoubleEntrySectionProps {
  // 分錄資料
  entries: EmbeddedAccountingEntryFormData[];
  onEntriesChange: (entries: EmbeddedAccountingEntryFormData[]) => void;
  
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
  balanceInfo: {
    isBalanced: boolean;
    totalDebit: number;
    totalCredit: number;
    difference: number;
  };
}

export const DoubleEntrySection: React.FC<DoubleEntrySectionProps> = ({
  entries,
  onEntriesChange,
  organizationId,
  isCopyMode = false,
  mode,
  permissions,
  errors,
  balanceError,
  onOpenTemplateDialog,
  onSwapDebitCredit,
  onQuickBalance,
  balanceInfo
}) => {
  return (
    <Card sx={{ mb: 3, boxShadow: 2 }}>
      <CardHeader
        title="借貸分錄"
        action={
          mode !== 'view' && (
            <Box sx={{ display: 'flex', gap: 1 }}>
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
        <DoubleEntryFormWithEntries
          entries={entries}
          onChange={onEntriesChange}
          organizationId={organizationId}
          isCopyMode={isCopyMode}
          disabled={!permissions.canEdit}
        />
      </CardContent>
    </Card>
  );
};

export default DoubleEntrySection;