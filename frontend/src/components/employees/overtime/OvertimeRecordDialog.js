import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  TextField,
  InputAdornment
} from '@mui/material';

/**
 * 加班記錄對話框組件
 * 統一處理創建和編輯加班記錄的對話框，消除重複的表單結構
 */
const OvertimeRecordDialog = ({
  open,
  onClose,
  title,
  formData,
  formErrors,
  employees,
  employeeId,
  isAdmin,
  submitting,
  onInputChange,
  onSubmit,
  submitButtonText = '確認'
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
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
        <Button onClick={onClose}>取消</Button>
        <Button
          onClick={onSubmit}
          disabled={submitting}
          variant="contained"
          color="primary"
        >
          {submitting ? '處理中...' : submitButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

OvertimeRecordDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  formData: PropTypes.shape({
    employeeId: PropTypes.string,
    date: PropTypes.string,
    hours: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    description: PropTypes.string,
    status: PropTypes.string
  }).isRequired,
  formErrors: PropTypes.object.isRequired,
  employees: PropTypes.array.isRequired,
  employeeId: PropTypes.string,
  isAdmin: PropTypes.bool.isRequired,
  submitting: PropTypes.bool.isRequired,
  onInputChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitButtonText: PropTypes.string
};

export default OvertimeRecordDialog;