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
 *
 * 此 Hook 提供交易相關的操作功能，包括編輯、複製、刪除和返回列表等。
 * 它可以接受外部傳入的回調函數，或使用預設的導航邏輯。
 *
 * 功能：
 * - 處理交易編輯操作
 * - 處理交易複製操作
 * - 處理交易刪除操作（包含確認提示）
 * - 處理返回交易列表操作
 *
 * @param {object} props - Hook 參數
 * @param {TransactionGroupWithEntries3 | null} props.transaction - 交易資料
 * @param {function} [props.onEdit] - 可選的編輯交易回調函數
 * @param {function} [props.onDelete] - 可選的刪除交易回調函數
 * @param {function} [props.onCopy] - 可選的複製交易回調函數
 * @returns {UseTransactionActionsReturn} 包含交易操作方法的物件
 * @returns {() => void} return.handleEdit - 處理編輯交易的方法
 * @returns {() => void} return.handleCopy - 處理複製交易的方法
 * @returns {() => void} return.handleDelete - 處理刪除交易的方法
 * @returns {() => void} return.handleBackToList - 處理返回列表的方法
 *
 * @example
 * // 在元件中使用
 * const { handleEdit, handleCopy, handleDelete, handleBackToList } = useTransactionActions({
 *   transaction,
 *   onEdit: (transaction) => console.log('編輯交易', transaction),
 *   onDelete: (id) => console.log('刪除交易', id),
 *   onCopy: (transaction) => console.log('複製交易', transaction)
 * });
 *
 * // 使用預設導航邏輯
 * const { handleEdit, handleCopy, handleDelete, handleBackToList } = useTransactionActions({
 *   transaction
 * });
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