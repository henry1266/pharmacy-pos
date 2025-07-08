import React, { useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Chip,
  Avatar,
  LinearProgress,
  Tooltip,
  Divider
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  SwapHoriz,
  AccountBalance,
  Receipt,
  ArrowForward,
  ArrowDownward,
  ArrowUpward,
  ArrowRightAlt,
  CallMade,
  CallReceived
} from '@mui/icons-material';
import { AccountingEntryDetail } from '@services/doubleEntryService';
import { formatCurrency } from '@utils/formatters';

interface Account {
  _id: string;
  name: string;
  accountType: string;
  normalBalance?: 'debit' | 'credit';
}

interface Statistics {
  totalDebit: number;
  totalCredit: number;
  balance: number;
  recordCount: number;
}

interface TransactionFlowVisualizationProps {
  entries: AccountingEntryDetail[];
  currentAccount: Account | null;
  statistics: Statistics;
}

const TransactionFlowVisualization: React.FC<TransactionFlowVisualizationProps> = ({
  entries,
  currentAccount,
  statistics
}) => {
  // 分析交易流向數據
  const flowData = useMemo(() => {
    if (!currentAccount) return null;

    const isDebitAccount = currentAccount.normalBalance === 'debit' || 
      ['asset', 'expense'].includes(currentAccount.accountType);

    // 統計對方科目
    const counterpartStats: Record<string, { debit: number; credit: number; count: number }> = {};
    
    entries.forEach(entry => {
      const counterparts = entry.counterpartAccounts || [];
      counterparts.forEach(counterpart => {
        if (!counterpartStats[counterpart]) {
          counterpartStats[counterpart] = { debit: 0, credit: 0, count: 0 };
        }
        counterpartStats[counterpart].debit += entry.debitAmount || 0;
        counterpartStats[counterpart].credit += entry.creditAmount || 0;
        counterpartStats[counterpart].count += 1;
      });
    });

    // 轉換為陣列並排序
    const counterpartArray = Object.entries(counterpartStats)
      .map(([name, stats]) => ({
        name,
        ...stats,
        total: stats.debit + stats.credit
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5); // 只顯示前5個

    return {
      isDebitAccount,
      counterparts: counterpartArray,
      totalIn: isDebitAccount ? statistics.totalDebit : statistics.totalCredit,
      totalOut: isDebitAccount ? statistics.totalCredit : statistics.totalDebit,
      netFlow: statistics.balance
    };
  }, [entries, currentAccount, statistics]);

  if (!flowData || !currentAccount) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body2" color="text.secondary">
          暫無交易流向資料
        </Typography>
      </Box>
    );
  }

  const { isDebitAccount, counterparts, totalIn, totalOut, netFlow } = flowData;

  return (
    <Stack spacing={3}>
      {/* 交易流向圖 */}
      <Card variant="outlined" sx={{ bgcolor: 'primary.50' }}>
        <CardContent sx={{ py: 2 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <SwapHoriz sx={{ mr: 1, color: 'primary.main' }} />
            交易流向圖
          </Typography>
          
          {/* 主要交易流向 */}
          {counterparts.slice(0, 3).map((counterpart, index) => {
            // 判斷流向：當前科目是借方還是貸方
            const currentIsDebit = counterpart.debit > 0;
            const currentIsCredit = counterpart.credit > 0;
            
            return (
              <Box key={counterpart.name} sx={{ mb: 2 }}>
                {/* 流向圖 */}
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 2,
                  bgcolor: 'white',
                  borderRadius: 2,
                  border: '2px solid',
                  borderColor: 'primary.200',
                  position: 'relative'
                }}>
                  {/* 左側科目 */}
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: 1
                  }}>
                    <Chip
                      label={currentIsDebit ? counterpart.name : currentAccount?.name}
                      size="small"
                      color="secondary"
                      sx={{ mb: 1, fontSize: '0.75rem', maxWidth: '100px' }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {currentIsDebit ? '來源科目' : '當前科目'}
                    </Typography>
                  </Box>

                  {/* 中間箭頭區域 */}
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    mx: 1,
                    flex: 1
                  }}>
                    <ArrowRightAlt sx={{
                      color: 'primary.main',
                      fontSize: 32,
                      mb: 0.5
                    }} />
                    <Typography variant="caption" fontWeight="bold" color="primary.main">
                      {formatCurrency(counterpart.total)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                      {counterpart.count} 筆交易
                    </Typography>
                  </Box>

                  {/* 右側科目 */}
                  <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: 1
                  }}>
                    <Chip
                      label={currentIsDebit ? currentAccount?.name : counterpart.name}
                      size="small"
                      color="primary"
                      sx={{ mb: 1, fontSize: '0.75rem', maxWidth: '100px' }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {currentIsDebit ? '當前科目' : '目標科目'}
                    </Typography>
                  </Box>
                </Box>
                
                {/* 交易類型說明 */}
                <Box sx={{
                  mt: 1,
                  textAlign: 'center',
                  p: 1,
                  bgcolor: 'grey.50',
                  borderRadius: 1
                }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    {currentIsDebit ? (
                      `${counterpart.name} >>> ${currentAccount?.name}`
                    ) : (
                      `${currentAccount?.name} >>> ${counterpart.name}`
                    )}
                  </Typography>
                  <br />
                  <Typography variant="caption" color="text.secondary">
                    {isDebitAccount ?
                      (currentIsDebit ? '資金流入' : '資金流出') :
                      (currentIsCredit ? '收入確認' : '支出確認')
                    }
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </CardContent>
      </Card>

      {/* 科目類型指示器 */}
      <Card variant="outlined">
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar
              sx={{
                bgcolor: isDebitAccount ? 'success.main' : 'error.main',
                width: 32,
                height: 32,
                mr: 1
              }}
            >
              {isDebitAccount ? <TrendingUp /> : <TrendingDown />}
            </Avatar>
            <Typography variant="subtitle2">
              {isDebitAccount ? '借方科目' : '貸方科目'}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            {isDebitAccount ? '資產或費用科目' : '負債、權益或收入科目'}
          </Typography>
        </CardContent>
      </Card>

      {/* 資金流向摘要 */}
      <Card variant="outlined">
        <CardContent sx={{ py: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            資金流向摘要
          </Typography>
          
          {/* 流入 */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ArrowDownward sx={{ color: 'success.main', mr: 1, fontSize: 16 }} />
              <Typography variant="body2" color="success.main">
                流入：{formatCurrency(totalIn)}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={totalIn > 0 ? Math.min((totalIn / (totalIn + totalOut)) * 100, 100) : 0}
              sx={{ height: 6, borderRadius: 3 }}
              color="success"
            />
          </Box>

          {/* 流出 */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <ArrowUpward sx={{ color: 'error.main', mr: 1, fontSize: 16 }} />
              <Typography variant="body2" color="error.main">
                流出：{formatCurrency(totalOut)}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={totalOut > 0 ? Math.min((totalOut / (totalIn + totalOut)) * 100, 100) : 0}
              sx={{ height: 6, borderRadius: 3 }}
              color="error"
            />
          </Box>

          {/* 淨額 */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2">
              淨額：
            </Typography>
            <Chip
              label={formatCurrency(Math.abs(netFlow))}
              color={netFlow >= 0 ? 'success' : 'error'}
              size="small"
              icon={netFlow >= 0 ? <TrendingUp /> : <TrendingDown />}
            />
          </Box>
        </CardContent>
      </Card>

      {/* 主要交易對象 */}
      {counterparts.length > 0 && (
        <Card variant="outlined">
          <CardContent sx={{ py: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              主要交易對象
            </Typography>
            
            <Stack spacing={1.5}>
              {counterparts.map((counterpart, index) => (
                <Box key={counterpart.name}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: `hsl(${index * 60}, 70%, 50%)`,
                        mr: 1
                      }}
                    />
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {counterpart.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {counterpart.count} 筆
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
                    <ArrowForward sx={{ fontSize: 12, color: 'text.secondary', mr: 0.5 }} />
                    <Typography variant="caption" color="text.secondary">
                      {formatCurrency(counterpart.total)}
                    </Typography>
                  </Box>
                  
                  {/* 進度條顯示相對金額 */}
                  <LinearProgress
                    variant="determinate"
                    value={counterparts.length > 0 ? (counterpart.total / counterparts[0].total) * 100 : 0}
                    sx={{ 
                      height: 4, 
                      borderRadius: 2, 
                      ml: 2, 
                      mt: 0.5,
                      bgcolor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: `hsl(${index * 60}, 70%, 50%)`
                      }
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* 交易活動指標 */}
      <Card variant="outlined">
        <CardContent sx={{ py: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            交易活動
          </Typography>
          
          <Stack spacing={1}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Receipt sx={{ fontSize: 16, color: 'primary.main', mr: 1 }} />
                <Typography variant="body2">總交易筆數</Typography>
              </Box>
              <Typography variant="body2" fontWeight="medium">
                {statistics.recordCount}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SwapHoriz sx={{ fontSize: 16, color: 'info.main', mr: 1 }} />
                <Typography variant="body2">平均交易額</Typography>
              </Box>
              <Typography variant="body2" fontWeight="medium">
                {statistics.recordCount > 0 
                  ? formatCurrency((totalIn + totalOut) / statistics.recordCount / 2)
                  : formatCurrency(0)
                }
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountBalance sx={{ fontSize: 16, color: 'secondary.main', mr: 1 }} />
                <Typography variant="body2">交易對象數</Typography>
              </Box>
              <Typography variant="body2" fontWeight="medium">
                {counterparts.length}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* 流向圖例說明 */}
      <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
        <CardContent sx={{ py: 2 }}>
          <Typography variant="caption" color="text.secondary" gutterBottom display="block">
            圖例說明
          </Typography>
          
          <Stack spacing={0.5}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ArrowDownward sx={{ fontSize: 12, color: 'success.main', mr: 1 }} />
              <Typography variant="caption">
                {isDebitAccount ? '借方增加（資產增加/費用發生）' : '貸方增加（收入/負債增加）'}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ArrowUpward sx={{ fontSize: 12, color: 'error.main', mr: 1 }} />
              <Typography variant="caption">
                {isDebitAccount ? '貸方減少（資產減少/費用沖銷）' : '借方減少（收入沖銷/負債減少）'}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};

export default TransactionFlowVisualization;