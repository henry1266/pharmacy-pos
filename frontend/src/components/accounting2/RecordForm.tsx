import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Grid,
  Chip,
  FormHelperText,
  InputAdornment
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zhTW } from 'date-fns/locale';
import { AccountingRecord2, Account2, Category2 } from '@pharmacy-pos/shared/types/accounting2';
import { Organization } from '@pharmacy-pos/shared/types/organization';

interface RecordFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (recordData: Partial<AccountingRecord2>) => void;
  record?: AccountingRecord2 | null;
  organizations: Organization[];
  selectedOrganizationId: string | null;
  accounts: Account2[];
  categories: Category2[];
}

const RecordForm: React.FC<RecordFormProps> = ({
  open,
  onClose,
  onSubmit,
  record,
  organizations,
  selectedOrganizationId,
  accounts,
  categories
}) => {
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense' | 'transfer',
    amount: '',
    categoryId: '',
    accountId: '',
    date: new Date(),
    description: '',
    tags: [] as string[],
    organizationId: selectedOrganizationId || (organizations.length > 0 ? organizations[0]._id : '')
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (record) {
      // 編輯模式
      console.log('🔍 RecordForm 編輯模式 - 原始 record:', record);
      
      // 處理 organizationId 轉換
      let organizationIdValue = selectedOrganizationId || (organizations.length > 0 ? organizations[0]._id : '');
      if (record.organizationId) {
        organizationIdValue = typeof record.organizationId === 'object'
          ? (record.organizationId as any)?.toString() || organizationIdValue
          : record.organizationId;
      }

      setFormData({
        type: record.type || 'expense',
        amount: record.amount?.toString() || '',
        categoryId: typeof record.categoryId === 'object' ? (record.categoryId as any)?._id || '' : record.categoryId || '',
        accountId: typeof record.accountId === 'object' ? (record.accountId as any)?._id || '' : record.accountId || '',
        date: record.date ? new Date(record.date) : new Date(),
        description: record.description || '',
        tags: record.tags || [],
        organizationId: organizationIdValue
      });
    } else {
      // 新增模式
      setFormData({
        type: 'expense',
        amount: '',
        categoryId: '',
        accountId: '',
        date: new Date(),
        description: '',
        tags: [],
        organizationId: selectedOrganizationId || (organizations.length > 0 ? organizations[0]._id : '')
      });
    }
    setErrors({});
    setTagInput('');
  }, [record, selectedOrganizationId, organizations, open]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // 清除該欄位的錯誤
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.type) {
      newErrors.type = '請選擇記錄類型';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = '請輸入有效的金額';
    }

    if (!formData.categoryId) {
      newErrors.categoryId = '請選擇類別';
    }

    if (!formData.accountId) {
      newErrors.accountId = '請選擇帳戶';
    }

    if (!formData.organizationId) {
      newErrors.organizationId = '請選擇機構';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      return;
    }

    const submitData: Partial<AccountingRecord2> = {
      type: formData.type,
      amount: parseFloat(formData.amount),
      categoryId: formData.categoryId,
      accountId: formData.accountId,
      date: formData.date,
      description: formData.description || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      organizationId: formData.organizationId
    };

    console.log('📤 RecordForm 提交資料:', submitData);
    onSubmit(submitData);
  };

  const handleClose = () => {
    setFormData({
      type: 'expense',
      amount: '',
      categoryId: '',
      accountId: '',
      date: new Date(),
      description: '',
      tags: [],
      organizationId: selectedOrganizationId || (organizations.length > 0 ? organizations[0]._id : '')
    });
    setErrors({});
    setTagInput('');
    onClose();
  };

  // 過濾當前機構的帳戶和類別
  const filteredAccounts = accounts.filter(account => 
    account.organizationId === formData.organizationId
  );

  const filteredCategories = categories.filter(category => 
    category.organizationId === formData.organizationId &&
    (formData.type === 'transfer' || category.type === formData.type)
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {record ? '編輯記帳記錄' : '新增記帳記錄'}
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={3}>
              {/* 記錄類型 */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.type}>
                  <InputLabel>記錄類型 *</InputLabel>
                  <Select
                    value={formData.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                    label="記錄類型 *"
                  >
                    <MenuItem value="income">收入</MenuItem>
                    <MenuItem value="expense">支出</MenuItem>
                    <MenuItem value="transfer">轉帳</MenuItem>
                  </Select>
                  {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
                </FormControl>
              </Grid>

              {/* 金額 */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="金額"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  error={!!errors.amount}
                  helperText={errors.amount}
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>

              {/* 所屬機構 */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.organizationId}>
                  <InputLabel>所屬機構 *</InputLabel>
                  <Select
                    value={formData.organizationId}
                    onChange={(e) => handleChange('organizationId', e.target.value)}
                    label="所屬機構 *"
                  >
                    {organizations.map((org) => (
                      <MenuItem key={org._id} value={org._id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Chip label="機構" size="small" color="primary" />
                          {org.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.organizationId && <FormHelperText>{errors.organizationId}</FormHelperText>}
                </FormControl>
              </Grid>

              {/* 類別 */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.categoryId}>
                  <InputLabel>類別 *</InputLabel>
                  <Select
                    value={formData.categoryId}
                    onChange={(e) => handleChange('categoryId', e.target.value)}
                    label="類別 *"
                  >
                    {filteredCategories.map((category) => (
                      <MenuItem key={category._id} value={category._id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {category.icon && <span>{category.icon}</span>}
                          {category.name}
                          <Chip 
                            label={category.type === 'income' ? '收入' : '支出'} 
                            size="small" 
                            color={category.type === 'income' ? 'success' : 'error'}
                          />
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.categoryId && <FormHelperText>{errors.categoryId}</FormHelperText>}
                </FormControl>
              </Grid>

              {/* 帳戶 */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.accountId}>
                  <InputLabel>帳戶 *</InputLabel>
                  <Select
                    value={formData.accountId}
                    onChange={(e) => handleChange('accountId', e.target.value)}
                    label="帳戶 *"
                  >
                    {filteredAccounts.map((account) => (
                      <MenuItem key={account._id} value={account._id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {account.name}
                          <Chip 
                            label={`$${account.balance?.toLocaleString() || 0}`} 
                            size="small" 
                            color="default"
                          />
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.accountId && <FormHelperText>{errors.accountId}</FormHelperText>}
                </FormControl>
              </Grid>

              {/* 日期 */}
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="日期"
                  value={formData.date}
                  onChange={(newValue) => handleChange('date', newValue || new Date())}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      required
                    />
                  )}
                />
              </Grid>

              {/* 標籤 */}
              <Grid item xs={12}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    標籤
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    {formData.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        label={tag}
                        onDelete={() => handleRemoveTag(tag)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      size="small"
                      placeholder="新增標籤"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={handleAddTag}
                      disabled={!tagInput.trim()}
                    >
                      新增
                    </Button>
                  </Box>
                </Box>
              </Grid>

              {/* 描述 */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="描述"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="記錄的詳細說明..."
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>
            取消
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.amount || !formData.categoryId || !formData.accountId}
          >
            {record ? '更新' : '建立'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default RecordForm;