/**
 * Transaction Detail View
 * 交易詳情檢視組件
 * 
 * 原檔案名稱: TransactionDetailView.tsx
 */

import React from 'react';
import {
  Account3
} from '@pharmacy-pos/shared/types/accounting3';
import { useTransactionDetail } from '../../hooks';

interface TransactionDetailViewProps {
  transactionId: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onBack?: () => void;
}

export const TransactionDetailView: React.FC<TransactionDetailViewProps> = ({
  transactionId,
  onEdit,
  onDelete,
  onBack
}) => {
  const { 
    transaction, 
    loading, 
    error,
    accounts
  } = useTransactionDetail(transactionId);

  if (loading) {
    return <div>載入中...</div>;
  }

  if (error) {
    return <div>錯誤: {error}</div>;
  }

  if (!transaction) {
    return <div>找不到交易記錄</div>;
  }

  const formatDate = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('zh-TW');
  };

  const getAccountName = (accountId: string | Account3) => {
    // 如果 accountId 是 Account3 物件，直接使用它
    if (typeof accountId !== 'string') {
      return `${accountId.code} - ${accountId.name}`;
    }
    
    // 否則從 accounts 物件中查找
    const account = accounts[accountId];
    return account ? `${account.code} - ${account.name}` : '未知科目';
  };

  const totalDebit = transaction.entries.reduce((sum, entry) => sum + entry.debitAmount, 0);
  const totalCredit = transaction.entries.reduce((sum, entry) => sum + entry.creditAmount, 0);
  const isBalanced = totalDebit === totalCredit;

  return (
    <div className="transaction-detail-view">
      <div className="detail-header">
        <h2>交易詳情</h2>
        
        <div className="actions">
          {onBack && (
            <button onClick={onBack}>
              返回
            </button>
          )}
          
          {onEdit && (
            <button onClick={() => onEdit(transaction._id)}>
              編輯
            </button>
          )}
          
          {onDelete && (
            <button onClick={() => onDelete(transaction._id)}>
              刪除
            </button>
          )}
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-section">
          <h3>基本資訊</h3>
          
          <div className="detail-row">
            <div className="detail-label">交易編號</div>
            <div className="detail-value">{transaction.groupNumber}</div>
          </div>
          
          <div className="detail-row">
            <div className="detail-label">日期</div>
            <div className="detail-value">{formatDate(transaction.transactionDate)}</div>
          </div>
          
          <div className="detail-row">
            <div className="detail-label">描述</div>
            <div className="detail-value">{transaction.description}</div>
          </div>
          
          <div className="detail-row">
            <div className="detail-label">狀態</div>
            <div className="detail-value">
              <span className={`status-badge status-${transaction.status}`}>
                {transaction.status}
              </span>
            </div>
          </div>
          
          <div className="detail-row">
            <div className="detail-label">建立時間</div>
            <div className="detail-value">{formatDate(transaction.createdAt)}</div>
          </div>
          
          <div className="detail-row">
            <div className="detail-label">建立者</div>
            <div className="detail-value">{transaction.createdBy}</div>
          </div>
        </div>

        <div className="detail-section">
          <h3>分錄明細</h3>
          
          <table className="entry-table">
            <thead>
              <tr>
                <th>科目</th>
                <th>描述</th>
                <th>借方</th>
                <th>貸方</th>
              </tr>
            </thead>
            <tbody>
              {transaction.entries.map((entry, index) => (
                <tr key={index}>
                  <td>{getAccountName(entry.accountId)}</td>
                  <td>{entry.description || '-'}</td>
                  <td>{entry.debitAmount}</td>
                  <td>{entry.creditAmount}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan={2}>合計</td>
                <td>{totalDebit}</td>
                <td>{totalCredit}</td>
              </tr>
            </tbody>
          </table>
          
          <div className="balance-status">
            {isBalanced ? (
              <span className="balanced">✓ 借貸平衡</span>
            ) : (
              <span className="unbalanced">❌ 借貸不平衡</span>
            )}
          </div>
        </div>

        {/* 附件功能暫時移除，因為 TransactionGroupWithEntries3 沒有 attachments 屬性 */}
      </div>
    </div>
  );
};