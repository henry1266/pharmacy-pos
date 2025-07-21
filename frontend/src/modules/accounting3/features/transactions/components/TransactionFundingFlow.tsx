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

/**
 * 交易資金流向追蹤組件
 */
export const TransactionFundingFlow: React.FC<TransactionFundingFlowProps> = ({
  transaction
}) => {
  const navigate = useNavigate();
  const [linkedTransactionDetails, setLinkedTransactionDetails] = useState<{[key: string]: any}>({});
  const [loading, setLoading] = useState(false);

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

  // 渲染金額顯示
  const renderAmountDisplay = (amount: number, tooltip: string) => (
    <Tooltip title={tooltip} arrow>
      <span style={{ fontWeight: 'medium' }}>
        {formatAmount(amount)}
      </span>
    </Tooltip>
  );

  // 渲染餘額顯示
  const renderBalanceDisplay = (availableAmount: number, totalAmount: number, tooltip: string) => (
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

  // 渲染導航按鈕
  const renderNavigationButton = (transactionId: string | any, label: string = '查看') => {
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

  // 檢查是否有多個來源
  const hasMultipleSources = useMemo(() => {
    return (transaction.sourceTransactionId ? 1 : 0) + (transaction.linkedTransactionIds?.length || 0) > 1;
  }, [transaction.sourceTransactionId, transaction.linkedTransactionIds]);

  // 渲染通用的交易表格行
  const renderTransactionRow = (
    transactionInfo: any,
    transactionId: string | any,
    index?: number,
    type: 'source' | 'linked' | 'referenced' | 'current' = 'linked'
  ) => {
    const cleanId = extractObjectId(transactionId);
    const isValid = cleanId && isValidObjectId(cleanId);
    
    // 處理當前交易的特殊情況
    if (type === 'current') {
      const currentTransactionAmount = transaction.totalAmount || 0;
      const usedByOthersAmount = transaction.referencedByInfo
        ?.filter(ref => ref.status !== 'cancelled')
        .reduce((sum, ref) => sum + (ref.totalAmount || 0), 0) || 0;
      const currentRemainingAmount = Math.max(0, currentTransactionAmount - usedByOthersAmount);
      
      return (
        <TableRow key="current">
          <TableCell>{formatDateOnly(transaction.transactionDate)}</TableCell>
          <TableCell>
            <Tooltip title={`編號: ${transaction.groupNumber}`} arrow>
              <span style={{ cursor: 'help' }}>{transaction.description}</span>
            </Tooltip>
          </TableCell>
          <TableCell align="center">
            {renderAmountDisplay(currentTransactionAmount, `交易總金額: ${formatAmount(currentTransactionAmount)}`)}
          </TableCell>
          <TableCell align="center">
            {renderBalanceDisplay(
              currentRemainingAmount,
              currentTransactionAmount,
              `交易總金額: ${formatAmount(currentTransactionAmount)}, 被其他交易使用: ${formatAmount(usedByOthersAmount)}, 當前剩餘: ${formatAmount(currentRemainingAmount)}`
            )}
          </TableCell>
          <TableCell align="center">
            <Button variant="outlined" size="small" onClick={() => window.location.reload()}>
              重新整理
            </Button>
          </TableCell>
        </TableRow>
      );
    }
    
    // 處理流向交易的特殊情況
    if (type === 'referenced') {
      const refTotalAmount = transactionInfo.totalAmount || 0;
      const cleanRefId = extractObjectId(transactionInfo._id);
      
      let balanceDisplay;
      if (cleanRefId && linkedTransactionDetails[cleanRefId] && linkedTransactionDetails[cleanRefId].hasRealBalance) {
        const refBalanceData = linkedTransactionDetails[cleanRefId];
        const totalAmount = refBalanceData.totalAmount || 0;
        const availableAmount = refBalanceData.availableAmount || 0;
        
        balanceDisplay = renderBalanceDisplay(
          availableAmount,
          totalAmount,
          `流向交易總額: ${formatAmount(totalAmount)}, API 計算剩餘: ${formatAmount(availableAmount)}`
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
        <TableRow key={transactionInfo._id}>
          <TableCell>{formatDateOnly(transactionInfo.transactionDate)}</TableCell>
          <TableCell>
            <Tooltip title={`編號: ${transactionInfo.groupNumber}`} arrow>
              <span style={{ cursor: 'help' }}>{transactionInfo.description}</span>
            </Tooltip>
          </TableCell>
          <TableCell align="center">
            {renderAmountDisplay(refTotalAmount, `流向交易使用金額: ${formatAmount(refTotalAmount)}`)}
          </TableCell>
          <TableCell align="center">{balanceDisplay}</TableCell>
          <TableCell align="center">
            {renderNavigationButton(transactionInfo._id)}
          </TableCell>
        </TableRow>
      );
    }
    
    // 處理來源和關聯交易
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
        
        balanceDisplay = renderBalanceDisplay(balanceInfo.availableAmount, balanceInfo.totalAmount, tooltipText);
      }
      
      return (
        <TableRow key={cleanId || index}>
          <TableCell>
            {transactionInfo.transactionDate ? formatDateOnly(transactionInfo.transactionDate) : '未知日期'}
          </TableCell>
          <TableCell>
            <Tooltip title={`編號: ${transactionInfo.groupNumber || '未知編號'}`} arrow>
              <span style={{ cursor: 'help' }}>
                {transactionInfo.description || '無描述'}
              </span>
            </Tooltip>
          </TableCell>
          <TableCell align="center">
            {renderAmountDisplay(
              usedAmount,
              `從此${type === 'source' ? '來源' : '關聯交易'}使用金額: ${formatAmount(usedAmount)}`
            )}
          </TableCell>
          <TableCell align="center">{balanceDisplay}</TableCell>
          <TableCell align="center">
            {renderNavigationButton(transactionId)}
          </TableCell>
        </TableRow>
      );
    }
    
    // 處理只有 ID 的情況
    return (
      <TableRow key={cleanId || index}>
        <TableCell colSpan={4}>
          {type === 'source' ? '來源交易' : '關聯交易'} {(index || 0) + 1} (僅 ID)
        </TableCell>
        <TableCell align="center">
          {renderNavigationButton(transactionId)}
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
    
    const isValid = cleanSourceId && isValidObjectId(cleanSourceId);
    
    // 如果有來源交易資訊，顯示詳細格式
    if (typeof transaction.sourceTransactionId === 'object' && transaction.sourceTransactionId !== null) {
      const sourceInfo = transaction.sourceTransactionId as any;
      
      return (
        <TableContainer component={Paper} sx={{ mt: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>日期</TableCell>
                <TableCell>交易描述</TableCell>
                <TableCell align="center">本次</TableCell>
                <TableCell align="center">餘額/總額</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {renderTransactionRow(sourceInfo, transaction.sourceTransactionId, 0, 'source')}
            </TableBody>
          </Table>
        </TableContainer>
      );
    } else {
      // 如果只有 ID，顯示簡化格式
      return renderNavigationButton(transaction.sourceTransactionId, '查看來源交易');
    }
  };

  // 渲染關聯交易列表
  const renderLinkedTransactions = () => {
    if (!transaction.linkedTransactionIds || transaction.linkedTransactionIds.length === 0) {
      return null;
    }

    return (
      <Box>
        <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>日期</TableCell>
                <TableCell>交易描述</TableCell>
                <TableCell align="center">本次</TableCell>
                <TableCell align="center">餘額/總額</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transaction.linkedTransactionIds.map((linkedId, index) =>
                renderTransactionRow(linkedId, linkedId, index, 'linked')
              )}
            </TableBody>
          </Table>
        </TableContainer>
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
        <Chip
          label={fromAccountName}
          size="small"
          color="secondary"
          sx={{
            fontSize: '0.75rem',
            height: 24,
            mr: 0.5,
            maxWidth: 80,
            '& .MuiChip-label': {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: '0.75rem'
            }
          }}
        />
        <ArrowForwardIcon sx={{ fontSize: 16, color: 'primary.main', mx: 0.25 }} />
        <Chip
          label={toAccountName}
          size="small"
          color="primary"
          sx={{
            fontSize: '0.75rem',
            height: 24,
            ml: 0.5,
            maxWidth: 80,
            '& .MuiChip-label': {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: '0.75rem'
            }
          }}
        />
      </Box>
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
      <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>日期</TableCell>
              <TableCell>交易描述</TableCell>
              <TableCell align="center">本次</TableCell>
              <TableCell align="center">餘額/總額</TableCell>
              <TableCell align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transaction.referencedByInfo.map((ref, index) =>
              renderTransactionRow(ref, ref._id, index, 'referenced')
            )}
          </TableBody>
        </Table>
      </TableContainer>
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
        
        {/* 來源區塊 */}
        {(transaction.sourceTransactionId || (transaction.linkedTransactionIds && transaction.linkedTransactionIds.length > 0)) && (
          <Box sx={{
            mb: 1,
            p: 2,
            pl: 6,
            borderRadius: '8px 8px 0 0',
            border: '4px solid #1976d2',
            borderBottom: '2px solid #1976d2',
            position: 'relative',
            '&::after': {
              content: '"💰\\A來\\A源"',
              whiteSpace: 'pre-line',
              position: 'absolute',
              top: '50%',
              left: -2,
              transform: 'translateY(-50%)',
              bgcolor: '#1976d2',
              color: 'white',
              px: 1,
              py: 2,
              borderRadius: 1,
              fontSize: '0.7rem',
              fontWeight: 'bold',
              zIndex: 1,
              lineHeight: 1.1,
              textAlign: 'center',
              display: 'block',
              width: '20px'
            }
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ color: 'primary.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  style={{
                    width: '1rem',
                    height: '1rem',
                    fill: 'currentColor'
                  }}
                >
                  <path d="M352 96l64 0c17.7 0 32 14.3 32 32l0 256c0 17.7-14.3 32-32 32l-64 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l64 0c53 0 96-43 96-96l0-256c0-53-43-96-96-96l-64 0c-17.7 0-32 14.3-32 32s14.3 32 32 32zm-9.4 182.6c12.5-12.5 12.5-32.8 0-45.3l-128-128c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L242.7 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l210.7 0-73.4 73.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l128-128z"/>
                </svg>
                來源
              </Typography>
              {(transaction.sourceTransactionId || (transaction.linkedTransactionIds && transaction.linkedTransactionIds.length > 0)) && (
                <Chip
                  label={`${(transaction.sourceTransactionId ? 1 : 0) + (transaction.linkedTransactionIds?.length || 0)} 筆`}
                  color="primary"
                  size="small"
                />
              )}
            </Box>
            
            {transaction.sourceTransactionId && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  資金來源交易
                </Typography>
                {renderSourceTransaction()}
              </Box>
            )}

            {renderLinkedTransactions()}
            
            {/* 來源區塊總計 */}
            <Box sx={{ mt: 2, p: 1, bgcolor: '#bbdefb', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                來源總計：{(() => {
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
                  
                  return formatAmount(total);
                })()}
              </Typography>
            </Box>
          </Box>
        )}
        
        {/* 交易區塊 */}
        <Box sx={{
          mb: 1,
          p: 2,
          pl: 6,
          borderRadius: 0,
          border: '4px solid #2e7d32',
          borderTop: '2px solid #2e7d32',
          borderBottom: '2px solid #2e7d32',
          position: 'relative',
          '&::after': {
            content: '"🔄\\A當\\A前\\A交\\A易"',
            whiteSpace: 'pre-line',
            position: 'absolute',
            top: '50%',
            left: -2,
            transform: 'translateY(-50%)',
            bgcolor: '#2e7d32',
            color: 'white',
            px: 1,
            py: 2,
            borderRadius: 1,
            fontSize: '0.7rem',
            fontWeight: 'bold',
            zIndex: 1,
            lineHeight: 1.1,
            textAlign: 'center',
            display: 'block',
            width: '20px'
          }
        }}>
          <Typography variant="subtitle2" gutterBottom sx={{ color: '#2e7d32', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
              style={{
                width: '1rem',
                height: '1rem',
                fill: 'currentColor'
              }}
            >
              <path d="M438.6 150.6c12.5-12.5 12.5-32.8 0-45.3l-96-96c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.7 96 32 96C14.3 96 0 110.3 0 128s14.3 32 32 32l306.7 0-41.4 41.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l96-96zm-333.3 352c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 416 416 416c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0 41.4-41.4c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-96 96c-12.5 12.5-12.5 32.8 0 45.3l96 96z"/>
            </svg>
            交易
          </Typography>
          
          <TableContainer component={Paper} sx={{ mt: 1 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>日期</TableCell>
                  <TableCell>交易描述</TableCell>
                  <TableCell align="center">本次</TableCell>
                  <TableCell align="center">餘額/總額</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {renderTransactionRow(transaction, transaction._id, -1, 'current')}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
        
        {/* 流向區塊 */}
        <Box sx={{
          p: 2,
          pl: 6,
          borderRadius: '0 0 8px 8px',
          border: '4px solid #f57c00',
          borderTop: '2px solid #f57c00',
          position: 'relative',
          '&::after': {
            content: '"📤\\A流\\A向"',
            whiteSpace: 'pre-line',
            position: 'absolute',
            top: '50%',
            left: -2,
            transform: 'translateY(-50%)',
            bgcolor: '#f57c00',
            color: 'white',
            px: 1,
            py: 2,
            borderRadius: 1,
            fontSize: '0.7rem',
            fontWeight: 'bold',
            zIndex: 1,
            lineHeight: 1.1,
            textAlign: 'center',
            display: 'block',
            width: '20px'
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="subtitle2" sx={{ color: 'warning.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 576 512"
                style={{
                  width: '1rem',
                  height: '1rem',
                  fill: 'currentColor'
                }}
              >
                <path d="M534.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-128-128c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L434.7 224 224 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l210.7 0-73.4 73.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l128-128zM192 96c17.7 0 32-14.3 32-32s-14.3-32-32-32l-64 0c-53 0-96 43-96 96l0 256c0 53 43 96 96 96l64 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-64 0c-17.7 0-32-14.3-32-32l0-256c0-17.7 14.3-32 32-32l64 0z"/>
              </svg>
              流向
            </Typography>
            {transaction.referencedByInfo && transaction.referencedByInfo.length > 0 && (
              <Chip
                label={`${transaction.referencedByInfo.length} 筆`}
                color="warning"
                size="small"
              />
            )}
            {(() => {
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
              return null;
            })()}
          </Box>
          
          {renderReferencedByInfo()}
          
          {/* 流向區塊餘額 */}
          <Box sx={{ mt: 2, p: 1, bgcolor: '#ffe0b2', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#f57c00' }}>
              剩餘餘額：{(() => {
                const usedAmount = transaction.referencedByInfo
                  ?.filter(ref => ref.status !== 'cancelled')
                  .reduce((sum, ref) => sum + ref.totalAmount, 0) || 0;
                
                const remainingAmount = Math.max(0, transaction.totalAmount - usedAmount);
                return formatAmount(remainingAmount);
              })()}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default TransactionFundingFlow;