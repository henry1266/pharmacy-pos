import React from 'react';
import {
  Grid,
  TextField,
} from '@mui/material';

interface BalanceAndCurrencyFieldsProps {
  initialBalance: number;
  currency: string;
  onInitialBalanceChange: (value: number) => void;
  onCurrencyChange: (value: string) => void;
}

/**
 * 期初餘額和幣別欄位組件
 * 包含期初餘額和幣別輸入欄位
 */
export const BalanceAndCurrencyFields: React.FC<BalanceAndCurrencyFieldsProps> = ({
  initialBalance,
  currency,
  onInitialBalanceChange,
  onCurrencyChange
}) => {
  return (
    <>
      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="期初餘額"
          type="number"
          value={initialBalance}
          onChange={(e) => onInitialBalanceChange(parseFloat(e.target.value) || 0)}
          inputProps={{ step: 0.01 }}
          InputLabelProps={{
            shrink: true, // 強制標籤收縮，避免重疊
          }}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          fullWidth
          label="幣別"
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value)}
          placeholder="TWD"
        />
      </Grid>
    </>
  );
};

export default BalanceAndCurrencyFields;