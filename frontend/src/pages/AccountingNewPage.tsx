import React, { useState, useEffect } from 'react';
import { 
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Paper,
  Snackbar,
  Alert,
  Container,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  SelectChangeEvent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import zhTW from 'date-fns/locale/zh-TW';
import { useNavigate } from 'react-router-dom';
import StatusSelect from '../components/common/form/StatusSelect.tsx';
import useAccountingFormData from '../hooks/useAccountingFormData';

// TypeScript interfaces
interface AccountingCategory {
  _id: string;
  name: string;
  description?: string;
  isExpense: boolean;
}

interface AccountingItem {
  amount: string | number;
  category: string;
  categoryId: string;
  note: string;
  id?: string; // Optional ID for existing items
}

interface UnaccountedSale {
  _id?: string;
  lastUpdated: string;
  product?: {
    _id?: string;
    code?: string;
    name?: string;
  };
  quantity: number;
  totalAmount: number;
  saleNumber: string;
}

interface FormData {
  date: Date;
  shift: string;
  status: string;
  items: AccountingItem[];
}

interface HeadCell {
  id: string;
  label: string;
  numeric: boolean;
}

/**
 * 記帳新增頁面 (Refactored)
 */
const AccountingNewPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Use the custom hook
  const {
    categories,
    loadingCategories,
    errorCategories,
    formData,
    handleFormChange,
    handleDateChange,
    handleItemChange,
    handleAddItem,
    handleRemoveItem,
    totalAmount,
    unaccountedSales,
    loadingSales,
    salesError,
    submitting,
    submitError,
    submitSuccess,
    submitAccountingRecord,
    setSubmitError,
  } = useAccountingFormData();

  // Local UI state (snackbar, sorting)
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info' | 'warning'>('success');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc'); // Sort order for sales table
  const [orderBy, setOrderBy] = useState<string>('lastUpdated'); // Sort by column for sales table

  // Show snackbar for submission results or errors
  useEffect(() => {
    if (submitSuccess) {
      showSnackbar('記帳記錄已新增', 'success');
      const timer = setTimeout(() => {
        navigate('/accounting');
      }, 1500);
      return () => clearTimeout(timer); // Cleanup timer on unmount
    } 
  }, [submitSuccess, navigate]);

  useEffect(() => {
    if (submitError) {
      showSnackbar(submitError, 'error');
    }
  }, [submitError]);

  useEffect(() => {
    if (errorCategories) {
      showSnackbar(errorCategories, 'error');
    }
  }, [errorCategories]);

  useEffect(() => {
    if (salesError) {
      showSnackbar(salesError, 'error');
    }
  }, [salesError]);

  // Show snackbar utility
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning'): void => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  // Close snackbar handler
  const handleCloseSnackbar = (_event?: React.SyntheticEvent | Event, reason?: string): void => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
    // Optionally clear the error from the hook when snackbar closes
    if (snackbarSeverity === 'error') {
      setSubmitError(null);
    }
  };

  // Back navigation
  const handleBack = (): void => {
    navigate('/accounting');
  };

  // Form submission trigger
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault(); // Prevent default form submission
    await submitAccountingRecord(); // Call the hook's submit function
  };

  // --- Sorting Logic for Unaccounted Sales Table ---
  const handleRequestSort = (property: string): void => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const stableSort = <T extends Record<string, any>>(array: T[], comparator: (a: T, b: T) => number): T[] => {
    const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) return order;
      return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
  };

  const getComparator = <T extends Record<string, any>>(
    order: 'asc' | 'desc',
    orderBy: string
  ): ((a: T, b: T) => number) => {
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  };

  const descendingComparator = <T extends Record<string, any>>(
    a: T,
    b: T,
    orderBy: string
  ): number => {
    let valA: any = a[orderBy];
    let valB: any = b[orderBy];

    if (orderBy.includes('.')) {
      const keys = orderBy.split('.');
      // 使用 optional chaining 替代巢狀 && 運算
      valA = keys.reduce((obj, key) => obj?.[key], a);
      valB = keys.reduce((obj, key) => obj?.[key], b);
    }

    if (orderBy === 'lastUpdated') {
      valA = new Date(valA);
      valB = new Date(valB);
    }

    if (valB < valA) return -1;
    if (valB > valA) return 1;
    return 0;
  };

  const sortedSales = stableSort<UnaccountedSale>(
    unaccountedSales as UnaccountedSale[], 
    getComparator<UnaccountedSale>(order, orderBy)
  );
  // --- End Sorting Logic ---

  // Table Headers for Unaccounted Sales
  const headCells: HeadCell[] = [
    { id: 'lastUpdated', label: '時間', numeric: false },
    { id: 'product.code', label: '產品編號', numeric: false },
    { id: 'product.name', label: '產品名稱', numeric: false },
    { id: 'quantity', label: '數量', numeric: true },
    { id: 'totalAmount', label: '金額', numeric: true },
    { id: 'saleNumber', label: '銷售單號', numeric: false },
  ];

  // 渲染未結算銷售區塊
  const renderUnaccountedSalesSection = (): React.ReactNode => {
    if (loadingSales) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      );
    }
    
    if (salesError) {
      return <Alert severity="error">{salesError}</Alert>;
    }
    
    if (sortedSales.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
          今日尚無已設定監測產品的未結算銷售記錄，或未設定監測產品。
        </Typography>
      );
    }
    
    return (
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
            {sortedSales.map((row) => (
              <TableRow hover key={row._id || `${row.saleNumber}-${row.product?._id}`}>
                <TableCell>{new Date(row.lastUpdated).toLocaleTimeString('zh-TW')}</TableCell>
                <TableCell>{row.product?.code}</TableCell>
                <TableCell>{row.product?.name}</TableCell>
                <TableCell align="right">{row.quantity}</TableCell>
                <TableCell align="right">{row.totalAmount?.toLocaleString()}</TableCell>
                <TableCell>{row.saleNumber}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  // 渲染類別選擇下拉選單內容
  const renderCategoryOptions = (): React.ReactNode => {
    if (loadingCategories) {
      return (
        <MenuItem disabled>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          載入中...
        </MenuItem>
      );
    }
    
    if (errorCategories) {
      return (
        <MenuItem disabled>
          <Typography color="error" variant="body2">無法載入名目</Typography>
        </MenuItem>
      );
    }
    
    if (categories.length > 0) {
      return categories.map((category: AccountingCategory) => (
        <MenuItem key={category._id} value={category.name}>
          {category.name}
        </MenuItem>
      ));
    }
    
    return (
      <MenuItem disabled>
        無可用名目
      </MenuItem>
    );
  };

  // 使用 TypeScript 類型斷言來解決 MUI Grid 組件的類型問題
  const GridItem = Grid as any;

  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, my: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={handleBack} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">
            新增記帳記錄
          </Typography>
        </Box>
        
        {/* Wrap form for onSubmit */}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Date, Shift, Status (use hook state and handlers) */}
            <GridItem item md={4} sm={6} xs={12}> {/* Adjusted grid size */}
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
                <DatePicker
                  label="日期"
                  value={formData.date}
                  onChange={handleDateChange}
                  disabled={submitting}
                />
              </LocalizationProvider>
            </GridItem>
            <GridItem item md={4} sm={6} xs={12}> {/* Adjusted grid size */}
              <FormControl fullWidth required>
                <InputLabel>班別</InputLabel>
                <Select
                  name="shift"
                  value={formData.shift}
                  label="班別"
                  onChange={handleFormChange as (event: SelectChangeEvent<string>) => void}
                  disabled={submitting}
                >
                  <MenuItem value="早">早班</MenuItem>
                  <MenuItem value="中">中班</MenuItem>
                  <MenuItem value="晚">晚班</MenuItem>
                </Select>
              </FormControl>
            </GridItem>
            <GridItem item md={4} sm={12} xs={12}> {/* Adjusted grid size */}
              <StatusSelect 
                value={formData.status}
                onChange={handleFormChange as (event: SelectChangeEvent<string>) => void} // Use hook's handler
              />
            </GridItem>
            
            {/* Items List (use hook state and handlers) */}
            <GridItem item xs={12}>
              <Typography variant="h6" gutterBottom>
                記帳項目
              </Typography>
              
              {formData.items.map((item, index) => (
                <Grid container spacing={2} key={`item-${item.id || index}`} sx={{ mb: 2, alignItems: 'center' }}>
                  <GridItem item sm={3} xs={12}>
                    <TextField
                      label="金額"
                      type="number"
                      value={item.amount}
                      onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                      fullWidth
                      required
                      disabled={submitting}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: item.category === '退押金' ? 'error.main' : undefined,
                            borderWidth: item.category === '退押金' ? 2 : 1
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: item.category === '退押金' ? 'error.main' : 'primary.main'
                          }
                        },
                        '& .MuiInputBase-input': {
                          color: item.category === '退押金' ? 'error.main' : 'inherit'
                        }
                      }}
                    />
                  </GridItem>
                  <GridItem item sm={3} xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>名目</InputLabel>
                      <Select
                        value={item.category}
                        label="名目"
                        onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                        disabled={loadingCategories || submitting}
                      >
                        {renderCategoryOptions()}
                      </Select>
                    </FormControl>
                  </GridItem>
                  <GridItem item sm={4} xs={12}>
                    <TextField
                      label="備註"
                      value={item.note}
                      onChange={(e) => handleItemChange(index, 'note', e.target.value)}
                      fullWidth
                      disabled={submitting}
                    />
                  </GridItem>
                  <GridItem item sm={2} xs={12} sx={{ textAlign: 'right' }}>
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveItem(index)}
                      disabled={formData.items.length <= 1 || submitting}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </GridItem>
                </Grid>
              ))}
              
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddItem}
                sx={{ mt: 1 }}
                disabled={submitting}
              >
                新增項目
              </Button>
            </GridItem>

            {/* Total Amount Display */}
            <GridItem item xs={12} sx={{ textAlign: 'right', mt: -1, mb: 2 }}>
              <Typography variant="h6">
                總金額: {totalAmount.toLocaleString('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 })}
              </Typography>
            </GridItem>

            {/* Unaccounted Sales Section (use hook state) */}
            <GridItem item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, mt: 2, backgroundColor: '#f9f9f9' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6">
                    監測產品 - 當日未結算銷售
                  </Typography>
                </Box>
                {renderUnaccountedSalesSection()}
              </Paper>
            </GridItem>

            {/* Submit Button */}
            <GridItem item xs={12} sx={{ mt: 3, textAlign: 'right' }}>
              <Button 
                variant="contained" 
                color="primary" 
                type="submit" // Changed to type submit
                disabled={submitting}
              >
                {submitting ? <CircularProgress size={24} /> : '提交記帳'}
              </Button>
            </GridItem>
          </Grid>
        </form>
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }} variant="filled">
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AccountingNewPage;