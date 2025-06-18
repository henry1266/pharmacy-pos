import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Typography,
  CircularProgress
} from '@mui/material';
import OvertimeRecordDialog from './OvertimeRecordDialog';

/**
 * 加班記錄對話框組件
 * 包含創建、編輯、刪除加班記錄的所有對話框
 * 重構後使用可重用的 OvertimeRecordDialog 組件
 */
const OvertimeDialogs = ({
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

OvertimeDialogs.propTypes = {
  // 對話框狀態
  createDialogOpen: PropTypes.bool.isRequired,
  editDialogOpen: PropTypes.bool.isRequired,
  deleteDialogOpen: PropTypes.bool.isRequired,
  
  // 表單數據
  formData: PropTypes.object.isRequired,
  formErrors: PropTypes.object.isRequired,
  employees: PropTypes.array.isRequired,
  selectedRecord: PropTypes.object,
  
  // 狀態
  submitting: PropTypes.bool.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  employeeId: PropTypes.string,
  
  // 事件處理
  onCloseDialogs: PropTypes.func.isRequired,
  onInputChange: PropTypes.func.isRequired,
  onCreateRecord: PropTypes.func.isRequired,
  onUpdateRecord: PropTypes.func.isRequired,
  onDeleteRecord: PropTypes.func.isRequired
};

export default OvertimeDialogs;