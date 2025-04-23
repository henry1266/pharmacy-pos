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
  Button
} from '@mui/material';
import SupplierSelect from '../../../common/SupplierSelect';


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
  // 調劑按鈕處理函數
  const handleDispenseClick = () => {
    // 使用原生DOM事件觸發Select組件的更新
    // 先獲取Select元素
    const statusSelect = document.getElementById('status-select');
    const paymentStatusSelect = document.getElementById('payment-status-select');
    
    // 設置formData的值
    const statusEvent = {
      target: {
        name: 'status',
        value: 'completed'
      }
    };
    
    const paymentStatusEvent = {
      target: {
        name: 'paymentStatus',
        value: '已開立'
      }
    };
    
    // 調用輸入變更處理函數
    handleInputChange(statusEvent);
    handleInputChange(paymentStatusEvent);
    
    // 手動觸發Select元素的更新
    if (statusSelect) {
      // 使用MUI的原生方法更新Select值
      const statusNativeInput = statusSelect.querySelector('.MuiSelect-nativeInput');
      if (statusNativeInput) {
        statusNativeInput.value = 'completed';
        // 觸發change事件
        const event = new Event('change', { bubbles: true });
        statusNativeInput.dispatchEvent(event);
      }
    }
    
    if (paymentStatusSelect) {
      // 使用MUI的原生方法更新Select值
      const paymentStatusNativeInput = paymentStatusSelect.querySelector('.MuiSelect-nativeInput');
      if (paymentStatusNativeInput) {
        paymentStatusNativeInput.value = '已開立';
        // 觸發change事件
        const event = new Event('change', { bubbles: true });
        paymentStatusNativeInput.dispatchEvent(event);
      }
    }
    
    // 尋找供應商"調劑"
    const dispensarySupplier = suppliers.find(s => s.name === '調劑');
    if (dispensarySupplier) {
      // 設置供應商為"調劑"
      handleSupplierChange(null, dispensarySupplier);
    }
    
    // 將焦點設在選擇藥品的輸入框
    setTimeout(() => {
      const productInput = document.getElementById('product-select-input');
      if (productInput) {
        productInput.focus();
      }
    }, 100);
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          基本資訊
        </Typography>
        
        {/* 輸入模板區域 */}
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleDispenseClick}
            sx={{ mb: 1 }}
          >
            調劑
          </Button>
          {/* 可以在這裡添加更多模板按鈕 */}
        </Box>
        
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
            <SupplierSelect
              suppliers={suppliers || []}
              selectedSupplier={selectedSupplier}
              onChange={handleSupplierChange}
              label="供應商 (可用名稱或簡碼搜索)"
              required={true}
              size="small"
              showCode={true}
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
