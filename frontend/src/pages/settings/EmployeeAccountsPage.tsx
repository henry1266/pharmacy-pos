import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  SelectChangeEvent
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import OvertimeManager from '../../components/employees/OvertimeManager';
import AccountDialog from '../../components/employees/account/AccountDialog';
import FormField from '../../components/employees/account/FormField';
import EmployeeAccountRow from '../../components/employees/account/EmployeeAccountRow';
import useEmployeeAccounts from '../../hooks/useEmployeeAccounts';
import { getRoleName, getRoleColor, roleOptions } from '../../utils/roleUtils';

/**
 * 員工帳號管理頁面
 * 允許管理員查看、創建、編輯和刪除員工帳號
 */
const EmployeeAccountsPage: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<number>(0);
  
  // 使用自定義 Hook 管理員工帳號狀態和邏輯
  const {
    employees,
    isLoading,
    error,
    successMessage,
    selectedEmployee,
    submitting,
    createDialogOpen,
    editDialogOpen,
    resetPasswordDialogOpen,
    deleteDialogOpen,
    unbindDialogOpen,
    formData,
    formErrors,
    setCreateDialogOpen,
    setSelectedEmployee,
    setFormData,
    handleInputChange,
    handleOpenEditDialog,
    handleOpenResetPasswordDialog,
    handleOpenDeleteDialog,
    handleOpenUnbindDialog,
    handleCloseDialogs,
    handleCreateAccount,
    handleUpdateAccount,
    handleResetPassword,
    handleDeleteAccount,
    handleUnbindAccount
  } = useEmployeeAccounts();
  
  // 處理標籤頁變更
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number): void => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <div>
          <Typography variant="h4" gutterBottom>員工帳號管理</Typography>
          <Typography variant="body1" color="text.secondary">
            在此頁面您可以管理所有員工的系統帳號
          </Typography>
        </div>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          新增帳號
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ mb: 3 }}
        >
          <Tab label="帳號管理" />
          <Tab label="加班管理" />
        </Tabs>

        {currentTab === 0 && (
          <>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress size={24} />
                <Typography sx={{ ml: 2 }}>載入中...</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>員工姓名</TableCell>
                      <TableCell>用戶名</TableCell>
                      <TableCell>電子郵件</TableCell>
                      <TableCell>角色</TableCell>
                      <TableCell>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {employees && employees.length > 0 ? employees.map((employee) => (
                      <EmployeeAccountRow
                        key={employee._id}
                        employee={employee}
                        onEdit={handleOpenEditDialog}
                        onResetPassword={handleOpenResetPasswordDialog}
                        onUnbind={handleOpenUnbindDialog}
                        onDelete={handleOpenDeleteDialog}
                        getRoleName={getRoleName}
                        getRoleColor={getRoleColor as any}
                      />
                    )) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          沒有員工資料
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}

        {currentTab === 1 && (
          <OvertimeManager isAdmin={true} />
        )}
      </Paper>

      {/* 創建帳號對話框 */}
      <AccountDialog
        open={createDialogOpen}
        onClose={handleCloseDialogs}
        title="建立員工帳號"
        description="為員工建立系統登入帳號"
        onConfirm={handleCreateAccount}
        confirmText="建立"
        submitting={submitting}
      >
        <FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
          <InputLabel id="employee-select-label">選擇員工</InputLabel>
          <Select
            labelId="employee-select-label"
            value={selectedEmployee ? selectedEmployee._id : ''}
            onChange={(e: SelectChangeEvent) => {
              const selected = employees.find(emp => emp._id === e.target.value);
              if (selected) {
                setSelectedEmployee(selected);
                setFormData({
                  ...formData,
                  employeeId: selected._id
                });
              }
            }}
            label="選擇員工"
          >
            {employees && employees.length > 0
              ? employees
                  .filter(emp => !emp.account) // 只顯示沒有帳號的員工
                  .map(emp => (
                    <MenuItem key={emp._id} value={emp._id}>{emp.name}</MenuItem>
                  ))
              : (
                <MenuItem value="" disabled>
                  沒有可選擇的員工
                </MenuItem>
              )
            }
          </Select>
        </FormControl>
        <FormField
          name="username"
          label="用戶名"
          value={formData.username}
          onChange={handleInputChange as any}
          error={!!formErrors.username}
          helperText={formErrors.username}
          required
        />
        <FormField
          type="email"
          name="email"
          label="電子郵件 (選填)"
          value={formData.email}
          onChange={handleInputChange as any}
          error={!!formErrors.email}
          helperText={formErrors.email}
        />
        <FormField
          type="password"
          name="password"
          label="密碼"
          value={formData.password}
          onChange={handleInputChange as any}
          error={!!formErrors.password}
          helperText={formErrors.password}
          required
        />
        <FormField
          type="password"
          name="confirmPassword"
          label="確認密碼"
          value={formData.confirmPassword}
          onChange={handleInputChange as any}
          error={!!formErrors.confirmPassword}
          helperText={formErrors.confirmPassword}
          required
        />
        <FormField
          type="select"
          name="role"
          label="角色"
          value={formData.role}
          onChange={handleInputChange as any}
          error={!!formErrors.role}
          helperText={formErrors.role}
          options={roleOptions}
        />
      </AccountDialog>

      {/* 編輯帳號對話框 */}
      <AccountDialog
        open={editDialogOpen}
        onClose={handleCloseDialogs}
        title="編輯員工帳號"
        description={`編輯 ${selectedEmployee?.name} 的系統帳號資訊`}
        onConfirm={handleUpdateAccount}
        confirmText="更新"
        submitting={submitting}
      >
        <FormField
          name="username"
          label="用戶名"
          value={formData.username}
          onChange={handleInputChange as any}
          error={!!formErrors.username}
          helperText={formErrors.username}
          required
        />
        <FormField
          type="email"
          name="email"
          label="電子郵件 (選填)"
          value={formData.email}
          onChange={handleInputChange as any}
          error={!!formErrors.email}
          helperText={formErrors.email}
        />
        <FormField
          type="select"
          name="role"
          label="角色"
          value={formData.role}
          onChange={handleInputChange as any}
          error={!!formErrors.role}
          helperText={formErrors.role}
          options={roleOptions}
        />
      </AccountDialog>

      {/* 重設密碼對話框 */}
      <AccountDialog
        open={resetPasswordDialogOpen}
        onClose={handleCloseDialogs}
        title="重設密碼"
        description={`為 ${selectedEmployee?.name} 重設系統帳號密碼`}
        onConfirm={handleResetPassword}
        confirmText="重設密碼"
        confirmColor="warning"
        submitting={submitting}
      >
        <FormField
          type="password"
          name="password"
          label="新密碼"
          value={formData.password}
          onChange={handleInputChange as any}
          error={!!formErrors.password}
          helperText={formErrors.password}
          required
        />
        <FormField
          type="password"
          name="confirmPassword"
          label="確認新密碼"
          value={formData.confirmPassword}
          onChange={handleInputChange as any}
          error={!!formErrors.confirmPassword}
          helperText={formErrors.confirmPassword}
          required
        />
      </AccountDialog>

      {/* 刪除帳號對話框 */}
      <AccountDialog
        open={deleteDialogOpen}
        onClose={handleCloseDialogs}
        title="刪除員工帳號"
        description={`您確定要刪除 ${selectedEmployee?.name} 的系統帳號嗎？此操作無法復原，刪除後員工將無法登入系統。`}
        onConfirm={handleDeleteAccount}
        confirmText="確認刪除"
        confirmColor="error"
        submitting={submitting}
        maxWidth="xs"
      />

      {/* 解除綁定對話框 */}
      <AccountDialog
        open={unbindDialogOpen}
        onClose={handleCloseDialogs}
        title="解除帳號綁定"
        description={`您確定要解除 ${selectedEmployee?.name} 與其帳號的綁定嗎？此操作不會刪除帳號，但會使帳號與員工資料分離。`}
        onConfirm={handleUnbindAccount}
        confirmText="確認解除綁定"
        confirmColor="info"
        submitting={submitting}
        maxWidth="xs"
      />
    </Box>
  );
};

export default EmployeeAccountsPage;