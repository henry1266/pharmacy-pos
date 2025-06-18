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
 * 供應商介面
 */
interface Supplier {
  _id: string;
  name: string;
  [key: string]: any;
}

/**
 * 供應商勾選篩選器組件屬性
 */
interface SupplierCheckboxFilterProps {
  suppliers?: Supplier[];
  selectedSuppliers?: string[];
  onFilterChange: (selected: string[]) => void;
}

/**
 * 供應商勾選篩選器組件
 */
const SupplierCheckboxFilter: React.FC<SupplierCheckboxFilterProps> = ({ 
  suppliers = [], 
  selectedSuppliers = [], 
  onFilterChange 
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [localSelectedSuppliers, setLocalSelectedSuppliers] = useState<string[]>(selectedSuppliers);
  
  // 當外部selectedSuppliers變更時，更新本地狀態
  useEffect(() => {
    setLocalSelectedSuppliers(selectedSuppliers);
  }, [selectedSuppliers]);
  
  // 處理點擊篩選按鈕
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  // 處理關閉彈出窗口
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  // 處理勾選變更
  const handleCheckboxChange = (supplierName: string) => {
    const newSelected = [...localSelectedSuppliers];
    const index = newSelected.indexOf(supplierName);
    
    if (index === -1) {
      newSelected.push(supplierName);
    } else {
      newSelected.splice(index, 1);
    }
    
    setLocalSelectedSuppliers(newSelected);
  };
  
  // 處理應用篩選
  const handleApplyFilter = () => {
    onFilterChange(localSelectedSuppliers);
    handleClose();
  };
  
  // 處理清除篩選
  const handleClearFilter = () => {
    setLocalSelectedSuppliers([]);
    onFilterChange([]);
    handleClose();
  };
  
  // 處理全選
  const handleSelectAll = () => {
    if (suppliers.length === localSelectedSuppliers.length) {
      // 如果已經全選，則清除所有選擇
      setLocalSelectedSuppliers([]);
    } else {
      // 否則選擇所有供應商
      setLocalSelectedSuppliers(suppliers.map(supplier => supplier.name));
    }
  };
  
  const open = Boolean(anchorEl);
  const id = open ? 'supplier-filter-popover' : undefined;
  
  // 計算篩選狀態圖標
  const getFilterIcon = () => {
    if (selectedSuppliers.length === 0) {
      return <CheckBoxOutlineBlankIcon fontSize="small" />;
    } else if (selectedSuppliers.length === suppliers.length) {
      return <CheckBoxIcon fontSize="small" color="primary" />;
    } else {
      return <FilterListIcon fontSize="small" color="primary" />;
    }
  };
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Typography variant="body2" component="span">
        供應商
      </Typography>
      <Tooltip title="篩選供應商">
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
            選擇供應商
          </Typography>
          
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox
                  checked={suppliers.length > 0 && localSelectedSuppliers.length === suppliers.length}
                  indeterminate={localSelectedSuppliers.length > 0 && localSelectedSuppliers.length < suppliers.length}
                  onChange={handleSelectAll}
                />
              }
              label="全選"
            />
            
            {suppliers.map((supplier) => (
              <FormControlLabel
                key={supplier._id}
                control={
                  <Checkbox
                    checked={localSelectedSuppliers.includes(supplier.name)}
                    onChange={() => handleCheckboxChange(supplier.name)}
                  />
                }
                label={supplier.name}
              />
            ))}
          </FormGroup>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
            <Button
              size="small"
              onClick={handleClearFilter}
              disabled={localSelectedSuppliers.length === 0}
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

export default SupplierCheckboxFilter;