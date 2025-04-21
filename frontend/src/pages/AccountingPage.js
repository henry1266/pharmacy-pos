import React, { useState, useEffect } from 'react';
import { Box, Typography, Snackbar, Alert } from '@mui/material';
import axios from 'axios';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// 導入拆分後的子組件
import AccountingFilter from '../components/accounting/AccountingFilter';
import AccountingDataGrid from '../components/accounting/AccountingDataGrid';
import AccountingForm from '../components/accounting/AccountingForm';

const AccountingPage = ({ openAddDialog = false }) => {
  const navigate = useNavigate();
  
  // 狀態管理
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  // 篩選條件
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [filterShift, setFilterShift] = useState('');
  
  // 表單資料
  const [formData, setFormData] = useState({
    date: new Date(),
    shift: '',
    items: [
      { amount: '', category: '掛號費', note: '' },
      { amount: '', category: '部分負擔', note: '' }
    ]
  });
  
  // 載入記帳記錄
  const fetchRecords = async () => {
    setLoading(true);
    try {
      let url = '/api/accounting';
      const params = new URLSearchParams();
      
      if (startDate) {
        params.append('startDate', format(startDate, 'yyyy-MM-dd'));
      }
      
      if (endDate) {
        params.append('endDate', format(endDate, 'yyyy-MM-dd'));
      }
      
      if (filterShift) {
        params.append('shift', filterShift);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await axios.get(url);
      setRecords(response.data);
      setError(null);
    } catch (err) {
      console.error('載入記帳記錄失敗:', err);
      setError('載入記帳記錄失敗');
    } finally {
      setLoading(false);
    }
  };
  
  // 初始載入
  useEffect(() => {
    fetchRecords();
  }, []);
  
  // 如果openAddDialog為true，自動打開新增對話框
  useEffect(() => {
    if (openAddDialog) {
      handleOpenAddDialog();
    }
  }, [openAddDialog]);
  
  // 篩選條件變更時重新載入
  useEffect(() => {
    fetchRecords();
  }, [startDate, endDate, filterShift]);
  
  // 導航到新增頁面
  const handleOpenAddDialog = () => {
    navigate('/accounting/new');
  };
  
  // 開啟編輯對話框
  const handleOpenEditDialog = (record) => {
    setFormData({
      date: new Date(record.date),
      shift: record.shift,
      items: record.items.map(item => ({
        amount: item.amount,
        category: item.category,
        note: item.note || ''
      }))
    });
    setEditMode(true);
    setCurrentId(record._id);
    setOpenDialog(true);
  };
  
  // 關閉對話框
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // 提交表單
  const handleSubmit = async () => {
    try {
      // 驗證表單
      if (!formData.date) {
        showSnackbar('請選擇日期', 'error');
        return;
      }
      
      if (!formData.shift) {
        showSnackbar('請選擇班別', 'error');
        return;
      }
      
      const validItems = formData.items.filter(
        item => item.amount && item.category
      );
      
      if (validItems.length === 0) {
        showSnackbar('至少需要一個有效的項目', 'error');
        return;
      }
      
      const submitData = {
        ...formData,
        date: format(formData.date, 'yyyy-MM-dd'),
        items: validItems
      };
      
      if (editMode) {
        // 更新記錄
        await axios.put(`/api/accounting/${currentId}`, submitData);
        showSnackbar('記帳記錄已更新', 'success');
      } else {
        // 新增記錄
        await axios.post('/api/accounting', submitData);
        showSnackbar('記帳記錄已新增', 'success');
      }
      
      handleCloseDialog();
      fetchRecords();
    } catch (err) {
      console.error('提交記帳記錄失敗:', err);
      showSnackbar(err.response?.data?.msg || '提交記帳記錄失敗', 'error');
    }
  };
  
  // 刪除記錄
  const handleDelete = async (id) => {
    if (window.confirm('確定要刪除此記帳記錄嗎？')) {
      try {
        await axios.delete(`/api/accounting/${id}`);
        showSnackbar('記帳記錄已刪除', 'success');
        fetchRecords();
      } catch (err) {
        console.error('刪除記帳記錄失敗:', err);
        showSnackbar('刪除記帳記錄失敗', 'error');
      }
    }
  };
  
  // 顯示提示訊息
  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };
  
  return (
    <Box sx={{ p: 3, width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        記帳系統
      </Typography>
      
      {/* 篩選區域 */}
      <AccountingFilter 
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        filterShift={filterShift}
        setFilterShift={setFilterShift}
        onAddClick={handleOpenAddDialog}
      />
      
      {/* 記帳記錄表格 */}
      <AccountingDataGrid 
        records={records}
        loading={loading}
        onEdit={handleOpenEditDialog}
        onDelete={handleDelete}
      />
      
      {/* 編輯表單對話框 (僅用於編輯，新增已改為獨立頁面) */}
      <AccountingForm 
        open={openDialog}
        onClose={handleCloseDialog}
        formData={formData}
        setFormData={setFormData}
        editMode={editMode}
        onSubmit={handleSubmit}
      />
      
      {/* 提示訊息 */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
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
