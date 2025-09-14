import React, { FC } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  OpenInNew as OpenInNewIcon,
  Lock as LockIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  SwapHoriz as SwapHorizIcon
} from '@mui/icons-material';

export interface ActionButtonsProps {
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onPreviewMouseEnter?: (e: React.MouseEvent) => void;
  onPreviewMouseLeave?: () => void;
  isDeleteDisabled?: boolean;
  status?: string;
  onUnlock?: () => void;
  relatedTransactionGroupId?: string;
  accountingEntryType?: 'expense-asset' | 'asset-liability';
  onViewAccountingEntry?: () => void;
  hasPaidAmount?: boolean;
  purchaseOrderId?: string;
}

const COLORS = {
  EXPENSE_ASSET: '#d33737ff',
  ASSET_LIABILITY: '#2a74b1ff',
  DEFAULT: '#696969ff'
} as const;

const COMMON_STYLES = {
  hoverBackground: 'rgba(0, 0, 0, 0.04)',
  hoverBackgroundDark: 'rgba(0, 0, 0, 0.1)',
  accountingButton: {
    border: '1px solid currentColor',
    borderWidth: '2px',
    borderRadius: '4px'
  }
} as const;

const getAccountingConfig = (accountingEntryType?: string, relatedTransactionGroupId?: string) => {
  if (accountingEntryType === 'expense-asset') {
    return {
      color: COLORS.EXPENSE_ASSET,
      icon: <TrendingUpIcon fontSize="medium" />
    };
  }
  if (accountingEntryType === 'asset-liability') {
    return {
      color: COLORS.ASSET_LIABILITY,
      icon: <SwapHorizIcon fontSize="medium" />
    };
  }
  if (relatedTransactionGroupId) {
    return {
      color: COLORS.DEFAULT,
      icon: <AccountBalanceIcon fontSize="medium" />
    };
  }
  return {
    color: COLORS.DEFAULT,
    icon: <AccountBalanceIcon fontSize="medium" />
  };
};

export const ActionButtons: FC<ActionButtonsProps> = ({
  onView,
  onEdit,
  onDelete,
  onPreviewMouseEnter,
  onPreviewMouseLeave,
  isDeleteDisabled,
  status,
  onUnlock,
  relatedTransactionGroupId,
  accountingEntryType,
  onViewAccountingEntry,
  hasPaidAmount,
  purchaseOrderId
}) => {
  void onPreviewMouseEnter;
  void onPreviewMouseLeave;
  void purchaseOrderId;

  const isCompleted = status === 'completed';
  const hasAccountingEntry = !!relatedTransactionGroupId;
  const accountingConfig = getAccountingConfig(accountingEntryType, relatedTransactionGroupId);

  return (
    <Box>
      <IconButton
        size="medium"
        onClick={onView}
        sx={{ '&:hover': { backgroundColor: COMMON_STYLES.hoverBackground } }}
      >
        <OpenInNewIcon fontSize="medium" />
      </IconButton>

      {hasPaidAmount && (
        <IconButton
          size="small"
          disabled
          title="已有付款記錄"
          sx={{
            color: '#4caf50 !important',
            cursor: 'default',
            '&:hover': { backgroundColor: 'transparent' }
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '16px' }}>
            $
          </Typography>
        </IconButton>
      )}

      {hasAccountingEntry && onViewAccountingEntry && (
        <IconButton
          size="medium"
          onClick={onViewAccountingEntry}
          title="檢視會計分錄"
          sx={{
            color: `${accountingConfig.color} !important`,
            '&:hover': { backgroundColor: COMMON_STYLES.hoverBackgroundDark },
            ...COMMON_STYLES.accountingButton
          }}
        >
          {accountingConfig.icon}
        </IconButton>
      )}

      {isCompleted && onUnlock && !hasPaidAmount ? (
        <IconButton
          size="medium"
          onClick={onUnlock}
          title="點擊解鎖並改為可編輯"
        >
          <LockIcon fontSize="medium" />
        </IconButton>
      ) : !isCompleted && !hasPaidAmount ? (
        <>
          <IconButton size="medium" onClick={onEdit}>
            <EditIcon fontSize="medium" />
          </IconButton>
          <IconButton size="medium" onClick={onDelete} disabled={!!isDeleteDisabled}>
            <DeleteIcon fontSize="medium" />
          </IconButton>
        </>
      ) : null}
    </Box>
  );
};

export default ActionButtons;
