import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Stack,
  Tooltip
} from '@mui/material';
import { Link as LinkIcon } from '@mui/icons-material';
import { TransactionGroupWithEntries } from '@pharmacy-pos/shared/types/accounting2';

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

interface AccountTransactionListFundingStatusDisplayProps {
  transaction: ExtendedTransactionGroupWithEntries;
}

// 工具函數 - 提取到組件外部避免重複創建
const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return d.toLocaleDateString('zh-TW');
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD'
  }).format(amount);
};

const calculateTotalAmount = (entries: any[]) => {
  return entries.reduce((total, entry) => total + (entry.debitAmount || 0), 0);
};

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
  // 計算剩餘可用金額（使用後端提供的精確資料）
  const calculateAvailableAmount = (group: ExtendedTransactionGroupWithEntries) => {
    const totalAmount = calculateTotalAmount(group.entries);
    
    if (!group.referencedByInfo || group.referencedByInfo.length === 0) {
      return totalAmount; // 沒有被引用，全額可用
    }
    
    // 🎯 使用後端提供的精確已使用金額資料
    // 計算實際已使用金額（從 referencedByInfo 中獲取，排除已取消的交易）
    const actualUsedAmount = group.referencedByInfo
      .filter(ref => ref.status !== 'cancelled') // 排除已取消的交易
      .reduce((sum, ref) => sum + (ref.totalAmount || 0), 0);
    
    // 剩餘可用金額 = 總金額 - 實際已使用金額
    const availableAmount = totalAmount - actualUsedAmount;
    
    console.log(`💰 交易 ${(group as any).groupNumber} 剩餘可用金額計算:`, {
      totalAmount,
      actualUsedAmount,
      availableAmount,
      referencedByCount: group.referencedByInfo.length,
      referencedBy: group.referencedByInfo.map(ref => ({
        groupNumber: ref.groupNumber,
        amount: ref.totalAmount,
        status: ref.status
      }))
    });
    
    // 確保不會是負數
    return Math.max(0, availableAmount);
  };

  // 取得剩餘可用狀態顏色
  const getAvailableAmountColor = (availableAmount: number, totalAmount: number) => {
    if (totalAmount === 0) return 'default';
    const percentage = (availableAmount / totalAmount) * 100;
    if (percentage >= 100) return 'success';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

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
          title="💰 資金來源追蹤"
          count={transaction.fundingSourceUsages!.length}
          details={renderFundingSourceDetails(transaction.fundingSourceUsages!)}
          summary={<SummaryItem label="總使用金額" value={formatCurrency(totalUsedAmount)} isBold />}
        >
          <Chip
            label={`💰 ${transaction.fundingSourceUsages!.length} 筆`}
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
          title="🔗 被引用情況"
          count={transaction.referencedByInfo!.length}
          details={renderReferenceDetails(transaction.referencedByInfo!)}
          summary={
            <>
              <SummaryItem label="總金額" value={formatCurrency(totalAmount)} />
              <SummaryItem label="已使用" value={formatCurrency(totalAmount - availableAmount)} />
              <SummaryItem label="剩餘可用" value={formatCurrency(availableAmount)} isBold />
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
          無金額交易
        </Typography>
      );
    }
    
    return (
      <Typography variant="body2" color="success.main" sx={{ textAlign: 'center' }}>
        ✓
      </Typography>
    );
  };

  return renderIntegratedFundingStatus();
};

export default AccountTransactionListFundingStatusDisplay;