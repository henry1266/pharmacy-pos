import React from 'react';
import { 
  Box,
  Grid, 
  TextField, 
  Autocomplete,  
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
              value={formData.poid}
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
              value={formData.pobill}
              onChange={handleInputChange}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
              <DatePicker
                label="發票日期"
                value={formData.pobilldate}
                onChange={handleDateChange}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
<Grid item xs={12} sm={6} md={2}>
  <Autocomplete
    id="supplier-select"
    options={suppliers}
    getOptionLabel={(option) => option.name}
    value={selectedSupplier}
    onChange={handleSupplierChange}
    filterOptions={(options, state) => filterSuppliers(options, state.inputValue)}
onKeyDown={(event) => {
  if (['Enter', 'Tab'].includes(event.key)) {
    const filtered = filterSuppliers(suppliers, event.target.value);
    if (filtered.length > 0) {
      handleSupplierChange(event, filtered[0]);
      event.preventDefault();

      // 直接模擬點擊付款狀態下拉框
      setTimeout(() => {
        try {
          // 嘗試直接點擊付款狀態標籤
          const paymentStatusLabel = document.querySelector('#payment-status-label');
          if (paymentStatusLabel) {
            paymentStatusLabel.click();
            return;
          }
          
          // 備用方案1：嘗試找到付款狀態下拉框並點擊
          const selectElement = document.querySelector('[name="paymentStatus"]');
          if (selectElement) {
            selectElement.click();
            return;
          }
          
          // 備用方案2：嘗試找到付款狀態FormControl並點擊
          const formControl = document.querySelector('label[id="payment-status-label"]').closest('.MuiFormControl-root');
          if (formControl) {
            formControl.click();
          }
        } catch (error) {
          console.error('無法自動聚焦到付款狀態:', error);
        }
      }, 100); // 增加延遲時間確保DOM已更新
    }
  }
}}
    renderInput={(params) => (
      <TextField {...params} required label="供應商" fullWidth />
    )}
  />


</Grid>
        <Grid item xs={12} sm={6} md={2}>
            <Box
				    sx={{
					  backgroundColor:
            formData.paymentStatus === '未付' ? '#F8D7DA' :     // 紅色（淡）
            formData.paymentStatus === '已下收' ? '#D4EDDA' :    // 綠色（淡）
            formData.paymentStatus === '已匯款' ? '#D4EDDA' :    // 綠色（淡）
            'transparent',
				    }}
			  >
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
            </Box>
          </Grid>
          <Grid item xs={12} sm={8} md={8}>
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

		  <Grid item xs={12} sm={6} md={2}>
            <Box
				sx={{
					backgroundColor:
					formData.status === 'pending' ? '#FFF3CD' : // 黃色（Bootstrap 較淡的警告色）
					formData.status === 'completed' ? '#D4EDDA' : 'transparent', // 綠色（Bootstrap 較淡的成功色）
				}}
			>
				<FormControl fullWidth>
					<InputLabel>狀態</InputLabel>
					<Select
						name="status"
						value={formData.status}
						onChange={handleInputChange}
						label="狀態"
						id="status-select"
					>
						<MenuItem value="pending">處理中</MenuItem>
						<MenuItem value="completed">已完成</MenuItem>
					</Select>
				</FormControl>
			      </Box>
          </Grid>
		</Grid>

      </CardContent>
    </Card>
  );
};

const filterSuppliers = (options, inputValue) => {
  const filterValue = inputValue?.toLowerCase() || '';
  return options.filter(option =>
    option.name.toLowerCase().includes(filterValue) ||
    (option.shortCode && option.shortCode.toLowerCase().includes(filterValue))
  );
};

export default BasicInfoForm;
