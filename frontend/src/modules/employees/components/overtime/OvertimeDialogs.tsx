import React from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Typography,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import OvertimeRecordDialog from './OvertimeRecordDialog';
import { Employee } from '@pharmacy-pos/shared/types/entities';
import { OvertimeStatus } from '@pharmacy-pos/shared/utils/overtimeDataProcessor';
import { OvertimeRecord } from '../../types';

// 定義表單數據介面
interface OvertimeDialogFormData {
  employeeId: string;
  date: string;
  hours: string | number;
  description: string;
  status: OvertimeStatus;
  inputMode: 'manual' | 'time'; // 新增：輸入模式
  currentTime: string; // 新增：當前時間輸入
}

// 定義表單錯誤介面
interface OvertimeDialogFormErrors {
  employeeId?: string;
  date?: string;
  hours?: string;
  description?: string;
  status?: string;
  [key: string]: string | undefined;
}

// 定義元件 Props 介面
interface OvertimeDialogsProps {
  // 對話框狀態
  createDialogOpen: boolean;
  editDialogOpen: boolean;
  deleteDialogOpen: boolean;
  
  // 表單數據
  formData: OvertimeDialogFormData;
  formErrors: OvertimeDialogFormErrors;
  employees: Employee[];
  selectedRecord: OvertimeRecord | null;
  
  // 狀態
  submitting: boolean;
  isAdmin: boolean;
  employeeId: string | null;
  
  // 事件處理
  onCloseDialogs: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => void;
  onCreateRecord: () => void;
  onUpdateRecord: () => void;
  onDeleteRecord: () => void;
}

/**
 * 加班記錄對話框組件
 * 包含創建、編輯、刪除加班記錄的所有對話框
 * 重構後使用可重用的 OvertimeRecordDialog 組件
 */
const OvertimeDialogs: React.FC<OvertimeDialogsProps> = ({
  // 對話框狀態
  createDialogOpen,
  editDialogOpen,
  deleteDialogOpen,
  
  // 表單數據
  formData,
  formErrors,
  employees,
  selectedRecord,
  
  // 狀態
  submitting,
  isAdmin,
  employeeId,
  
  // 事件處理
  onCloseDialogs,
  onInputChange,
  onCreateRecord,
  onUpdateRecord,
  onDeleteRecord
}) => {
  return (
    <>
      {/* 創建加班記錄對話框 */}
      <OvertimeRecordDialog
        open={createDialogOpen}
        onClose={onCloseDialogs}
        title="新增加班記錄"
        formData={formData}
        formErrors={formErrors}
        employees={employees}
        employeeId={employeeId}
        isAdmin={isAdmin}
        submitting={submitting}
        onInputChange={onInputChange}
        onSubmit={onCreateRecord}
        submitButtonText="新增"
      />

      {/* 編輯加班記錄對話框 */}
      <OvertimeRecordDialog
        open={editDialogOpen}
        onClose={onCloseDialogs}
        title="編輯加班記錄"
        formData={formData}
        formErrors={formErrors}
        employees={employees}
        employeeId={employeeId}
        isAdmin={isAdmin}
        submitting={submitting}
        onInputChange={onInputChange}
        onSubmit={onUpdateRecord}
        submitButtonText="更新"
      />

      {/* 刪除加班記錄對話框 */}
      <Dialog open={deleteDialogOpen} onClose={onCloseDialogs}>
        <DialogTitle>刪除加班記錄</DialogTitle>
        <DialogContent>
          <Typography>
            您確定要刪除這筆加班記錄嗎？此操作無法復原。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseDialogs}>取消</Button>
          <Button
            onClick={onDeleteRecord}
            disabled={submitting}
            variant="contained"
            color="error"
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting ? '處理中...' : '刪除'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default OvertimeDialogs;