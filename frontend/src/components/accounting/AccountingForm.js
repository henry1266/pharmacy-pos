import React, { useState, useEffect } from 'react';
import { 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Box
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import zhTW from 'date-fns/locale/zh-TW';
import { format } from 'date-fns';
import { getAccountingCategories } from '../../services/accountingCategoryService';
import StatusSelect from '../common/form/StatusSelect';
import PropTypes from 'prop-types';

/**
 * 記帳表單對話框組件
 * 
 * @param {Object} props
 * @param {boolean} props.open - 對話框是否開啟
 * @param {Function} props.onClose - 關閉對話框的處理函數
 * @param {Object} props.formData - 表單數據
 * @param {Array} props.formData.unaccountedSales - 未結算銷售列表
 * @param {Function} props.setFormData - 設置表單數據的函數
 * @param {boolean} props.editMode - 是否為編輯模式
 * @param {Function} props.onSubmit - 提交表單的處理函數
 * @param {boolean} props.loadingSales - 是否正在載入未結算銷售 (用於編輯模式)
 */
const AccountingForm = ({
  open,
  onClose,
  formData,
  setFormData,
  editMode,
  onSubmit,
  loadingSales
}) => {
  // 記帳名目類別狀態
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 獲取記帳名目類別
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const data = await getAccountingCategories();
        setCategories(data);
        setError(null);
      } catch (err) {
        console.error('獲取記帳名目類別失敗:', err);
        setError('獲取記帳名目類別失敗');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, []);
  
  // 處理表單變更
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // 處理日期變更
  const handleDateChange = (date) => {
    setFormData({
      ...formData,
      date
    });
  };
  
  // 處理項目變更 - 重構以降低認知複雜度
  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    
    // 處理類別變更為"退押金"的情況
    if (field === 'category' && value === '退押金') {
      // 如果當前金額為正數或為空，則將其轉為負數
      const currentAmount = updatedItems[index].amount;
      if (currentAmount > 0) {
        updatedItems[index].amount = -Math.abs(currentAmount);
      }
    }
    
    // 處理金額變更
    if (field === 'amount') {
      handleAmountChange(updatedItems, index, value);
    } else {
      updatedItems[index][field] = value;
    }
    
    // 處理類別變更，同時更新categoryId
    if (field === 'category') {
      updateCategoryId(updatedItems, index, value);
    }
    
    setFormData({
      ...formData,
      items: updatedItems
    });
  };
  
  // 處理金額變更的輔助函數
  const handleAmountChange = (items, index, value) => {
    if (value === '') {
      items[index].amount = '';
      return;
    }
    
    const parsedValue = parseFloat(value);
    if (items[index].category === '退押金') {
      items[index].amount = -Math.abs(parsedValue);
    } else {
      items[index].amount = parsedValue;
    }
  };
  
  // 更新類別ID的輔助函數
  const updateCategoryId = (items, index, categoryName) => {
    if (categories.length > 0) {
      const selectedCategory = categories.find(cat => cat.name === categoryName);
      if (selectedCategory) {
        items[index].categoryId = selectedCategory._id;
      }
    }
  };
  
  // 新增項目
  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { amount: '', category: '', categoryId: '', note: '' }]
    });
  };
  
  // 刪除項目
  const handleRemoveItem = (index) => {
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    
    setFormData({
      ...formData,
      items: updatedItems.length ? updatedItems : [{ amount: '', category: '', categoryId: '', note: '' }]
    });
  };
  
  // 計算總金額 (僅用於顯示，後端會重新計算)
  const calculateTotal = (items, unaccountedSales = []) => {
    const manualTotal = items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    
    // 計算銷售總額
    let salesTotal = 0;
    if (editMode && unaccountedSales && unaccountedSales.length > 0) {
      salesTotal = unaccountedSales.reduce((sum, sale) => sum + (parseFloat(sale.totalAmount) || 0), 0);
    }
      
    // 總是加上手動和銷售總額以在編輯模式下預覽
    return manualTotal + salesTotal; 
  };

  // --- Sorting Logic (Copied from AccountingNewPage) ---
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState("lastUpdated");

  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const stableSort = (array, comparator) => {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  };

  const getComparator = (order, orderBy) => {
    return order === "desc"
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  };

  const descendingComparator = (a, b, orderBy) => {
    let valA = a[orderBy];
    let valB = b[orderBy];
    if (orderBy.includes(".")) {
      const keys = orderBy.split(".");
      valA = keys.reduce((obj, key) => obj?.[key], a);
      valB = keys.reduce((obj, key) => obj?.[key], b);
    }
    if (orderBy === "lastUpdated") {
      valA = new Date(valA);
      valB = new Date(valB);
    }
    if (valB < valA) return -1;
    if (valB > valA) return 1;
    return 0;
  };

  // 排序未結算銷售
  const sortedSales = formData.unaccountedSales ? stableSort(formData.unaccountedSales, getComparator(order, orderBy)) : [];

  // Table Headers (Copied from AccountingNewPage)
  const headCells = [
    { id: "lastUpdated", label: "時間", numeric: false },
    { id: "product.code", label: "產品編號", numeric: false },
    { id: "product.name", label: "產品名稱", numeric: false },
    { id: "quantity", label: "數量", numeric: true },
    { id: "totalAmount", label: "金額", numeric: true },
    { id: "saleNumber", label: "銷售單號", numeric: false },
  ];

  // 渲染未結算銷售區塊
  const renderUnaccountedSalesSection = () => {
    if (!editMode || !formData.unaccountedSales || formData.unaccountedSales.length === 0) {
      return null;
    }

    // 提取巢狀三元運算子為獨立變數
    let content;
    
    if (loadingSales) {
      content = renderLoadingContent();
    } else if (!formData.unaccountedSales.length) {
      content = renderEmptyContent();
    } else {
      content = renderSalesTable();
    }

    return (
      <Grid item xs={12}>
        <Paper variant="outlined" sx={{ p: 2, mt: 2, backgroundColor: '#f9f9f9' }}>
          <Typography variant="h6" gutterBottom>
            監測產品 - 當日未結算銷售 (將於完成時自動加入)
          </Typography>
          {content}
        </Paper>
      </Grid>
    );
  };

  // 渲染載入中內容
  const renderLoadingContent = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
      <CircularProgress size={24} />
    </Box>
  );

  // 渲染空內容
  const renderEmptyContent = () => (
    <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
      目前無未結算銷售記錄。
    </Typography>
  );

  // 渲染銷售表格
  const renderSalesTable = () => (
    <TableContainer sx={{ maxHeight: 300 }}>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow sx={{ '& th': { backgroundColor: '#eee', fontWeight: 'bold' } }}>
            {headCells.map((headCell) => (
              <TableCell
                key={headCell.id}
                align={headCell.numeric ? 'right' : 'left'}
                sortDirection={orderBy === headCell.id ? order : false}
              >
                <TableSortLabel
                  active={orderBy === headCell.id}
                  direction={orderBy === headCell.id ? order : 'asc'}
                  onClick={() => handleRequestSort(headCell.id)}
                >
                  {headCell.label}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedSales.map((sale) => (
            <TableRow hover key={sale._id || `sale-${sale.saleNumber}-${sale.product?.code}`}>
              <TableCell>{format(new Date(sale.lastUpdated), 'HH:mm:ss')}</TableCell>
              <TableCell>{sale.product?.code || 'N/A'}</TableCell>
              <TableCell>{sale.product?.name || '未知產品'}</TableCell>
              <TableCell align="right">{Math.abs(sale.quantity || 0)}</TableCell>
              <TableCell align="right">${sale.totalAmount || 0}</TableCell>
              <TableCell>{sale.saleNumber}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // 渲染表單項目的樣式
  const getItemFieldStyle = (item) => {
    const isRefundDeposit = item.category === '退押金';
    
    if (!isRefundDeposit) {
      return {};
    }
    
    return {
      '& .MuiOutlinedInput-root': {
        '& fieldset': {
          borderColor: 'red',
          borderWidth: 2
        },
        '&:hover fieldset': {
          borderColor: 'red'
        },
        '&.Mui-focused fieldset': {
          borderColor: 'red'
        }
      },
      '& .MuiInputBase-input': {
        color: 'red'
      }
    };
  };

  // 渲染類別選單項目
  const renderCategoryMenuItems = () => {
    if (loading) {
      return (
        <MenuItem disabled>
          <CircularProgress size={20} />
          載入中...
        </MenuItem>
      );
    }
    
    if (error) {
      return (
        <MenuItem disabled>
          無法載入名目類別
        </MenuItem>
      );
    }
    
    if (categories.length > 0) {
      return categories.map(category => (
        <MenuItem key={category._id} value={category.name}>
          {category.name}
        </MenuItem>
      ));
    }
    
    return (
      <MenuItem disabled>
        無可用名目類別
      </MenuItem>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {editMode ? '編輯記帳記錄' : '新增記帳記錄'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
              <DatePicker
                label="日期"
                value={formData.date}
                onChange={handleDateChange}
                renderInput={(params) => <TextField {...params} fullWidth required />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>班別</InputLabel>
              <Select
                name="shift"
                value={formData.shift}
                label="班別"
                onChange={handleFormChange}
              >
                <MenuItem value="早">早班</MenuItem>
                <MenuItem value="中">中班</MenuItem>
                <MenuItem value="晚">晚班</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {editMode && (
            <Grid item xs={12} sm={6}>
              <StatusSelect 
                value={formData.status || 'pending'} // Default to pending if status is missing
                onChange={handleFormChange} 
              />
            </Grid>
          )}
          
          {/* 項目列表 */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              項目
            </Typography>
            
            {formData.items.map((item, index) => (
              <Grid container spacing={2} key={`item-${index}-${item.category || 'new'}`} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={3}>
                  <TextField
                    label="金額"
                    type="number"
                    value={item.amount}
                    onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                    fullWidth
                    required
                    sx={getItemFieldStyle(item)}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <FormControl fullWidth required>
                    <InputLabel>名目</InputLabel>
                    <Select
                      value={item.category}
                      label="名目"
                      onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                      disabled={loading}
                    >
                      {renderCategoryMenuItems()}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="備註"
                    value={item.note}
                    onChange={(e) => handleItemChange(index, 'note', e.target.value)}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <IconButton
                    color="error"
                    onClick={() => handleRemoveItem(index)}
                    disabled={formData.items.length <= 1}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
            
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddItem}
              sx={{ mt: 1 }}
            >
              新增項目
            </Button>
          </Grid>

          {/* 未結算銷售區塊 */}
          {renderUnaccountedSalesSection()}
          
          <Grid item xs={12}>
            <Typography variant="h6" align="right">
              總金額 (預覽): ${calculateTotal(formData.items, formData.unaccountedSales)}
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={onSubmit} variant="contained" color="primary">
          {editMode ? '更新' : '新增'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Props 驗證
AccountingForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  formData: PropTypes.shape({
    date: PropTypes.instanceOf(Date),
    shift: PropTypes.string,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        amount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
        category: PropTypes.string,
        categoryId: PropTypes.string,
        note: PropTypes.string
      })
    ),
    status: PropTypes.string,
    unaccountedSales: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string,
        lastUpdated: PropTypes.string,
        product: PropTypes.shape({
          code: PropTypes.string,
          name: PropTypes.string
        }),
        quantity: PropTypes.number,
        totalAmount: PropTypes.number,
        saleNumber: PropTypes.string
      })
    )
  }).isRequired,
  setFormData: PropTypes.func.isRequired,
  editMode: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loadingSales: PropTypes.bool
};

export default AccountingForm;
