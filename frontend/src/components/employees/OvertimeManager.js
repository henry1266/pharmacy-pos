import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Tooltip,
  Divider,
  InputAdornment,
  Tabs,
  Tab
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import overtimeRecordService from '../../services/overtimeRecordService';
import employeeService from '../../services/employeeService';

/**
 * 加班管理組件
 * 用於管理員工的加班記錄和加班時數
 */
const OvertimeManager = ({ isAdmin = false, employeeId = null }) => {
  // 狀態
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [overtimeRecords, setOvertimeRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const [scheduleOvertimeRecords, setScheduleOvertimeRecords] = useState([]);
  const [scheduleOvertimeLoading, setScheduleOvertimeLoading] = useState(false);
  
  // 月份篩選狀態
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    hours: '',
    description: '',
    status: 'pending'
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [summaryData, setSummaryData] = useState([]);

  // 獲取加班記錄
  const fetchOvertimeRecords = async () => {
    setLoading(true);
    try {
      const params = {};
      if (employeeId) {
        params.employeeId = employeeId;
      }
      
      // 添加月份篩選
      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 0);
      
      params.startDate = startDate.toISOString().split('T')[0];
      params.endDate = endDate.toISOString().split('T')[0];
      
      const records = await overtimeRecordService.getOvertimeRecords(params);
      setOvertimeRecords(records);
      
      // 獲取加班時數統計
      if (employeeId) {
        const summary = await overtimeRecordService.getEmployeeOvertimeSummary(employeeId, params);
        setSummaryData([{
          employeeId: summary.employeeId,
          employeeName: employees.find(emp => emp._id === summary.employeeId)?.name || '未知員工',
          totalHours: summary.totalHours,
          recordCount: summary.recordCount
        }]);
      } else {
        const summary = await overtimeRecordService.getAllEmployeesOvertimeSummary(params);
        setSummaryData(summary);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 獲取員工列表
  const fetchEmployees = async () => {
    try {
      const employeeList = await employeeService.getAllEmployees();
      setEmployees(employeeList);
    } catch (err) {
      setError(err.message);
    }
  };

  // 初始化時獲取資料
  // 獲取排班系統中的加班記錄
  const fetchScheduleOvertimeRecords = async () => {
    setScheduleOvertimeLoading(true);
    try {
      const params = {};
      if (employeeId) {
        params.employeeId = employeeId;
      }
      
      // 設置日期範圍為選擇的月份
      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 0);
      
      params.startDate = startDate.toISOString().split('T')[0];
      params.endDate = endDate.toISOString().split('T')[0];
      
      const records = await overtimeRecordService.getScheduleOvertimeRecords(params);
      setScheduleOvertimeRecords(records);
    } catch (err) {
      setError(err.message);
    } finally {
      setScheduleOvertimeLoading(false);
    }
  };
  
  // 處理標籤頁變更
  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    
    // 如果切換到排班系統加班記錄標籤頁，則獲取排班系統加班記錄
    if (newValue === 1) {
      fetchScheduleOvertimeRecords();
    }
  };
  
  // 處理月份變更
  useEffect(() => {
    if (currentTab === 1) {
      fetchScheduleOvertimeRecords();
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchEmployees();
    fetchOvertimeRecords();
  }, [employeeId, selectedMonth, selectedYear]);

  // 處理表單輸入變更
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // 清除對應欄位的錯誤訊息
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  // 驗證表單
  const validateForm = () => {
    const errors = {};

    if (!formData.employeeId) {
      errors.employeeId = '請選擇員工';
    }

    if (!formData.date) {
      errors.date = '請選擇日期';
    }

    if (!formData.hours) {
      errors.hours = '請輸入加班時數';
    } else if (isNaN(formData.hours) || formData.hours <= 0 || formData.hours > 24) {
      errors.hours = '加班時數必須在 0.5 到 24 小時之間';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 開啟創建加班記錄對話框
  const handleOpenCreateDialog = () => {
    setFormData({
      employeeId: employeeId || '',
      date: new Date().toISOString().split('T')[0],
      hours: '',
      description: '',
      status: 'pending'
    });
    setFormErrors({});
    setCreateDialogOpen(true);
  };

  // 開啟編輯加班記錄對話框
  const handleOpenEditDialog = (record) => {
    setSelectedRecord(record);
    setFormData({
      employeeId: record.employeeId._id,
      date: new Date(record.date).toISOString().split('T')[0],
      hours: record.hours,
      description: record.description || '',
      status: record.status
    });
    setFormErrors({});
    setEditDialogOpen(true);
  };

  // 開啟刪除加班記錄對話框
  const handleOpenDeleteDialog = (record) => {
    setSelectedRecord(record);
    setDeleteDialogOpen(true);
  };

  // 關閉所有對話框
  const handleCloseDialogs = () => {
    setCreateDialogOpen(false);
    setEditDialogOpen(false);
    setDeleteDialogOpen(false);
    setSelectedRecord(null);
  };

  // 創建加班記錄
  const handleCreateRecord = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await overtimeRecordService.createOvertimeRecord({
        employeeId: formData.employeeId,
        date: formData.date,
        hours: parseFloat(formData.hours),
        description: formData.description,
        status: formData.status
      });

      setSuccessMessage('加班記錄創建成功');
      handleCloseDialogs();
      fetchOvertimeRecords();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 更新加班記錄
  const handleUpdateRecord = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await overtimeRecordService.updateOvertimeRecord(selectedRecord._id, {
        employeeId: formData.employeeId,
        date: formData.date,
        hours: parseFloat(formData.hours),
        description: formData.description,
        status: formData.status
      });

      setSuccessMessage('加班記錄更新成功');
      handleCloseDialogs();
      fetchOvertimeRecords();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 刪除加班記錄
  const handleDeleteRecord = async () => {
    setSubmitting(true);
    try {
      await overtimeRecordService.deleteOvertimeRecord(selectedRecord._id);

      setSuccessMessage('加班記錄已刪除');
      handleCloseDialogs();
      fetchOvertimeRecords();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 清除成功訊息
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // 清除錯誤訊息
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // 獲取狀態顯示文字
  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return '待審核';
      case 'approved':
        return '已核准';
      case 'rejected':
        return '已拒絕';
      default:
        return status;
    }
  };

  // 獲取狀態顏色
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  // 格式化日期
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW');
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2">
            加班時數管理
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

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {/* 月份篩選器 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
          <Typography variant="subtitle2">月份篩選：</Typography>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="month-select-label">月份</InputLabel>
            <Select
              labelId="month-select-label"
              value={selectedMonth}
              label="月份"
              onChange={(e) => setSelectedMonth(e.target.value)}
              size="small"
            >
              <MenuItem value={0}>一月</MenuItem>
              <MenuItem value={1}>二月</MenuItem>
              <MenuItem value={2}>三月</MenuItem>
              <MenuItem value={3}>四月</MenuItem>
              <MenuItem value={4}>五月</MenuItem>
              <MenuItem value={5}>六月</MenuItem>
              <MenuItem value={6}>七月</MenuItem>
              <MenuItem value={7}>八月</MenuItem>
              <MenuItem value={8}>九月</MenuItem>
              <MenuItem value={9}>十月</MenuItem>
              <MenuItem value={10}>十一月</MenuItem>
              <MenuItem value={11}>十二月</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="year-select-label">年份</InputLabel>
            <Select
              labelId="year-select-label"
              value={selectedYear}
              label="年份"
              onChange={(e) => setSelectedYear(e.target.value)}
              size="small"
            >
              <MenuItem value={2024}>2024</MenuItem>
              <MenuItem value={2025}>2025</MenuItem>
              <MenuItem value={2026}>2026</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          sx={{ mb: 2 }}
        >
          <Tab label="獨立加班記錄" />
          <Tab label="排班系統加班記錄" />
        </Tabs>

        {currentTab === 0 && (
          <>
            
            {/* 加班時數統計 */}
            <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                {`${selectedYear}年${selectedMonth + 1}月 加班時數統計`}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>員工姓名</TableCell>
                      <TableCell>加班時數</TableCell>
                      <TableCell>加班次數</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summaryData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          <Typography color="textSecondary">
                            沒有找到加班記錄
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      summaryData.map((item) => (
                        <TableRow key={item.employeeId}>
                          <TableCell>{item.employeeName}</TableCell>
                          <TableCell>{item.totalHours} 小時</TableCell>
                          <TableCell>{item.recordCount} 次</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* 加班記錄列表 */}
            {loading ? (
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
                      <TableCell>日期</TableCell>
                      <TableCell>加班時數</TableCell>
                      <TableCell>加班原因</TableCell>
                      <TableCell>狀態</TableCell>
                      <TableCell>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {overtimeRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography color="textSecondary">
                            沒有找到加班記錄
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      overtimeRecords.map((record) => (
                        <TableRow key={record._id}>
                          <TableCell>{record.employeeId.name}</TableCell>
                          <TableCell>{formatDate(record.date)}</TableCell>
                          <TableCell>{record.hours} 小時</TableCell>
                          <TableCell>{record.description || '-'}</TableCell>
                          <TableCell>
                            <Chip
                              label={getStatusText(record.status)}
                              color={getStatusColor(record.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {isAdmin && (
                                <>
                                  <Tooltip title="編輯">
                                    <IconButton
                                      size="small"
                                      color="primary"
                                      onClick={() => handleOpenEditDialog(record)}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  {record.status === 'pending' && (
                                    <>
                                      <Tooltip title="核准">
                                        <IconButton
                                          size="small"
                                          color="success"
                                          onClick={() => {
                                            setSelectedRecord(record);
                                            overtimeRecordService.updateOvertimeRecord(record._id, {
                                              status: 'approved'
                                            }).then(() => {
                                              setSuccessMessage('加班記錄已核准');
                                              fetchOvertimeRecords();
                                            }).catch(err => {
                                              setError(err.message);
                                            });
                                          }}
                                        >
                                          <CheckCircleIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="拒絕">
                                        <IconButton
                                          size="small"
                                          color="error"
                                          onClick={() => {
                                            setSelectedRecord(record);
                                            overtimeRecordService.updateOvertimeRecord(record._id, {
                                              status: 'rejected'
                                            }).then(() => {
                                              setSuccessMessage('加班記錄已拒絕');
                                              fetchOvertimeRecords();
                                            }).catch(err => {
                                              setError(err.message);
                                            });
                                          }}
                                        >
                                          <CancelIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </>
                                  )}
                                  <Tooltip title="刪除">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => handleOpenDeleteDialog(record)}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}

        {currentTab === 1 && (
          <>
            <Typography variant="subtitle1" gutterBottom>
              排班系統中的加班記錄 ({selectedMonth + 1}月)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              以下顯示排班系統中標記為加班的記錄，這些記錄是在排班系統中設置的，不是通過加班管理系統創建的。
            </Typography>
            
            {scheduleOvertimeLoading ? (
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
                      <TableCell>日期</TableCell>
                      <TableCell>班次</TableCell>
                      <TableCell>預估時數</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scheduleOvertimeRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center">
                          <Typography color="textSecondary">
                            排班系統中沒有找到加班記錄
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      scheduleOvertimeRecords.map((record) => {
                        // 計算預估時數
                        let estimatedHours = 0;
                        switch(record.shift) {
                          case 'morning':
                            estimatedHours = 3.5; // 早班 8:30-12:00
                            break;
                          case 'afternoon':
                            estimatedHours = 3; // 中班 15:00-18:00
                            break;
                          case 'evening':
                            estimatedHours = 1.5; // 晚班 19:00-20:30
                            break;
                          default:
                            estimatedHours = 0;
                        }
                        
                        return (
                          <TableRow key={record._id}>
                            <TableCell>{record.employeeId.name}</TableCell>
                            <TableCell>{formatDate(record.date)}</TableCell>
                            <TableCell>
                              {record.shift === 'morning' ? '早班' :
                               record.shift === 'afternoon' ? '中班' :
                               record.shift === 'evening' ? '晚班' : record.shift}
                            </TableCell>
                            <TableCell>{estimatedHours} 小時</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
      </Paper>

      {/* 創建加班記錄對話框 */}
      <Dialog open={createDialogOpen} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
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
                  onChange={handleInputChange}
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
                onChange={handleInputChange}
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
                onChange={handleInputChange}
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
                onChange={handleInputChange}
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
                    onChange={handleInputChange}
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
          <Button onClick={handleCloseDialogs}>取消</Button>
          <Button
            onClick={handleCreateRecord}
            disabled={submitting}
            variant="contained"
            color="primary"
          >
            {submitting ? '處理中...' : '新增'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 編輯加班記錄對話框 */}
      <Dialog open={editDialogOpen} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
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
                  onChange={handleInputChange}
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
                onChange={handleInputChange}
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
                onChange={handleInputChange}
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
                onChange={handleInputChange}
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
                    onChange={handleInputChange}
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
          <Button onClick={handleCloseDialogs}>取消</Button>
          <Button
            onClick={handleUpdateRecord}
            disabled={submitting}
            variant="contained"
            color="primary"
          >
            {submitting ? '處理中...' : '更新'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 刪除加班記錄對話框 */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDialogs}>
        <DialogTitle>刪除加班記錄</DialogTitle>
        <DialogContent>
          <Typography>
            您確定要刪除這筆加班記錄嗎？此操作無法復原。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialogs}>取消</Button>
          <Button
            onClick={handleDeleteRecord}
            disabled={submitting}
            variant="contained"
            color="error"
          >
            {submitting ? '處理中...' : '刪除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

OvertimeManager.propTypes = {
  isAdmin: PropTypes.bool,
  employeeId: PropTypes.string
};

export default OvertimeManager;