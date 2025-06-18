import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Divider,
  SelectChangeEvent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';

// 自定義 Hook
import useOvertimeManager from '../../hooks/useOvertimeManager';

// 子組件
import OvertimeFilters from './overtime/OvertimeFilters';
import OvertimeRecordTable from './overtime/OvertimeRecordTable';
import OvertimeDialogs from './overtime/OvertimeDialogs';

// 工具函數和類型
import {
  groupOvertimeRecords,
  validateOvertimeForm,
  OvertimeStatus
} from '../../utils/overtimeDataProcessor';

// 從 overtimeRecordService 導入類型
import { OvertimeRecord } from '../../services/overtimeRecordService';
import { Employee } from '../../types/entities';

// 定義排班記錄介面
interface ScheduleRecord {
  employeeId?: Employee;
  employee?: Employee;
  [key: string]: any;
}

// 定義排班記錄集合介面
interface ScheduleOvertimeRecords {
  [employeeId: string]: ScheduleRecord[];
}

// 定義表單數據介面
interface FormData {
  employeeId: string;
  date: string;
  hours: string | number;
  description: string;
  status: OvertimeStatus;
}

// 定義表單錯誤介面
interface FormErrors {
  employeeId?: string;
  date?: string;
  hours?: string;
  description?: string;
  status?: string;
  [key: string]: string | undefined;
}

// 定義元件 Props 介面
interface OvertimeManagerRefactoredProps {
  isAdmin?: boolean;
  employeeId?: string | null;
}

/**
 * 重構後的加班管理組件
 * 使用模組化架構，將原本1498行的組件拆分為多個小組件
 */
