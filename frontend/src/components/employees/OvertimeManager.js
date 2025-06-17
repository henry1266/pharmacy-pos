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
  Collapse
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import WorkIcon from '@mui/icons-material/Work';
import EventNoteIcon from '@mui/icons-material/EventNote';
import overtimeRecordService from '../../services/overtimeRecordService';
import employeeService from '../../services/employeeService';
import { getSchedules } from '../../services/employeeScheduleService';

/**
 * 加班管理組件
 * 用於管理員工的加班記錄
 * 重新設計，移除複雜的加班統計計算邏輯
 */
const OvertimeManager = ({ isAdmin = false, employeeId = null }) => {
  // 狀態
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [overtimeRecords, setOvertimeRecords] = useState([]);
  const [expandedEmployees, setExpandedEmployees] = useState({});
  const [scheduleOvertimeRecords, setScheduleOvertimeRecords] = useState({});
  const [employees, setEmployees] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
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
      // 確保包含月底最後一天，將時間設為 23:59:59
      const endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
      
      params.startDate = startDate.toISOString().split('T')[0];
      params.endDate = endDate.toISOString().split('T')[0];
      
      const records = await overtimeRecordService.getOvertimeRecords(params);
      setOvertimeRecords(records);
      
      // 初始化展開狀態
      const expandedState = {};
      records.forEach(record => {
        expandedState[record.employeeId._id] = false;
      });
      setExpandedEmployees(expandedState);
      
      // 獲取加班時數統計（包含排班系統加班記錄）
      const stats = await overtimeRecordService.getMonthlyOvertimeStats(selectedYear, selectedMonth + 1);
      
      // 如果是特定員工視圖，則過濾出該員工的統計數據
      if (employeeId) {
        const employeeStats = stats.filter(stat => stat.employeeId === employeeId);
        setSummaryData(employeeStats);
      } else {
        setSummaryData(stats);
      }
      
      // 獲取排班系統加班記錄
      try {
        // 構建查詢參數
        const startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
        const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];
        
        // 獲取排班系統加班記錄
        const scheduleRecords = await getSchedules(startDate, endDate);
        
        // 過濾出加班記錄 (leaveType === 'overtime')
        const overtimeSchedules = scheduleRecords.filter(record => record.leaveType === 'overtime');
        
        // 按員工ID分組
        const groupedSchedules = overtimeSchedules.reduce((groups, record) => {
          const employeeId = record.employeeId._id;
          if (!groups[employeeId]) {
            groups[employeeId] = [];
          }
          groups[employeeId].push(record);
          return groups;
        }, {});
        
        setScheduleOvertimeRecords(groupedSchedules);
      } catch (err) {
        console.error('獲取排班系統加班記錄失敗:', err);
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

  // 初始化和月份變更時加載數據
  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        await fetchEmployees();
        await fetchOvertimeRecords();
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

  return (
    <Box sx={{ width: '100%' }}>
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
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

        {/* 加班記錄列表 */}
        <Typography variant="subtitle1" gutterBottom>
          {`${selectedYear}年${selectedMonth + 1}月 加班記錄`}
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
                  <TableCell width="5%"></TableCell>
                  <TableCell>員工姓名</TableCell>
                  <TableCell>獨立加班時數</TableCell>
                  <TableCell>排班加班時數</TableCell>
                  <TableCell>加班總時數</TableCell>
                  <TableCell>記錄數量</TableCell>
                  <TableCell>最近加班日期</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {overtimeRecords.length === 0 && summaryData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="textSecondary">
                        沒有找到加班記錄
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  // 合併獨立加班記錄和排班系統加班統計
                  Object.entries(
                    // 先處理獨立加班記錄
                    overtimeRecords.reduce((groups, record) => {
                      const employeeId = record.employeeId._id;
                      if (!groups[employeeId]) {
                        groups[employeeId] = {
                          employee: record.employeeId,
                          records: [],
                          independentHours: 0,
                          scheduleHours: 0,
                          totalHours: 0,
                          scheduleRecords: [],
                          latestDate: new Date(0)
                        };
                      }
                      groups[employeeId].records.push(record);
                      groups[employeeId].independentHours += record.hours;
                      groups[employeeId].totalHours += record.hours;
                      
                      const recordDate = new Date(record.date);
                      if (recordDate > groups[employeeId].latestDate) {
                        groups[employeeId].latestDate = recordDate;
                      }
                      
                      return groups;
                    }, {})
                  ).map(([employeeId, group]) => {
                    // 查找對應的排班系統加班統計
                    const scheduleStats = summaryData.find(stat => stat.employeeId === employeeId);
                    
                    if (scheduleStats) {
                      // 計算排班系統加班時數 (總時數 - 獨立加班時數)
                      const scheduleHours = scheduleStats.overtimeHours - group.independentHours;
                      group.scheduleHours = scheduleHours > 0 ? scheduleHours : 0;
                      group.totalHours = scheduleStats.overtimeHours;
                      group.scheduleRecordCount = scheduleStats.scheduleRecordCount || 0;
                    }
                    
                    return (
                      <React.Fragment key={employeeId}>
                        {/* 員工主行 */}
                        <TableRow
                          sx={{
                            '& > *': { borderBottom: 'unset' },
                            bgcolor: 'rgba(0, 0, 0, 0.04)',
                            cursor: 'pointer'
                          }}
                          onClick={() => setExpandedEmployees({
                            ...expandedEmployees,
                            [employeeId]: !expandedEmployees[employeeId]
                          })}
                        >
                          <TableCell>
                            <IconButton
                              size="small"
                              aria-label={expandedEmployees[employeeId] ? "收起" : "展開"}
                            >
                              {expandedEmployees[employeeId] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                            </IconButton>
                          </TableCell>
                          <TableCell component="th" scope="row">
                            <Typography variant="subtitle1" fontWeight="bold">
                              {group.employee.name}
                            </Typography>
                          </TableCell>
                          <TableCell>{group.independentHours.toFixed(1)} 小時</TableCell>
                          <TableCell>{group.scheduleHours.toFixed(1)} 小時</TableCell>
                          <TableCell>{group.totalHours.toFixed(1)} 小時</TableCell>
                          <TableCell>
                            {group.records.length} 筆獨立 + {group.scheduleRecordCount} 筆排班
                          </TableCell>
                          <TableCell>{formatDate(group.latestDate)}</TableCell>
                        </TableRow>
                        
                        {/* 詳細記錄 (可收折) */}
                        <TableRow>
                          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                            <Collapse in={expandedEmployees[employeeId]} timeout="auto" unmountOnExit>
                              <Box sx={{ margin: 1, mb: 3 }}>
                                {/* 加班記錄摘要 */}
                                <Paper elevation={1} sx={{ p: 2, mb: 2, bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="body2" gutterBottom>
                                        獨立加班總時數: <strong>{group.independentHours.toFixed(1)} 小時</strong>
                                      </Typography>
                                      <Typography variant="body2" gutterBottom>
                                        排班系統加班總時數: <strong>{group.scheduleHours.toFixed(1)} 小時</strong>
                                      </Typography>
                                      <Typography variant="body2" gutterBottom>
                                        加班總時數: <strong>{group.totalHours.toFixed(1)} 小時</strong>
                                      </Typography>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                          <WorkIcon fontSize="small" sx={{ mr: 1, color: 'secondary.main' }} />
                                          獨立加班記錄 ({group.records.length} 筆)
                                        </Box>
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                          <CalendarMonthIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                                          排班系統加班記錄 ({group.scheduleRecordCount} 筆)
                                        </Box>
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                                        * 排班系統加班時數: 早班3.5h, 中班3h, 晚班1.5h
                                      </Typography>
                                    </Grid>
                                  </Grid>
                                </Paper>
                                
                                {/* 合併的加班記錄詳細列表 */}
                                <Typography variant="subtitle2" gutterBottom component="div" sx={{ fontWeight: 'bold', mt: 2 }}>
                                  加班記錄明細
                                </Typography>
                                <Table size="small" aria-label="加班記錄明細">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>類型</TableCell>
                                      <TableCell>日期</TableCell>
                                      <TableCell>時段/原因</TableCell>
                                      <TableCell>加班時數</TableCell>
                                      <TableCell>狀態</TableCell>
                                      {isAdmin && <TableCell>操作</TableCell>}
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                        {/* 合併並按日期排序所有加班記錄 */}
                                        {(() => {
                                          // 準備獨立加班記錄
                                          const independentRecords = group.records.map(record => ({
                                            id: `independent-${record._id}`,
                                            type: 'independent',
                                            date: new Date(record.date),
                                            originalRecord: record,
                                            hours: record.hours,
                                            description: record.description || '-',
                                            status: record.status
                                          }));
                                          
                                          // 準備排班系統加班記錄
                                          const scheduleRecords = scheduleOvertimeRecords[employeeId]
                                            ? scheduleOvertimeRecords[employeeId].map(record => {
                                                // 計算加班時數
                                                let hours = 0;
                                                switch(record.shift) {
                                                  case 'morning': hours = 3.5; break;
                                                  case 'afternoon': hours = 3; break;
                                                  case 'evening': hours = 1.5; break;
                                                  default: hours = 0;
                                                }
                                                
                                                // 班次中文名稱
                                                const shiftName = {
                                                  'morning': '早班 (08:30-12:00)',
                                                  'afternoon': '中班 (15:00-18:00)',
                                                  'evening': '晚班 (19:00-20:30)'
                                                }[record.shift];
                                                
                                                return {
                                                  id: `schedule-${record._id}`,
                                                  type: 'schedule',
                                                  date: new Date(record.date),
                                                  originalRecord: record,
                                                  hours: hours,
                                                  description: shiftName,
                                                  status: 'approved',
                                                  shift: record.shift
                                                };
                                              })
                                            : [];
                                          
                                          // 合併並按日期排序 (最早的日期在前)
                                          const allRecords = [...independentRecords, ...scheduleRecords]
                                            .sort((a, b) => a.date - b.date);
                                          
                                          // 如果沒有記錄，顯示提示訊息
                                          if (allRecords.length === 0) {
                                            return (
                                              <TableRow>
                                                <TableCell colSpan={isAdmin ? 6 : 5} align="center">
                                                  <Typography color="textSecondary">
                                                    沒有找到加班記錄
                                                  </Typography>
                                                </TableCell>
                                              </TableRow>
                                            );
                                          }
                                          
                                          // 渲染所有記錄
                                          return allRecords.map(record => {
                                            if (record.type === 'independent') {
                                              // 獨立加班記錄
                                              return (
                                                <TableRow
                                                  key={record.id}
                                                  sx={{
                                                    bgcolor: record.status === 'approved' ? 'rgba(76, 175, 80, 0.08)' : 'inherit',
                                                    '& td': {
                                                      color: record.status === 'approved' ? 'text.primary' : 'text.secondary'
                                                    }
                                                  }}
                                                >
                                                  <TableCell>
                                                    <Tooltip title="獨立加班記錄">
                                                      <WorkIcon fontSize="small" sx={{ color: 'secondary.main' }} />
                                                    </Tooltip>
                                                  </TableCell>
                                                  <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                      <EventNoteIcon fontSize="small" sx={{ mr: 1, color: 'secondary.main' }} />
                                                      {formatDate(record.date)}
                                                    </Box>
                                                  </TableCell>
                                                  <TableCell>{record.description}</TableCell>
                                                  <TableCell>{record.hours} 小時</TableCell>
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
                                                            onClick={() => handleOpenEditDialog(record.originalRecord)}
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
                                                                  setSelectedRecord(record.originalRecord);
                                                                  overtimeRecordService.updateOvertimeRecord(record.originalRecord._id, {
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
                                                                  setSelectedRecord(record.originalRecord);
                                                                  overtimeRecordService.updateOvertimeRecord(record.originalRecord._id, {
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
                                                            onClick={() => handleOpenDeleteDialog(record.originalRecord)}
                                                          >
                                                            <DeleteIcon fontSize="small" />
                                                          </IconButton>
                                                        </Tooltip>
                                                      </Box>
                                                    </TableCell>
                                                  )}
                                                </TableRow>
                                              );
                                            } else {
                                              // 排班系統加班記錄
                                              return (
                                                <TableRow
                                                  key={record.id}
                                                  sx={{ bgcolor: 'rgba(25, 118, 210, 0.05)' }}
                                                >
                                                  <TableCell>
                                                    <Tooltip title="排班系統加班記錄">
                                                      <CalendarMonthIcon fontSize="small" sx={{ color: 'primary.main' }} />
                                                    </Tooltip>
                                                  </TableCell>
                                                  <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                      <EventNoteIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                                                      {formatDate(record.date)}
                                                    </Box>
                                                  </TableCell>
                                                  <TableCell>{record.description}</TableCell>
                                                  <TableCell>{record.hours.toFixed(1)} 小時</TableCell>
                                                  <TableCell>
                                                    <Chip
                                                      label="已核准"
                                                      color="success"
                                                      size="small"
                                                    />
                                                  </TableCell>
                                                  {isAdmin && (
                                                    <TableCell>
                                                      <Typography variant="caption" color="text.secondary">
                                                        (請在排班系統中管理)
                                                      </Typography>
                                                    </TableCell>
                                                  )}
                                                </TableRow>
                                              );
                                            }
                                          });
                                        })()}
                                    
                                    {/* 如果沒有記錄 */}
                                    {group.records.length === 0 && (!scheduleOvertimeRecords[employeeId] || scheduleOvertimeRecords[employeeId].length === 0) && (
                                      <TableRow>
                                        <TableCell colSpan={isAdmin ? 6 : 5} align="center">
                                          <Typography color="textSecondary">
                                            沒有找到加班記錄
                                          </Typography>
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </TableBody>
                                </Table>
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

        {/* 加班時數統計摘要 */}
        {summaryData.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="subtitle1" gutterBottom>
              {`${selectedYear}年${selectedMonth + 1}月 加班時數統計摘要`}
            </Typography>
            <Paper elevation={2} sx={{ p: 2, bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body1" gutterBottom>
                    總計加班時數: <strong>
                      {summaryData.reduce((total, item) => total + item.overtimeHours, 0).toFixed(1)} 小時
                    </strong>
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    獨立加班記錄: <strong>
                      {summaryData.reduce((total, item) => total + (item.independentRecordCount || 0), 0)} 筆
                    </strong>
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    排班系統加班記錄: <strong>
                      {summaryData.reduce((total, item) => total + (item.scheduleRecordCount || 0), 0)} 筆
                    </strong>
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    * 點擊員工行可展開查看詳細加班記錄
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    * 獨立加班記錄可在此頁面管理
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    * 排班系統加班記錄請在排班系統中管理
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>
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