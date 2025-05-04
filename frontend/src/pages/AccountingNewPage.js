import React, { useState, useEffect, useCallback } from 'react';
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
  TableSortLabel
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import zhTW from 'date-fns/locale/zh-TW';
// Removed axios import
import { useNavigate } from 'react-router-dom';
// Removed service imports, now handled by hook
import StatusSelect from '../components/common/form/StatusSelect';
import useAccountingFormData from '../hooks/useAccountingFormData'; // Import the new hook

/**
 * 記帳新增頁面 (Refactored)
 */
const AccountingNewPage = () => {
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
    setSubmitError, // For clearing error on snackbar close
    setSubmitSuccess // For resetting success state
  } = useAccountingFormData();

  // Local UI state (snackbar, sorting)
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [order, setOrder] = useState('asc'); // Sort order for sales table
  const [orderBy, setOrderBy] = useState('lastUpdated'); // Sort by column for sales table

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
  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  // Close snackbar handler
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
    // Optionally clear the error from the hook when snackbar closes
    if (snackbarSeverity === 'error') {
      setSubmitError(null);
      // Consider clearing other errors from hook if needed
    }
  };

  // Back navigation
  const handleBack = () => {
    navigate('/accounting');
  };

  // Form submission trigger
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission
    await submitAccountingRecord(); // Call the hook's submit function
  };

  // --- Sorting Logic for Unaccounted Sales Table (remains the same) ---
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
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
    return order === 'desc'
      ? (a, b) => descendingComparator(a, b, orderBy)
      : (a, b) => -descendingComparator(a, b, orderBy);
  };

  const descendingComparator = (a, b, orderBy) => {
    let valA = a[orderBy];
    let valB = b[orderBy];

    if (orderBy.includes('.')) {
      const keys = orderBy.split('.');
      valA = keys.reduce((obj, key) => obj && obj[key], a);
      valB = keys.reduce((obj, key) => obj && obj[key], b);
    }

    if (orderBy === 'lastUpdated') {
      valA = new Date(valA);
      valB = new Date(valB);
    }

    if (valB < valA) return -1;
    if (valB > valA) return 1;
    return 0;
  };

  const sortedSales = stableSort(unaccountedSales, getComparator(order, orderBy));
  // --- End Sorting Logic ---

  // Table Headers for Unaccounted Sales (remains the same)
  const headCells = [
    { id: 'lastUpdated', label: '時間', numeric: false },
    { id: 'product.code', label: '產品編號', numeric: false },
    { id: 'product.name', label: '產品名稱', numeric: false },
    { id: 'quantity', label: '數量', numeric: true },
    { id: 'totalAmount', label: '金額', numeric: true },
    { id: 'saleNumber', label: '銷售單號', numeric: false },
  ];

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
            <Grid item xs={12} sm={6} md={4}> {/* Adjusted grid size */}
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
                <DatePicker
                  label="日期"
                  value={formData.date}
                  onChange={handleDateChange}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                  disabled={submitting}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6} md={4}> {/* Adjusted grid size */}
              <FormControl fullWidth required>
                <InputLabel>班別</InputLabel>
                <Select
                  name="shift"
                  value={formData.shift}
                  label="班別"
                  onChange={handleFormChange}
                  disabled={submitting}
                >
                  <MenuItem value="早">早班</MenuItem>
                  <MenuItem value="中">中班</MenuItem>
                  <MenuItem value="晚">晚班</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={12} md={4}> {/* Adjusted grid size */}
              <StatusSelect 
                value={formData.status}
                onChange={handleFormChange} // Use hook's handler
                disabled={submitting}
              />
            </Grid>
            
            {/* Items List (use hook state and handlers) */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                記帳項目
              </Typography>
              
              {formData.items.map((item, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: 'center' }}>
                  <Grid item xs={12} sm={3}>
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
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <FormControl fullWidth required>
                      <InputLabel>名目</InputLabel>
                      <Select
                        value={item.category}
                        label="名目"
                        onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                        disabled={loadingCategories || submitting}
                      >
                        {loadingCategories ? (
                          <MenuItem disabled>
                            <CircularProgress size={20} sx={{ mr: 1 }} />
                            載入中...
                          </MenuItem>
                        ) : errorCategories ? (
                          <MenuItem disabled>
                            <Typography color="error" variant="body2">無法載入名目</Typography>
                          </MenuItem>
                        ) : categories.length > 0 ? (
                          categories.map(category => (
                            <MenuItem key={category._id} value={category.name}>
                              {category.name}
                            </MenuItem>
                          ))
                        ) : (
                          <MenuItem disabled>
                            無可用名目
                          </MenuItem>
                        )}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="備註"
                      value={item.note}
                      onChange={(e) => handleItemChange(index, 'note', e.target.value)}
                      fullWidth
                      disabled={submitting}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2} sx={{ textAlign: 'right' }}>
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveItem(index)}
                      disabled={formData.items.length <= 1 || submitting}
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
                disabled={submitting}
              >
                新增項目
              </Button>
            </Grid>

            {/* Total Amount Display */}
            <Grid item xs={12} sx={{ textAlign: 'right', mt: -1, mb: 2 }}>
              <Typography variant="h6">
                總金額: {totalAmount.toLocaleString('zh-TW', { style: 'currency', currency: 'TWD', minimumFractionDigits: 0 })}
              </Typography>
            </Grid>

            {/* Unaccounted Sales Section (use hook state) */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, mt: 2, backgroundColor: '#f9f9f9' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6">
                    監測產品 - 當日未結算銷售
                  </Typography>
                </Box>
                {loadingSales ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : salesError ? (
                  <Alert severity="error">{salesError}</Alert>
                ) : sortedSales.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                    今日尚無已設定監測產品的未結算銷售記錄，或未設定監測產品。
                  </Typography>
                ) : (
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
                          <TableRow hover key={row._id || row.saleNumber + row.product?._id}>
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
                )}
              </Paper>
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12} sx={{ mt: 3, textAlign: 'right' }}>
              <Button 
                variant="contained" 
                color="primary" 
                type="submit" // Changed to type submit
                disabled={submitting}
              >
                {submitting ? <CircularProgress size={24} /> : '提交記帳'}
              </Button>
            </Grid>
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