const OvertimeManagerRefactored: React.FC<OvertimeManagerRefactoredProps> = ({ isAdmin = false, employeeId = null }) => {
  // 使用自定義 Hook 管理業務邏輯
  const {
    // 狀態
    loading,
    error,
    successMessage,
    overtimeRecords,
    scheduleOvertimeRecords,
    employees,
    summaryData,
    expandedEmployees,
    selectedMonth,
    selectedYear,
    
    // 操作方法
    setSelectedMonth,
    setSelectedYear,
    createOvertimeRecord,
    updateOvertimeRecord,
    deleteOvertimeRecord,
    toggleEmployeeExpanded,
    clearMessages
  } = useOvertimeManager({ isAdmin, employeeId });

  // 對話框狀態
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<OvertimeRecord | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // 表單狀態
  const [formData, setFormData] = useState<FormData>({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    hours: '',
    description: '',
    status: 'pending'
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  // 處理表單輸入變更
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 清除對應欄位的錯誤訊息
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [formErrors]);

  // 開啟創建加班記錄對話框
  const handleOpenCreateDialog = useCallback(() => {
    setFormData({
      employeeId: employeeId || '',
      date: new Date().toISOString().split('T')[0],
      hours: '',
      description: '',
      status: 'pending'
    });
    setFormErrors({});
    setCreateDialogOpen(true);
  }, [employeeId]);

  // 開啟編輯加班記錄對話框
  const handleOpenEditDialog = useCallback((record: OvertimeRecord) => {
    setSelectedRecord(record);
    
    // 安全地獲取 employeeId
    let empId = '';
    if (record.employeeId) {
      if (typeof record.employeeId === 'string') {
        empId = record.employeeId;
      } else if (typeof record.employeeId === 'object' && 'employee' in record && record.employee) {
        empId = (record.employee as any)._id || '';
      } else if (typeof record.employeeId === 'object') {
        empId = (record.employeeId as any)._id || '';
      }
    }
    
    setFormData({
      employeeId: empId,
      date: new Date(record.date).toISOString().split('T')[0],
      hours: record.hours,
      description: record.description || '',
      status: record.status as OvertimeStatus
    });
    setFormErrors({});
    setEditDialogOpen(true);
  }, []);

  // 開啟刪除加班記錄對話框
  const handleOpenDeleteDialog = useCallback((record: OvertimeRecord) => {
    setSelectedRecord(record);
    setDeleteDialogOpen(true);
  }, []);

  // 關閉所有對話框
  const handleCloseDialogs = useCallback(() => {
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setDeleteDialogOpen(false);
    setSelectedRecord(null);
    setFormErrors({});
  }, []);

  // 創建加班記錄
  const handleCreateRecord = useCallback(async () => {
    // 將 hours 轉換為 number 類型
    const formDataWithNumberHours = {
      ...formData,
      hours: typeof formData.hours === 'string' ? parseFloat(formData.hours) : formData.hours
    };
    
    const errors = validateOvertimeForm(formDataWithNumberHours as any);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      const success = await createOvertimeRecord({
        employeeId: formData.employeeId,
        date: formData.date,
        hours: parseFloat(formData.hours as string),
        description: formData.description,
        status: formData.status
      });

      if (success) {
        handleCloseDialogs();
      }
    } finally {
      setSubmitting(false);
    }
  }, [formData, createOvertimeRecord, handleCloseDialogs]);

  // 更新加班記錄
  const handleUpdateRecord = useCallback(async () => {
    // 將 hours 轉換為 number 類型
    const formDataWithNumberHours = {
      ...formData,
      hours: typeof formData.hours === 'string' ? parseFloat(formData.hours) : formData.hours
    };
    
    const errors = validateOvertimeForm(formDataWithNumberHours as any);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      if (selectedRecord) {
        const success = await updateOvertimeRecord(selectedRecord._id, {
          employeeId: formData.employeeId,
          date: formData.date,
          hours: parseFloat(formData.hours as string),
          description: formData.description,
          status: formData.status
        });

        if (success) {
          handleCloseDialogs();
        }
      }
    } finally {
      setSubmitting(false);
    }
  }, [formData, selectedRecord, updateOvertimeRecord, handleCloseDialogs]);

  // 刪除加班記錄
  const handleDeleteRecord = useCallback(async () => {
    setSubmitting(true);
    try {
      if (selectedRecord) {
        const success = await deleteOvertimeRecord(selectedRecord._id);
        if (success) {
          handleCloseDialogs();
        }
      }
    } finally {
      setSubmitting(false);
    }
  }, [selectedRecord, deleteOvertimeRecord, handleCloseDialogs]);

  // 快速核准記錄
  const handleApproveRecord = useCallback(async (record: OvertimeRecord) => {
    setSubmitting(true);
    try {
      await updateOvertimeRecord(record._id, { status: 'approved' });
    } finally {
      setSubmitting(false);
    }
  }, [updateOvertimeRecord]);

  // 快速拒絕記錄
  const handleRejectRecord = useCallback(async (record: OvertimeRecord) => {
    setSubmitting(true);
    try {
      await updateOvertimeRecord(record._id, { status: 'rejected' });
    } finally {
      setSubmitting(false);
    }
  }, [updateOvertimeRecord]);

  // 處理數據分組
  const groupedRecords = React.useMemo(() => {
    return groupOvertimeRecords(
      overtimeRecords as any,
      scheduleOvertimeRecords as any,
      summaryData as any,
      employees as any,
      selectedMonth
    );
  }, [overtimeRecords, scheduleOvertimeRecords, summaryData, employees, selectedMonth]);

  return (
    <Box sx={{ width: '100%' }}>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        {/* 標題和操作按鈕 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            加班記錄管理
          </Typography>
          {isAdmin && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
            >
              新增加班記錄
            </Button>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* 錯誤和成功訊息 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={clearMessages}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={clearMessages}>
            {successMessage}
          </Alert>
        )}

        {/* 年份與月份篩選器 */}
        <OvertimeFilters
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          onYearChange={setSelectedYear}
          onMonthChange={setSelectedMonth}
        />

        {/* 加班記錄列表標題 */}
        <Typography variant="subtitle1" gutterBottom>
          {`${selectedYear}年 ${selectedMonth + 1}月 加班記錄`}
        </Typography>
        
        {/* 載入狀態或記錄表格 */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
            <Typography sx={{ ml: 2 }}>載入中...</Typography>
          </Box>
        ) : (
          <OvertimeRecordTable
            groupedRecords={groupedRecords}
            expandedEmployees={expandedEmployees}
            selectedMonth={selectedMonth}
            isAdmin={isAdmin}
            onToggleExpanded={toggleEmployeeExpanded}
            onEditRecord={handleOpenEditDialog}
            onDeleteRecord={handleOpenDeleteDialog}
            onApproveRecord={handleApproveRecord}
            onRejectRecord={handleRejectRecord}
          />
        )}
      </Paper>

      {/* 對話框組件 */}
      <OvertimeDialogs
        createDialogOpen={createDialogOpen}
        editDialogOpen={editDialogOpen}
        deleteDialogOpen={deleteDialogOpen}
        formData={formData}
        formErrors={formErrors}
        employees={employees}
        selectedRecord={selectedRecord}
        submitting={submitting}
        isAdmin={isAdmin}
        employeeId={employeeId}
        onCloseDialogs={handleCloseDialogs}
        onInputChange={handleInputChange}
        onCreateRecord={handleCreateRecord}
        onUpdateRecord={handleUpdateRecord}
        onDeleteRecord={handleDeleteRecord}
      />
    </Box>
  );
};

export default OvertimeManagerRefactored;