import React from 'react';
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
                <TableCell align="right">金額</TableCell>
                <TableCell align="center">狀態</TableCell>
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
                <TableCell align="right" sx={{ fontWeight: 'medium' }}>
                  {sourceInfo.totalAmount ? formatAmount(sourceInfo.totalAmount) : '未知金額'}
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={sourceInfo.status === 'confirmed' ? '已確認' : sourceInfo.status === 'cancelled' ? '已取消' : '草稿'}
                    color={sourceInfo.status === 'confirmed' ? 'success' : sourceInfo.status === 'cancelled' ? 'error' : 'default'}
                    size="small"
                  />
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
                <TableCell align="right">金額</TableCell>
                <TableCell align="center">狀態</TableCell>
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
                      <TableCell align="right" sx={{ fontWeight: 'medium' }}>
                        {linkedInfo.totalAmount ? formatAmount(linkedInfo.totalAmount) : '未知金額'}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={linkedInfo.status === 'confirmed' ? '已確認' : linkedInfo.status === 'cancelled' ? '已取消' : '草稿'}
                          color={linkedInfo.status === 'confirmed' ? 'success' : linkedInfo.status === 'cancelled' ? 'error' : 'default'}
                          size="small"
                        />
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
                <TableCell align="right">金額</TableCell>
                <TableCell align="center">狀態</TableCell>
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
                  <TableCell align="right" sx={{ fontWeight: 'medium' }}>
                    {formatAmount(ref.totalAmount)}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={ref.status === 'confirmed' ? '已確認' : ref.status === 'cancelled' ? '已取消' : '草稿'}
                      color={ref.status === 'confirmed' ? 'success' : ref.status === 'cancelled' ? 'error' : 'default'}
                      size="small"
                    />
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
          <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1, border: '1px solid', borderColor: 'primary.200' }}>
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
            <Box sx={{ mt: 2, p: 1, bgcolor: 'primary.100', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
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
        <Box sx={{ mb: 3, p: 2, bgcolor: 'info.50', borderRadius: 1, border: '1px solid', borderColor: 'info.200' }}>
          <Typography variant="subtitle2" gutterBottom sx={{ color: 'info.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
                  <TableCell align="right">金額</TableCell>
                  <TableCell align="center">狀態</TableCell>
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
                  <TableCell align="right" sx={{ fontWeight: 'medium' }}>
                    {formatAmount(transaction.totalAmount)}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={transaction.status === 'confirmed' ? '已確認' : transaction.status === 'cancelled' ? '已取消' : '草稿'}
                      color={transaction.status === 'confirmed' ? 'success' : transaction.status === 'cancelled' ? 'error' : 'default'}
                      size="small"
                    />
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
        <Box sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 1, border: '1px solid', borderColor: 'warning.200' }}>
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
          <Box sx={{ mt: 2, p: 1, bgcolor: 'warning.100', borderRadius: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
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