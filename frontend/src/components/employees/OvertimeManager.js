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
  Tab,
  Collapse
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
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
  const [scheduleOvertimeRecords, setScheduleOvertimeRecords] = useState([]);
  const [scheduleOvertimeLoading, setScheduleOvertimeLoading] = useState(false);
  const [totalOvertimeData, setTotalOvertimeData] = useState([]);
  const [totalOvertimeLoading, setTotalOvertimeLoading] = useState(false);
  const [expandedEmployees, setExpandedEmployees] = useState(new Set());
  
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
      const response = await employeeService.getEmployees({ limit: 1000 });
      setEmployees(response.employees);
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
  
  // 計算總加班時數
  const calculateTotalOvertimeData = async () => {
    setTotalOvertimeLoading(true);
    try {
      // 創建一個映射來存儲每個員工的加班時數
      const employeeOvertimeMap = new Map();
      
      // 處理獨立加班記錄
      overtimeRecords.forEach(record => {
        // 只計算已核准的獨立加班記錄
        if (record.status === 'approved') {
          const employeeId = record.employeeId._id;
          const employeeName = record.employeeId.name;
          
          if (!employeeOvertimeMap.has(employeeId)) {
            employeeOvertimeMap.set(employeeId, {
              employeeId,
              employeeName,
              independentHours: 0,
              scheduleHours: 0,
              totalHours: 0
            });
          }
          
          const employeeData = employeeOvertimeMap.get(employeeId);
          employeeData.independentHours += record.hours;
          employeeData.totalHours += record.hours;
        }
      });
      
      // 處理排班系統加班記錄
      scheduleOvertimeRecords.forEach(record => {
        const employeeId = record.employeeId._id;
        const employeeName = record.employeeId.name;
        
        if (!employeeOvertimeMap.has(employeeId)) {
          employeeOvertimeMap.set(employeeId, {
            employeeId,
            employeeName,
            independentHours: 0,
            scheduleHours: 0,
            totalHours: 0
          });
        }
        
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
        
        const employeeData = employeeOvertimeMap.get(employeeId);
        employeeData.scheduleHours += estimatedHours;
        employeeData.totalHours += estimatedHours;
      });
      
      // 確保所有員工都在映射中
      employees.forEach(employee => {
        if (!employeeOvertimeMap.has(employee._id)) {
          employeeOvertimeMap.set(employee._id, {
            employeeId: employee._id,
            employeeName: employee.name,
            independentHours: 0,
            scheduleHours: 0,
            totalHours: 0
          });
        }
      });
      
      // 將映射轉換為數組
      const result = Array.from(employeeOvertimeMap.values());
      
      // 過濾掉總加班時數為 0 的員工
      const filteredResult = result.filter(employee => employee.totalHours > 0);
      
      // 按總時數降序排序
      filteredResult.sort((a, b) => b.totalHours - a.totalHours);
      
      setTotalOvertimeData(filteredResult);
    } catch (err) {
      setError(err.message);
    } finally {
      setTotalOvertimeLoading(false);
    }
  };

  // 初始化和月份變更時加載所有數據
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        await fetchEmployees();
        await fetchOvertimeRecords();
        await fetchScheduleOvertimeRecords();
        await calculateTotalOvertimeData();
      } finally {
        setLoading(false);
      }
    };
    
    loadAllData();
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
  
  // 獲取班次顯示文字
  const getShiftText = (shift) => {
    switch(shift) {
      case 'morning':
        return '早班';
      case 'afternoon':
        return '中班';
      case 'evening':
        return '晚班';
      default:
        return shift;
    }
  };
  
  // 處理員工記錄的展開和收起
  const handleEmployeeExpand = (employeeId) => {
    setExpandedEmployees(prev => {
      const newSet = new Set(prev);
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId);
      } else {
        newSet.add(employeeId);
      }
      return newSet;
    });
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

        {/* 移除標籤頁，改為統一視圖 */}

        {/* 統一的加班記錄視圖 */}
        <Typography variant="subtitle1" gutterBottom>
          {`${selectedYear}年${selectedMonth + 1}月 加班時數統計`}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          點擊員工姓名可展開/收起詳細記錄，包含獨立加班和排班系統加班記錄
        </Typography>
        
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
                  <TableCell>獨立加班時數</TableCell>
                  <TableCell>排班加班時數</TableCell>
                  <TableCell>總加班時數</TableCell>
                  <TableCell>詳細資訊</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {totalOvertimeData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="textSecondary">
                        沒有找到加班記錄
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  totalOvertimeData.map((employee) => {
                    // 獲取該員工的獨立加班記錄
                    const independentRecords = overtimeRecords.filter(
                      record => record.employeeId._id === employee.employeeId
                    );
                    
                    // 獲取該員工的排班系統加班記錄
                    const scheduleRecords = scheduleOvertimeRecords.filter(
                      record => record.employeeId._id === employee.employeeId
                    ).map(record => {
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
                      return { ...record, estimatedHours };
                    });
                    
                    return (
                      <React.Fragment key={employee.employeeId}>
                        {/* 員工摺疊標題行 */}
                        <TableRow
                          sx={{
                            '& > *': { borderBottom: 'unset' },
                            cursor: 'pointer',
                            bgcolor: expandedEmployees.has(employee.employeeId) ? 'rgba(0, 0, 0, 0.04)' : 'inherit',
                            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.08)' }
                          }}
                          onClick={() => handleEmployeeExpand(employee.employeeId)}
                        >
                          <TableCell component="th" scope="row">
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {expandedEmployees.has(employee.employeeId) ?
                                <ExpandLessIcon fontSize="small" sx={{ mr: 1 }} /> :
                                <ExpandMoreIcon fontSize="small" sx={{ mr: 1 }} />
                              }
                              <Typography fontWeight="medium">{employee.employeeName}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{employee.independentHours.toFixed(1)} 小時</TableCell>
                          <TableCell>{employee.scheduleHours.toFixed(1)} 小時</TableCell>
                          <TableCell>
                            <Typography fontWeight="bold">
                              {employee.totalHours.toFixed(1)} 小時
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEmployeeExpand(employee.employeeId);
                              }}
                            >
                              {expandedEmployees.has(employee.employeeId) ? '收起' : '展開'}
                            </Button>
                          </TableCell>
                        </TableRow>
                        
                        {/* 展開的詳細記錄 */}
                        <TableRow>
                          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                            <Collapse in={expandedEmployees.has(employee.employeeId)} timeout="auto" unmountOnExit>
                              <Box sx={{ margin: 1, mb: 3 }}>
                                {/* 獨立加班記錄 */}
                                {independentRecords.length > 0 && (
                                  <>
                                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
                                      獨立加班記錄
                                    </Typography>
                                    <Table size="small" aria-label="獨立加班記錄">
                                      <TableHead>
                                        <TableRow>
                                          <TableCell>日期</TableCell>
                                          <TableCell>加班時數</TableCell>
                                          <TableCell>加班原因</TableCell>
                                          <TableCell>狀態</TableCell>
                                          {isAdmin && <TableCell>操作</TableCell>}
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {independentRecords.map((record) => (
                                          <TableRow key={record._id}>
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
                                            {isAdmin && (
                                              <TableCell>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
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
                                                </Box>
                                              </TableCell>
                                            )}
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </>
                                )}
                                
                                {/* 排班系統加班記錄 */}
                                {scheduleRecords.length > 0 && (
                                  <>
                                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold', color: 'secondary.main' }}>
                                      排班系統加班記錄
                                    </Typography>
                                    <Table size="small" aria-label="排班系統加班記錄">
                                      <TableHead>
                                        <TableRow>
                                          <TableCell>日期</TableCell>
                                          <TableCell>班次</TableCell>
                                          <TableCell>預估時數</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {scheduleRecords.map((record) => (
                                          <TableRow key={record._id}>
                                            <TableCell>{formatDate(record.date)}</TableCell>
                                            <TableCell>{getShiftText(record.shift)}</TableCell>
                                            <TableCell>{record.estimatedHours} 小時</TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </>
                                )}
                                
                                {independentRecords.length === 0 && scheduleRecords.length === 0 && (
                                  <Typography color="textSecondary" sx={{ my: 2 }}>
                                    沒有找到詳細加班記錄
                                  </Typography>
                                )}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
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