import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Grid,
  Box,
  Alert
} from '@mui/material';
import { Account2, Account2FormData } from '@pharmacy-pos/shared/types/accounting2';
import { Organization } from '@pharmacy-pos/shared/types/organization';

// 表單 Props 介面
interface AccountFormProps {
  open: boolean;
  account?: Account2 | null;
  onClose: () => void;
  onSubmit: (data: Account2FormData) => Promise<void>;
  loading?: boolean;
  organizations?: Organization[];
  selectedOrganizationId?: string | null;
}

// 科目類型選項
const ACCOUNT_TYPES = [
  { value: 'asset', label: '資產' },
  { value: 'liability', label: '負債' },
  { value: 'equity', label: '權益' },
  { value: 'revenue', label: '收入' },
  { value: 'expense', label: '費用' }
];

// 帳戶類型選項
const ACCOUNT_SUB_TYPES = [
  { value: 'cash', label: '現金' },
  { value: 'bank', label: '銀行' },
  { value: 'credit', label: '信用卡' },
  { value: 'investment', label: '投資' },
  { value: 'other', label: '其他' }
];

/**
 * 科目表單組件
 * 
 * 職責：
 * - 提供新增/編輯科目的表單介面
 * - 表單驗證與資料處理
 * - 支援編輯模式與新增模式
 */
export const AccountForm: React.FC<AccountFormProps> = ({
  open,
  account,
  onClose,
  onSubmit,
  loading = false,
  organizations = [],
  selectedOrganizationId
}) => {
  const [formData, setFormData] = useState<Account2FormData>({
    code: '',
    name: '',
    accountType: 'asset',
    type: 'other',
    parentId: '',
    initialBalance: 0,
    currency: 'TWD',
    description: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isActive, setIsActive] = useState(true);

  // 當 account 變化時更新表單資料
  useEffect(() => {
    if (account) {
      setFormData({
        code: account.code,
        name: account.name,
        accountType: account.accountType,
        type: account.type,
        parentId: account.parentId || '',
        initialBalance: account.initialBalance,
        currency: account.currency,
        description: account.description || ''
      });
      setIsActive(account.isActive);
    } else {
      // 重置表單
      setFormData({
        code: '',
        name: '',
        accountType: 'asset',
        type: 'other',
        parentId: '',
        initialBalance: 0,
        currency: 'TWD',
        description: ''
      });
      setIsActive(true);
    }
    setErrors({});
  }, [account, open]);

  // 表單驗證
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = '科目代號為必填';
    }

    if (!formData.name.trim()) {
      newErrors.name = '科目名稱為必填';
    }

    if (!formData.accountType) {
      newErrors.accountType = '科目類型為必填';
    }

    if (!formData.type) {
      newErrors.type = '帳戶類型為必填';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 處理表單提交
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('提交表單失敗:', error);
    }
  };

  // 處理輸入變化
  const handleInputChange = (field: keyof Account2FormData, value: any) => {
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

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle>
        {account ? '編輯科目' : '新增科目'}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            {/* 基本資訊 */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="科目代號"
                value={formData.code}
                onChange={(e) => handleInputChange('code', e.target.value)}
                error={!!errors.code}
                helperText={errors.code}
                placeholder="例如：1101"
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="科目名稱"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                placeholder="例如：現金"
                required
              />
            </Grid>

            {/* 科目類型 */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.accountType}>
                <InputLabel>科目類型 *</InputLabel>
                <Select
                  value={formData.accountType}
                  onChange={(e) => handleInputChange('accountType', e.target.value)}
                  label="科目類型 *"
                >
                  {ACCOUNT_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.accountType && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {errors.accountType}
                  </Alert>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.type}>
                <InputLabel>帳戶類型 *</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  label="帳戶類型 *"
                >
                  {ACCOUNT_SUB_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.type && (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {errors.type}
                  </Alert>
                )}
              </FormControl>
            </Grid>

            {/* 期初餘額與幣別 */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="期初餘額"
                type="number"
                value={formData.initialBalance}
                onChange={(e) => handleInputChange('initialBalance', parseFloat(e.target.value) || 0)}
                inputProps={{ step: 0.01 }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="幣別"
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                placeholder="TWD"
              />
            </Grid>

            {/* 上層科目 */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="上層科目ID"
                value={formData.parentId}
                onChange={(e) => handleInputChange('parentId', e.target.value)}
                placeholder="選填，如果是子科目請填入上層科目ID"
              />
            </Grid>

            {/* 狀態開關 */}
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    color="primary"
                  />
                }
                label="啟用此科目"
              />
            </Grid>

            {/* 描述 */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="描述"
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="科目的詳細說明（選填）"
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          取消
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
        >
          {loading ? '處理中...' : (account ? '更新' : '新增')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccountForm;