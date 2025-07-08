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
  Grid,
  Typography,
  Alert
} from '@mui/material';
import { Account2, Account2FormData, ACCOUNT_TYPES, ACCOUNT_TYPES_V2, CURRENCIES } from '@pharmacy-pos/shared/types/accounting2';
import { Organization } from '@pharmacy-pos/shared/types/organization';

interface AccountFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Account2FormData) => Promise<void>;
  account?: Account2;
  loading?: boolean;
  organizations?: Organization[];
  selectedOrganizationId?: string | null;
}

const AccountForm: React.FC<AccountFormProps> = ({
  open,
  onClose,
  onSubmit,
  account,
  loading = false,
  organizations = [],
  selectedOrganizationId = null
}) => {
  const [formData, setFormData] = useState<Account2FormData>({
    code: '',
    name: '',
    accountType: 'asset',
    type: 'cash',
    initialBalance: 0,
    currency: 'TWD',
    description: '',
    organizationId: selectedOrganizationId || undefined
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (account) {
      // 確保 organizationId 轉換為字串格式
      const organizationId = account.organizationId ?
        (typeof account.organizationId === 'string' ? account.organizationId : String(account.organizationId)) :
        undefined;
      
      console.log('🔍 AccountForm 編輯模式 - 原始 organizationId:', account.organizationId);
      console.log('🔍 AccountForm 編輯模式 - 轉換後 organizationId:', organizationId);
      
      setFormData({
        code: account.code || '',
        name: account.name,
        accountType: account.accountType || 'asset',
        type: account.type,
        initialBalance: account.initialBalance,
        currency: account.currency,
        description: account.description || '',
        organizationId: organizationId
      });
    } else {
      setFormData({
        code: '',
        name: '',
        accountType: 'asset',
        type: 'cash',
        initialBalance: 0,
        currency: 'TWD',
        description: '',
        organizationId: selectedOrganizationId || undefined
      });
    }
    setErrors({});
  }, [account, open, selectedOrganizationId]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = '請輸入會計科目代碼';
    }

    if (!formData.name.trim()) {
      newErrors.name = '請輸入帳戶名稱';
    }

    if (formData.initialBalance < 0) {
      newErrors.initialBalance = '初始餘額不能為負數';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    console.log('🔍 AccountForm 提交資料:', formData);

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('提交表單錯誤:', error);
    }
  };

  const handleChange = (field: keyof Account2FormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: field === 'initialBalance' ? Number(value) :
               field === 'organizationId' ? (value || undefined) : value
    }));
    
    // 清除該欄位的錯誤
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {account ? '編輯帳戶' : '新增帳戶'}
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="會計科目代碼"
                value={formData.code}
                onChange={handleChange('code')}
                error={!!errors.code}
                helperText={errors.code}
                placeholder="例如：1101, 2201"
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>會計科目類型</InputLabel>
                <Select
                  value={formData.accountType}
                  onChange={handleChange('accountType')}
                  label="會計科目類型"
                  required
                >
                  {ACCOUNT_TYPES_V2.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="帳戶名稱"
                value={formData.name}
                onChange={handleChange('name')}
                error={!!errors.name}
                helperText={errors.name}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>帳戶類型</InputLabel>
                <Select
                  value={formData.type}
                  onChange={handleChange('type')}
                  label="帳戶類型"
                >
                  {ACCOUNT_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>幣別</InputLabel>
                <Select
                  value={formData.currency}
                  onChange={handleChange('currency')}
                  label="幣別"
                >
                  {CURRENCIES.map((currency) => (
                    <MenuItem key={currency.value} value={currency.value}>
                      {currency.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>所屬機構</InputLabel>
                <Select
                  value={formData.organizationId || ''}
                  onChange={handleChange('organizationId')}
                  label="所屬機構"
                >
                  <MenuItem value="">
                    <em>個人帳戶</em>
                  </MenuItem>
                  {organizations.map((org) => (
                    <MenuItem key={org._id} value={org._id}>
                      {org.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="初始餘額"
                type="number"
                value={formData.initialBalance}
                onChange={handleChange('initialBalance')}
                error={!!errors.initialBalance}
                helperText={errors.initialBalance}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="描述"
                multiline
                rows={3}
                value={formData.description}
                onChange={handleChange('description')}
                placeholder="選填：帳戶相關說明..."
              />
            </Grid>

            {account && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    目前餘額：{account.currency} {account.balance.toLocaleString()}
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            取消
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
          >
            {loading ? '處理中...' : (account ? '更新' : '新增')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AccountForm;