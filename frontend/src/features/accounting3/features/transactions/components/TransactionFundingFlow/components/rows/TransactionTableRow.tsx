import React from 'react';
import { TableRow, TableCell, Tooltip } from '@mui/material';
import { TransactionTableRowProps } from '../../types';
import { COLORS, TRANSACTION_TYPES, TABLE_ROW_STYLES } from '../../constants';
import { extractObjectId, isValidObjectId, formatDateOnly } from '../../../../utils/transactionUtils';
import AmountTooltip from '../tooltips/AmountTooltip';
import BalanceTooltip from '../tooltips/BalanceTooltip';

/**
 * 交易表格行組件
 * 根據不同的交易類型渲染不同的表格行
 */
const TransactionTableRow: React.FC<TransactionTableRowProps> = ({
  transactionInfo,
  transactionId,
  index = 0,
  type,
  navigate,
  calculateUsedAmount,
  calculateBalanceInfo,
  loading,
  linkedTransactionDetails
}) => {
  const cleanId = extractObjectId(transactionId);
  const isValid = cleanId && isValidObjectId(cleanId);
  
  // 處理行點擊事件
  const handleRowClick = () => {
    if (type === TRANSACTION_TYPES.CURRENT) {
      window.location.reload();
      return;
    }
    
    if (isValid) {
      console.log(`✅ 導航到交易: /accounting3/transaction/${cleanId}`);
      navigate(`/accounting3/transaction/${cleanId}`);
    } else {
      console.error('❌ 無效的交易 ID:', transactionId);
    }
  };
  
  // 當前交易行
  if (type === TRANSACTION_TYPES.CURRENT) {
    const currentTransactionAmount = transactionInfo.totalAmount || 0;
    const usedByOthersAmount = transactionInfo.referencedByInfo
      ?.filter((ref: any) => ref.status !== 'cancelled')
      .reduce((sum: number, ref: any) => sum + (ref.totalAmount || 0), 0) || 0;
    const currentRemainingAmount = Math.max(0, currentTransactionAmount - usedByOthersAmount);
    
    return (
      <TableRow
        key="current"
        onClick={handleRowClick}
        sx={TABLE_ROW_STYLES}
      >
        <TableCell>{formatDateOnly(transactionInfo.transactionDate)}</TableCell>
        <TableCell>
          <Tooltip title={`編號: ${transactionInfo.groupNumber}`} arrow>
            <span style={{ cursor: 'pointer' }}>{transactionInfo.description}</span>
          </Tooltip>
        </TableCell>
        <TableCell align="center">
          <AmountTooltip
            amount={currentTransactionAmount}
            tooltip={`交易總金額: ${formatAmount(currentTransactionAmount)}`}
          />
        </TableCell>
        <TableCell align="center">
          <BalanceTooltip
            availableAmount={currentRemainingAmount}
            totalAmount={currentTransactionAmount}
            tooltip={`交易總金額: ${formatAmount(currentTransactionAmount)}, 被其他交易使用: ${formatAmount(usedByOthersAmount)}, 當前剩餘: ${formatAmount(currentRemainingAmount)}`}
          />
        </TableCell>
      </TableRow>
    );
  }
  
  // 流向交易行
  if (type === TRANSACTION_TYPES.REFERENCED) {
    const refTotalAmount = transactionInfo.totalAmount || 0;
    const cleanRefId = extractObjectId(transactionInfo._id);
    
    let balanceDisplay;
    if (cleanRefId && linkedTransactionDetails[cleanRefId] && linkedTransactionDetails[cleanRefId].hasRealBalance) {
      const refBalanceData = linkedTransactionDetails[cleanRefId];
      const totalAmount = refBalanceData.totalAmount || 0;
      const availableAmount = refBalanceData.availableAmount || 0;
      
      balanceDisplay = (
        <BalanceTooltip
          availableAmount={availableAmount}
          totalAmount={totalAmount}
          tooltip={`流向交易總額: ${formatAmount(totalAmount)}, API 計算剩餘: ${formatAmount(availableAmount)}`}
        />
      );
    } else if (loading) {
      balanceDisplay = <span style={{ color: '#666', fontStyle: 'italic' }}>載入餘額中...</span>;
    } else {
      balanceDisplay = (
        <Tooltip title={`流向交易狀態: 已使用 ${formatAmount(refTotalAmount)}`} arrow>
          <span style={{ fontWeight: 'medium', color: COLORS.ERROR }}>
            已使用/{formatAmount(refTotalAmount)}
          </span>
        </Tooltip>
      );
    }
    
    return (
      <TableRow
        key={transactionInfo._id}
        onClick={handleRowClick}
        sx={{
          cursor: isValid ? 'pointer' : 'default',
          '&:hover': isValid ? { backgroundColor: COLORS.HOVER_BG } : {}
        }}
      >
        <TableCell>{formatDateOnly(transactionInfo.transactionDate)}</TableCell>
        <TableCell>
          <Tooltip title={`編號: ${transactionInfo.groupNumber}`} arrow>
            <span style={{ cursor: isValid ? 'pointer' : 'default' }}>{transactionInfo.description}</span>
          </Tooltip>
        </TableCell>
        <TableCell align="center">
          <AmountTooltip
            amount={refTotalAmount}
            tooltip={`流向交易使用金額: ${formatAmount(refTotalAmount)}`}
          />
        </TableCell>
        <TableCell align="center">{balanceDisplay}</TableCell>
      </TableRow>
    );
  }
  
  // 來源和關聯交易行
  if (typeof transactionInfo === 'object' && transactionInfo !== null) {
    const hasMultipleSources = type === TRANSACTION_TYPES.LINKED;
    const usedAmount = calculateUsedAmount(transactionInfo, hasMultipleSources);
    const balanceInfo = calculateBalanceInfo(cleanId || '', transactionInfo, usedAmount);
    
    let balanceDisplay;
    if (loading) {
      balanceDisplay = <span style={{ color: '#666', fontStyle: 'italic' }}>載入餘額中...</span>;
    } else {
      const tooltipText = type === TRANSACTION_TYPES.SOURCE
        ? `來源交易總額: ${formatAmount(balanceInfo.totalAmount)}, 使用金額: ${formatAmount(usedAmount)}, 調整後剩餘: ${formatAmount(balanceInfo.availableAmount)}`
        : `關聯交易總額: ${formatAmount(balanceInfo.totalAmount)}, 使用金額: ${formatAmount(usedAmount)}, 調整後剩餘: ${formatAmount(balanceInfo.availableAmount)}`;
      
      balanceDisplay = (
        <BalanceTooltip
          availableAmount={balanceInfo.availableAmount}
          totalAmount={balanceInfo.totalAmount}
          tooltip={tooltipText}
        />
      );
    }
    
    return (
      <TableRow
        key={cleanId || index}
        onClick={handleRowClick}
        sx={{
          cursor: isValid ? 'pointer' : 'default',
          '&:hover': isValid ? { backgroundColor: COLORS.HOVER_BG } : {}
        }}
      >
        <TableCell>
          {transactionInfo.transactionDate ? formatDateOnly(transactionInfo.transactionDate) : '未知日期'}
        </TableCell>
        <TableCell>
          <Tooltip title={`編號: ${transactionInfo.groupNumber || '未知編號'}`} arrow>
            <span style={{ cursor: isValid ? 'pointer' : 'default' }}>
              {transactionInfo.description || '無描述'}
            </span>
          </Tooltip>
        </TableCell>
        <TableCell align="center">
          <AmountTooltip
            amount={usedAmount}
            tooltip={`從此${type === TRANSACTION_TYPES.SOURCE ? '來源' : '關聯交易'}使用金額: ${formatAmount(usedAmount)}`}
          />
        </TableCell>
        <TableCell align="center">{balanceDisplay}</TableCell>
      </TableRow>
    );
  }
  
  // 只有 ID 的情況
  return (
    <TableRow
      key={cleanId || index}
      onClick={handleRowClick}
      sx={{
        cursor: isValid ? 'pointer' : 'default',
        '&:hover': isValid ? { backgroundColor: COLORS.HOVER_BG } : {}
      }}
    >
      <TableCell colSpan={4}>
        {type === TRANSACTION_TYPES.SOURCE ? '來源交易' : '關聯交易'} {index + 1} (僅 ID)
      </TableCell>
    </TableRow>
  );
};

// 格式化金額的輔助函數
const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export default TransactionTableRow;