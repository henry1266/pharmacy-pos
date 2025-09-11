import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Stack,
  Tooltip
} from '@mui/material';
import { Link as LinkIcon } from '@mui/icons-material';
import { ExtendedTransactionGroupWithEntries } from './types';
import {
  formatDate,
  formatCurrency,
  calculateTotalAmount,
  calculateAvailableAmount,
  getAvailableAmountColor
} from './utils';
import { FUNDING_STATUS } from './constants';

interface AccountTransactionListFundingStatusDisplayProps {
  transaction: ExtendedTransactionGroupWithEntries;
}


// 可重用的詳情項目組件
const DetailItem: React.FC<{
  label: string;
  value: string;
  isLast?: boolean;
}> = ({ label, value, isLast = false }) => (
  <Box sx={{
    mb: 1,
    pb: 1,
    borderBottom: !isLast ? '1px solid rgba(255,255,255,0.2)' : 'none'
  }}>
    <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
      <strong>{label}：</strong>{value}
    </Typography>
  </Box>
);

// 可重用的摘要項目組件
const SummaryItem: React.FC<{
  label: string;
  value: string;
  isBold?: boolean;
}> = ({ label, value, isBold = false }) => (
  <Typography
    variant="caption"
    display="block"
    sx={{ fontWeight: isBold ? 'bold' : 'normal' }}
  >
    <strong>{label}：</strong>{value}
  </Typography>
);

// 可重用的 Tooltip 內容組件
const TooltipContent: React.FC<{
  title: string;
  items: React.ReactNode;
  summary: React.ReactNode;
}> = ({ title, items, summary }) => (
  <Box>
    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
      {title}
    </Typography>
    {items}
    <Box sx={{ mt: 1, borderTop: '1px solid rgba(255,255,255,0.2)', pt: 1 }}>
      {summary}
    </Box>
  </Box>
);

/**
 * 資金狀態顯示組件
 * 顯示交易的資金來源和使用狀態
 */
export const AccountTransactionListFundingStatusDisplay: React.FC<AccountTransactionListFundingStatusDisplayProps> = ({
  transaction
}) => {

  // 渲染資金來源詳情
  const renderFundingSourceDetails = (usages: NonNullable<ExtendedTransactionGroupWithEntries['fundingSourceUsages']>) => {
    return (
      <>
        {usages.map((usage, index) => (
          <DetailItem
            key={usage.sourceTransactionId}
            label={`來源 ${index + 1}`}
            value={`${usage.sourceTransactionDescription || '未知交易'} (編號: ${usage.sourceTransactionGroupNumber || 'N/A'}) - ${formatCurrency(usage.usedAmount)}`}
            isLast={index === usages.length - 1}
          />
        ))}
      </>
    );
  };

  // 渲染引用詳情
  const renderReferenceDetails = (references: NonNullable<ExtendedTransactionGroupWithEntries['referencedByInfo']>) => {
    return (
      <>
        {references.map((ref, index) => (
          <DetailItem
            key={ref._id}
            label={`${formatDate(ref.transactionDate)} - ${ref.groupNumber}`}
            value={`${ref.description} (${formatCurrency(ref.totalAmount)})`}
            isLast={index === references.length - 1}
          />
        ))}
      </>
    );
  };

  // 可重用的 Tooltip 包裝組件
  const TooltipWrapper: React.FC<{
    title: string;
    count: number;
    details: React.ReactNode;
    summary: React.ReactNode;
    children: React.ReactNode;
  }> = ({ title, count, details, summary, children }) => (
    <Tooltip
      title={
        <TooltipContent
          title={`${title} (${count} 筆)`}
          items={details}
          summary={summary}
        />
      }
      arrow
      placement="left"
    >
      <Stack direction="column" spacing={0.5} alignItems="center">
        {children}
      </Stack>
    </Tooltip>
  );

  // 渲染整合的資金狀態
  const renderIntegratedFundingStatus = () => {
    const totalAmount = calculateTotalAmount(transaction.entries);
    const availableAmount = calculateAvailableAmount(transaction);
    const hasReferences = transaction.referencedByInfo && transaction.referencedByInfo.length > 0;
    const hasFundingSources = transaction.fundingSourceUsages && transaction.fundingSourceUsages.length > 0;
    
    // 如果有資金來源使用，優先顯示資金來源資訊
    if (hasFundingSources) {
      const totalUsedAmount = transaction.fundingSourceUsages!.reduce((sum, usage) => sum + usage.usedAmount, 0);
      
      return (
        <TooltipWrapper
          title={`${FUNDING_STATUS.ICONS.FUNDING_SOURCE} ${FUNDING_STATUS.LABELS.FUNDING_SOURCE_TRACKING}`}
          count={transaction.fundingSourceUsages!.length}
          details={renderFundingSourceDetails(transaction.fundingSourceUsages!)}
          summary={<SummaryItem label={FUNDING_STATUS.LABELS.TOTAL_USED_AMOUNT} value={formatCurrency(totalUsedAmount)} isBold />}
        >
          <Chip
            label={`${FUNDING_STATUS.ICONS.FUNDING_SOURCE} ${transaction.fundingSourceUsages!.length} 筆`}
            size="small"
            variant="outlined"
            color="primary"
            sx={{ cursor: 'help' }}
          />
          <Typography variant="caption" color="text.secondary">
            {formatCurrency(totalUsedAmount)}
          </Typography>
        </TooltipWrapper>
      );
    }
    
    // 如果被引用，顯示被引用和剩餘可用狀態
    if (hasReferences) {
      const color = getAvailableAmountColor(availableAmount, totalAmount);
      
      return (
        <TooltipWrapper
          title={`${FUNDING_STATUS.ICONS.REFERENCED} ${FUNDING_STATUS.LABELS.REFERENCED_SITUATION}`}
          count={transaction.referencedByInfo!.length}
          details={renderReferenceDetails(transaction.referencedByInfo!)}
          summary={
            <>
              <SummaryItem label={FUNDING_STATUS.LABELS.TOTAL_AMOUNT} value={formatCurrency(totalAmount)} />
              <SummaryItem label={FUNDING_STATUS.LABELS.USED_AMOUNT} value={formatCurrency(totalAmount - availableAmount)} />
              <SummaryItem label={FUNDING_STATUS.LABELS.AVAILABLE_AMOUNT} value={formatCurrency(availableAmount)} isBold />
            </>
          }
        >
          <Chip
            icon={<LinkIcon />}
            label={` ${transaction.referencedByInfo!.length} 筆`}
            color="warning"
            size="small"
            variant="outlined"
            sx={{ cursor: 'help' }}
          />
          <Chip
            label={formatCurrency(availableAmount)}
            color={color}
            size="small"
            variant={availableAmount === totalAmount ? 'filled' : 'outlined'}
          />
        </TooltipWrapper>
      );
    }
    
    // 沒有資金追蹤的情況
    if (totalAmount === 0) {
      return (
        <Typography variant="caption" color="text.secondary">
          {FUNDING_STATUS.LABELS.NO_AMOUNT_TRANSACTION}
        </Typography>
      );
    }
    
    return (
      <Typography variant="body2" color="success.main" sx={{ textAlign: 'center' }}>
        {FUNDING_STATUS.ICONS.SUCCESS}
      </Typography>
    );
  };

  return renderIntegratedFundingStatus();
};

export default AccountTransactionListFundingStatusDisplay;