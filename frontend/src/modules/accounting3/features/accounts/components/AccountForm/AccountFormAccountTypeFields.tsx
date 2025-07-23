import React from 'react';
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';

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

interface AccountFormAccountTypeFieldsProps {
  accountType: string;
  type: string;
  onAccountTypeChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  errors: Record<string, string>;
}

/**
 * 科目類型欄位組件
 * 包含科目類型和帳戶類型選擇器
 */
export const AccountFormAccountTypeFields: React.FC<AccountFormAccountTypeFieldsProps> = ({
  accountType,
  type,
  onAccountTypeChange,
  onTypeChange,
  errors
}) => {
  return (
    <>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth error={!!errors.accountType}>
          <InputLabel>科目類型 *</InputLabel>
          <Select
            value={accountType}
            onChange={(e) => onAccountTypeChange(e.target.value)}
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
            value={type}
            onChange={(e) => onTypeChange(e.target.value)}
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
    </>
  );
};

export default AccountFormAccountTypeFields;