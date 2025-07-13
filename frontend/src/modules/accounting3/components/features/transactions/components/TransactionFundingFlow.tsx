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
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';

import { useNavigate } from 'react-router-dom';
import { TransactionGroupWithEntries3 } from '@pharmacy-pos/shared/types/accounting3';
import { formatAmount, formatDate, extractObjectId, isValidObjectId } from '../utils/transactionUtils';

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
        <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
          <Grid container spacing={1}>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                日期
              </Typography>
              <Typography variant="caption" display="block">
                {sourceInfo.transactionDate ? formatDate(sourceInfo.transactionDate) : '未知日期'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                交易描述
              </Typography>
              <Typography variant="caption" display="block">
                <strong>{sourceInfo.groupNumber || '未知編號'}</strong> - {sourceInfo.description || '無描述'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                金額
              </Typography>
              <Typography variant="caption" display="block" fontWeight="medium">
                {sourceInfo.totalAmount ? formatAmount(sourceInfo.totalAmount) : '未知金額'}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                狀態
              </Typography>
              <Typography variant="caption" display="block">
                {sourceInfo.status === 'confirmed' ? '已確認' : sourceInfo.status === 'cancelled' ? '已取消' : '草稿'}
              </Typography>
            </Grid>
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Button
                variant="outlined"
                size="small"
                fullWidth
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
            </Grid>
          </Grid>
        </Box>
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
        <Typography variant="body2" color="text.secondary" gutterBottom>
          關聯交易 ({transaction.linkedTransactionIds.length} 筆)
        </Typography>
        <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
          {transaction.linkedTransactionIds.map((linkedId, index) => {
            const cleanLinkedId = extractObjectId(linkedId);
            const isValid = cleanLinkedId && isValidObjectId(cleanLinkedId);
            
            // 如果有關聯交易資訊，顯示詳細格式
            if (typeof linkedId === 'object' && linkedId !== null) {
              const linkedInfo = linkedId as any;
              
              return (
                <Box key={cleanLinkedId || index} sx={{ mb: 1, p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
                  <Grid container spacing={1}>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        日期
                      </Typography>
                      <Typography variant="caption" display="block">
                        {linkedInfo.transactionDate ? formatDate(linkedInfo.transactionDate) : '未知日期'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        交易描述
                      </Typography>
                      <Typography variant="caption" display="block">
                        <strong>{linkedInfo.groupNumber || '未知編號'}</strong> - {linkedInfo.description || '無描述'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        金額
                      </Typography>
                      <Typography variant="caption" display="block" fontWeight="medium">
                        {linkedInfo.totalAmount ? formatAmount(linkedInfo.totalAmount) : '未知金額'}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        狀態
                      </Typography>
                      <Typography variant="caption" display="block">
                        {linkedInfo.status === 'confirmed' ? '已確認' : linkedInfo.status === 'cancelled' ? '已取消' : '草稿'}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sx={{ mt: 1 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
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
                        {isValid ? `查看關聯交易 ${index + 1}` : `無效交易 ${index + 1}`}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              );
            } else {
              // 如果只有 ID，顯示簡化格式
              return (
                <Button
                  key={cleanLinkedId || index}
                  variant="outlined"
                  size="small"
                  sx={{ mb: 1, mr: 1 }}
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
                  {isValid ? `關聯交易 ${index + 1}` : `無效交易 ${index + 1}`}
                </Button>
              );
            }
          })}
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
      <>
        <Box sx={{ mb: 2 }}>
          <Chip
            label={`被 ${transaction.referencedByInfo.length} 筆交易引用`}
            color="warning"
            size="small"
            sx={{ mr: 1 }}
          />
          {(() => {
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
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          流向詳情
        </Typography>
        <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
          {transaction.referencedByInfo.map((ref, index) => (
            <Box key={ref._id} sx={{ mb: 1, p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
              <Grid container spacing={1}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    日期
                  </Typography>
                  <Typography variant="caption" display="block">
                    {formatDate(ref.transactionDate)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    交易描述
                  </Typography>
                  <Typography variant="caption" display="block">
                    <strong>{ref.groupNumber}</strong> - {ref.description}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    金額
                  </Typography>
                  <Typography variant="caption" display="block" fontWeight="medium">
                    {formatAmount(ref.totalAmount)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    狀態
                  </Typography>
                  <Typography variant="caption" display="block">
                    {ref.status === 'confirmed' ? '已確認' : ref.status === 'cancelled' ? '已取消' : '草稿'}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          ))}
        </Box>
      </>
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
            <Typography variant="subtitle2" gutterBottom sx={{ color: 'primary.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
            
            {transaction.sourceTransactionId && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  資金來源交易
                </Typography>
                {renderSourceTransaction()}
              </Box>
            )}

            {renderLinkedTransactions()}
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
          
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                日期
              </Typography>
              <Typography variant="body1">
                {formatDate(transaction.transactionDate)}
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                交易描述
              </Typography>
              <Typography variant="body1">
                {transaction.description}
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                金額
              </Typography>
              <Typography variant="h6" color="primary">
                {formatAmount(transaction.totalAmount)}
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                剩餘可用金額
              </Typography>
              <Typography variant="h6" color="success.main">
                {formatAmount(calculateAvailableAmount())}
              </Typography>
            </Grid>
          </Grid>
        </Box>
        
        {/* 流向區塊 */}
        <Box sx={{ p: 2, bgcolor: 'warning.50', borderRadius: 1, border: '1px solid', borderColor: 'warning.200' }}>
          <Typography variant="subtitle2" gutterBottom sx={{ color: 'warning.main', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 0.5 }}>
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
          
          {renderReferencedByInfo()}
        </Box>
      </CardContent>
    </Card>
  );
};

export default TransactionFundingFlow;