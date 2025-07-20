import React, { useState, useEffect } from 'react';
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
import { accounting3Service } from '../../../../services/accounting3Service';

interface TransactionFundingFlowProps {
  transaction: TransactionGroupWithEntries3;
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
              <TableRow>
                <TableCell>
                  {sourceInfo.transactionDate ? formatDateOnly(sourceInfo.transactionDate) : '未知日期'}
                </TableCell>
                <TableCell>
                  <Tooltip title={`編號: ${sourceInfo.groupNumber || '未知編號'}`} arrow>
                    <span style={{ cursor: 'help' }}>
                      {sourceInfo.description || '無描述'}
                    </span>
                  </Tooltip>
                </TableCell>
                <TableCell align="center">
                  {(() => {
                    // 從來源交易實際使用的金額
                    // 檢查來源交易資訊中是否有使用金額的記錄
                    let usedFromThisSource = 0;
                    
                    // 如果來源交易資訊中有 usedAmount 或類似欄位
                    if (sourceInfo.usedAmount !== undefined) {
                      usedFromThisSource = sourceInfo.usedAmount;
                    } else if (sourceInfo.allocatedAmount !== undefined) {
                      usedFromThisSource = sourceInfo.allocatedAmount;
                    } else {
                      // 如果沒有明確的使用金額，需要計算
                      // 檢查是否有多個來源，如果有則需要按比例分配
                      const totalSources = (transaction.sourceTransactionId ? 1 : 0) + (transaction.linkedTransactionIds?.length || 0);
                      if (totalSources > 1) {
                        // 多來源情況：需要按比例分配當前交易的總金額
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
                          usedFromThisSource = Math.round((sourceAmount / totalSourceAmount) * currentTransactionAmount);
                        } else {
                          usedFromThisSource = currentTransactionAmount;
                        }
                      } else {
                        // 單一來源：使用當前交易的總金額
                        usedFromThisSource = transaction.totalAmount || 0;
                      }
                    }
                    
                    console.log('🔍 來源交易使用金額計算:', {
                      sourceInfo,
                      usedFromThisSource,
                      currentTransactionTotal: transaction.totalAmount,
                      hasMultipleSources: (transaction.sourceTransactionId ? 1 : 0) + (transaction.linkedTransactionIds?.length || 0) > 1
                    });
                    
                    return (
                      <Tooltip title={`從此來源使用金額: ${formatAmount(usedFromThisSource)}`} arrow>
                        <span style={{
                          fontWeight: 'medium'
                        }}>
                          {formatAmount(usedFromThisSource)}
                        </span>
                      </Tooltip>
                    );
                  })()}
                </TableCell>
                <TableCell align="center">
                  {(() => {
                    // 來源交易區塊：使用餘額計算 API 獲取的真實資料
                    const cleanSourceId = extractObjectId(transaction.sourceTransactionId);
                    
                    // 檢查是否有從 API 獲取的來源交易餘額資料
                    if (cleanSourceId && linkedTransactionDetails[cleanSourceId] && linkedTransactionDetails[cleanSourceId].hasRealBalance) {
                      const sourceBalanceData = linkedTransactionDetails[cleanSourceId];
                      const totalAmount = sourceBalanceData.totalAmount || 0;
                      let availableAmount = sourceBalanceData.availableAmount || 0;
                      
                      // 計算從這個來源使用的金額
                      let usedFromThisSource = 0;
                      if (sourceInfo.usedAmount !== undefined) {
                        usedFromThisSource = sourceInfo.usedAmount;
                      } else if (sourceInfo.allocatedAmount !== undefined) {
                        usedFromThisSource = sourceInfo.allocatedAmount;
                      } else {
                        // 按比例分配計算使用金額
                        const totalSources = (transaction.sourceTransactionId ? 1 : 0) + (transaction.linkedTransactionIds?.length || 0);
                        if (totalSources > 1) {
                          const currentTransactionAmount = transaction.totalAmount || 0;
                          const sourceAmount = sourceInfo.totalAmount || 0;
                          
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
                          
                          if (totalSourceAmount > 0) {
                            usedFromThisSource = Math.round((sourceAmount / totalSourceAmount) * currentTransactionAmount);
                          } else {
                            usedFromThisSource = currentTransactionAmount;
                          }
                        } else {
                          usedFromThisSource = transaction.totalAmount || 0;
                        }
                      }
                      
                      // 如果這個來源被當前交易完全使用，餘額應該減去使用的金額
                      // 但由於 API 餘額可能還沒有反映當前交易的使用情況，我們需要手動調整
                      if (usedFromThisSource >= totalAmount) {
                        // 如果使用金額等於或超過總額，餘額為0
                        availableAmount = 0;
                      } else if (availableAmount + usedFromThisSource > totalAmount) {
                        // 如果 API 餘額加上使用金額超過總額，說明 API 餘額還沒更新
                        availableAmount = Math.max(0, totalAmount - usedFromThisSource);
                      }
                      
                      console.log('🔍 來源交易餘額計算:', {
                        sourceId: cleanSourceId,
                        totalAmount,
                        originalAvailableAmount: sourceBalanceData.availableAmount,
                        usedFromThisSource,
                        adjustedAvailableAmount: availableAmount,
                        sourceBalanceData
                      });
                      
                      return (
                        <Tooltip title={`來源交易總額: ${formatAmount(totalAmount)}, 使用金額: ${formatAmount(usedFromThisSource)}, 調整後剩餘: ${formatAmount(availableAmount)}`} arrow>
                          <span style={{
                            fontWeight: 'medium',
                            color: availableAmount === totalAmount ? '#2e7d32' :
                                   availableAmount > 0 ? '#ed6c02' : '#d32f2f'
                          }}>
                            {formatAmount(availableAmount)}/{formatAmount(totalAmount)}
                          </span>
                        </Tooltip>
                      );
                    } else if (loading) {
                      return (
                        <span style={{ color: '#666', fontStyle: 'italic' }}>
                          載入餘額中...
                        </span>
                      );
                    } else {
                      // 回退到原始資料顯示
                      const totalAmount = sourceInfo.totalAmount || 0;
                      const remainingAfterCurrentUse = sourceInfo.availableAmount !== undefined
                        ? sourceInfo.availableAmount
                        : totalAmount;
                      
                      return (
                        <Tooltip title={`來源交易總額: ${formatAmount(totalAmount)}, 回退計算剩餘: ${formatAmount(remainingAfterCurrentUse)}`} arrow>
                          <span style={{
                            fontWeight: 'medium',
                            color: remainingAfterCurrentUse === totalAmount ? '#2e7d32' :
                                   remainingAfterCurrentUse > 0 ? '#ed6c02' : '#d32f2f'
                          }}>
                            {formatAmount(remainingAfterCurrentUse)}/{formatAmount(totalAmount)}
                          </span>
                        </Tooltip>
                      );
                    }
                  })()}
                </TableCell>
                <TableCell align="center">
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      if (isValid) {
                        console.log('✅ 導航到來源交易:', `/accounting3/transaction/${cleanSourceId}`);
                        navigate(`/accounting3/transaction/${cleanSourceId}`);
                      } else {
                        console.error('❌ 無效的來源交易 ID:', transaction.sourceTransactionId);
                      }
                    }}
                    disabled={!isValid}
                  >
                    {isValid ? '查看' : '無效'}
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      );
    } else {
      // 如果只有 ID，顯示簡化格式
      return (
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            if (isValid) {
              console.log('✅ 導航到來源交易:', `/accounting3/transaction/${cleanSourceId}`);
              navigate(`/accounting3/transaction/${cleanSourceId}`);
            } else {
              console.error('❌ 無效的來源交易 ID:', transaction.sourceTransactionId);
            }
          }}
          disabled={!isValid}
        >
          {isValid ? '查看來源交易' : '無效來源交易'}
        </Button>
      );
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
              {transaction.linkedTransactionIds.map((linkedId, index) => {
                const cleanLinkedId = extractObjectId(linkedId);
                const isValid = cleanLinkedId && isValidObjectId(cleanLinkedId);
                
                // 如果有關聯交易資訊，顯示詳細格式
                if (typeof linkedId === 'object' && linkedId !== null) {
                  const linkedInfo = linkedId as any;
                  
                  return (
                    <TableRow key={cleanLinkedId || index}>
                      <TableCell>
                        {linkedInfo.transactionDate ? formatDateOnly(linkedInfo.transactionDate) : '未知日期'}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={`編號: ${linkedInfo.groupNumber || '未知編號'}`} arrow>
                          <span style={{ cursor: 'help' }}>
                            {linkedInfo.description || '無描述'}
                          </span>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">
                        {(() => {
                          // 從關聯交易實際使用的金額
                          // 檢查關聯交易資訊中是否有使用金額的記錄
                          let usedFromThisSource = 0;
                          
                          // 如果關聯交易資訊中有 usedAmount 或類似欄位
                          if (linkedInfo.usedAmount !== undefined) {
                            usedFromThisSource = linkedInfo.usedAmount;
                          } else if (linkedInfo.allocatedAmount !== undefined) {
                            usedFromThisSource = linkedInfo.allocatedAmount;
                          } else {
                            // 如果沒有明確的使用金額，需要計算
                            // 檢查是否有多個來源，如果有則需要按比例分配
                            const totalSources = (transaction.sourceTransactionId ? 1 : 0) + (transaction.linkedTransactionIds?.length || 0);
                            if (totalSources > 1) {
                              // 多來源情況：需要從後端 API 或其他地方獲取實際分配金額
                              // 暫時按比例分配當前交易的總金額
                              const currentTransactionAmount = transaction.totalAmount || 0;
                              const sourceAmount = linkedInfo.totalAmount || 0;
                              
                              // 計算所有來源的總金額
                              let totalSourceAmount = 0;
                              if (transaction.sourceTransactionId && typeof transaction.sourceTransactionId === 'object') {
                                const sourceInfo = transaction.sourceTransactionId as any;
                                totalSourceAmount += sourceInfo.totalAmount || 0;
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
                                usedFromThisSource = Math.round((sourceAmount / totalSourceAmount) * currentTransactionAmount);
                              } else {
                                usedFromThisSource = currentTransactionAmount;
                              }
                            } else {
                              // 單一來源：使用當前交易的總金額
                              usedFromThisSource = transaction.totalAmount || 0;
                            }
                          }
                          
                          console.log('🔍 關聯交易使用金額計算:', {
                            linkedInfo,
                            usedFromThisSource,
                            currentTransactionTotal: transaction.totalAmount,
                            hasMultipleSources: (transaction.sourceTransactionId ? 1 : 0) + (transaction.linkedTransactionIds?.length || 0) > 1
                          });
                          
                          return (
                            <Tooltip title={`從此關聯交易使用金額: ${formatAmount(usedFromThisSource)}`} arrow>
                              <span style={{
                                fontWeight: 'medium'
                              }}>
                                {formatAmount(usedFromThisSource)}
                              </span>
                            </Tooltip>
                          );
                        })()}
                      </TableCell>
                      <TableCell align="center">
                        {(() => {
                          // 關聯交易區塊：使用餘額計算 API 獲取的真實資料
                          
                          // 檢查是否有從 API 獲取的關聯交易餘額資料
                          if (cleanLinkedId && linkedTransactionDetails[cleanLinkedId] && linkedTransactionDetails[cleanLinkedId].hasRealBalance) {
                            const linkedBalanceData = linkedTransactionDetails[cleanLinkedId];
                            const totalAmount = linkedBalanceData.totalAmount || 0;
                            let availableAmount = linkedBalanceData.availableAmount || 0;
                            
                            // 計算從這個關聯交易使用的金額
                            let usedFromThisSource = 0;
                            if (linkedInfo.usedAmount !== undefined) {
                              usedFromThisSource = linkedInfo.usedAmount;
                            } else if (linkedInfo.allocatedAmount !== undefined) {
                              usedFromThisSource = linkedInfo.allocatedAmount;
                            } else {
                              // 按比例分配計算使用金額
                              const totalSources = (transaction.sourceTransactionId ? 1 : 0) + (transaction.linkedTransactionIds?.length || 0);
                              if (totalSources > 1) {
                                const currentTransactionAmount = transaction.totalAmount || 0;
                                const sourceAmount = linkedInfo.totalAmount || 0;
                                
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
                                
                                if (totalSourceAmount > 0) {
                                  usedFromThisSource = Math.round((sourceAmount / totalSourceAmount) * currentTransactionAmount);
                                } else {
                                  usedFromThisSource = currentTransactionAmount;
                                }
                              } else {
                                usedFromThisSource = transaction.totalAmount || 0;
                              }
                            }
                            
                            // 如果這個關聯交易被當前交易完全使用，餘額應該減去使用的金額
                            if (usedFromThisSource >= totalAmount) {
                              // 如果使用金額等於或超過總額，餘額為0
                              availableAmount = 0;
                            } else if (availableAmount + usedFromThisSource > totalAmount) {
                              // 如果 API 餘額加上使用金額超過總額，說明 API 餘額還沒更新
                              availableAmount = Math.max(0, totalAmount - usedFromThisSource);
                            }
                            
                            console.log('🔍 關聯交易餘額計算:', {
                              linkedId: cleanLinkedId,
                              totalAmount,
                              originalAvailableAmount: linkedBalanceData.availableAmount,
                              usedFromThisSource,
                              adjustedAvailableAmount: availableAmount,
                              linkedBalanceData
                            });
                            
                            return (
                              <Tooltip title={`關聯交易總額: ${formatAmount(totalAmount)}, 使用金額: ${formatAmount(usedFromThisSource)}, 調整後剩餘: ${formatAmount(availableAmount)}`} arrow>
                                <span style={{
                                  fontWeight: 'medium',
                                  color: availableAmount === totalAmount ? '#2e7d32' :
                                         availableAmount > 0 ? '#ed6c02' : '#d32f2f'
                                }}>
                                  {formatAmount(availableAmount)}/{formatAmount(totalAmount)}
                                </span>
                              </Tooltip>
                            );
                          } else if (loading) {
                            return (
                              <span style={{ color: '#666', fontStyle: 'italic' }}>
                                載入餘額中...
                              </span>
                            );
                          } else {
                            // 回退到原始資料顯示
                            const totalAmount = linkedInfo.totalAmount || 0;
                            const remainingAfterCurrentUse = linkedInfo.availableAmount !== undefined
                              ? linkedInfo.availableAmount
                              : totalAmount;
                            
                            return (
                              <Tooltip title={`關聯交易總額: ${formatAmount(totalAmount)}, 回退計算剩餘: ${formatAmount(remainingAfterCurrentUse)}`} arrow>
                                <span style={{
                                  fontWeight: 'medium',
                                  color: remainingAfterCurrentUse === totalAmount ? '#2e7d32' :
                                         remainingAfterCurrentUse > 0 ? '#ed6c02' : '#d32f2f'
                                }}>
                                  {formatAmount(remainingAfterCurrentUse)}/{formatAmount(totalAmount)}
                                </span>
                              </Tooltip>
                            );
                          }
                        })()}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            if (isValid) {
                              console.log('✅ 導航到關聯交易:', `/accounting3/transaction/${cleanLinkedId}`);
                              navigate(`/accounting3/transaction/${cleanLinkedId}`);
                            } else {
                              console.error('❌ 無效的關聯交易 ID:', linkedId);
                            }
                          }}
                          disabled={!isValid}
                        >
                          {isValid ? '查看' : '無效'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                } else {
                  // 如果只有 ID，顯示簡化格式
                  return (
                    <TableRow key={cleanLinkedId || index}>
                      <TableCell colSpan={4}>
                        關聯交易 {index + 1} (僅 ID)
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            if (isValid) {
                              console.log('✅ 導航到關聯交易:', `/accounting3/transaction/${cleanLinkedId}`);
                              navigate(`/accounting3/transaction/${cleanLinkedId}`);
                            } else {
                              console.error('❌ 無效的關聯交易 ID:', linkedId);
                            }
                          }}
                          disabled={!isValid}
                        >
                          {isValid ? '查看' : '無效'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                }
              })}
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

    const usedAmount = transaction.referencedByInfo
      .filter(ref => ref.status !== 'cancelled')
      .reduce((sum, ref) => sum + ref.totalAmount, 0);

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
              {transaction.referencedByInfo.map((ref, index) => (
                <TableRow key={ref._id}>
                  <TableCell>
                    {formatDateOnly(ref.transactionDate)}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={`編號: ${ref.groupNumber}`} arrow>
                      <span style={{ cursor: 'help' }}>
                        {ref.description}
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    {(() => {
                      // 流向交易使用的金額
                      const refTotalAmount = ref.totalAmount || 0;
                      
                      return (
                        <Tooltip title={`流向交易使用金額: ${formatAmount(refTotalAmount)}`} arrow>
                          <span style={{
                            fontWeight: 'medium',
                            color: '#d32f2f'
                          }}>
                            {formatAmount(refTotalAmount)}
                          </span>
                        </Tooltip>
                      );
                    })()}
                  </TableCell>
                  <TableCell align="center">
                    {(() => {
                      // 流向交易的餘額狀態：使用餘額計算 API 獲取的真實資料
                      const cleanRefId = extractObjectId(ref._id);
                      
                      // 檢查是否有從 API 獲取的流向交易餘額資料
                      if (cleanRefId && linkedTransactionDetails[cleanRefId] && linkedTransactionDetails[cleanRefId].hasRealBalance) {
                        const refBalanceData = linkedTransactionDetails[cleanRefId];
                        const totalAmount = refBalanceData.totalAmount || 0;
                        const availableAmount = refBalanceData.availableAmount || 0;
                        
                        console.log('🔍 流向交易使用 API 餘額資料:', {
                          refId: cleanRefId,
                          totalAmount,
                          availableAmount,
                          refBalanceData
                        });
                        
                        return (
                          <Tooltip title={`流向交易總額: ${formatAmount(totalAmount)}, API 計算剩餘: ${formatAmount(availableAmount)}`} arrow>
                            <span style={{
                              fontWeight: 'medium',
                              color: availableAmount === totalAmount ? '#2e7d32' :
                                     availableAmount > 0 ? '#ed6c02' : '#d32f2f'
                            }}>
                              {formatAmount(availableAmount)}/{formatAmount(totalAmount)}
                            </span>
                          </Tooltip>
                        );
                      } else if (loading) {
                        return (
                          <span style={{ color: '#666', fontStyle: 'italic' }}>
                            載入餘額中...
                          </span>
                        );
                      } else {
                        // 回退到原始顯示方式
                        const refTotalAmount = ref.totalAmount || 0;
                        
                        return (
                          <Tooltip title={`流向交易狀態: 已使用 ${formatAmount(refTotalAmount)}`} arrow>
                            <span style={{
                              fontWeight: 'medium',
                              color: '#d32f2f'
                            }}>
                              已使用/{formatAmount(refTotalAmount)}
                            </span>
                          </Tooltip>
                        );
                      }
                    })()}
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        const cleanRefId = extractObjectId(ref._id);
                        if (cleanRefId && isValidObjectId(cleanRefId)) {
                          console.log('✅ 導航到流向交易:', `/accounting3/transaction/${cleanRefId}`);
                          navigate(`/accounting3/transaction/${cleanRefId}`);
                        } else {
                          console.error('❌ 無效的流向交易 ID:', ref._id);
                        }
                      }}
                      disabled={!ref._id || !isValidObjectId(extractObjectId(ref._id))}
                    >
                      {ref._id && isValidObjectId(extractObjectId(ref._id)) ? '查看' : '無效'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
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
                <TableRow>
                  <TableCell>
                    {formatDateOnly(transaction.transactionDate)}
                  </TableCell>
                  <TableCell>
                    <Tooltip title={`編號: ${transaction.groupNumber}`} arrow>
                      <span style={{ cursor: 'help' }}>
                        {transaction.description}
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="center">
                    {(() => {
                      // 本次金額（當前交易的總金額）
                      const currentTransactionAmount = transaction.totalAmount || 0;
                      
                      return (
                        <Tooltip title={`交易總金額: ${formatAmount(currentTransactionAmount)}`} arrow>
                          <span style={{
                            fontWeight: 'medium'
                          }}>
                            {formatAmount(currentTransactionAmount)}
                          </span>
                        </Tooltip>
                      );
                    })()}
                  </TableCell>
                  <TableCell align="center">
                    {(() => {
                      // 交易區塊：顯示交易本身的餘額狀態
                      const currentTransactionAmount = transaction.totalAmount || 0;
                      
                      // 計算交易被其他交易使用的金額
                      const usedByOthersAmount = transaction.referencedByInfo
                        ?.filter(ref => ref.status !== 'cancelled')
                        .reduce((sum, ref) => sum + (ref.totalAmount || 0), 0) || 0;
                      
                      // 計算交易的實際剩餘金額
                      const currentRemainingAmount = Math.max(0, currentTransactionAmount - usedByOthersAmount);
                      
                      console.log('🔍 交易自身狀態:', {
                        currentTransactionAmount,
                        usedByOthersAmount,
                        currentRemainingAmount,
                        referencedByInfo: transaction.referencedByInfo
                      });
                      
                      return (
                        <Tooltip title={`交易總金額: ${formatAmount(currentTransactionAmount)}, 被其他交易使用: ${formatAmount(usedByOthersAmount)}, 當前剩餘: ${formatAmount(currentRemainingAmount)}`} arrow>
                          <span style={{
                            fontWeight: 'medium',
                            color: currentRemainingAmount === currentTransactionAmount ? '#2e7d32' :
                                   currentRemainingAmount > 0 ? '#ed6c02' : '#d32f2f'
                          }}>
                            {formatAmount(currentRemainingAmount)}/{formatAmount(currentTransactionAmount)}
                          </span>
                        </Tooltip>
                      );
                    })()}
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        // 當前交易，可以重新整理或其他操作
                        window.location.reload();
                      }}
                    >
                      重新整理
                    </Button>
                  </TableCell>
                </TableRow>
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