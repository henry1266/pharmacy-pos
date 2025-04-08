import React from 'react';
import { 
  Grid, 
  TextField, 
  Autocomplete, 
  Divider, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Typography,
  Card,
  CardContent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { zhTW } from 'date-fns/locale';

/**
 * 進貨單基本資訊表單組件
 * @param {Object} props - 組件屬性
 * @param {Object} props.formData - 表單數據
 * @param {Function} props.handleInputChange - 處理輸入變更的函數
 * @param {Function} props.handleDateChange - 處理日期變更的函數
 * @param {Function} props.handleSupplierChange - 處理供應商變更的函數
 * @param {Array} props.suppliers - 供應商列表
 * @param {Object} props.selectedSupplier - 當前選中的供應商
 * @param {boolean} props.isEditMode - 是否為編輯模式
 * @returns {React.ReactElement} 基本資訊表單組件
 */
const BasicInfoForm = ({
  formData,
  handleInputChange,
  handleDateChange,
  handleSupplierChange,
  suppliers,
  selectedSupplier,
  isEditMode
}) => {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          基本資訊
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              required
              label="進貨單號"
              name="poid"
              value={formData.poid}
              onChange={handleInputChange}
              variant="outlined"
              disabled={isEditMode}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="發票號碼"
              name="pobill"
              value={formData.pobill}
              onChange={handleInputChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
              <DatePicker
                label="發票日期"
                value={formData.pobilldate}
                onChange={handleDateChange}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Autocomplete
              id="supplier-select"
              options={suppliers}
              getOptionLabel={(option) => option.name}
              value={selectedSupplier}
              onChange={handleSupplierChange}
              renderInput={(params) => (
                <TextField {...params} required label="供應商" fullWidth />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={6}>
            <TextField
              fullWidth
              label="備註"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              variant="outlined"
              multiline
              rows={1}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="payment-status-label">付款狀態</InputLabel>
              <Select
                labelId="payment-status-label"
                name="paymentStatus"
                value={formData.paymentStatus}
                onChange={handleInputChange}
                label="付款狀態"
              >
                <MenuItem value="未付">未付</MenuItem>
                <MenuItem value="已下收">已下收</MenuItem>
                <MenuItem value="已匯款">已匯款</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel id="status-label">狀態</InputLabel>
              <Select
                labelId="status-label"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                label="狀態"
              >
                <MenuItem value="pending">處理中</MenuItem>
                <MenuItem value="completed">已完成</MenuItem>
                <MenuItem value="cancelled">已取消</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default BasicInfoForm;
