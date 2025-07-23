import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  ContentCopy as ContentCopyIcon,
  CheckCircle as ConfirmIcon,
  LockOpen as UnlockIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { ExtendedTransactionGroupWithEntries } from './types';
import { isBalanced, copyTransactionToClipboard } from './utils';
import { ACTION_TOOLTIPS, TRANSACTION_STATUS } from './constants';

interface AccountTransactionListActionMenuProps {
  anchorEl: HTMLElement | null;
  transaction: ExtendedTransactionGroupWithEntries | null;
  onClose: () => void;
  onView?: (transaction: ExtendedTransactionGroupWithEntries) => void;
  onEdit?: (transaction: ExtendedTransactionGroupWithEntries) => void;
  onCopy?: (transaction: ExtendedTransactionGroupWithEntries) => void;
  onConfirm?: (id: string) => void;
  onUnlock?: (id: string) => void;
  onDelete?: (id: string) => void;
}

/**
 * 交易操作選單組件
 * 提供交易的各種操作選項
 */
export const AccountTransactionListActionMenu: React.FC<AccountTransactionListActionMenuProps> = ({
  anchorEl,
  transaction,
  onClose,
  onView,
  onEdit,
  onCopy,
  onConfirm,
  onUnlock,
  onDelete
}) => {
  // 處理查看交易
  const handleView = () => {
    if (transaction && onView) {
      onView(transaction);
    }
    onClose();
  };

  // 處理編輯交易
  const handleEdit = () => {
    if (transaction && onEdit) {
      onEdit(transaction);
    }
    onClose();
  };

  // 處理複製交易
  const handleCopy = async () => {
    if (transaction) {
      if (onCopy) {
        onCopy(transaction);
      } else {
        try {
          await copyTransactionToClipboard(transaction);
        } catch (err) {
          console.error('複製失敗:', err);
        }
      }
    }
    onClose();
  };

  // 處理確認交易
  const handleConfirm = () => {
    if (transaction && onConfirm) {
      onConfirm(transaction._id);
    }
    onClose();
  };

  // 處理解鎖交易
  const handleUnlock = () => {
    if (transaction && onUnlock) {
      onUnlock(transaction._id);
    }
    onClose();
  };

  // 處理刪除交易
  const handleDelete = () => {
    if (transaction && onDelete) {
      onDelete(transaction._id);
    }
    onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
    >
      {onView && (
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{ACTION_TOOLTIPS.VIEW}</ListItemText>
        </MenuItem>
      )}
      
      {onEdit && transaction?.status === TRANSACTION_STATUS.DRAFT && (
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{ACTION_TOOLTIPS.EDIT}</ListItemText>
        </MenuItem>
      )}

      <MenuItem onClick={handleCopy}>
        <ListItemIcon>
          <ContentCopyIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>{ACTION_TOOLTIPS.COPY}</ListItemText>
      </MenuItem>

      {/* 確認按鈕 - 只有草稿狀態且已平衡可以確認 */}
      {onConfirm && transaction?.status === TRANSACTION_STATUS.DRAFT &&
       transaction.entries && isBalanced(transaction.entries) && (
        <MenuItem onClick={handleConfirm}>
          <ListItemIcon>
            <ConfirmIcon fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>{ACTION_TOOLTIPS.CONFIRM}</ListItemText>
        </MenuItem>
      )}

      {/* 解鎖按鈕 - 只有已確認狀態可以解鎖 */}
      {onUnlock && transaction?.status === TRANSACTION_STATUS.CONFIRMED && (
        <MenuItem onClick={handleUnlock}>
          <ListItemIcon>
            <UnlockIcon fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText>{ACTION_TOOLTIPS.UNLOCK}</ListItemText>
        </MenuItem>
      )}

      {/* 刪除按鈕 - 只有草稿狀態可以刪除 */}
      {onDelete && transaction?.status === TRANSACTION_STATUS.DRAFT && (
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>{ACTION_TOOLTIPS.DELETE}</ListItemText>
        </MenuItem>
      )}
    </Menu>
  );
};

export default AccountTransactionListActionMenu;