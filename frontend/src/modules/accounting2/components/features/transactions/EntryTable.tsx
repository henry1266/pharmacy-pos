import React, { useMemo } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Button,
  Typography,
  Paper,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ArrowForward
} from '@mui/icons-material';
import { EmbeddedAccountingEntryFormData } from '@pharmacy-pos/shared';

// 科目選項介面
interface AccountOption {
  _id: string;
  name: string;
  code: string;
  accountType: string;
  normalBalance: 'debit' | 'credit';
  organizationId?: string;
  parentId?: string;
}

// 平衡資訊介面
interface BalanceInfo {
  totalDebit: number;
  totalCredit: number;
  difference: number;
  isBalanced: boolean;
}

// EntryTable Props 介面
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

// 會計科目類型選項
const accountTypeOptions = [
  { value: 'asset', label: '資產', color: '#4caf50' },
  { value: 'liability', label: '負債', color: '#f44336' },
  { value: 'equity', label: '權益', color: '#2196f3' },
  { value: 'revenue', label: '收入', color: '#ff9800' },
  { value: 'expense', label: '費用', color: '#9c27b0' }
];

/**
 * 分錄表格組件
 * 
 * 職責：
 * - 顯示分錄表格
 * - 處理分錄的增刪改操作
 * - 顯示借貸平衡狀態
 * - 管理分錄的交互操作
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
  // 計算交易流向
  const getTransactionFlow = (currentIndex: number) => {
    const currentEntry = entries[currentIndex];
    if (!currentEntry.accountId || (currentEntry.debitAmount === 0 && currentEntry.creditAmount === 0)) {
      return null;
    }

    // 找到當前會計科目
    const currentAccount = availableAccounts.find(acc => acc._id === currentEntry.accountId);
    if (!currentAccount) return null;

    // 找到對方科目（有相反金額的分錄）
    const counterpartEntries = entries.filter((entry, index) => {
      if (index === currentIndex || !entry.accountId) return false;
      
      // 如果當前分錄是借方，找貸方分錄；反之亦然
      if (currentEntry.debitAmount > 0 && entry.creditAmount > 0) return true;
      if (currentEntry.creditAmount > 0 && entry.debitAmount > 0) return true;
      
      return false;
    });

    if (counterpartEntries.length === 0) return null;

    // 取第一個對方科目
    const counterpartEntry = counterpartEntries[0];
    const counterpartAccount = availableAccounts.find(acc => acc._id === counterpartEntry.accountId);
    if (!counterpartAccount) return null;

    const hasDebit = currentEntry.debitAmount > 0;
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5 }}>
        {hasDebit ? (
          // 借方：對方科目 -> 當前科目
          <>
            <Chip
              label={counterpartAccount.name}
              size="small"
              color="secondary"
              sx={{ fontSize: '0.65rem', height: 20, mr: 0.5 }}
            />
            <ArrowForward sx={{ fontSize: 14, color: 'primary.main', mx: 0.25 }} />
            <Chip
              label={currentAccount.name}
              size="small"
              color="primary"
              sx={{ fontSize: '0.65rem', height: 20, ml: 0.5 }}
            />
          </>
        ) : (
          // 貸方：當前科目 -> 對方科目
          <>
            <Chip
              label={currentAccount.name}
              size="small"
              color="primary"
              sx={{ fontSize: '0.65rem', height: 20, mr: 0.5 }}
            />
            <ArrowForward sx={{ fontSize: 14, color: 'primary.main', mx: 0.25 }} />
            <Chip
              label={counterpartAccount.name}
              size="small"
              color="secondary"
              sx={{ fontSize: '0.65rem', height: 20, ml: 0.5 }}
            />
          </>
        )}
      </Box>
    );
  };

  return (
    <Box>
      {/* 分錄表格 */}
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="6%">序號</TableCell>
              <TableCell width="25%">會計科目</TableCell>
              <TableCell width="15%">交易流向</TableCell>
              <TableCell width="15%">借方金額</TableCell>
              <TableCell width="15%">貸方金額</TableCell>
              <TableCell width="15%">資金來源</TableCell>
              <TableCell width="8%">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {entries.map((entry, index) => (
              <TableRow key={index}>
                {/* 序號 */}
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {entry.sequence || index + 1}
                  </Typography>
                </TableCell>

                {/* 會計科目選擇 */}
                <TableCell>
                  {entry.accountId ? (
                    // 已選擇科目：顯示科目資訊和編輯按鈕
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ flex: 1 }}>
                        {(() => {
                          const selectedAccount = availableAccounts.find(acc => acc._id === entry.accountId);
                          return selectedAccount ? (
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {selectedAccount.code} - {selectedAccount.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {accountTypeOptions.find(opt => opt.value === selectedAccount.accountType)?.label} |
                                {selectedAccount.normalBalance === 'debit' ? '借方' : '貸方'}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="error">
                              科目不存在
                            </Typography>
                          );
                        })()}
                      </Box>
                      <Tooltip title={disabled ? "已確認的交易無法修改" : "更換科目"}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => onOpenAccountSelector(index)}
                            color="primary"
                            disabled={disabled}
                          >
                            <SearchIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  ) : (
                    // 未選擇科目：顯示選擇按鈕
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<SearchIcon />}
                      onClick={() => onOpenAccountSelector(index)}
                      disabled={disabled}
                      sx={{
                        width: '100%',
                        justifyContent: 'flex-start',
                        color: disabled ? 'text.disabled' : 'text.secondary',
                        borderColor: disabled ? 'action.disabled' : 'divider',
                        '&:hover': !disabled ? {
                          borderColor: 'primary.main',
                          color: 'primary.main'
                        } : {}
                      }}
                    >
                      {disabled ? '已確認無法修改' : '選擇會計科目'}
                    </Button>
                  )}
                </TableCell>

                {/* 交易流向 */}
                <TableCell>
                  {getTransactionFlow(index) || (
                    <Typography variant="caption" color="text.disabled">
                      -
                    </Typography>
                  )}
                </TableCell>

                {/* 借方金額 */}
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={entry.debitAmount || ''}
                    onChange={(e) => onUpdateEntry(index, 'debitAmount', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    inputProps={{ min: 0, step: 0.01 }}
                    disabled={disabled || entry.creditAmount > 0}
                    sx={{
                      '& input': {
                        textAlign: 'right'
                      }
                    }}
                  />
                </TableCell>

                {/* 貸方金額 */}
                <TableCell>
                  <TextField
                    size="small"
                    type="number"
                    value={entry.creditAmount || ''}
                    onChange={(e) => onUpdateEntry(index, 'creditAmount', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    inputProps={{ min: 0, step: 0.01 }}
                    disabled={disabled || entry.debitAmount > 0}
                    sx={{
                      '& input': {
                        textAlign: 'right'
                      }
                    }}
                  />
                </TableCell>

                {/* 資金來源 */}
                <TableCell>
                  {entry.sourceTransactionId ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Chip
                        label="已設定"
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                      <Tooltip title={disabled ? "已確認的交易無法修改" : "移除資金來源"}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => onRemoveFundingSource(index)}
                            disabled={disabled}
                            color="error"
                            sx={{ p: 0.25 }}
                          >
                            <DeleteIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  ) : (
                    // 根據借貸方向決定是否顯示資金來源選擇
                    entry.debitAmount > 0 ? (
                      // 借方分錄：顯示資金來源選擇（推薦）
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        disabled={disabled}
                        sx={{
                          fontSize: '0.7rem',
                          minWidth: 'auto',
                          px: 1,
                          py: 0.5
                        }}
                        onClick={() => onOpenFundingSource(index)}
                      >
                        選擇來源
                      </Button>
                    ) : entry.creditAmount > 0 ? (
                      // 貸方分錄：顯示次要選擇（可選）
                      <Button
                        size="small"
                        variant="text"
                        color="secondary"
                        disabled={disabled}
                        sx={{
                          fontSize: '0.65rem',
                          minWidth: 'auto',
                          px: 0.5,
                          py: 0.25,
                          opacity: 0.7
                        }}
                        onClick={() => onOpenFundingSource(index)}
                      >
                        可選來源
                      </Button>
                    ) : (
                      // 未設定金額：顯示提示
                      <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                        請先設定金額
                      </Typography>
                    )
                  )}
                </TableCell>

                {/* 操作按鈕 */}
                <TableCell>
                  <Tooltip title={disabled ? "已確認的交易無法修改" : "刪除分錄"}>
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => onRemoveEntry(index)}
                        disabled={disabled || entries.length <= 1}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}

            {/* 總計行 */}
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              <TableCell>
                <Typography variant="subtitle2">總計</Typography>
              </TableCell>
              <TableCell>
                {/* 科目欄位 - 空白 */}
              </TableCell>
              <TableCell>
                {/* 交易流向欄位 - 空白 */}
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" sx={{ textAlign: 'right' }}>
                  NT$ {balanceInfo.totalDebit.toLocaleString()}
                </Typography>
              </TableCell>
              <TableCell>
                <Typography variant="subtitle2" sx={{ textAlign: 'right' }}>
                  NT$ {balanceInfo.totalCredit.toLocaleString()}
                </Typography>
              </TableCell>
              <TableCell sx={{ pl: 1 }}>
                <Typography
                  variant="body2"
                  color={balanceInfo.isBalanced ? 'success.main' : 'error.main'}
                  sx={{ textAlign: 'left' }}
                >
                  {balanceInfo.isBalanced ? '✓ 借貸平衡' : `✗ 差額：NT$ ${balanceInfo.difference.toLocaleString()}`}
                </Typography>
              </TableCell>
              <TableCell>
                {/* 操作欄位 - 空白 */}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      {/* 新增分錄按鈕 */}
      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Tooltip title={disabled ? "已確認的交易無法修改" : "新增一筆分錄"}>
          <span>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={onAddEntry}
              disabled={disabled}
            >
              新增分錄
            </Button>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default EntryTable;