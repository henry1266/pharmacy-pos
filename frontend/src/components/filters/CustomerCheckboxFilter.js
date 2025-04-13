import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Popover, 
  FormGroup, 
  FormControlLabel, 
  Checkbox,
  Button,
  Tooltip,
  IconButton
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

/**
 * 客戶勾選篩選器組件
 * @param {Object} props - 組件屬性
 * @param {Array} props.customers - 客戶列表
 * @param {Array} props.selectedCustomers - 已選擇的客戶
 * @param {Function} props.onFilterChange - 篩選變更回調函數
 * @returns {React.ReactElement} 客戶勾選篩選器組件
 */
const CustomerCheckboxFilter = ({ customers = [], selectedCustomers = [], onFilterChange }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [localSelectedCustomers, setLocalSelectedCustomers] = useState(selectedCustomers);
  
  // 當外部selectedCustomers變更時，更新本地狀態
  useEffect(() => {
    setLocalSelectedCustomers(selectedCustomers);
  }, [selectedCustomers]);
  
  // 處理點擊篩選按鈕
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  // 處理關閉彈出窗口
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  // 處理勾選變更
  const handleCheckboxChange = (customerName) => {
    const newSelected = [...localSelectedCustomers];
    const index = newSelected.indexOf(customerName);
    
    if (index === -1) {
      newSelected.push(customerName);
    } else {
      newSelected.splice(index, 1);
    }
    
    setLocalSelectedCustomers(newSelected);
  };
  
  // 處理應用篩選
  const handleApplyFilter = () => {
    onFilterChange(localSelectedCustomers);
    handleClose();
  };
  
  // 處理清除篩選
  const handleClearFilter = () => {
    setLocalSelectedCustomers([]);
    onFilterChange([]);
    handleClose();
  };
  
  // 處理全選
  const handleSelectAll = () => {
    if (customers.length === localSelectedCustomers.length) {
      // 如果已經全選，則清除所有選擇
      setLocalSelectedCustomers([]);
    } else {
      // 否則選擇所有客戶
      setLocalSelectedCustomers(customers.map(customer => customer.name));
    }
  };
  
  const open = Boolean(anchorEl);
  const id = open ? 'customer-filter-popover' : undefined;
  
  // 計算篩選狀態圖標
  const getFilterIcon = () => {
    if (selectedCustomers.length === 0) {
      return <CheckBoxOutlineBlankIcon fontSize="small" />;
    } else if (selectedCustomers.length === customers.length) {
      return <CheckBoxIcon fontSize="small" color="primary" />;
    } else {
      return <FilterListIcon fontSize="small" color="primary" />;
    }
  };
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Typography variant="body2" component="span">
        客戶
      </Typography>
      <Tooltip title="篩選客戶">
        <IconButton
          size="small"
          onClick={handleClick}
          aria-describedby={id}
        >
          {getFilterIcon()}
        </IconButton>
      </Tooltip>
      
      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <Box sx={{ p: 2, width: 250, maxHeight: 400, overflow: 'auto' }}>
          <Typography variant="subtitle2" gutterBottom>
            選擇客戶
          </Typography>
          
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={customers.length > 0 && localSelectedCustomers.length === customers.length}
                  indeterminate={localSelectedCustomers.length > 0 && localSelectedCustomers.length < customers.length}
                  onChange={handleSelectAll}
                />
              }
              label="全選"
            />
            
            {customers.map((customer) => (
              <FormControlLabel
                key={customer._id}
                control={
                  <Checkbox
                    checked={localSelectedCustomers.includes(customer.name)}
                    onChange={() => handleCheckboxChange(customer.name)}
                  />
                }
                label={customer.name}
              />
            ))}
          </FormGroup>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button
              size="small"
              onClick={handleClearFilter}
              disabled={localSelectedCustomers.length === 0}
            >
              清除
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={handleApplyFilter}
            >
              應用
            </Button>
          </Box>
        </Box>
      </Popover>
    </Box>
  );
};

export default CustomerCheckboxFilter;
