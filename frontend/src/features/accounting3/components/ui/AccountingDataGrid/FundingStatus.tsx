import React from 'react';
import { Box, Chip, Stack, Tooltip, Typography } from '@mui/material';
import { Link as LinkIcon } from '@mui/icons-material';
import { ExtendedTransactionGroupWithEntries } from './types';
import { calculateTotalAmount, calculateAvailableAmount, getAvailableAmountColor } from './utils/calculations';
import { formatCurrency } from './utils/formatters';

interface FundingStatusProps {
  group: ExtendedTransactionGroupWithEntries;
}

/**
 * 資金狀態組件
 * 顯示交易的資金來源和使用情況
 */
export const FundingStatus: React.FC<FundingStatusProps> = ({ group }) => {
  const totalAmount = calculateTotalAmount(group.entries);
  const availableAmount = calculateAvailableAmount(group);
  const hasReferences = group.referencedByInfo && group.referencedByInfo.length > 0;
  const hasFundingSources = group.fundingSourceUsages && group.fundingSourceUsages.length > 0;
  
  // 如果有資金來源使用，優先顯示資金來源資訊
  if (hasFundingSources) {
    const totalUsedAmount = group.fundingSourceUsages!.reduce((sum, usage) => sum + usage.usedAmount, 0);
    
    return (
      <Tooltip
        title={
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              💰 資金來源追蹤 ({group.fundingSourceUsages!.length} 筆)
            </Typography>
            
            {group.fundingSourceUsages!.map((usage, index) => (
              <Box key={usage.sourceTransactionId} sx={{ mb: 1, pb: 1, borderBottom: index < group.fundingSourceUsages!.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>
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
            label={`💰 ${group.fundingSourceUsages!.length} 筆`}
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
              🔗 被引用情況 ({group.referencedByInfo!.length} 筆)
            </Typography>
            
            {group.referencedByInfo!.map((ref, index) => (
              <Box key={ref._id} sx={{ mb: 1, pb: 1, borderBottom: index < group.referencedByInfo!.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>
                <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                  <strong>{ref.transactionDate.toString()}</strong> - {ref.groupNumber}
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
            label={` ${group.referencedByInfo!.length} 筆`}
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

export default FundingStatus;