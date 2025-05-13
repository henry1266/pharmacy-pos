import React from 'react';
import { 
  Box,
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
import SupplierSelect from '../common/SupplierSelect';
import PaymentStatusSelect from '../common/PaymentStatusSelect';
import StatusSelect from '../common/StatusSelect';

/**
 * 進貨單基本資訊表單組件
 * @param {Object} props - 組件屬性
 * @param {Object} props.formData - 表單數據 (包含 poid, pobill, pobilldate, paymentStatus, status, notes, supplierId 等)
 * @param {Function} props.handleInputChange - 處理輸入變更的函數 (應能處理 name-value pair)
 * @param {Function} props.handleDateChange - 處理日期變更的函數
 * @param {Function} props.handleSupplierChange - 處理供應商變更的函數
 * @param {Array} props.suppliers - 供應商列表
 * @param {Object} props.selectedSupplier - 當前選中的供應商 (或其 ID，需根據 SupplierSelect 的 onChange 回調調整)
 * @param {boolean} props.isEditMode - 是否為編輯模式
 * @returns {React.ReactElement} 基本資訊表單組件
 */
const BasicInfoForm = ({
  formData,
  handleInputChange, // Assuming this can handle { target: { name, value } }
  handleDateChange,
  // handlePaymentStatusChange, // Removed
  // selectedPaymentStatus, // Removed
  // handleStatusChange, // Removed
  // selectedStatus, // Removed
  handleSupplierChange,
  suppliers,
  selectedSupplier,
  isEditMode
}) => {
  // Wrapper for PaymentStatusSelect and StatusSelect to use handleInputChange
  const handleSelectChange = (name) => (eventOrValue) => {
    // PaymentStatusSelect and StatusSelect might pass the value directly or an event
    const value = eventOrValue && eventOrValue.target ? eventOrValue.target.value : eventOrValue;
    handleInputChange({ target: { name, value } });
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          基本資訊
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="進貨單號"
              name="poid"
              value={formData.poid || ''}
              onChange={handleInputChange}
              variant="outlined"
              disabled={isEditMode}
              helperText="留空將自動生成"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="發票號碼"
              name="pobill"
              value={formData.pobill || ''}
              onChange={handleInputChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
              <DatePicker
                label="發票日期"
                value={formData.pobilldate || null}
                onChange={handleDateChange} // Assuming handleDateChange updates formData.pobilldate in parent
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <SupplierSelect
              suppliers={suppliers || []}
              selectedSupplier={selectedSupplier} // Or formData.supplierId, depending on parent state structure
              onChange={handleSupplierChange} // Assuming this updates formData.supplierId or related fields in parent
              label="進貨商 (可用名稱或簡碼)"
              disabled={isEditMode}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <PaymentStatusSelect
              options={['未付款', '已付款', '已匯款']}
              selectedPaymentStatus={formData.paymentStatus || ''} // Use formData
              onChange={handleSelectChange('paymentStatus')} // Use wrapper for handleInputChange
              label="付款狀態"
            />
          </Grid>      
          <Grid item xs={12} sm={8} md={8}>
            <TextField
              fullWidth
              label="備註"
              name="notes"
              value={formData.notes || ''}
              onChange={handleInputChange}
              variant="outlined"
              multiline
              rows={1}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <StatusSelect
              options={['處理中', '已完成']}
              selectedStatus={formData.status || ''} // Use formData
              onChange={handleSelectChange('status')} // Use wrapper for handleInputChange
              label="狀態"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default BasicInfoForm;

