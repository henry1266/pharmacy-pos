import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
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
  // 預設選擇所有月份
  const [selectedMonth, setSelectedMonth] = useState(-1); // 所有月份
  const [selectedYear, setSelectedYear] = useState(2025); // 2025年
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
      
      // 添加月份篩選 - 使用更可靠的日期格式化方法
      let startDate, endDate;
      
      if (selectedMonth === -1) {
        // 如果選擇全部月份，查詢整年的數據
        startDate = new Date(selectedYear, 0, 1); // 1月1日
        endDate = new Date(selectedYear, 11, 31, 23, 59, 59); // 12月31日
      } else {
        // 如果選擇特定月份，只查詢該月的數據
        startDate = new Date(selectedYear, selectedMonth, 1); // 該月1日
        // 計算下個月的第0天，即當月的最後一天
        endDate = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59);
      }
      
      // 使用本地時區格式化日期，避免時區問題
      params.startDate = formatDateToYYYYMMDD(startDate);
      params.endDate = formatDateToYYYYMMDD(endDate);
      
      console.log(`[診斷] 查詢整年數據: startDate=${params.startDate}, endDate=${params.endDate}, 年份=${selectedYear}`);
      
      const records = await overtimeRecordService.getOvertimeRecords(params);
      setOvertimeRecords(records);
      
      // 初始化展開狀態
      const expandedState = {};
      records.forEach(record => {
        expandedState[record.employeeId._id] = false;
      });
      setExpandedEmployees(expandedState);
      
      // 獲取加班時數統計（包含排班系統加班記錄）- 添加更詳細的錯誤處理
      // 使用現有的 API 路徑
      const statsUrl = '/api/overtime-records/monthly-stats';
      let statsParams = {
        year: selectedYear
      };
      
      // 處理月份篩選
      if (selectedMonth !== -1) {
        statsParams.month = selectedMonth + 1;
        console.log(`嘗試獲取月度加班統計: 年份=${selectedYear}, 月份=${selectedMonth + 1}`);
      } else {
        console.log(`嘗試獲取年度加班統計: 年份=${selectedYear}, 所有月份`);
      }
      
      let stats = [];
      try {
        // 直接使用axios進行請求，以便獲取完整的響應
        const token = localStorage.getItem('token');
        const config = {
          headers: {
            'x-auth-token': token
          },
          params: statsParams
        };
        
        console.log(`直接發送請求: ${statsUrl}`, config.params);
        
        const response = await axios.get(statsUrl, config);
        console.log(`API響應狀態: ${response.status}`);
        console.log(`API響應數據:`, response.data);
        
        stats = response.data;
        console.log(`獲取到月度加班統計:`, stats);
      } catch (statsError) {
        console.error('獲取月度加班統計失敗:', statsError);
        console.error('錯誤詳情:', statsError.response?.data || statsError.message);
        setError(`獲取月度加班統計失敗: ${statsError.response?.data?.message || statsError.message}`);
        stats = []; // 設置為空數組，避免後續處理出錯
      }
      
      // 如果是特定員工視圖，則過濾出該員工的統計數據
      if (employeeId) {
        const employeeStats = stats.filter(stat => stat.employeeId === employeeId);
        setSummaryData(employeeStats);
      } else {
        setSummaryData(stats);
      }
      
      // 獲取排班系統加班記錄
      try {
        // 構建查詢參數 - 使用更可靠的日期格式化方法
        let startDate, endDate;
        
        // 使用與上面相同的月份篩選邏輯
        if (selectedMonth === -1) {
          // 如果選擇全部月份，查詢整年的數據
          startDate = formatDateToYYYYMMDD(new Date(selectedYear, 0, 1)); // 1月1日
          endDate = formatDateToYYYYMMDD(new Date(selectedYear, 11, 31)); // 12月31日
        } else {
          // 如果選擇特定月份，只查詢該月的數據
          startDate = formatDateToYYYYMMDD(new Date(selectedYear, selectedMonth, 1)); // 該月1日
          // 計算下個月的第0天，即當月的最後一天
          endDate = formatDateToYYYYMMDD(new Date(selectedYear, selectedMonth + 1, 0));
        }
        
        console.log(`嘗試獲取排班系統加班記錄: ${startDate} 至 ${endDate}, 年份: ${selectedYear}`);
        
        // 獲取排班系統加班記錄 - 添加更詳細的錯誤處理
        let scheduleRecords = [];
        try {
          // 直接使用axios進行請求，以便獲取完整的響應
          const token = localStorage.getItem('token');
          const config = {
            headers: {
              'x-auth-token': token
            }
          };
          const url = `/api/employee-schedules?startDate=${startDate}&endDate=${endDate}`;
          console.log(`直接發送請求: ${url}`);
          
          const response = await axios.get(url, config);
          console.log(`API響應狀態: ${response.status}`);
          console.log(`API響應數據:`, response.data);
          
          scheduleRecords = response.data;
          console.log(`獲取到排班記錄數量: ${scheduleRecords.length}`, scheduleRecords);
        } catch (scheduleError) {
          console.error('獲取排班記錄失敗:', scheduleError);
          console.error('錯誤詳情:', scheduleError.response?.data || scheduleError.message);
          setError(`獲取排班記錄失敗: ${scheduleError.response?.data?.message || scheduleError.message}`);
          // 不提前返回，繼續處理其他邏輯
          scheduleRecords = []; // 設置為空數組，繼續處理
        }
        
        // 檢查是否有排班記錄
        if (scheduleRecords.length === 0) {
          console.log(`${startDate} 至 ${endDate} 期間沒有排班記錄`);
          // 設置空的分組記錄
          setScheduleOvertimeRecords({});
          // 不提前返回，繼續處理其他邏輯
        }
        
        // 詳細檢查每條記錄的格式和內容
        console.log("詳細檢查排班記錄:");
        scheduleRecords.forEach((record, index) => {
          console.log(`記錄 ${index + 1}:`, record);
          console.log(`  - ID: ${record._id}`);
          console.log(`  - 日期: ${record.date}`);
          console.log(`  - 班次: ${record.shift}`);
          console.log(`  - 員工ID: `, record.employeeId);
          console.log(`  - 請假類型: ${record.leaveType}`);
        });
        
        // 過濾出加班記錄 (leaveType === 'overtime')
        const overtimeSchedules = scheduleRecords.filter(record => {
          // 檢查記錄是否有效
          if (!record || typeof record !== 'object') {
            console.error(`[診斷] 排班記錄格式不正確:`, record);
            return false;
          }
          
          // 檢查記錄ID
          if (!record._id) {
            console.error(`[診斷] 排班記錄缺少_id字段:`, record);
            return false;
          }
          
          // 檢查 leaveType 字段
          const isOvertime = record.leaveType === 'overtime';
          console.log(`[診斷] 記錄 ${record._id} 是否為加班: ${isOvertime}, leaveType: ${record.leaveType || '未設置'}`);
          
          return isOvertime;
        });
        console.log(`[診斷] 過濾後加班記錄數量: ${overtimeSchedules.length}`, overtimeSchedules);
        
        // 檢查是否有加班記錄
        if (overtimeSchedules.length === 0) {
          console.log(`${startDate} 至 ${endDate} 期間沒有加班記錄`);
          // 設置空的分組記錄
          setScheduleOvertimeRecords({});
          // 不提前返回，繼續處理其他邏輯
        }
        
        // 按員工ID分組 - 處理不同的employeeId格式
        const groupedSchedules = overtimeSchedules.reduce((groups, record) => {
          console.log(`處理加班記錄:`, record);
          
          // 獲取員工ID，處理不同的格式
          let employeeIdValue;
          
          if (!record.employeeId) {
            console.error(`記錄 ${record._id} 沒有employeeId字段`);
            return groups;
          }
          
          if (typeof record.employeeId === 'string') {
            // 如果employeeId是字符串，直接使用
            employeeIdValue = record.employeeId;
            console.log(`記錄 ${record._id} 的employeeId是字符串: ${employeeIdValue}`);
          } else if (typeof record.employeeId === 'object') {
            if (record.employeeId._id) {
              // 如果employeeId是對象且有_id字段，使用_id
              employeeIdValue = record.employeeId._id;
              console.log(`記錄 ${record._id} 的employeeId是對象，_id: ${employeeIdValue}`);
            } else if (record.employeeId.$oid) {
              // 如果employeeId是MongoDB格式的對象，使用$oid
              employeeIdValue = record.employeeId.$oid;
              console.log(`記錄 ${record._id} 的employeeId是MongoDB格式，$oid: ${employeeIdValue}`);
            } else {
              console.error(`記錄 ${record._id} 的employeeId是對象，但沒有_id或$oid字段:`, record.employeeId);
              return groups;
            }
          } else {
            console.error(`記錄 ${record._id} 的employeeId格式不正確: ${typeof record.employeeId}`);
            return groups;
          }
          
          // 使用獲取的employeeIdValue進行分組
          if (!groups[employeeIdValue]) {
            groups[employeeIdValue] = [];
          }
          groups[employeeIdValue].push(record);
          return groups;
        }, {});
        
        console.log("分組後的加班記錄:", groupedSchedules);
        
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
  }, [employeeId, selectedYear, selectedMonth]);

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

  // 格式化日期顯示
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW');
  };
  
  // 格式化日期為 YYYY-MM-DD 格式，避免時區問題
  const formatDateToYYYYMMDD = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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

        {/* 年份與月份篩選器 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
          <Typography variant="subtitle2">篩選：</Typography>
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
              <MenuItem value={2027}>2027</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel id="month-select-label">月份</InputLabel>
            <Select
              labelId="month-select-label"
              value={selectedMonth}
              label="月份"
              onChange={(e) => setSelectedMonth(e.target.value)}
              size="small"
            >
              <MenuItem value={-1}>全部月份</MenuItem>
              <MenuItem value={0}>1月</MenuItem>
              <MenuItem value={1}>2月</MenuItem>
              <MenuItem value={2}>3月</MenuItem>
              <MenuItem value={3}>4月</MenuItem>
              <MenuItem value={4}>5月</MenuItem>
              <MenuItem value={5}>6月</MenuItem>
              <MenuItem value={6}>7月</MenuItem>
              <MenuItem value={7}>8月</MenuItem>
              <MenuItem value={8}>9月</MenuItem>
              <MenuItem value={9}>10月</MenuItem>
              <MenuItem value={10}>11月</MenuItem>
              <MenuItem value={11}>12月</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* 加班記錄列表 */}
        <Typography variant="subtitle1" gutterBottom>
          {selectedMonth === -1
            ? `${selectedYear}年 全年加班記錄`
            : `${selectedYear}年 ${selectedMonth + 1}月 加班記錄`}
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
                </TableRow>
              </TableHead>
              <TableBody>
                {overtimeRecords.length === 0 && summaryData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="textSecondary">
                        {error ? (
                          // 如果有錯誤，顯示錯誤信息
                          `查詢出錯: ${error}`
                        ) : (
                          // 提供更明確的指引
                          <>
                            沒有找到加班記錄。請嘗試選擇其他月份（如 1-8 月）查看加班記錄。
                            <br />
                            <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
                              根據系統記錄，2025年1月至8月有加班數據。
                            </Typography>
                          </>
                        )}
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
                        </TableRow>
                        
                        {/* 詳細記錄 (可收折) */}
                        <TableRow>
                          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                            <Collapse in={expandedEmployees[employeeId]} timeout="auto" unmountOnExit>
                              <Box sx={{ margin: 1, mb: 3 }}>
                                {/* 合併的加班記錄詳細列表 */}
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
                                            .sort((a, b) => new Date(a.date) - new Date(b.date));
                                          
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