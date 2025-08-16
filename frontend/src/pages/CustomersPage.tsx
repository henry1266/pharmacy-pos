import React, { useState, useEffect, useCallback, FC, ChangeEvent } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Button as MuiButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Avatar,
  List,
  ListItem,
  IconButton,
  Tooltip,
  Snackbar,
  Alert,
  SelectChangeEvent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import CommonListPageLayout from '../components/common/CommonListPageLayout';
import useCustomerData from '../hooks/useCustomerData';
import testModeDataService from '../testMode/services/TestModeDataService';

// 定義客戶資料介面
interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  idCardNumber?: string;
  birthdate?: string | null;
  notes?: string;
  membershipLevel: string;
  level?: string;
  [key: string]: any;
}

// 定義客戶表單狀態介面
interface CustomerFormState {
  id?: string;
  code?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  idCardNumber: string;
  birthdate: string | null;
  notes: string;
  membershipLevel: string;
}

// 定義 Snackbar 狀態介面
interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}

// 定義 CustomerFormDialog 屬性介面
interface CustomerFormDialogProps {
  open: boolean;
  onClose: () => void;
  editMode: boolean;
  currentCustomerState: CustomerFormState;
  onInputChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => void;
  onSave: () => void;
  formError?: string;
  isTestMode: boolean;
  loading: boolean;
}

// 定義 CustomerDetailPanel 屬性介面
interface CustomerDetailPanelProps {
  selectedCustomer: Customer | null;
  handleEdit: (customer: Customer) => void;
  handleDelete: (id: string) => void;
}

// 定義 handleSaveCustomerTestMode 配置介面
interface SaveCustomerTestModeConfig {
  customerData: Omit<CustomerFormState, 'id' | 'code'>;
  editMode: boolean;
  currentCustomerState: CustomerFormState;
  mapMembershipLevel: (level: string) => string;
  setLocalCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  setLocalSelectedCustomer: React.Dispatch<React.SetStateAction<Customer | null>>;
  localSelectedCustomer: Customer | null;
  showSnackbarCallback: (message: string, severity?: SnackbarState['severity']) => void;
  setOpenDialog: React.Dispatch<React.SetStateAction<boolean>>;
}

// 定義 handleSaveCustomerActual 配置介面
interface SaveCustomerActualConfig {
  customerData: Omit<CustomerFormState, 'id' | 'code'>;
  editMode: boolean;
  currentCustomerId?: string;
  actualAddCustomer: (customer: Omit<CustomerFormState, 'id' | 'code'>) => Promise<any>;
  actualUpdateCustomer: (id: string, customer: Omit<CustomerFormState, 'id' | 'code'>) => Promise<any>;
  showSnackbarCallback: (message: string, severity?: SnackbarState['severity']) => void;
  setOpenDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setFormError: React.Dispatch<React.SetStateAction<string | null>>;
}

