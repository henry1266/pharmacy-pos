import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Divider,
  Grid,
  Box,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';

import { useNavigate } from 'react-router-dom';
import { TransactionGroupWithEntries3 } from '@pharmacy-pos/shared/types/accounting3';
import { formatAmount, formatDate, formatDateOnly, extractObjectId, isValidObjectId } from '../utils/transactionUtils';
import { accounting3Service } from '../../../services/accounting3Service';

interface TransactionFundingFlowProps {
  transaction: TransactionGroupWithEntries3;
}

// 交易資訊介面
interface TransactionInfo {
  _id: string;
  description: string;
  transactionDate: string;
  groupNumber: string;
  totalAmount: number;
  usedAmount?: number;
  allocatedAmount?: number;
  availableAmount?: number;
}

// 餘額計算結果介面
interface BalanceCalculationResult {
  usedFromThisSource: number;
  availableAmount: number;
  totalAmount: number;
}

const CHIP_STYLES = {
  fontSize: '0.75rem',
  height: 24,
  maxWidth: 80,
  '& .MuiChip-label': {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: '0.75rem'
  }
};

const TABLE_HEADERS = ['日期', '交易描述', '本次', '餘額/總額'];

// 可重用的 Tooltip 組件
const AmountTooltip: React.FC<{ amount: number; tooltip: string }> = ({ amount, tooltip }) => (
  <Tooltip title={tooltip} arrow>
    <span style={{ fontWeight: 'medium' }}>
      {formatAmount(amount)}
    </span>
  </Tooltip>
);

const BalanceTooltip: React.FC<{
  availableAmount: number;
  totalAmount: number;
  tooltip: string
}> = ({ availableAmount, totalAmount, tooltip }) => (
  <Tooltip title={tooltip} arrow>
    <span style={{
      fontWeight: 'medium',
      color: availableAmount === totalAmount ? '#2e7d32' :
             availableAmount > 0 ? '#ed6c02' : '#d32f2f'
    }}>
      {formatAmount(availableAmount)}/{formatAmount(totalAmount)}
    </span>
  </Tooltip>
);

// 導航按鈕組件
const NavigationButton: React.FC<{
  transactionId: string | any;
  label?: string;
  navigate: (path: string) => void;
}> = ({ transactionId, label = '查看', navigate }) => {
  const cleanId = extractObjectId(transactionId);
  const isValid = cleanId && isValidObjectId(cleanId);
  
  return (
    <Button
      variant="outlined"
      size="small"
      onClick={() => {
        if (isValid) {
          console.log(`✅ 導航到交易: /accounting3/transaction/${cleanId}`);
          navigate(`/accounting3/transaction/${cleanId}`);
        } else {
          console.error('❌ 無效的交易 ID:', transactionId);
        }
      }}
      disabled={!isValid}
    >
      {isValid ? label : '無效'}
    </Button>
  );
};

