import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  IconButton,
  Box,
  Divider,
  Paper,
  Tooltip,
  SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  FileCopy as CopyIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zhTW } from 'date-fns/locale';
import { 
  TransactionGroupWithEntries, 
  TransactionGroupWithEntriesFormData,
  EmbeddedAccountingEntryFormData
} from '../types';
import { safeDateConvert } from '../../../transactions/utils/dateUtils';

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (formData: TransactionGroupWithEntriesFormData) => void;
  editingTransaction: TransactionGroupWithEntries | null;
  copyingTransaction: TransactionGroupWithEntries | null;
  accounts: any[];
  organizations: any[];
  defaultAccountId?: string | null;
  defaultOrganizationId?: string | null;
}

/**
 * 交易表單組件
 * 用於創建和編輯交易
 */
export const TransactionForm: React.FC<TransactionFormProps> = ({
  open,
  onClose,
  onSubmit,
  editingTransaction,
  copyingTransaction,
  accounts,
  organizations,
  defaultAccountId,
  defaultOrganizationId
}) => {
  // 表單狀態
  const [formData, setFormData] = useState<TransactionGroupWithEntriesFormData>({
    description: '',
    transactionDate: new Date(),
    organizationId: '',
    receiptUrl: '',
    invoiceNo: '',
    entries: [
      { sequence: 1, accountId: '', debitAmount: 0, creditAmount: 0, description: '' },
      { sequence: 2, accountId: '', debitAmount: 0, creditAmount: 0, description: '' }
    ],
    linkedTransactionIds: [],
    sourceTransactionId: '',
    fundingType: 'original'
  });

  // 表單驗證狀態
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // 計算借貸總額
  const totalDebit = formData.entries.reduce((sum, entry) => sum + (Number(entry.debitAmount) || 0), 0);
  const totalCredit = formData.entries.reduce((sum, entry) => sum + (Number(entry.creditAmount) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  // 初始化表單數據
  useEffect(() => {
    if (open) {
      if (editingTransaction) {
        // 編輯模式
        setFormData({
          description: editingTransaction.description || '',
          transactionDate: safeDateConvert(editingTransaction.transactionDate),
          organizationId: editingTransaction.organizationId || '',
          receiptUrl: editingTransaction.receiptUrl || '',
          invoiceNo: editingTransaction.invoiceNo || '',
          entries: editingTransaction.entries.map(entry => ({
            _id: entry._id,
            sequence: entry.sequence,
            accountId: typeof entry.accountId === 'string' ? entry.accountId : entry.accountId?._id || '',
            debitAmount: entry.debitAmount || 0,
            creditAmount: entry.creditAmount || 0,
            description: entry.description || '',
            sourceTransactionId: entry.sourceTransactionId || '',
            fundingPath: entry.fundingPath || []
          })),
          linkedTransactionIds: editingTransaction.linkedTransactionIds || [],
          sourceTransactionId: editingTransaction.sourceTransactionId || '',
          fundingType: editingTransaction.fundingType || 'original'
        });
      } else if (copyingTransaction) {
        // 複製模式
        setFormData({
          description: `複製: ${copyingTransaction.description || ''}`,
          transactionDate: new Date(),
          organizationId: copyingTransaction.organizationId || '',
          receiptUrl: copyingTransaction.receiptUrl || '',
          invoiceNo: '',
          entries: copyingTransaction.entries.map(entry => ({
            sequence: entry.sequence,
            accountId: typeof entry.accountId === 'string' ? entry.accountId : entry.accountId?._id || '',
            debitAmount: entry.debitAmount || 0,
            creditAmount: entry.creditAmount || 0,
            description: entry.description || '',
            sourceTransactionId: '',
            fundingPath: []
          })),
          linkedTransactionIds: [],
          sourceTransactionId: '',
          fundingType: 'original'
        });
      } else {
        // 新增模式
        setFormData({
          description: '',
          transactionDate: new Date(),
          organizationId: defaultOrganizationId || '',
          receiptUrl: '',
          invoiceNo: '',
          entries: [
            { 
              sequence: 1, 
              accountId: defaultAccountId || '', 
              debitAmount: 0, 
              creditAmount: 0, 
              description: '' 
            },
            { 
              sequence: 2, 
              accountId: '', 
              debitAmount: 0, 
              creditAmount: 0, 
              description: '' 
            }
          ],
          linkedTransactionIds: [],
          sourceTransactionId: '',
          fundingType: 'original'
        });
      }
      
      // 重置錯誤
      setErrors({});
    }
  }, [open, editingTransaction, copyingTransaction, defaultAccountId, defaultOrganizationId]);

  // 處理表單字段變更
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // 清除該字段的錯誤
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // 處理日期變更
  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({ ...prev, transactionDate: date || new Date() }));
  };

  // 處理選擇框變更
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // 處理分錄變更
  const handleEntryChange = (index: number, field: keyof EmbeddedAccountingEntryFormData, value: any) => {
    setFormData(prev => {
      const newEntries = [...prev.entries];
      newEntries[index] = { ...newEntries[index], [field]: value };
      return { ...prev, entries: newEntries };
    });
  };

  // 添加新分錄
  const handleAddEntry = () => {
    setFormData(prev => {
      const newSequence = prev.entries.length > 0 
        ? Math.max(...prev.entries.map(e => e.sequence || 0)) + 1 
        : 1;
      
      return {
        ...prev,
        entries: [
          ...prev.entries,
          { sequence: newSequence, accountId: '', debitAmount: 0, creditAmount: 0, description: '' }
        ]
      };
    });
  };

  // 刪除分錄
  const handleDeleteEntry = (index: number) => {
    if (formData.entries.length <= 2) {
      setErrors(prev => ({ ...prev, entries: '至少需要兩筆分錄' }));
      return;
    }
    
    setFormData(prev => {
      const newEntries = [...prev.entries];
      newEntries.splice(index, 1);
      return { ...prev, entries: newEntries };
    });
  };

  // 複製分錄
  const handleCopyEntry = (index: number) => {
    setFormData(prev => {
      const entryToCopy = prev.entries[index];
      const newSequence = Math.max(...prev.entries.map(e => e.sequence || 0)) + 1;
      
      const newEntry = {
        ...entryToCopy,
        _id: undefined,
        sequence: newSequence,
        description: `複製: ${entryToCopy.description}`
      };
      
      return {
        ...prev,
        entries: [...prev.entries, newEntry]
      };
    });
  };

  // 表單提交
  const handleSubmit = () => {
    // 表單驗證
    const newErrors: Record<string, string> = {};
    
    if (!formData.description.trim()) {
      newErrors.description = '請輸入交易描述';
    }
    
    if (formData.entries.length < 2) {
      newErrors.entries = '至少需要兩筆分錄';
    }
    
    formData.entries.forEach((entry, index) => {
      if (!entry.accountId) {
        newErrors[`entries[${index}].accountId`] = '請選擇科目';
      }
      
      if (entry.debitAmount === 0 && entry.creditAmount === 0) {
        newErrors[`entries[${index}].amount`] = '借方或貸方金額必須大於零';
      }
      
      if (entry.debitAmount > 0 && entry.creditAmount > 0) {
        newErrors[`entries[${index}].amount`] = '借方和貸方金額不能同時大於零';
      }
    });
    
    if (!isBalanced) {
      newErrors.balance = `借貸不平衡：借方 ${totalDebit.toFixed(2)}，貸方 ${totalCredit.toFixed(2)}`;
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // 提交表單
    onSubmit(formData);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{ 
        sx: { 
          minHeight: '80vh',
          maxHeight: '90vh'
        } 
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {editingTransaction ? '編輯交易' : copyingTransaction ? '複製交易' : '新增交易'}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
          <Grid container spacing={2}>
            {/* 基本信息 */}
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0' }}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  基本信息
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="交易描述"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      error={!!errors.description}
                      helperText={errors.description}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <DatePicker
                      label="交易日期"
                      value={formData.transactionDate}
                      onChange={handleDateChange}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          fullWidth
                          required
                        />
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel id="organization-label">組織</InputLabel>
                      <Select
                        labelId="organization-label"
                        name="organizationId"
                        value={formData.organizationId || ''}
                        onChange={handleSelectChange}
                        label="組織"
                      >
                        <MenuItem value="">
                          <em>無</em>
                        </MenuItem>
                        {organizations.map(org => (
                          <MenuItem key={org._id} value={org._id}>
                            {org.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="收據 URL"
                      name="receiptUrl"
                      value={formData.receiptUrl}
                      onChange={handleChange}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="發票號碼"
                      name="invoiceNo"
                      value={formData.invoiceNo}
                      onChange={handleChange}
                    />
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            {/* 分錄 */}
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, border: '1px solid #e0e0e0' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    分錄
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={handleAddEntry}
                    size="small"
                  >
                    添加分錄
                  </Button>
                </Box>
                
                {errors.entries && (
                  <Typography color="error" variant="body2" gutterBottom>
                    {errors.entries}
                  </Typography>
                )}
                
                {errors.balance && (
                  <Typography color="error" variant="body2" gutterBottom>
                    {errors.balance}
                  </Typography>
                )}
                
                {/* 分錄標題 */}
                <Grid container spacing={2} sx={{ mb: 1, px: 1 }}>
                  <Grid item xs={1}>
                    <Typography variant="body2" color="textSecondary">序號</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="textSecondary">科目</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2" color="textSecondary">借方</Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="body2" color="textSecondary">貸方</Typography>
                  </Grid>
                  <Grid item xs={3}>
                    <Typography variant="body2" color="textSecondary">描述</Typography>
                  </Grid>
                  <Grid item xs={1}>
                    <Typography variant="body2" color="textSecondary">操作</Typography>
                  </Grid>
                </Grid>
                
                <Divider sx={{ mb: 2 }} />
                
                {/* 分錄列表 */}
                {formData.entries.map((entry, index) => (
                  <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
                    <Grid item xs={1}>
                      <TextField
                        fullWidth
                        size="small"
                        value={entry.sequence}
                        InputProps={{ readOnly: true }}
                      />
                    </Grid>
                    
                    <Grid item xs={3}>
                      <FormControl fullWidth size="small" error={!!errors[`entries[${index}].accountId`]}>
                        <InputLabel id={`account-label-${index}`}>科目</InputLabel>
                        <Select
                          labelId={`account-label-${index}`}
                          value={entry.accountId || ''}
                          onChange={(e) => handleEntryChange(index, 'accountId', e.target.value)}
                          label="科目"
                          required
                        >
                          <MenuItem value="">
                            <em>請選擇</em>
                          </MenuItem>
                          {accounts.map(account => (
                            <MenuItem key={account._id} value={account._id}>
                              {account.name} ({account.code})
                            </MenuItem>
                          ))}
                        </Select>
                        {errors[`entries[${index}].accountId`] && (
                          <Typography variant="caption" color="error">
                            {errors[`entries[${index}].accountId`]}
                          </Typography>
                        )}
                      </FormControl>
                    </Grid>
                    
                    <Grid item xs={2}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={entry.debitAmount || ''}
                        onChange={(e) => handleEntryChange(index, 'debitAmount', Number(e.target.value))}
                        error={!!errors[`entries[${index}].amount`]}
                        InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                      />
                    </Grid>
                    
                    <Grid item xs={2}>
                      <TextField
                        fullWidth
                        size="small"
                        type="number"
                        value={entry.creditAmount || ''}
                        onChange={(e) => handleEntryChange(index, 'creditAmount', Number(e.target.value))}
                        error={!!errors[`entries[${index}].amount`]}
                        InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                      />
                    </Grid>
                    
                    <Grid item xs={3}>
                      <TextField
                        fullWidth
                        size="small"
                        value={entry.description || ''}
                        onChange={(e) => handleEntryChange(index, 'description', e.target.value)}
                      />
                    </Grid>
                    
                    <Grid item xs={1}>
                      <Box display="flex">
                        <Tooltip title="複製分錄">
                          <IconButton 
                            size="small" 
                            onClick={() => handleCopyEntry(index)}
                            sx={{ mr: 0.5 }}
                          >
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="刪除分錄">
                          <IconButton 
                            size="small" 
                            onClick={() => handleDeleteEntry(index)}
                            disabled={formData.entries.length <= 2}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Grid>
                    
                    {errors[`entries[${index}].amount`] && (
                      <Grid item xs={12}>
                        <Typography variant="caption" color="error">
                          {errors[`entries[${index}].amount`]}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                ))}
                
                {/* 合計 */}
                <Divider sx={{ mt: 2, mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={4} textAlign="right">
                    <Typography variant="subtitle2">
                      借方合計:
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {totalDebit.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={4} textAlign="right">
                    <Typography variant="subtitle2">
                      貸方合計:
                    </Typography>
                  </Grid>
                  <Grid item xs={2}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {totalCredit.toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={4} textAlign="right">
                    <Typography variant="subtitle2">
                      差額:
                    </Typography>
                  </Grid>
                  <Grid item xs={8}>
                    <Typography 
                      variant="subtitle2" 
                      fontWeight="bold"
                      color={isBalanced ? 'success.main' : 'error.main'}
                    >
                      {Math.abs(totalDebit - totalCredit).toFixed(2)}
                      {isBalanced ? ' (平衡)' : ' (不平衡)'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          取消
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={!isBalanced}
        >
          {editingTransaction ? '更新' : '保存'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionForm;