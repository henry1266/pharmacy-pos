import { useNavigate } from 'react-router-dom';
import { TransactionGroupWithEntries3 } from '@pharmacy-pos/shared/types/accounting3';
import { accounting3Service } from '../../../services/accounting3Service';

interface UseTransactionActionsProps {
  transaction: TransactionGroupWithEntries3 | null;
  onEdit?: (transaction: TransactionGroupWithEntries3) => void;
  onDelete?: (transactionId: string) => void;
  onCopy?: (transaction: TransactionGroupWithEntries3) => void;
}

interface UseTransactionActionsReturn {
  handleEdit: () => void;
  handleCopy: () => void;
  handleDelete: () => void;
  handleBackToList: () => void;
}

/**
 * 自定義 Hook 用於處理交易操作邏輯
 */
export const useTransactionActions = ({
  transaction,
  onEdit,
  onDelete,
  onCopy
}: UseTransactionActionsProps): UseTransactionActionsReturn => {
  const navigate = useNavigate();

  // 處理編輯
  const handleEdit = () => {
    if (transaction && onEdit) {
      onEdit(transaction);
    } else if (transaction) {
      navigate(`/accounting3/transaction/${transaction._id}/edit`);
    }
  };

  // 處理複製
  const handleCopy = () => {
    if (transaction && onCopy) {
      onCopy(transaction);
    } else if (transaction) {
      navigate(`/accounting3/transaction/${transaction._id}/copy`);
    }
  };

  // 處理刪除
  const handleDelete = () => {
    if (transaction && window.confirm('確定要刪除這筆交易嗎？此操作無法復原。')) {
      if (onDelete) {
        onDelete(transaction._id);
      } else {
        // 預設刪除邏輯
        accounting3Service.transactions.delete(transaction._id)
          .then(() => {
            navigate('/accounting3');
          })
          .catch((error) => {
            console.error('刪除交易失敗:', error);
            alert('刪除交易失敗');
          });
      }
    }
  };

  // 處理返回列表
  const handleBackToList = () => {
    navigate('/accounting3/transaction');
  };

  return {
    handleEdit,
    handleCopy,
    handleDelete,
    handleBackToList
  };
};