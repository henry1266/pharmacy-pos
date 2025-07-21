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
import { TransactionGroupWithEntries, EmbeddedAccountingEntry } from '@pharmacy-pos/shared/types/accounting2';

// 臨時型別擴展，確保 referencedByInfo 和 fundingSourceUsages 屬性可用
interface ExtendedTransactionGroupWithEntries extends TransactionGroupWithEntries {
  referencedByInfo?: Array<{
    _id: string;
    groupNumber: string;
    description: string;
    transactionDate: Date | string;
    totalAmount: number;
    status: 'draft' | 'confirmed' | 'cancelled';
  }>;
  fundingSourceUsages?: Array<{
    sourceTransactionId: string;
    usedAmount: number;
    sourceTransactionDescription?: string;
    sourceTransactionGroupNumber?: string;
    sourceTransactionDate?: Date | string;
    sourceTransactionAmount?: number;
  }>;
}

interface TransactionActionMenuProps {
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
export const TransactionActionMenu: React.FC<TransactionActionMenuProps> = ({
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
  // 檢查借貸平衡
  const isBalanced = (entries: EmbeddedAccountingEntry[]) => {
    const totalDebit = entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
    const totalCredit = entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
    return Math.abs(totalDebit - totalCredit) < 0.01; // 允許小數點誤差
  };

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
          // 格式化貨幣
          const formatCurrency = (amount: number) => {
            return new Intl.NumberFormat('zh-TW', {
              style: 'currency',
              currency: 'TWD'
            }).format(amount);
          };

          // 格式化日期
          const formatDate = (date: Date | string) => {
            const d = new Date(date);
            return d.toLocaleDateString('zh-TW');
          };

          // 取得狀態標籤
          const getStatusLabel = (status: string) => {
            switch (status) {
              case 'confirmed': return '已確認';
              case 'draft': return '草稿';
              case 'cancelled': return '已取消';
              default: return status;
            }
          };

          // 計算交易群組總金額
          const calculateTotalAmount = (entries: any[]) => {
            return entries.reduce((total, entry) => total + (entry.debitAmount || 0), 0);
          };

          // 複製交易資料到剪貼簿
          const transactionData = {
            編號: (transaction as any).groupNumber || 'N/A',
            描述: transaction.description,
            日期: formatDate(transaction.transactionDate),
            狀態: getStatusLabel(transaction.status),
            金額: formatCurrency(calculateTotalAmount(transaction.entries || []))
          };
          
          const textToCopy = Object.entries(transactionData)
            .map(([key, value]) => `${key}: ${value}`)
            .join('\n');
          
          await navigator.clipboard.writeText(textToCopy);
          console.log('交易資料已複製到剪貼簿');
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
          <ListItemText>查看詳情</ListItemText>
        </MenuItem>
      )}
      
      {onEdit && transaction?.status === 'draft' && (
        <MenuItem onClick={handleEdit}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>編輯交易</ListItemText>
        </MenuItem>
      )}

      <MenuItem onClick={handleCopy}>
        <ListItemIcon>
          <ContentCopyIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>複製交易</ListItemText>
      </MenuItem>

      {/* 確認按鈕 - 只有草稿狀態且已平衡可以確認 */}
      {onConfirm && transaction?.status === 'draft' &&
       transaction.entries && isBalanced(transaction.entries) && (
        <MenuItem onClick={handleConfirm}>
          <ListItemIcon>
            <ConfirmIcon fontSize="small" color="success" />
          </ListItemIcon>
          <ListItemText>確認交易</ListItemText>
        </MenuItem>
      )}

      {/* 解鎖按鈕 - 只有已確認狀態可以解鎖 */}
      {onUnlock && transaction?.status === 'confirmed' && (
        <MenuItem onClick={handleUnlock}>
          <ListItemIcon>
            <UnlockIcon fontSize="small" color="warning" />
          </ListItemIcon>
          <ListItemText>解鎖交易</ListItemText>
        </MenuItem>
      )}

      {/* 刪除按鈕 - 只有草稿狀態可以刪除 */}
      {onDelete && transaction?.status === 'draft' && (
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>刪除交易</ListItemText>
        </MenuItem>
      )}
    </Menu>
  );
};

export default TransactionActionMenu;