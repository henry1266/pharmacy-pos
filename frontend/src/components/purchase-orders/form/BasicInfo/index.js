import React from 'react';
import { 
  Grid, 
  TextField, 
  Typography,
  Card,
  CardContent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { zhTW } from 'date-fns/locale';
import SupplierSelect from './SupplierSelect';
import StatusSelect from './StatusSelect';
import PaymentSelect from './PaymentSelect';

/**
 * 進貨單基本資訊表單組件
 * @param {Object} props - 組件屬性
 * @param {Object} props.formData - 表單數據
 * @param {Function} props.onInputChange - 處理輸入變更的函數
 * @param {Function} props.onDateChange - 處理日期變更的函數
 * @param {Function} props.onSupplierChange - 處理供應商變更的函數
 * @param {Array} props.suppliers - 供應商列表
 * @param {Object} props.selectedSupplier - 當前選中的供應商
 * @param {boolean} props.isEditMode - 是否為編輯模式
 * @returns {React.ReactElement} 基本資訊表單組件
 */
const BasicInfoForm = ({
  formData,
  onInputChange,
  onDateChange,
  onSupplierChange,
  suppliers,
  selectedSupplier,
  isEditMode
}) => {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          基本資訊
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="進貨單號"
              name="poid"
              value={formData.poid}
              onChange={onInputChange}
              variant="outlined"
              disabled={isEditMode}
              helperText="留空將自動生成"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="發票號碼"
              name="pobill"
              value={formData.pobill}
              onChange={onInputChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
              <DatePicker
                label="發票日期"
                value={formData.pobilldate}
                onChange={onDateChange}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <SupplierSelect 
              suppliers={suppliers}
              selectedSupplier={selectedSupplier}
              onChange={onSupplierChange}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={6}>
            <TextField
              fullWidth
              label="備註"
              name="notes"
              value={formData.notes}
              onChange={onInputChange}
              variant="outlined"
              multiline
              rows={1}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <PaymentSelect 
              value={formData.paymentStatus}
              onChange={onInputChange}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatusSelect 
              value={formData.status}
              onChange={onInputChange}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default BasicInfoForm;
