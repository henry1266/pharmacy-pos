import React from 'react';
import {
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  useTheme,
  useMediaQuery,
  SelectChangeEvent
} from '@mui/material';
import { Customer } from '@pharmacy-pos/shared/types/entities';
import { SaleEditDetailsCardProps } from '../../types/edit';

/**
 * 銷售編輯詳情卡片組件
 * 用於顯示和編輯銷售詳情，如客戶、折扣、付款方式等
 * 
 * @param props 組件屬性
 * @returns 銷售編輯詳情卡片組件
 */
const SaleEditDetailsCard: React.FC<SaleEditDetailsCardProps> = ({
  customers,
  currentSale,
  handleInputChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          銷售資訊
        </Typography>
        <Grid container spacing={2}>
          {/* 客戶選擇 */}
          <Grid item xs={12} {...({} as any)}>
            <FormControl fullWidth>
              <InputLabel>客戶</InputLabel>
              <Select
                name="customer"
                value={currentSale.customer ?? ''}
                onChange={(event: SelectChangeEvent<string>) => {
                  // 將 SelectChangeEvent 轉換為 ChangeEvent 以匹配處理函數
                  handleInputChange(event as any);
                }}
                label="客戶"
              >
                <MenuItem value="">
                  <em>一般客戶</em>
                </MenuItem>
                {customers.map((customer) => (
                  <MenuItem key={customer._id} value={customer._id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* 折扣 */}
          <Grid item xs={12} {...({} as any)}>
            <TextField
              fullWidth
              label="折扣金額"
              type="number"
              name="discount"
              value={currentSale.discount ?? ''}
              onChange={handleInputChange}
              InputProps={{ inputProps: { min: 0, step: 0.01 } }}
            />
          </Grid>

          {/* 付款方式 */}
          <Grid item xs={12} sm={6} {...({} as any)}>
            <FormControl fullWidth>
              <InputLabel>付款方式</InputLabel>
              <Select
                name="paymentMethod"
                value={currentSale.paymentMethod}
                onChange={(event: SelectChangeEvent<string>) => {
                  handleInputChange(event as any);
                }}
                label="付款方式"
              >
                <MenuItem value="cash">現金</MenuItem>
                <MenuItem value="credit_card">信用卡</MenuItem>
                <MenuItem value="transfer">轉帳</MenuItem>
                <MenuItem value="other">其他</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* 付款狀態 */}
          <Grid item xs={12} sm={6} {...({} as any)}>
            <FormControl fullWidth>
              <InputLabel>付款狀態</InputLabel>
              <Select
                name="paymentStatus"
                value={currentSale.paymentStatus}
                onChange={(event: SelectChangeEvent<string>) => {
                  handleInputChange(event as any);
                }}
                label="付款狀態"
              >
                <MenuItem value="paid">已付款</MenuItem>
                <MenuItem value="pending">待付款</MenuItem>
                <MenuItem value="partial">部分付款</MenuItem>
                <MenuItem value="cancelled">已取消</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* 備註 */}
          <Grid item xs={12} {...({} as any)}>
            <TextField
              fullWidth
              label="備註"
              name="notes"
              multiline
              rows={isMobile ? 2 : 3}
              value={currentSale.notes ?? ''}
              onChange={handleInputChange}
            />
          </Grid>

          {/* 總金額顯示 */}
          <Grid item xs={12} {...({} as any)}>
            <Box sx={{ mt: 2, textAlign: 'right' }}>
              <Typography variant="h6">
                總金額: ${(currentSale.totalAmount ?? 0).toFixed(2)}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default SaleEditDetailsCard;