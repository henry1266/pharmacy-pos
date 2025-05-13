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
        document.activeElement.dispatchEvent(tabEvent);
      }, i * 100); // 每次按Tab之間間隔100毫秒
    }
  };
  
  // 模擬下鍵按下的函數
  const simulateArrowDownKey = (times = 1) => {
    // 創建下鍵事件
    const arrowDownEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'ArrowDown',
      code: 'ArrowDown',
      keyCode: 40,
      which: 40
    });
    
    // 按指定次數模擬下鍵按下
    for (let i = 0; i < times; i++) {
      setTimeout(() => {
        document.activeElement.dispatchEvent(arrowDownEvent);
      }, i * 100); // 每次按下鍵之間間隔100毫秒
    }
  };
  
  // 模擬Enter鍵按下的函數
  const simulateEnterKey = () => {
    // 創建Enter鍵事件
    const enterEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Enter',
      code: 'Enter',
      keyCode: 13,
      which: 13
    });
    
    // 模擬Enter鍵按下
    document.activeElement.dispatchEvent(enterEvent);
  };
  
  // 模擬輸入文本的函數
  const simulateTextInput = (element, text) => {
    // 設置輸入值
    if (element.tagName === 'INPUT') {
      // 直接設置input元素的值
      element.value = text;
      
      // 觸發input事件
      const inputEvent = new Event('input', { bubbles: true });
      element.dispatchEvent(inputEvent);
      
      // 觸發change事件
      const changeEvent = new Event('change', { bubbles: true });
      element.dispatchEvent(changeEvent);
    }
  };
  
  // 調劑按鈕處理函數 - 實現新的鍵盤導航序列
  const handleDispenseClick = () => {
    // 開始處理
    setIsProcessing(true);
    setProcessingStep(1);
    
    // 1. 將焦點設置到供應商輸入框
    setTimeout(() => {
      const supplierInput = document.querySelector('#supplier-select input');
      if (supplierInput) {
        supplierInput.focus();
        console.log('已將焦點設置到供應商輸入框');
        
        // 2. 輸入"WRUQ"
        setTimeout(() => {
          simulateTextInput(supplierInput, 'WRUQ');
          console.log('已在供應商輸入框中輸入WRUQ');
          
          // 3. 按Enter鍵
          setTimeout(() => {
            simulateEnterKey();
            console.log('已在供應商輸入框中按下Enter鍵');
            setProcessingStep(2);
            
            // 4. 按下鍵三次
            setTimeout(() => {
              simulateArrowDownKey(3);
              console.log('已按下鍵三次');
              
              // 5. 按Enter鍵
              setTimeout(() => {
                simulateEnterKey();
                console.log('已按下Enter鍵選擇付款狀態');
                
                // 6. 按Tab鍵
                setTimeout(() => {
                  simulateTabKey(1);
                  console.log('已按Tab鍵移至狀態欄位');
                  setProcessingStep(3);
                  
                  // 7. 按下鍵兩次
                  setTimeout(() => {
                    simulateArrowDownKey(2);
                    console.log('已按下鍵兩次');
                    
                    // 8. 按Enter鍵
                    setTimeout(() => {
                      simulateEnterKey();
                      console.log('已按下Enter鍵選擇狀態');
                      
                      // 9. 按Tab鍵四次
                      setTimeout(() => {
                        simulateTabKey(4);
                        console.log('已按Tab鍵四次移至藥品選擇區域');
                        
                        // 處理完成
                        setProcessingStep(4);
                        setTimeout(() => {
                          setIsProcessing(false);
                          setProcessingStep(0);
                        }, 200);
                      }, 100);
                    }, 100);
                  }, 100);
                }, 100);
              }, 100);
            }, 100);
          }, 100);
        }, 100);
      } else {
        console.error('找不到供應商輸入框');
        setIsProcessing(false);
      }
    }, 100);
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
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={2}>
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
              label="出貨商 (可用名稱或簡碼)"
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
