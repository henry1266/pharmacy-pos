import React, { useState, useEffect } from 'react';
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
  Button,
  CircularProgress
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
  // 添加本地狀態來跟踪調劑按鈕處理過程
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  
  // 處理供應商欄位按ENTER後跳轉到付款狀態欄位
  const handleSupplierEnterKeyDown = () => {
    // 找到付款狀態欄位並設置焦點
    const paymentStatusSelect = document.getElementById('payment-status-select');
    if (paymentStatusSelect) {
      paymentStatusSelect.focus();
    }
  };
  
  // 模擬Tab鍵按下的函數
  const simulateTabKey = (times = 1) => {
    // 創建Tab鍵事件
    const tabEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Tab',
      code: 'Tab',
      keyCode: 9,
      which: 9
    });
    
    // 按指定次數模擬Tab鍵按下
    for (let i = 0; i < times; i++) {
      setTimeout(() => {
        document.dispatchEvent(tabEvent);
      }, i * 100); // 每次按Tab之間間隔100毫秒
    }
  };
  
  // 調劑按鈕處理函數 - 使用單一狀態更新
  const handleDispenseClick = () => {
    // 開始處理
    setIsProcessing(true);
    setProcessingStep(1);
    
    // 尋找供應商"調劑"
    const dispensarySupplier = suppliers.find(s => s.name === '調劑');
    
    // 一次性更新所有狀態
    if (dispensarySupplier) {
      // 1. 先設置供應商
      handleSupplierChange(null, dispensarySupplier);
      
      // 2. 然後設置付款狀態
      setTimeout(() => {
        setProcessingStep(2);
        const paymentEvent = {
          target: {
            name: 'paymentStatus',
            value: '已開立'
          }
        };
        handleInputChange(paymentEvent);
        
        // 設置付款狀態後模擬一個Tab鍵按下
        setTimeout(() => {
          simulateTabKey(1);
        }, 200);
        
        // 3. 再設置狀態
        setTimeout(() => {
          setProcessingStep(3);
          const updateEvent = {
            target: {
              name: 'status',
              value: 'completed'
            }
          };
          handleInputChange(updateEvent);
          
          // 設置狀態後模擬三個Tab鍵按下
          setTimeout(() => {
            simulateTabKey(3);
            
            // 處理完成
            setProcessingStep(4);
            setIsProcessing(false);
            setProcessingStep(0);
          }, 200);
        }, 500);
      }, 500);
    }
  };

  // 渲染處理步驟指示器
  const renderProcessingIndicator = () => {
    if (!isProcessing) return null;
    
    let stepText = '';
    switch (processingStep) {
      case 1:
        stepText = '設置供應商...';
        break;
      case 2:
        stepText = '設置付款狀態...';
        break;
      case 3:
        stepText = '設置狀態...';
        break;
      case 4:
        stepText = '完成處理...';
        break;
      default:
        stepText = '處理中...';
    }
    
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
        <CircularProgress size={20} sx={{ mr: 1 }} />
        <Typography variant="body2" color="text.secondary">
          {stepText}
        </Typography>
      </Box>
    );
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          基本資訊
        </Typography>
        
        {/* 輸入模板區域 */}
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleDispenseClick}
            disabled={isProcessing}
            sx={{ mb: 1 }}
          >
            調劑
          </Button>
          {renderProcessingIndicator()}
        </Box>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
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
          
          <Grid item xs={12} sm={6} md={3}>
            <SupplierSelect
              suppliers={suppliers || []}
              selectedSupplier={selectedSupplier}
              onChange={handleSupplierChange}
              label="供應商 (可用名稱或簡碼搜索)"
              required={true}
              size="small"
              showCode={true}
              onEnterKeyDown={handleSupplierEnterKeyDown}
            />
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