// Helper function to format date as YYYY/MM/DD
const formatDateToYYYYMMDD = (dateString?: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return ''; // Invalid date
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}/${month}/${day}`;
};

// Initial state for the customer form
const initialCustomerState: CustomerFormState = {
  name: '',
  phone: '',
  email: '',
  address: '',
  idCardNumber: "",
  birthdate: null,
  notes: "",
  membershipLevel: 'regular',
};

// Mock 數據已移至統一的測試數據模組

// ---
// Extracted Component for Customer Form Dialog
// ---
const CustomerFormDialog: FC<CustomerFormDialogProps> = ({
  open,
  onClose,
  editMode,
  currentCustomerState,
  onInputChange,
  onSave,
  formError,
  isTestMode,
  loading
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
    <DialogTitle>{editMode ? '編輯會員' : '添加會員'} {isTestMode && "(模擬)"}</DialogTitle>
    <DialogContent>
      {formError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {formError}
        </Alert>
      )}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: formError ? 0 : 2 }}>
        <TextField name="name" label="會員姓名" value={currentCustomerState.name} onChange={onInputChange} fullWidth required margin="dense" size="small" />
        <TextField name="phone" label="電話" value={currentCustomerState.phone} onChange={onInputChange} fullWidth required margin="dense" size="small" />
        <TextField name="idCardNumber" label="身分證" value={currentCustomerState.idCardNumber} onChange={onInputChange} fullWidth margin="dense" size="small" />
        <TextField name="birthdate" label="出生年月日" type="date" value={currentCustomerState.birthdate ? new Date(currentCustomerState.birthdate).toISOString().split('T')[0] : ''} onChange={onInputChange} fullWidth margin="dense" size="small" InputLabelProps={{ shrink: true }} />
        <TextField name="email" label="電子郵件" value={currentCustomerState.email} onChange={onInputChange} fullWidth margin="dense" size="small" />
        <TextField name="address" label="地址" value={currentCustomerState.address} onChange={onInputChange} fullWidth margin="dense" size="small" />
        <TextField name="notes" label="備註" value={currentCustomerState.notes ?? ''} onChange={onInputChange} fullWidth margin="dense" size="small" multiline rows={3} />
        <FormControl fullWidth margin="dense" size="small">
          <InputLabel>會員等級</InputLabel>
          <Select name="membershipLevel" value={currentCustomerState.membershipLevel} onChange={onInputChange} label="會員等級">
            <MenuItem value="regular">一般會員</MenuItem>
            <MenuItem value="platinum">白金會員</MenuItem>
          </Select>
        </FormControl>
      </Box>
    </DialogContent>
    <DialogActions>
      <MuiButton onClick={onClose} color="inherit">取消</MuiButton>
      <MuiButton onClick={onSave} color="primary" variant="contained" disabled={loading && !isTestMode}>
        {(loading && !isTestMode) ? '保存中...' : '保存'}
      </MuiButton>
    </DialogActions>
  </Dialog>
);

// 添加 PropTypes 驗證
CustomerFormDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  editMode: PropTypes.bool.isRequired,
  currentCustomerState: PropTypes.object.isRequired,
  onInputChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  formError: PropTypes.string,
  isTestMode: PropTypes.bool.isRequired,
  loading: PropTypes.bool.isRequired
} as any; // 使用 any 類型來避免 TypeScript 錯誤

// ---
// Extracted Component for Customer Detail Panel
// ---
const CustomerDetailPanel: FC<CustomerDetailPanelProps> = ({ selectedCustomer, handleEdit, handleDelete }) => {
  if (!selectedCustomer) {
    return (
      <Card elevation={2} sx={{ borderRadius: '0.5rem', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            選擇一個會員查看詳情
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={2} sx={{ borderRadius: '0.5rem', height: '100%' }}>
      <CardHeader
        avatar={<Avatar sx={{ bgcolor: 'secondary.main' }}>{selectedCustomer.name?.charAt(0) ?? 'C'}</Avatar>}
        title={<Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>{selectedCustomer.name}</Typography>}
        subheader={`編號: ${selectedCustomer.code}`}
        action={
          <Box>
            <Tooltip title="編輯">
              <IconButton color="primary" onClick={() => handleEdit(selectedCustomer)} size="small"><EditIcon /></IconButton>
            </Tooltip>
            <Tooltip title="刪除">
              <IconButton color="error" onClick={() => handleDelete(selectedCustomer.id)} size="small"><DeleteIcon /></IconButton>
            </Tooltip>
          </Box>
        }
        sx={{ pb: 1 }}
      />
      <Divider />
      <CardContent sx={{ py: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>會員資訊</Typography>
        <List dense sx={{ py: 0 }}>
          <ListItem sx={{ py: 0.5 }}><Typography variant="body2" sx={{ width: '30%', color: 'text.secondary' }}>電話:</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedCustomer.phone}</Typography></ListItem>
          <ListItem sx={{ py: 0.5 }}><Typography variant="body2" sx={{ width: '30%', color: 'text.secondary' }}>身分證:</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedCustomer.idCardNumber ?? '無'}</Typography></ListItem>
          <ListItem sx={{ py: 0.5 }}><Typography variant="body2" sx={{ width: '30%', color: 'text.secondary' }}>出生年月日:</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{formatDateToYYYYMMDD(selectedCustomer.birthdate) ?? '無'}</Typography></ListItem>
          <ListItem sx={{ py: 0.5 }}><Typography variant="body2" sx={{ width: '30%', color: 'text.secondary' }}>Email:</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedCustomer.email ?? '無'}</Typography></ListItem>
          <ListItem sx={{ py: 0.5 }}><Typography variant="body2" sx={{ width: '30%', color: 'text.secondary' }}>等級:</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedCustomer.level}</Typography></ListItem>
          <ListItem sx={{ py: 0.5 }}><Typography variant="body2" sx={{ width: '30%', color: 'text.secondary' }}>地址:</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{selectedCustomer.address ?? '無'}</Typography></ListItem>
          <ListItem sx={{ py: 0.5, flexDirection: 'column', alignItems: 'flex-start' }}><Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>備註:</Typography><Typography variant="body2" sx={{ fontWeight: 500, whiteSpace: 'pre-wrap' }}>{selectedCustomer.notes ?? '無'}</Typography></ListItem>
        </List>
      </CardContent>
    </Card>
  );
};

// 添加 PropTypes 驗證
CustomerDetailPanel.propTypes = {
  selectedCustomer: PropTypes.object,
  handleEdit: PropTypes.func.isRequired,
  handleDelete: PropTypes.func.isRequired
} as any; // 使用 any 類型來避免 TypeScript 錯誤

// ---
// Refactoring Helper Functions (defined outside CustomersPage)
// ---

// Helper to determine the source of customer data
const getCustomerDataSource = (
  isTestMode: boolean,
  actualCustomers: Customer[] | null,
  actualError: string | null,
  showSnackbarCallback: (message: string, severity?: SnackbarState['severity']) => void
): Customer[] => {
  if (isTestMode) {
    // 使用統一的測試數據服務
    const testCustomers = testModeDataService.getCustomers(actualCustomers as any, actualError);
    if (actualError || !actualCustomers || actualCustomers.length === 0) {
      showSnackbarCallback('測試模式：載入實際客戶資料失敗，已使用模擬數據。', 'info');
    }
    return testCustomers as Customer[];
  }
  return actualCustomers || []; // Return empty array if actualCustomers is null/undefined
};

// 修改參數過多的函式 - 使用配置對象模式
const handleSaveCustomerTestMode = (config: SaveCustomerTestModeConfig): void => {
  const {
    customerData,
    editMode,
    currentCustomerState,
    mapMembershipLevel,
    setLocalCustomers,
    setLocalSelectedCustomer,
    localSelectedCustomer,
    showSnackbarCallback,
    setOpenDialog
  } = config;

  const newOrUpdatedCustomer: Customer = {
    ...customerData,
    id: editMode && currentCustomerState.id ? currentCustomerState.id : `mockCust${Date.now()}`,
    code: editMode && currentCustomerState.code ? currentCustomerState.code : `MKC${Date.now().toString().slice(-4)}`,
    level: mapMembershipLevel(customerData.membershipLevel)
  };

  if (editMode) {
    setLocalCustomers(prev => prev.map(c => (c.id === newOrUpdatedCustomer.id ? newOrUpdatedCustomer : c)));
    if (localSelectedCustomer && localSelectedCustomer.id === newOrUpdatedCustomer.id) {
      setLocalSelectedCustomer(newOrUpdatedCustomer);
    }
  } else {
    setLocalCustomers(prev => [...prev, newOrUpdatedCustomer]);
  }
  setOpenDialog(false);
  showSnackbarCallback(editMode ? '測試模式：會員已模擬更新' : '測試模式：會員已模擬新增', 'info');
};

// 修改參數過多的函式 - 使用配置對象模式
const handleSaveCustomerActual = async (config: SaveCustomerActualConfig): Promise<void> => {
  const {
    customerData,
    editMode,
    currentCustomerId,
    actualAddCustomer,
    actualUpdateCustomer,
    showSnackbarCallback,
    setOpenDialog,
    setFormError
  } = config;

  try {
    if (editMode && currentCustomerId) {
      await actualUpdateCustomer(currentCustomerId, customerData);
    } else {
      await actualAddCustomer(customerData);
    }
    setOpenDialog(false);
    showSnackbarCallback(editMode ? '會員已更新' : '會員已新增', 'success');
  } catch (err: any) {
    setFormError(`保存會員失敗: ${err.message}`);
  }
};

// Helper for deleting customer in Test Mode
const handleDeleteCustomerTestMode = (
  id: string,
  setLocalCustomers: React.Dispatch<React.SetStateAction<Customer[]>>,
  localSelectedCustomer: Customer | null,
  setLocalSelectedCustomer: React.Dispatch<React.SetStateAction<Customer | null>>,
  showSnackbarCallback: (message: string, severity?: SnackbarState['severity']) => void
): void => {
  setLocalCustomers(prev => prev.filter(c => c.id !== id));
  if (localSelectedCustomer && localSelectedCustomer.id === id) {
    setLocalSelectedCustomer(null);
  }
  showSnackbarCallback('測試模式：會員已模擬刪除', 'info');
};

// Helper for deleting customer in Actual Mode
const handleDeleteCustomerActual = async (
  id: string,
  actualDeleteCustomer: (id: string) => Promise<any>,
  localSelectedCustomer: Customer | null,
  setLocalSelectedCustomer: React.Dispatch<React.SetStateAction<Customer | null>>,
  showSnackbarCallback: (message: string, severity?: SnackbarState['severity']) => void
): Promise<void> => {
  try {
    await actualDeleteCustomer(id);
    if (localSelectedCustomer && localSelectedCustomer.id === id) {
      setLocalSelectedCustomer(null);
    }
    showSnackbarCallback('會員已成功刪除', 'success');
  } catch (err: any) {
    showSnackbarCallback(`刪除會員失敗: ${err.message}`, 'error');
  }
};


// ---
// Refactored CustomersPage Component
// ---
const CustomersPage: FC = () => {
  const [isTestMode, setIsTestMode] = useState<boolean>(false);

  useEffect(() => {
    const testModeActive = localStorage.getItem('isTestMode') === 'true';
    setIsTestMode(testModeActive);
  }, []);

  const {
    customers: actualCustomers,
    loading: actualLoading,
    error: actualError,
    addCustomer: actualAddCustomer,
    updateCustomer: actualUpdateCustomer,
    deleteCustomer: actualDeleteCustomer,
    mapMembershipLevel
  } = useCustomerData();

  const [localCustomers, setLocalCustomers] = useState<Customer[]>([]);
  const [localSelectedCustomer, setLocalSelectedCustomer] = useState<Customer | null>(null); // Stores the selected customer object
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });

  const showSnackbar = useCallback((message: string, severity: SnackbarState['severity'] = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  useEffect(() => {
    const customerSource = getCustomerDataSource(isTestMode, actualCustomers, actualError, showSnackbar);
    setLocalCustomers(customerSource.map(c => ({ ...c, level: mapMembershipLevel(c.membershipLevel) })));
  }, [isTestMode, actualCustomers, actualError, mapMembershipLevel, showSnackbar]);


  const customersToDisplay = localCustomers; // Always use localCustomers, which is managed by the effect above
  const isLoading = isTestMode ? false : actualLoading;
  const pageError = isTestMode ? null : actualError;

  // Derived state for the detail panel, ensuring it uses the latest from customersToDisplay
  const panelSelectedCustomer = customersToDisplay.find(c => c.id === localSelectedCustomer?.id) ?? null;


  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentCustomerState, setCurrentCustomerState] = useState<CustomerFormState>(initialCustomerState);
  const [formError, setFormError] = useState<string | null>(null);


  const handleCloseSnackbar = useCallback((_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') return;
    setSnackbar(s => ({ ...s, open: false })); // Use functional update for snackbar
  }, []);

  const columns = [
    { field: 'code', headerName: '會員編號', width: 100 },
    { field: 'name', headerName: '會員姓名', width: 120 },
    { field: 'idCardNumber', headerName: '身分證', width: 140 },
    { field: 'birthdate', headerName: '出生年月日', width: 150, valueGetter: (params: any) => formatDateToYYYYMMDD(params?.value) },
    { field: 'phone', headerName: '電話', width: 140 },
    { field: 'level', headerName: '會員等級', width: 120 },
    {
      field: 'actions',
      headerName: '操作',
      width: 120,
      renderCell: (params: any) => (
        <Box>
          <Tooltip title="編輯">
            <IconButton size="small" color="primary" onClick={(e) => { e.stopPropagation(); handleEdit(params.row); }}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="刪除">
            <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(params.row?.id); }}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    const { name, value } = e.target;
    setCurrentCustomerState(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleEdit = useCallback((customer: Customer) => {
    setCurrentCustomerState({
      id: customer.id,
      code: customer.code,
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      idCardNumber: customer.idCardNumber || "",
      birthdate: customer.birthdate || null,
      notes: customer.notes || "",
      membershipLevel: customer.membershipLevel || 'regular'
    });
    setEditMode(true);
    setFormError(null);
    setOpenDialog(true);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    const confirmMessage = isTestMode ? '測試模式：確定要模擬刪除此會員嗎？' : '確定要刪除此會員嗎？';
    if (window.confirm(confirmMessage)) {
      if (isTestMode) {
        handleDeleteCustomerTestMode(id, setLocalCustomers, localSelectedCustomer, setLocalSelectedCustomer, showSnackbar);
      } else {
        await handleDeleteCustomerActual(id, actualDeleteCustomer, localSelectedCustomer, setLocalSelectedCustomer, showSnackbar);
      }
    }
  }, [isTestMode, actualDeleteCustomer, localSelectedCustomer, showSnackbar]); // Removed setters from deps (stable)

  const handleAddCustomer = useCallback(() => {
    setCurrentCustomerState(initialCustomerState);
    setEditMode(false);
    setFormError(null);
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => setOpenDialog(false), []);

  const handleSaveCustomer = useCallback(async () => {
    setFormError(null);
    const customerDataToSave = { // Renamed to avoid conflict with currentCustomerState fields like id/code
      name: currentCustomerState.name || '',
      phone: currentCustomerState.phone || '',
      email: currentCustomerState.email || '',
      address: currentCustomerState.address || '',
      idCardNumber: currentCustomerState.idCardNumber || '',
      birthdate: currentCustomerState.birthdate,
      notes: currentCustomerState.notes || '',
      membershipLevel: currentCustomerState.membershipLevel || 'regular'
    };

    // Validate required fields
    if (!customerDataToSave.name.trim() || !customerDataToSave.phone.trim()) {
      setFormError('請填寫必填欄位：會員姓名和電話');
      return;
    }

    if (isTestMode) {
      // 使用配置對象模式調用函式
      handleSaveCustomerTestMode({
        customerData: customerDataToSave,
        editMode,
        currentCustomerState,
        mapMembershipLevel,
        setLocalCustomers,
        setLocalSelectedCustomer,
        localSelectedCustomer,
        showSnackbarCallback: showSnackbar,
        setOpenDialog
      });
    } else {
      // 使用配置對象模式調用函式
      await handleSaveCustomerActual({
        customerData: customerDataToSave,
        editMode,
        currentCustomerId: currentCustomerState.id || '',
        actualAddCustomer,
        actualUpdateCustomer,
        showSnackbarCallback: showSnackbar,
        setOpenDialog,
        setFormError
      });
    }
  }, [
    currentCustomerState,
    editMode,
    isTestMode,
    mapMembershipLevel,
    localSelectedCustomer,
    showSnackbar,
    actualAddCustomer,
    actualUpdateCustomer
  ]);

  return (
    <>
      <Box sx={{ width: '95%', mx: 'auto' }}>
        <CommonListPageLayout
          title="會員管理"
          actionButtons={
            <MuiButton
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddCustomer}
            >
              新增會員
            </MuiButton>
          }
          loading={isLoading}
          error={pageError || ''}
          columns={columns}
          rows={customersToDisplay}
          onRowClick={(params: any) => setLocalSelectedCustomer(params.row)}
          dataTableProps={{
            getRowId: (row: Customer) => row.id
          }}
          detailPanel={<CustomerDetailPanel selectedCustomer={panelSelectedCustomer} handleEdit={handleEdit} handleDelete={handleDelete} />}
        />
      </Box>

      <CustomerFormDialog
        open={openDialog}
        onClose={handleCloseDialog}
        editMode={editMode}
        currentCustomerState={currentCustomerState}
        onInputChange={handleInputChange}
        onSave={handleSaveCustomer}
        formError={formError || ''}
        isTestMode={isTestMode}
        loading={isLoading}
      />

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CustomersPage;