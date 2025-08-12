import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Button,
  Box,
  Typography,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  AccountBalance as AccountIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { EmbeddedAccountingEntryFormData } from '@pharmacy-pos/shared';

interface AccountOption {
  _id: string;
  name: string;
  code: string;
  accountType: string;
  normalBalance: 'debit' | 'credit';
  organizationId?: string;
  parentId?: string;
}

interface BalanceInfo {
  totalDebit: number;
  totalCredit: number;
  difference: number;
  isBalanced: boolean;
}

interface EntryTableProps {
  entries: EmbeddedAccountingEntryFormData[];
  availableAccounts: AccountOption[];
  balanceInfo: BalanceInfo;
  disabled?: boolean;
  onUpdateEntry: (index: number, field: keyof EmbeddedAccountingEntryFormData, value: any) => void;
  onAddEntry: () => void;
  onRemoveEntry: (index: number) => void;
  onOpenAccountSelector: (index: number) => void;
  onOpenFundingSource: (index: number) => void;
  onRemoveFundingSource: (index: number) => void;
}

/**
 * 分錄表格組件
 * 
 * 功能：
 * - 顯示和編輯分錄資料
 * - 支援科目選擇
 * - 支援資金來源追蹤
 * - 即時平衡驗證
 */
export const EntryTable: React.FC<EntryTableProps> = ({
  entries,
  availableAccounts,
  balanceInfo,
  disabled = false,
  onUpdateEntry,
  onAddEntry,
  onRemoveEntry,
  onOpenAccountSelector,
  onOpenFundingSource,
  onRemoveFundingSource
}) => {
  // 取得科目名稱
  const getAccountName = (accountId: string) => {
    const account = availableAccounts.find(acc => acc._id === accountId);
    return account ? `${account.name} (${account.code})` : '請選擇科目';
  };

  // 格式化金額
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD'
    }).format(amount);
  };

  // 渲染交易流向
  const renderTransactionFlow = () => {
    if (entries.length < 2) {
      return <Typography variant="caption" color="text.disabled">-</Typography>;
    }

    // 找到主要的借方和貸方科目
    const debitEntries = entries.filter(entry => (entry.debitAmount || 0) > 0);
    const creditEntries = entries.filter(entry => (entry.creditAmount || 0) > 0);

    if (debitEntries.length === 0 || creditEntries.length === 0) {
      return <Typography variant="caption" color="text.disabled">-</Typography>;
    }

    // 取第一個借方和貸方科目作為代表
    const fromAccount = creditEntries[0];
    const toAccount = debitEntries[0];

    // 獲取科目名稱
    const fromAccountName = getAccountName(fromAccount?.accountId || '').replace(' (請選擇科目)', '').split(' (')[0] || '未選擇';
    const toAccountName = getAccountName(toAccount?.accountId || '').replace(' (請選擇科目)', '').split(' (')[0] || '未選擇';

    // 如果科目未選擇，顯示提示
    if (fromAccountName === '請選擇科目' || toAccountName === '請選擇科目') {
      return <Typography variant="caption" color="text.disabled">請先選擇科目</Typography>;
    }

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

  // 處理金額輸入
  const handleAmountChange = (index: number, field: 'debitAmount' | 'creditAmount', value: string) => {
    const numericValue = parseFloat(value) || 0;
    onUpdateEntry(index, field, numericValue);
  };

  return (
    <Box>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width="30%">會計科目</TableCell>
              <TableCell width="12%" align="right">借方金額</TableCell>
              <TableCell width="12%" align="right">貸方金額</TableCell>
              <TableCell width="18%">摘要</TableCell>
              <TableCell width="18%" align="center">交易流向</TableCell>
              <TableCell width="10%" align="center">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry, index) => (
              <TableRow key={index} hover>
                {/* 會計科目 */}
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<AccountIcon />}
                      onClick={() => onOpenAccountSelector(index)}
                      disabled={disabled}
                      sx={{ 
                        justifyContent: 'flex-start',
                        textTransform: 'none',
                        minWidth: 200,
                        maxWidth: 300
                      }}
                    >
                      <Typography variant="body2" noWrap>
                        {getAccountName(entry.accountId)}
                      </Typography>
                    </Button>
                    
                    {/* 資金來源指示器 */}
                    {entry.sourceTransactionId ? (
                      <Tooltip title="已設定資金來源">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => onRemoveFundingSource(index)}
                          disabled={disabled}
                        >
                          <LinkIcon />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="設定資金來源">
                        <IconButton
                          size="small"
                          onClick={() => onOpenFundingSource(index)}
                          disabled={disabled}
                        >
                          <LinkOffIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>

                {/* 借方金額 */}
                <TableCell align="right">
                  <TextField
                    type="number"
                    size="small"
                    value={entry.debitAmount || ''}
                    onChange={(e) => handleAmountChange(index, 'debitAmount', e.target.value)}
                    disabled={disabled}
                    inputProps={{
                      min: 0,
                      step: 0.01,
                      style: { textAlign: 'right' }
                    }}
                    sx={{ width: 120 }}
                  />
                </TableCell>

                {/* 貸方金額 */}
                <TableCell align="right">
                  <TextField
                    type="number"
                    size="small"
                    value={entry.creditAmount || ''}
                    onChange={(e) => handleAmountChange(index, 'creditAmount', e.target.value)}
                    disabled={disabled}
                    inputProps={{
                      min: 0,
                      step: 0.01,
                      style: { textAlign: 'right' }
                    }}
                    sx={{ width: 120 }}
                  />
                </TableCell>

                {/* 摘要 */}
                <TableCell>
                  <TextField
                    size="small"
                    value={entry.description || ''}
                    onChange={(e) => onUpdateEntry(index, 'description', e.target.value)}
                    disabled={disabled}
                    placeholder="分錄摘要..."
                    fullWidth
                  />
                </TableCell>

                {/* 交易流向 - 只在第一行顯示 */}
                <TableCell align="center">
                  {index === 0 ? renderTransactionFlow() : null}
                </TableCell>

                {/* 操作 */}
                <TableCell align="center">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => onRemoveEntry(index)}
                    disabled={disabled || entries.length <= 2}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}

            {/* 合計行 */}
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>
                <Typography variant="subtitle2" fontWeight="bold">
                  合計
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography 
                  variant="subtitle2" 
                  fontWeight="bold"
                  color={balanceInfo.totalDebit > 0 ? 'primary.main' : 'text.secondary'}
                >
                  {formatCurrency(balanceInfo.totalDebit)}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography 
                  variant="subtitle2" 
                  fontWeight="bold"
                  color={balanceInfo.totalCredit > 0 ? 'secondary.main' : 'text.secondary'}
                >
                  {formatCurrency(balanceInfo.totalCredit)}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    差額: {formatCurrency(balanceInfo.difference)}
                  </Typography>
                  <Chip
                    label={balanceInfo.isBalanced ? '已平衡' : '未平衡'}
                    color={balanceInfo.isBalanced ? 'success' : 'error'}
                    size="small"
                    variant="outlined"
                  />
                </Box>
              </TableCell>
              <TableCell align="center">
                {/* 交易流向欄位在合計行留空 */}
              </TableCell>
              <TableCell align="center">
                <Button
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={onAddEntry}
                  disabled={disabled}
                  variant="outlined"
                >
                  新增
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default EntryTable;