// 交易表格組件
const TransactionTable: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <TableContainer component={Paper} sx={{ mt: 1 }}>
    <Table size="small">
      <TableHead>
        <TableRow>
          {TABLE_HEADERS.map((header) => (
            <TableCell key={header} align={header === '日期' || header === '交易描述' ? 'left' : 'center'}>
              {header}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {children}
      </TableBody>
    </Table>
  </TableContainer>
);

// 流向區塊組件
const FlowSection: React.FC<{
  title: string;
  count?: number;
  children: React.ReactNode;
  summary?: React.ReactNode;
  statusChip?: React.ReactNode;
}> = ({ title, count, children, summary, statusChip }) => {
  return (
    <Box sx={{ mb: 2, p: 2, borderRadius: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          {title}
        </Typography>
        {count !== undefined && count > 0 && (
          <Chip
            label={`${count} 筆`}
            color="primary"
            size="small"
          />
        )}
        {statusChip && (
          <Box sx={{ ml: 'auto' }}>
            {statusChip}
          </Box>
        )}
      </Box>
      
      {children}
      
      {summary && (
        <Box sx={{ mt: 2, p: 1, bgcolor: 'white', borderRadius: 1 }}>
          {summary}
        </Box>
      )}
    </Box>
  );
};

/**
 * 交易資金流向追蹤組件
 */
export const TransactionFundingFlow: React.FC<TransactionFundingFlowProps> = ({
  transaction
}) => {
  const navigate = useNavigate();
  const [linkedTransactionDetails, setLinkedTransactionDetails] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(false);

  // 提取帳戶ID的工具函數
  const extractAccountId = (accountId: string | any): string | null => {
    if (typeof accountId === 'string') {
      return accountId;
    }
    if (typeof accountId === 'object' && accountId?._id) {
      return accountId._id;
    }
    return null;
  };

  // 處理帳戶點擊事件
  const handleAccountClick = (accountId: string | any) => {
    const cleanId = extractAccountId(accountId);
    if (cleanId) {
      navigate(`/accounting3/accounts/${cleanId}`);
    }
  };

  // 計算從特定來源使用的金額
  const calculateUsedAmount = useMemo(() => {
    return (sourceInfo: any, isMultipleSource: boolean): number => {
      if (sourceInfo.usedAmount !== undefined) {
        return sourceInfo.usedAmount;
      }
      if (sourceInfo.allocatedAmount !== undefined) {
        return sourceInfo.allocatedAmount;
      }
      
      if (isMultipleSource) {
        const currentTransactionAmount = transaction.totalAmount || 0;
        const sourceAmount = sourceInfo.totalAmount || 0;
        
        // 計算所有來源的總金額
        let totalSourceAmount = 0;
        if (transaction.sourceTransactionId && typeof transaction.sourceTransactionId === 'object') {
          const sourceData = transaction.sourceTransactionId as any;
          totalSourceAmount += sourceData.totalAmount || 0;
        }
        if (transaction.linkedTransactionIds) {
          transaction.linkedTransactionIds.forEach(linkedId => {
            if (typeof linkedId === 'object' && linkedId !== null) {
              const linkedData = linkedId as any;
              totalSourceAmount += linkedData.totalAmount || 0;
            }
          });
        }
        
        // 按比例分配
        if (totalSourceAmount > 0) {
          return Math.round((sourceAmount / totalSourceAmount) * currentTransactionAmount);
        }
        return currentTransactionAmount;
      }
      
      // 單一來源：使用當前交易的總金額
      return transaction.totalAmount || 0;
    };
  }, [transaction]);

  // 計算餘額資訊
  const calculateBalanceInfo = useMemo(() => {
    return (
      transactionId: string,
      sourceInfo: any,
      usedAmount: number
    ): BalanceCalculationResult => {
      const cleanId = extractObjectId(transactionId);
      
      // 檢查是否有從 API 獲取的餘額資料
      if (cleanId && linkedTransactionDetails[cleanId] && linkedTransactionDetails[cleanId].hasRealBalance) {
        const balanceData = linkedTransactionDetails[cleanId];
        const totalAmount = balanceData.totalAmount || 0;
        let availableAmount = balanceData.availableAmount || 0;
        
        // 調整餘額
        if (usedAmount >= totalAmount) {
          availableAmount = 0;
        } else if (availableAmount + usedAmount > totalAmount) {
          availableAmount = Math.max(0, totalAmount - usedAmount);
        }
        
        return {
          usedFromThisSource: usedAmount,
          availableAmount,
          totalAmount
        };
      }
      
      // 回退到原始資料
      const totalAmount = sourceInfo.totalAmount || 0;
      const availableAmount = sourceInfo.availableAmount !== undefined
        ? sourceInfo.availableAmount
        : totalAmount;
      
      return {
        usedFromThisSource: usedAmount,
        availableAmount,
        totalAmount
      };
    };
  }, [linkedTransactionDetails]);

  // 工具函數：計算總計金額
  const calculateSourceTotal = () => {
    let total = 0;
    
    // 計算來源交易金額
    if (transaction.sourceTransactionId && typeof transaction.sourceTransactionId === 'object') {
      const sourceInfo = transaction.sourceTransactionId as any;
      if (sourceInfo.totalAmount) {
        total += sourceInfo.totalAmount;
      }
    }
    
    // 計算關聯交易金額
    if (transaction.linkedTransactionIds) {
      transaction.linkedTransactionIds.forEach(linkedId => {
        if (typeof linkedId === 'object' && linkedId !== null) {
          const linkedInfo = linkedId as any;
          if (linkedInfo.totalAmount) {
            total += linkedInfo.totalAmount;
          }
        }
      });
    }
    
    return total;
  };

  // 工具函數：計算流向總計
  const calculateFlowTotal = () => {
    const usedAmount = transaction.referencedByInfo
      ?.filter(ref => ref.status !== 'cancelled')
      .reduce((sum, ref) => sum + ref.totalAmount, 0) || 0;
    
    return usedAmount;
  };

  // 工具函數：計算剩餘金額（來源總計 - 流向總計）
  const calculateRemainingAmount = () => {
    const sourceTotal = calculateSourceTotal();
    const flowTotal = calculateFlowTotal();
    
    return Math.max(0, sourceTotal - flowTotal);
  };

  // 檢查是否有多個來源
  const hasMultipleSources = useMemo(() => {
    return (transaction.sourceTransactionId ? 1 : 0) + (transaction.linkedTransactionIds?.length || 0) > 1;
  }, [transaction.sourceTransactionId, transaction.linkedTransactionIds]);

  // 交易表格行組件
  const TransactionTableRow: React.FC<{
    transactionInfo: any;
    transactionId: string | any;
    index?: number;
    type: 'source' | 'linked' | 'referenced' | 'current';
  }> = ({ transactionInfo, transactionId, index, type }) => {
    const cleanId = extractObjectId(transactionId);
    const isValid = cleanId && isValidObjectId(cleanId);
    
    // 處理行點擊事件
    const handleRowClick = () => {
      if (type === 'current') {
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
    if (type === 'current') {
      const currentTransactionAmount = transaction.totalAmount || 0;
      const usedByOthersAmount = transaction.referencedByInfo
        ?.filter(ref => ref.status !== 'cancelled')
        .reduce((sum, ref) => sum + (ref.totalAmount || 0), 0) || 0;
      const currentRemainingAmount = Math.max(0, currentTransactionAmount - usedByOthersAmount);
      
      return (
        <TableRow
          key="current"
          onClick={handleRowClick}
          sx={{
            cursor: 'pointer',
            '&:hover': { backgroundColor: '#f5f5f5' }
          }}
        >
          <TableCell>{formatDateOnly(transaction.transactionDate)}</TableCell>
          <TableCell>
            <Tooltip title={`編號: ${transaction.groupNumber}`} arrow>
              <span style={{ cursor: 'pointer' }}>{transaction.description}</span>
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
    if (type === 'referenced') {
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
            <span style={{ fontWeight: 'medium', color: '#d32f2f' }}>
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
            '&:hover': isValid ? { backgroundColor: '#f5f5f5' } : {}
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
      const usedAmount = calculateUsedAmount(transactionInfo, hasMultipleSources);
      const balanceInfo = calculateBalanceInfo(cleanId || '', transactionInfo, usedAmount);
      
      let balanceDisplay;
      if (loading) {
        balanceDisplay = <span style={{ color: '#666', fontStyle: 'italic' }}>載入餘額中...</span>;
      } else {
        const tooltipText = type === 'source'
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
            '&:hover': isValid ? { backgroundColor: '#f5f5f5' } : {}
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
              tooltip={`從此${type === 'source' ? '來源' : '關聯交易'}使用金額: ${formatAmount(usedAmount)}`}
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
          '&:hover': isValid ? { backgroundColor: '#f5f5f5' } : {}
        }}
      >
        <TableCell colSpan={4}>
          {type === 'source' ? '來源交易' : '關聯交易'} {(index || 0) + 1} (僅 ID)
        </TableCell>
      </TableRow>
    );
  };
  
  // 調試：檢查交易的完整結構
  console.log('🔍 TransactionFundingFlow 渲染，交易資訊:', {
    id: transaction._id,
    hasSourceTransaction: !!transaction.sourceTransactionId,
    sourceTransactionType: typeof transaction.sourceTransactionId,
    sourceTransactionId: transaction.sourceTransactionId,
    linkedTransactionIds: transaction.linkedTransactionIds,
    totalAmount: transaction.totalAmount,
    description: transaction.description,
    fullTransaction: transaction
  });

  // 獲取關聯交易和來源交易的詳細資訊（使用新的餘額計算 API）
  useEffect(() => {
    const fetchLinkedTransactionDetails = async () => {
      console.log('🚀 開始獲取關聯交易和來源交易詳情:', {
        hasLinkedTransactionIds: !!transaction.linkedTransactionIds,
        linkedTransactionIdsLength: transaction.linkedTransactionIds?.length,
        linkedTransactionIds: transaction.linkedTransactionIds,
        hasSourceTransactionId: !!transaction.sourceTransactionId,
        sourceTransactionId: transaction.sourceTransactionId
      });

      // 收集所有需要查詢餘額的交易 ID
      const allTransactionIds: string[] = [];
      
      // 添加關聯交易 ID
      if (transaction.linkedTransactionIds && transaction.linkedTransactionIds.length > 0) {
        for (const linkedId of transaction.linkedTransactionIds) {
          const cleanId = extractObjectId(linkedId);
          if (cleanId && isValidObjectId(cleanId)) {
            allTransactionIds.push(cleanId);
          }
        }
      }
      
      // 添加來源交易 ID
      if (transaction.sourceTransactionId) {
        const cleanSourceId = extractObjectId(transaction.sourceTransactionId);
        if (cleanSourceId && isValidObjectId(cleanSourceId)) {
          allTransactionIds.push(cleanSourceId);
        }
      }
      
      // 添加流向交易 ID
      if (transaction.referencedByInfo && transaction.referencedByInfo.length > 0) {
        for (const ref of transaction.referencedByInfo) {
          const cleanRefId = extractObjectId(ref._id);
          if (cleanRefId && isValidObjectId(cleanRefId)) {
            allTransactionIds.push(cleanRefId);
          }
        }
      }

      if (allTransactionIds.length === 0) {
        console.log('⚠️ 沒有有效的交易 ID，跳過 API 調用');
        return;
      }

      setLoading(true);
      const details: {[key: string]: any} = {};

      try {
        console.log('💰 使用新的餘額計算 API 獲取真實餘額資訊');
        console.log('📋 所有交易 IDs:', allTransactionIds);

        // 使用新的批次餘額計算 API
        const balanceResponse = await accounting3Service.transactions.calculateBalances(allTransactionIds);
        
        console.log('📡 餘額計算 API 回應:', {
          success: balanceResponse.success,
          hasData: !!balanceResponse.data,
          balancesCount: balanceResponse.data?.balances?.length || 0,
          summary: balanceResponse.data?.summary,
          balances: balanceResponse.data?.balances
        });

        if (balanceResponse.success && balanceResponse.data?.balances) {
          for (const balance of balanceResponse.data.balances) {
            if (balance.success) {
              console.log('✅ 獲取真實餘額成功:', {
                transactionId: balance.transactionId,
                totalAmount: balance.totalAmount,
                usedAmount: balance.usedAmount,
                availableAmount: balance.availableAmount,
                referencedByCount: balance.referencedByCount
              });

              // 同時獲取交易基本資訊
              try {
                const transactionResponse = await accounting3Service.transactions.getById(balance.transactionId);
                if (transactionResponse.success && transactionResponse.data) {
                  details[balance.transactionId] = {
                    ...transactionResponse.data,
                    // 使用真實計算的餘額資訊
                    totalAmount: balance.totalAmount,
                    usedAmount: balance.usedAmount,
                    availableAmount: balance.availableAmount,
                    referencedByCount: balance.referencedByCount,
                    referencedByTransactions: balance.referencedByTransactions,
                    // 標記這是真實計算的餘額
                    hasRealBalance: true
                  };
                } else {
                  // 如果無法獲取交易詳情，至少保存餘額資訊
                  details[balance.transactionId] = {
                    _id: balance.transactionId,
                    id: balance.transactionId,
                    totalAmount: balance.totalAmount,
                    usedAmount: balance.usedAmount,
                    availableAmount: balance.availableAmount,
                    referencedByCount: balance.referencedByCount,
                    referencedByTransactions: balance.referencedByTransactions,
                    hasRealBalance: true,
                    description: '無法獲取交易詳情'
                  };
                }
              } catch (error) {
                console.warn('⚠️ 獲取交易詳情失敗，但餘額計算成功:', balance.transactionId, error);
                details[balance.transactionId] = {
                  _id: balance.transactionId,
                  id: balance.transactionId,
                  totalAmount: balance.totalAmount,
                  usedAmount: balance.usedAmount,
                  availableAmount: balance.availableAmount,
                  referencedByCount: balance.referencedByCount,
                  referencedByTransactions: balance.referencedByTransactions,
                  hasRealBalance: true,
                  description: '無法獲取交易詳情'
                };
              }
            } else {
              console.error('❌ 餘額計算失敗:', {
                transactionId: balance.transactionId,
                error: balance.error
              });
            }
          }
        }
        
        console.log('🎯 最終獲取的詳情:', {
          detailsKeys: Object.keys(details),
          detailsCount: Object.keys(details).length,
          hasRealBalanceData: Object.values(details).some((d: any) => d.hasRealBalance),
          details: details
        });
        
        setLinkedTransactionDetails(details);
      } catch (error) {
        console.error('❌ 獲取關聯交易詳情失敗:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLinkedTransactionDetails();
  }, [transaction.linkedTransactionIds, transaction.sourceTransactionId, transaction.referencedByInfo]);

  // 渲染來源交易資訊
  const renderSourceTransaction = () => {
    if (!transaction.sourceTransactionId) return null;

    const cleanSourceId = extractObjectId(transaction.sourceTransactionId);
    console.log('🔍 資金來源交易 ID 提取:', { 原始: transaction.sourceTransactionId, 提取後: cleanSourceId });
    
    // 如果有來源交易資訊，顯示詳細格式
    if (typeof transaction.sourceTransactionId === 'object' && transaction.sourceTransactionId !== null) {
      const sourceInfo = transaction.sourceTransactionId as any;
      
      return (
        <TransactionTable>
          <TransactionTableRow
            transactionInfo={sourceInfo}
            transactionId={transaction.sourceTransactionId}
            index={0}
            type="source"
          />
        </TransactionTable>
      );
    } else {
      // 如果只有 ID，顯示簡化格式
      return <NavigationButton transactionId={transaction.sourceTransactionId} label="查看來源交易" navigate={navigate} />;
    }
  };

  // 渲染關聯交易列表
  const renderLinkedTransactions = () => {
    if (!transaction.linkedTransactionIds || transaction.linkedTransactionIds.length === 0) {
      return null;
    }

    return (
      <Box>
        <Box sx={{ maxHeight: 300 }}>
          <TransactionTable>
            {transaction.linkedTransactionIds.map((linkedId, index) => (
              <TransactionTableRow
                key={index}
                transactionInfo={linkedId}
                transactionId={linkedId}
                index={index}
                type="linked"
              />
            ))}
          </TransactionTable>
        </Box>
      </Box>
    );
  };

  // 計算剩餘可用金額
  const calculateAvailableAmount = () => {
    if (!transaction.referencedByInfo || transaction.referencedByInfo.length === 0) {
      return transaction.totalAmount;
    }
    
    const usedAmount = transaction.referencedByInfo
      .filter(ref => ref.status !== 'cancelled')
      .reduce((sum, ref) => sum + ref.totalAmount, 0);
    
    return Math.max(0, transaction.totalAmount - usedAmount);
  };

  // 交易流向 Chip 組件
  const FlowChip: React.FC<{
    label: string;
    color: 'primary' | 'secondary';
    margin?: string;
    accountId?: string | any;
  }> = ({
    label,
    color,
    margin = '0',
    accountId
  }) => (
    <Chip
      label={label}
      size="small"
      color={color}
      clickable={!!accountId}
      onClick={accountId ? () => handleAccountClick(accountId) : undefined}
      sx={{
        ...CHIP_STYLES,
        margin,
        cursor: accountId ? 'pointer' : 'default',
        '&:hover': accountId ? {
          backgroundColor: color === 'primary' ? 'primary.dark' : 'secondary.dark'
        } : {}
      }}
    />
  );

  // 渲染交易流向圖
  const renderTransactionFlow = () => {
    if (!transaction.entries || transaction.entries.length < 2) {
      return <Typography variant="caption" color="text.disabled">-</Typography>;
    }

    // 找到主要的借方和貸方科目
    const debitEntries = transaction.entries.filter(entry => (entry.debitAmount || 0) > 0);
    const creditEntries = transaction.entries.filter(entry => (entry.creditAmount || 0) > 0);

    if (debitEntries.length === 0 || creditEntries.length === 0) {
      return <Typography variant="caption" color="text.disabled">-</Typography>;
    }

    // 取第一個借方和貸方科目作為代表
    const fromAccount = creditEntries[0];
    const toAccount = debitEntries[0];

    // 獲取科目名稱
    const fromAccountName = (fromAccount as any).accountName || '未知科目';
    const toAccountName = (toAccount as any).accountName || '未知科目';

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5, minWidth: 180 }}>
        <FlowChip
          label={fromAccountName}
          color="secondary"
          margin="0 0.5rem 0 0"
          accountId={fromAccount?.accountId || ''}
        />
        <ArrowForwardIcon sx={{ fontSize: 16, color: 'primary.main', mx: 0.25 }} />
        <FlowChip
          label={toAccountName}
          color="primary"
          margin="0 0 0 0.5rem"
          accountId={toAccount?.accountId || ''}
        />
      </Box>
    );
  };

  // 🆕 渲染付款流向詳情
  const renderPaymentFlowSection = () => {
    const transactionAny = transaction as any;
    if (transactionAny.transactionType !== 'payment' || !transactionAny.paymentInfo) {
      return null;
    }

    return (
      <FlowSection
        title="付款明細"
        count={transactionAny.paymentInfo.payableTransactions?.length || 0}
        statusChip={
          <Chip
            label={`${transactionAny.paymentInfo.paymentMethod} 付款`}
            color="info"
            size="small"
          />
        }
      >
        <TransactionTable>
          {transactionAny.paymentInfo.payableTransactions?.map((payment: any, index: number) => (
            <TableRow key={index}>
              <TableCell>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => navigate(`/accounting3/transaction/${payment.transactionId}`)}
                >
                  查看應付帳款
                </Button>
              </TableCell>
              <TableCell>
                <Typography variant="body2">
                  付款金額: {formatAmount(payment.paidAmount)}
                </Typography>
                {payment.remainingAmount && payment.remainingAmount > 0 && (
                  <Typography variant="caption" color="warning.main">
                    剩餘: {formatAmount(payment.remainingAmount)}
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <Chip
                  label={!payment.remainingAmount || payment.remainingAmount === 0 ? '已付清' : '部分付款'}
                  color={!payment.remainingAmount || payment.remainingAmount === 0 ? 'success' : 'warning'}
                  size="small"
                />
              </TableCell>
            </TableRow>
          )) || []}
        </TransactionTable>
      </FlowSection>
    );
  };

  // 🆕 渲染應付帳款狀態
  const renderPayableStatusSection = () => {
    const transactionAny = transaction as any;
    if (transactionAny.transactionType !== 'purchase' || !transactionAny.payableInfo) {
      return null;
    }

    return (
      <FlowSection
        title="付款狀態"
        statusChip={
          <Chip
            label={transactionAny.payableInfo.isPaidOff ? '已付清' : '未付清'}
            color={transactionAny.payableInfo.isPaidOff ? 'success' : 'warning'}
            size="small"
          />
        }
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="body2" gutterBottom>
            總金額: {formatAmount(transaction.totalAmount || 0)}
          </Typography>
          <Typography variant="body2" gutterBottom>
            已付金額: {formatAmount(transactionAny.payableInfo.totalPaidAmount || 0)}
          </Typography>
          <Typography variant="body2" gutterBottom>
            剩餘金額: {formatAmount((transaction.totalAmount || 0) - (transactionAny.payableInfo.totalPaidAmount || 0))}
          </Typography>
          
          {transactionAny.payableInfo.paymentHistory && transactionAny.payableInfo.paymentHistory.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                付款歷史 ({transactionAny.payableInfo.paymentHistory.length} 筆)
              </Typography>
              <TransactionTable>
                {transactionAny.payableInfo.paymentHistory.map((history: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => navigate(`/accounting3/transaction/${history.paymentTransactionId}`)}
                      >
                        查看付款交易
                      </Button>
                    </TableCell>
                    <TableCell>
                      {formatAmount(history.paidAmount)}
                    </TableCell>
                    <TableCell>
                      {formatDate(history.paymentDate)}
                    </TableCell>
                    <TableCell>
                      {history.paymentMethod || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TransactionTable>
            </Box>
          )}
        </Box>
      </FlowSection>
    );
  };

  // 渲染流向詳情
  const renderReferencedByInfo = () => {
    if (!transaction.referencedByInfo || transaction.referencedByInfo.length === 0) {
      return (
        <Chip
          label="未被引用"
          color="success"
          size="small"
        />
      );
    }

    return (
      <Box sx={{ maxHeight: 300 }}>
        <TransactionTable>
          {transaction.referencedByInfo.map((ref, index) => (
            <TransactionTableRow
              key={index}
              transactionInfo={ref}
              transactionId={ref._id}
              index={index}
              type="referenced"
            />
          ))}
        </TransactionTable>
      </Box>
    );
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccountBalanceIcon />
          資金流向追蹤
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {/* 🆕 付款交易特殊顯示 */}
        {renderPaymentFlowSection()}
        
        {/* 🆕 應付帳款狀態顯示 */}
        {renderPayableStatusSection()}

        {/* 兩欄式佈局 */}
        <Grid container spacing={2}>
          {/* 左欄：來源區塊 */}
          <Grid item xs={12} md={6}>
            {(transaction.sourceTransactionId || (transaction.linkedTransactionIds && transaction.linkedTransactionIds.length > 0)) && (
              <FlowSection
                title="來源"
                count={(transaction.sourceTransactionId ? 1 : 0) + (transaction.linkedTransactionIds?.length || 0)}
              >
                {transaction.sourceTransactionId && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      資金來源交易
                    </Typography>
                    {renderSourceTransaction()}
                  </Box>
                )}
                {renderLinkedTransactions()}
              </FlowSection>
            )}
          </Grid>
          
          {/* 右欄：流向區塊 */}
          <Grid item xs={12} md={6}>
            <FlowSection
              title="流向"
              count={transaction.referencedByInfo?.length || 0}
              statusChip={(() => {
                const usedAmount = transaction.referencedByInfo
                  ?.filter(ref => ref.status !== 'cancelled')
                  .reduce((sum, ref) => sum + ref.totalAmount, 0) || 0;
                
                if (usedAmount > 0 && usedAmount < transaction.totalAmount) {
                  return (
                    <Chip
                      label="部分已使用"
                      color="info"
                      size="small"
                    />
                  );
                } else if (usedAmount >= transaction.totalAmount) {
                  return (
                    <Chip
                      label="已全部使用"
                      color="error"
                      size="small"
                    />
                  );
                }
                return undefined;
              })()}
            >
              {renderReferencedByInfo()}
            </FlowSection>
          </Grid>
        </Grid>
        
        {/* 總計區域 - 水平對齊 */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {/* 來源總計 */}
          <Grid item xs={12} md={6}>
            {(transaction.sourceTransactionId || (transaction.linkedTransactionIds && transaction.linkedTransactionIds.length > 0)) && (
              <Box sx={{ pt: 2, pb: 2, borderTop: '1px solid #e0e0e0', minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h6" align="center" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                  來源總計：{formatAmount(transaction.totalAmount || 0)}
                </Typography>
              </Box>
            )}
          </Grid>
          
          {/* 流向總計 */}
          <Grid item xs={12} md={6}>
            {transaction.referencedByInfo && transaction.referencedByInfo.length > 0 && (
              <Box sx={{ pt: 2, pb: 2, borderTop: '1px solid #e0e0e0', minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography variant="h6" align="center" sx={{ fontWeight: 'bold', color: '#d32f2f' }}>
                  流向總計：{formatAmount(calculateFlowTotal())}
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
        
      </CardContent>
    </Card>
  );
};

export default TransactionFundingFlow;