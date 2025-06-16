import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Typography,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  FormControl,
  Select,
  MenuItem
} from '@mui/material';

/**
 * 班次區塊元件
 * 用於顯示特定班次的員工列表和排班操作
 */
const ShiftSection = ({ shift, shiftLabel, employees, schedules, date, onAddSchedule, onRemoveSchedule }) => {
  const [selectedLeaveType, setSelectedLeaveType] = useState(null);
  
  // 處理請假類型變更
  const handleLeaveTypeChange = (event) => {
    setSelectedLeaveType(event.target.value || null);
  };

  // 獲取班次顏色
  const getShiftColor = (shift) => {
    if (shift === 'morning') {
      return 'success.dark';
    } else if (shift === 'afternoon') {
      return 'info.dark';
    } else {
      return 'warning.dark';
    }
  };

  // 獲取班次背景顏色
  const getShiftBgColor = (shift) => {
    if (shift === 'morning') {
      return '#e7f5e7';
    } else if (shift === 'afternoon') {
      return '#e3f2fd';
    } else {
      return '#fff8e1';
    }
  };

  // 檢查員工是否已被排班在指定班次
  const isEmployeeScheduled = (employeeId) => {
    return (schedules[shift] || []).some(
      schedule => schedule.employee._id === employeeId
    );
  };

  // 處理員工選擇
  const handleQuickPanelEmployeeToggle = async (employee) => {
    if (isEmployeeScheduled(employee._id)) {
      // 找到要刪除的排班記錄
      const scheduleToRemove = schedules[shift].find(
        schedule => schedule.employee._id === employee._id
      );
      
      if (scheduleToRemove) {
        await onRemoveSchedule(scheduleToRemove._id);
      }
    } else {
      // 新增排班
      const scheduleData = {
        date,
        shift: shift,
        employeeId: employee._id
      };
      
      // 只有在 selectedLeaveType 不為 null 時才添加 leaveType 屬性
      if (selectedLeaveType) {
        scheduleData.leaveType = selectedLeaveType;
      }
      
      await onAddSchedule(scheduleData);
    }
  };

  // 獲取主要文字樣式
  const getPrimaryTypographyProps = (isScheduled) => {
    return {
      fontWeight: isScheduled ? 'bold' : 'normal',
      color: 'text.primary',
      fontSize: '0.9rem'
    };
  };

  // 獲取次要文字樣式
  const getSecondaryTypographyProps = () => {
    return {
      fontSize: '0.75rem'
    };
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        mb: 1,
        bgcolor: getShiftBgColor(shift),
        borderRadius: 1,
        px: 1,
        py: 0.5
      }}>
        <Box sx={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          bgcolor: getShiftColor(shift),
          mr: 1
        }} />
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 'bold',
            color: getShiftColor(shift),
          }}
        >
          {shiftLabel}
        </Typography>
        
        <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={selectedLeaveType || ''}
              onChange={handleLeaveTypeChange}
              displayEmpty
              variant="outlined"
              size="small"
            >
              <MenuItem value="">
                <em>正常排班</em>
              </MenuItem>
              <MenuItem value="sick">病假 (獨立計算)</MenuItem>
              <MenuItem value="personal">特休 (獨立計算)</MenuItem>
              <MenuItem value="overtime">加班 (獨立計算)</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>
      
      <List dense disablePadding sx={{ maxHeight: '150px', overflow: 'auto' }}>
        {employees.length > 0 ? (
          employees.map((employee) => {
            const isScheduled = isEmployeeScheduled(employee._id);
            return (
              <ListItem
                key={`${shift}-${employee._id}`}
                disablePadding
                dense
                sx={{ py: 0 }}
              >
                <ListItemButton
                  onClick={() => handleQuickPanelEmployeeToggle(employee)}
                  dense
                  sx={{ py: 0.5 }}
                >
                  <Box
                    sx={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      bgcolor: isScheduled ? 'success.main' : 'transparent',
                      border: isScheduled ? 'none' : '1px solid #ccc',
                      mr: 1
                    }}
                  />
                  <ListItemText
                    primary={employee.name}
                    secondary={`${employee.department}`}
                    primaryTypographyProps={getPrimaryTypographyProps(isScheduled)}
                    secondaryTypographyProps={getSecondaryTypographyProps()}
                  />
                </ListItemButton>
              </ListItem>
            );
          })
        ) : (
          <Typography variant="body2" color="text.secondary" align="center">
            沒有可用的員工資料
          </Typography>
        )}
      </List>
    </Box>
  );
};

// PropTypes for ShiftSection
ShiftSection.propTypes = {
  shift: PropTypes.string.isRequired,
  shiftLabel: PropTypes.string.isRequired,
  employees: PropTypes.array.isRequired,
  schedules: PropTypes.object.isRequired,
  date: PropTypes.string.isRequired,
  onAddSchedule: PropTypes.func.isRequired,
  onRemoveSchedule: PropTypes.func.isRequired
};

export default ShiftSection;