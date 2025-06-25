import React, { useState, useEffect } from 'react';
import { Box, Typography, Snackbar, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Import Hook and Service
import useAccountingData from '../hooks/useAccountingData';
import { accountingServiceV2 } from '../services/accountingServiceV2';

// Import Presentation Components
import AccountingFilter from '../components/accounting/AccountingFilter';
import AccountingDataGrid from '../components/accounting/AccountingDataGrid';
import AccountingForm from '../components/accounting/AccountingForm';

// Import Types
import { AccountingRecord } from '@pharmacy-pos/shared/types/entities';
import type {
  FormData,
  ExtendedAccountingRecord
} from '@pharmacy-pos/shared/types/accounting';

// TypeScript interfaces
interface AccountingPageProps {
  openAddDialog?: boolean;
}

// 定義嚴重性類型別名
type AlertSeverity = 'success' | 'error' | 'info' | 'warning';

const AccountingPage: React.FC<AccountingPageProps> = ({ openAddDialog = false }) => {
  const navigate = useNavigate();

  // Use the custom hook for data fetching, filtering, and basic actions
  const {
    records,
    loading: loadingRecords,
    error: fetchError,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    filterShift,
    setFilterShift,
    fetchRecords,
    deleteRecord,
    fetchEditData,
  } = useAccountingData();

  // Local UI State (Dialog, Form, Snackbar)
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<AlertSeverity>('success');
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    date: new Date(),
    shift: '',
    status: 'pending',
    items: [
      { amount: 0, category: '掛號費', note: '' },
      { amount: 0, category: '部分負擔', note: '' }
    ],
    unaccountedSales: []
  });

  // Effect to open add dialog if triggered by prop (navigates to new page)
  useEffect(() => {
    if (openAddDialog) {
      handleOpenAddDialog();
    }
  }, [openAddDialog]);

  // Navigate to the dedicated new accounting record page
  const handleOpenAddDialog = (): void => {
    navigate('/accounting/new');
  };

  // Open Edit Dialog - Fetch data using hook
  const handleOpenEditDialog = async (record: ExtendedAccountingRecord): Promise<void> => {
    setFormLoading(true);
    setEditMode(true);
    setCurrentId(record._id);
    const result = await fetchEditData(record);
    if (result.success) {
      setFormData(result.data);
      setOpenDialog(true);
    } else {
      showSnackbar(result.error ?? '載入編輯資料失敗', 'error');
      // Reset state if fetch fails
      setEditMode(false);
      setCurrentId(null);
    }
    setFormLoading(false);
  };

  // Close Dialog
  const handleCloseDialog = (): void => {
    setOpenDialog(false);
    // Reset form state when closing
    setEditMode(false);
    setCurrentId(null);
    setFormData({
      date: new Date(),
      shift: '',
      status: 'pending',
      items: [
        { amount: 0, category: '掛號費', note: '' },
        { amount: 0, category: '部分負擔', note: '' }
      ],
      unaccountedSales: []
    });
  };

  // Handle Form Submission (Update only, Create is on a separate page)
  const handleSubmit = async (): Promise<void> => {
    // Basic Validation (can be enhanced)
    if (!formData.date || !formData.shift) {
      showSnackbar('請選擇日期和班別', 'error');
      return;
    }
    const validItems = formData.items.filter(item => item.amount && item.category);
    if (validItems.length === 0) {
      showSnackbar('至少需要一個有效的項目', 'error');
      return;
    }

    setFormLoading(true);
    try {
      const submitData = {
        ...formData,
        items: validItems // Submit only valid items
      };

      if (editMode && currentId) {
        await accountingServiceV2.updateAccountingRecord(currentId, submitData as Partial<AccountingRecord>);
        showSnackbar('記帳記錄已更新', 'success');
        handleCloseDialog();
        fetchRecords(); // Refetch records after update
      } else {
        // Create logic is handled on /accounting/new page
        showSnackbar('錯誤：此處不應執行新增操作', 'error');
      }
    } catch (err: any) {
      console.error('提交記帳記錄失敗:', err);
      showSnackbar(err.message ?? '提交記帳記錄失敗', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Deletion - Use hook's delete function
  const handleDelete = async (id: string): Promise<void> => {
    if (window.confirm('確定要刪除此記帳記錄嗎？')) {
      setFormLoading(true);
      const result = await deleteRecord(id);
      if (result.success) {
        showSnackbar('記帳記錄已刪除', 'success');
        // No need to call fetchRecords here if hook handles optimistic update
      } else {
        showSnackbar(result.error ?? '刪除記帳記錄失敗', 'error');
      }
      setFormLoading(false);
    }
  };

  // Show Snackbar utility
  const showSnackbar = (message: string, severity: AlertSeverity): void => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        記帳系統
      </Typography>

      {/* Filter Component */}
      <AccountingFilter
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        filterShift={filterShift}
        setFilterShift={setFilterShift}
        onAddClick={handleOpenAddDialog}
      />

      {/* Display Fetch Error if any */}
      {fetchError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {fetchError}
        </Alert>
      )}

      {/* Data Grid Component */}
      <AccountingDataGrid
        records={records}
        loading={loadingRecords ?? formLoading}
        onEdit={handleOpenEditDialog}
        onDelete={handleDelete}
      />

      {/* Edit Form Dialog (only for editing) */}
      <AccountingForm
        open={openDialog}
        onClose={handleCloseDialog}
        formData={formData}
        setFormData={setFormData}
        editMode={editMode}
        onSubmit={handleSubmit}
        loadingSales={formLoading}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};


export default AccountingPage;