import React from 'react';
import { 
  Box, 
  TextField, 
  Grid, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Card, 
  CardContent, 
  Typography,
  Autocomplete
} from '@mui/material';


/**
 * 出貨單基本信息表單組件
 * @param {Object} props - 組件屬性
 * @param {Object} props.formData - 表單數據
 * @param {Function} props.handleInputChange - 輸入變更處理函數
 * @param {Function} props.handleSupplierChange - 供應商變更處理函數
 * @param {Array} props.suppliers - 供應商列表
 * @param {Object} props.selectedSupplier - 選中的供應商
 * @param {boolean} props.isEditMode - 是否為編輯模式
 * @returns {React.ReactElement} 基本信息表單組件
 */
const BasicInfoForm = ({
  formData,
  handleInputChange,
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
          <Grid item xs={12} sm={6} md={4}>
            <TextField
              fullWidth
              label="出貨單號"
              name="soid"
              value={formData.soid}
              onChange={handleInputChange}
              disabled={isEditMode}
              variant="outlined"
              size="small"
              helperText={!isEditMode && "留空將自動生成"}
            />
          </Grid>
          

          
          <Grid item xs={12} sm={6} md={4}>
            <Autocomplete
              id="supplier-select"
              options={suppliers || []}
              getOptionLabel={(option) => option.name || ''}
              value={selectedSupplier}
              onChange={handleSupplierChange}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="供應商"
                  variant="outlined"
                  size="small"
                  required
                  error={!formData.sosupplier}
                  helperText={!formData.sosupplier && "供應商為必填項"}
                />
              )}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-select-label">狀態</InputLabel>
              <Select
                labelId="status-select-label"
                id="status-select"
                name="status"
                value={formData.status}
                label="狀態"
                onChange={handleInputChange}
              >
                <MenuItem value="pending">處理中</MenuItem>
                <MenuItem value="completed">已完成</MenuItem>
                <MenuItem value="cancelled">已取消</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="payment-status-select-label">付款狀態</InputLabel>
              <Select
                labelId="payment-status-select-label"
                id="payment-status-select"
                name="paymentStatus"
                value={formData.paymentStatus}
                label="付款狀態"
                onChange={handleInputChange}
              >
                <MenuItem value="未收">未收</MenuItem>
                <MenuItem value="已收款">已收款</MenuItem>
                <MenuItem value="已開立">已開立</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="備註"
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              multiline
              rows={2}
              variant="outlined"
              size="small"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default BasicInfoForm;
