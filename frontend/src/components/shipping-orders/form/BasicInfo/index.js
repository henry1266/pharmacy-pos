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
    // 使用延時執行，模擬手動點選的過程
    
    // 第一步：設置供應商為"調劑"（立即執行）
    const dispensarySupplier = suppliers.find(s => s.name === '調劑');
    if (dispensarySupplier) {
      handleSupplierChange(null, dispensarySupplier);
    }
    
    // 第二步：設置狀態為"已完成"（延遲1秒執行）
    setTimeout(() => {
      // 模擬點擊狀態下拉選單
      const statusSelect = document.getElementById('status-select');
      if (statusSelect) {
        statusSelect.click();
        
        // 模擬選擇"已完成"選項
        setTimeout(() => {
          // 尋找"已完成"選項並點擊
          const completedOption = document.querySelector('[data-value="completed"]');
          if (completedOption) {
            completedOption.click();
          } else {
            // 如果找不到選項，使用原始方法
            const statusEvent = {
              target: {
                name: 'status',
                value: 'completed'
              }
            };
            handleInputChange(statusEvent);
          }
        }, 300);
      }
    }, 1000);
    
    // 第三步：設置付款狀態為"已開立"（延遲2秒執行）
    setTimeout(() => {
      // 模擬點擊付款狀態下拉選單
      const paymentStatusSelect = document.getElementById('payment-status-select');
      if (paymentStatusSelect) {
        paymentStatusSelect.click();
        
        // 模擬選擇"已開立"選項
        setTimeout(() => {
          // 尋找"已開立"選項並點擊
          const paidOption = document.querySelector('[data-value="已開立"]');
          if (paidOption) {
            paidOption.click();
          } else {
            // 如果找不到選項，使用原始方法
            const paymentStatusEvent = {
              target: {
                name: 'paymentStatus',
                value: '已開立'
              }
            };
            handleInputChange(paymentStatusEvent);
          }
        }, 300);
      }
    }, 2000);
    
    // 第四步：將焦點設在選擇藥品的輸入框（延遲3秒執行）
    setTimeout(() => {
      const productInput = document.getElementById('product-select-input');
      if (productInput) {
        productInput.focus();
      }
    }, 3000);
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
