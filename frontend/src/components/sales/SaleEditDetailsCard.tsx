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
import { Customer } from '../../types/entities';

// 定義當前銷售記錄的型別
interface CurrentSale {
  customer?: string;
  discount?: number | string;
  paymentMethod: string;
  paymentStatus: string;
  note?: string;
  totalAmount?: number;
}

interface SaleEditDetailsCardProps {
  customers: Customer[];
  currentSale: CurrentSale;
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => void;
}

// This component is similar to SalesPage's SaleInfoCard but adapted for editing
const SaleEditDetailsCard: React.FC<SaleEditDetailsCardProps> = ({
  customers,
  currentSale,
  handleInputChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm")); // Check for mobile view

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          銷售資訊
        </Typography>
        <Grid container spacing={2}>
          {/* Customer Selection */}
          <Grid item xs={12} {...({} as any)}>
            <FormControl fullWidth>
              <InputLabel>客戶</InputLabel>
              <Select
                name="customer"
                value={currentSale.customer || ''} // Ensure value is controlled
                onChange={handleInputChange}
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

          {/* Discount */}
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

          {/* Payment Method */}
          <Grid item xs={12} sm={6} {...({} as any)}> {/* Adjust grid for better layout */}
            <FormControl fullWidth>
              <InputLabel>付款方式</InputLabel>
              <Select
                name="paymentMethod"
                value={currentSale.paymentMethod}
                onChange={handleInputChange}
                label="付款方式"
              >
                <MenuItem value="cash">現金</MenuItem>
                <MenuItem value="credit_card">信用卡</MenuItem>
                <MenuItem value="transfer">轉帳</MenuItem>
                <MenuItem value="other">其他</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Payment Status */}
          <Grid item xs={12} sm={6} {...({} as any)}> {/* Adjust grid for better layout */}
            <FormControl fullWidth>
              <InputLabel>付款狀態</InputLabel>
              <Select
                name="paymentStatus"
                value={currentSale.paymentStatus}
                onChange={handleInputChange}
                label="付款狀態"
              >
                <MenuItem value="paid">已付款</MenuItem>
                <MenuItem value="pending">待付款</MenuItem>
                <MenuItem value="partial">部分付款</MenuItem>
                <MenuItem value="cancelled">已取消</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Note */}
          <Grid item xs={12} {...({} as any)}>
            <TextField
              fullWidth
              label="備註"
              name="note"
              multiline
              rows={isMobile ? 2 : 3} // Adjust rows for mobile
              value={currentSale.note ?? ''}
              onChange={handleInputChange}
            />
          </Grid>

           {/* Total Amount Display (moved from SummaryActions) */}
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