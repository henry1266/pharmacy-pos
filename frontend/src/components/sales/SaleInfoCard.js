import React from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Card,
  CardContent,
  TextField,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  CardHeader
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

const SaleInfoCard = ({
  saleData,
  customers,
  isMobile,
  expanded,
  onExpandToggle,
  onInputChange
}) => {
  return (
    <Card>
      <CardHeader
        title="基本資訊"
        action={
          <IconButton
            onClick={onExpandToggle}
            aria-expanded={expanded}
            aria-label="顯示/隱藏基本資訊"
          >
            <ExpandMoreIcon sx={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s' }} />
          </IconButton>
        }
        sx={{ pb: expanded ? 0 : 2 }} // Remove padding bottom if expanded
      />
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <CardContent sx={{ pt: 0 }}> {/* Remove padding top */}
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="銷貨單號"
                name="saleNumber"
                value={saleData.saleNumber}
                onChange={onInputChange}
                placeholder="選填，自動生成"
                helperText="格式: YYYYMMDDXXX"
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>客戶</InputLabel>
                <Select
                  name="customer"
                  value={saleData.customer}
                  onChange={onInputChange}
                  label="客戶"
                >
                  <MenuItem value=""><em>一般客戶</em></MenuItem>
                  {customers.map((customer) => (
                    <MenuItem key={customer._id} value={customer._id}>{customer.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>付款方式</InputLabel>
                <Select
                  name="paymentMethod"
                  value={saleData.paymentMethod}
                  onChange={onInputChange}
                  label="付款方式"
                >
                  <MenuItem value="cash">現金</MenuItem>
                  <MenuItem value="credit_card">信用卡</MenuItem>
                  <MenuItem value="debit_card">金融卡</MenuItem>
                  <MenuItem value="mobile_payment">行動支付</MenuItem>
                  {/* Add other payment methods as needed */}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="折扣金額"
                name="discount"
                type="number"
                value={saleData.discount}
                onChange={onInputChange}
                size="small"
                InputProps={{ inputProps: { min: 0 } }}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="備註"
                name="note"
                value={saleData.note}
                onChange={onInputChange}
                size="small"
                multiline
                rows={1} // Adjust as needed
              />
            </Grid>
          </Grid>
        </CardContent>
      </Collapse>
    </Card>
  );
};

SaleInfoCard.propTypes = {
  saleData: PropTypes.shape({
    saleNumber: PropTypes.string,
    customer: PropTypes.string,
    paymentMethod: PropTypes.string,
    discount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    note: PropTypes.string
  }).isRequired,
  customers: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  isMobile: PropTypes.bool,
  expanded: PropTypes.bool.isRequired,
  onExpandToggle: PropTypes.func.isRequired,
  onInputChange: PropTypes.func.isRequired
};

export default SaleInfoCard;
