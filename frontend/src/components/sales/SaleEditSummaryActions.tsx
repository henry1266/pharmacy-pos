import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Button,
  SelectChangeEvent
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

// 定義銷售項目的型別
interface SaleItem {
  [key: string]: any; // 允許任意屬性，因為原始程式碼使用 PropTypes.object
}

// 定義當前銷售記錄的型別
interface CurrentSale {
  discount?: number | string;
  paymentMethod: string;
  paymentStatus: string;
  note?: string;
  totalAmount?: number | string;
  items: SaleItem[];
}

interface SaleEditSummaryActionsProps {
  currentSale: CurrentSale;
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => void;
  handleUpdateSale: () => void;
}

const SaleEditSummaryActions: React.FC<SaleEditSummaryActionsProps> = ({
  currentSale,
  handleInputChange,
  handleUpdateSale
}) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          銷售摘要與操作
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4} {...({} as any)}>
            <TextField
              fullWidth
              label="折扣金額"
              type="number"
              name="discount"
              value={currentSale.discount || ''}
              onChange={handleInputChange}
              InputProps={{ inputProps: { min: 0, step: 0.01 } }}
            />
          </Grid>
          <Grid item xs={12} md={4} {...({} as any)}>
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
          <Grid item xs={12} md={4} {...({} as any)}>
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
          <Grid item xs={12} {...({} as any)}>
            <TextField
              fullWidth
              label="備註"
              name="note"
              multiline
              rows={3}
              value={currentSale.note || ''}
              onChange={handleInputChange}
            />
          </Grid>
          <Grid item xs={12} {...({} as any)}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
              <Typography variant="h6">
                總金額: ${(Number(currentSale.totalAmount) || 0).toFixed(2)}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleUpdateSale}
                disabled={currentSale.items.length === 0} // Disable if no items
              >
                更新銷售記錄
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default SaleEditSummaryActions;