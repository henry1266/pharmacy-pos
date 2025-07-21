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

interface FundingStatusDisplayProps {
  transaction: ExtendedTransactionGroupWithEntries;
}

/**
 * 資金狀態顯示組件
 * 顯示交易的資金來源和使用狀態
 */
export const FundingStatusDisplay: React.FC<FundingStatusDisplayProps> = ({
  transaction
}) => {
  // 格式化日期
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('zh-TW');
  };

  // 格式化貨幣
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD'
    }).format(amount);
  };

  // 計算交易群組總金額
  const calculateTotalAmount = (entries: any[]) => {
    return entries.reduce((total, entry) => total + (entry.debitAmount || 0), 0);
  };

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
        <Tooltip
          title={
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                💰 資金來源追蹤 ({transaction.fundingSourceUsages!.length} 筆)
              </Typography>
              
              {transaction.fundingSourceUsages!.map((usage, index) => (
                <Box key={usage.sourceTransactionId} sx={{ mb: 1, pb: 1, borderBottom: index < transaction.fundingSourceUsages!.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>
                  <Typography variant="caption" display="block" sx={{ mb: 0.5, fontWeight: 'bold' }}>
                    來源 {index + 1}: {usage.sourceTransactionDescription || '未知交易'}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                    <strong>編號：</strong>{usage.sourceTransactionGroupNumber || 'N/A'}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                    <strong>使用金額：</strong>{formatCurrency(usage.usedAmount)}
                  </Typography>
                </Box>
              ))}
              
              <Typography variant="caption" display="block" sx={{ mt: 1, fontWeight: 'bold', borderTop: '1px solid rgba(255,255,255,0.2)', pt: 1 }}>
                <strong>總使用金額：</strong>{formatCurrency(totalUsedAmount)}
              </Typography>
            </Box>
          }
          arrow
          placement="left"
        >
          <Stack direction="column" spacing={0.5} alignItems="center">
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
          </Stack>
        </Tooltip>
      );
    }
    
    // 如果被引用，顯示被引用和剩餘可用狀態
    if (hasReferences) {
      const color = getAvailableAmountColor(availableAmount, totalAmount);
      
      return (
        <Tooltip
          title={
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                🔗 被引用情況 ({transaction.referencedByInfo!.length} 筆)
              </Typography>
              
              {transaction.referencedByInfo!.map((ref, index) => (
                <Box key={ref._id} sx={{ mb: 1, pb: 1, borderBottom: index < transaction.referencedByInfo!.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>
                  <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                    <strong>{formatDate(ref.transactionDate)}</strong> - {ref.groupNumber}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    {ref.description} ({formatCurrency(ref.totalAmount)})
                  </Typography>
                </Box>
              ))}
              
              <Typography variant="caption" display="block" sx={{ mt: 1, fontWeight: 'bold', borderTop: '1px solid rgba(255,255,255,0.2)', pt: 1 }}>
                <strong>總金額：</strong>{formatCurrency(totalAmount)}
              </Typography>
              <Typography variant="caption" display="block">
                <strong>已使用：</strong>{formatCurrency(totalAmount - availableAmount)}
              </Typography>
              <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>
                <strong>剩餘可用：</strong>{formatCurrency(availableAmount)}
              </Typography>
            </Box>
          }
          arrow
          placement="left"
        >
          <Stack direction="column" spacing={0.5} alignItems="center">
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
          </Stack>
        </Tooltip>
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

export default FundingStatusDisplay;