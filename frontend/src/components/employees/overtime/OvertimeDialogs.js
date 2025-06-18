import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  InputAdornment,
  CircularProgress
} from '@mui/material';

/**
 * 加班記錄對話框組件
 * 包含創建、編輯、刪除加班記錄的所有對話框
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
      <Dialog open={createDialogOpen} onClose={onCloseDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>新增加班記錄</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!formErrors.employeeId}>
                <InputLabel id="employee-select-label">員工</InputLabel>
                <Select
                  labelId="employee-select-label"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={onInputChange}
                  label="員工"
                  disabled={!!employeeId}
                >
                  {employees.map((employee) => (
                    <MenuItem key={employee._id} value={employee._id}>
                      {employee.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.employeeId && (
                  <Typography color="error" variant="caption">
                    {formErrors.employeeId}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="加班日期"
                name="date"
                type="date"
                value={formData.date}
                onChange={onInputChange}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                error={!!formErrors.date}
                helperText={formErrors.date}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="加班時數"
                name="hours"
                value={formData.hours}
                onChange={onInputChange}
                fullWidth
                type="number"
                inputProps={{ min: 0.5, max: 24, step: 0.5 }}
                error={!!formErrors.hours}
                helperText={formErrors.hours}
                InputProps={{
                  endAdornment: <InputAdornment position="end">小時</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="加班原因/說明"
                name="description"
                value={formData.description}
                onChange={onInputChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
            
            {isAdmin && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="status-select-label">狀態</InputLabel>
                  <Select
                    labelId="status-select-label"
                    name="status"
                    value={formData.status}
                    onChange={onInputChange}
                    label="狀態"
                  >
                    <MenuItem value="pending">待審核</MenuItem>
                    <MenuItem value="approved">已核准</MenuItem>
                    <MenuItem value="rejected">已拒絕</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseDialogs}>取消</Button>
          <Button
            onClick={onCreateRecord}
            disabled={submitting}
            variant="contained"
            color="primary"
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting ? '處理中...' : '新增'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 編輯加班記錄對話框 */}
      <Dialog open={editDialogOpen} onClose={onCloseDialogs} maxWidth="sm" fullWidth>
        <DialogTitle>編輯加班記錄</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!formErrors.employeeId}>
                <InputLabel id="employee-select-label">員工</InputLabel>
                <Select
                  labelId="employee-select-label"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={onInputChange}
                  label="員工"
                  disabled={!!employeeId}
                >
                  {employees.map((employee) => (
                    <MenuItem key={employee._id} value={employee._id}>
                      {employee.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.employeeId && (
                  <Typography color="error" variant="caption">
                    {formErrors.employeeId}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="加班日期"
                name="date"
                type="date"
                value={formData.date}
                onChange={onInputChange}
                fullWidth
                InputLabelProps={{
                  shrink: true,
                }}
                error={!!formErrors.date}
                helperText={formErrors.date}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="加班時數"
                name="hours"
                value={formData.hours}
                onChange={onInputChange}
                fullWidth
                type="number"
                inputProps={{ min: 0.5, max: 24, step: 0.5 }}
                error={!!formErrors.hours}
                helperText={formErrors.hours}
                InputProps={{
                  endAdornment: <InputAdornment position="end">小時</InputAdornment>,
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="加班原因/說明"
                name="description"
                value={formData.description}
                onChange={onInputChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
            
            {isAdmin && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel id="status-select-label">狀態</InputLabel>
                  <Select
                    labelId="status-select-label"
                    name="status"
                    value={formData.status}
                    onChange={onInputChange}
                    label="狀態"
                  >
                    <MenuItem value="pending">待審核</MenuItem>
                    <MenuItem value="approved">已核准</MenuItem>
                    <MenuItem value="rejected">已拒絕</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onCloseDialogs}>取消</Button>
          <Button
            onClick={onUpdateRecord}
            disabled={submitting}
            variant="contained"
            color="primary"
            startIcon={submitting ? <CircularProgress size={20} /> : null}
          >
            {submitting ? '處理中...' : '更新'}
          </Button>
        </DialogActions>
      </Dialog>

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