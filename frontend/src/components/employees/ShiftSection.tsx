import React, { useState } from 'react';
import {
  Typography,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  FormControl,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';

// 定義與 QuickSelectPanel.tsx 兼容的類型
export interface Employee {
  _id: string;
  name: string;
  department?: string;
  position?: string;
  [key: string]: any;
}

export interface Schedule {
  _id: string;
  employee?: Employee;
  leaveType?: string | null;
  [key: string]: any;
}

export interface Schedules {
  [shift: string]: Schedule[];
}

export interface ScheduleData {
  date: string;
  shift: string;
  employeeId: string;
  leaveType?: string;
  [key: string]: any;
}

// 定義元件 Props 介面
export interface ShiftSectionProps {
  shift: string;
  shiftLabel: string;
  employees: Employee[];
  schedules: Schedules;
  date: string;
  onAddSchedule: (scheduleData: ScheduleData) => Promise<boolean>;
  onRemoveSchedule: (scheduleId: string) => Promise<boolean>;
}

/**
 * 班次區塊元件
 * 用於顯示特定班次的員工列表和排班操作
 */
const ShiftSection: React.FC<ShiftSectionProps> = ({ shift, shiftLabel, employees, schedules, date, onAddSchedule, onRemoveSchedule }) => {
  const [selectedLeaveType, setSelectedLeaveType] = useState<string | null>(null);
  
  // 處理請假類型變更
  const handleLeaveTypeChange = (event: SelectChangeEvent<string>) => {
    setSelectedLeaveType(event.target.value === '' ? null : event.target.value);
  };

  // 獲取班次顏色
  const getShiftColor = (shift: string): string => {
    if (shift === 'morning') {
      return 'success.dark';
    } else if (shift === 'afternoon') {
      return 'info.dark';
    } else {
      return 'warning.dark';
    }
  };

  // 獲取班次背景顏色
  const getShiftBgColor = (shift: string): string => {
    if (shift === 'morning') {
      return '#e7f5e7';
    } else if (shift === 'afternoon') {
      return '#e3f2fd';
    } else {
      return '#fff8e1';
    }
  };

  // 檢查員工是否已被排班在指定班次
  const isEmployeeScheduled = (employeeId: string): boolean => {
    return (schedules[shift] || []).some(
      schedule => schedule.employee._id === employeeId
    );
  };

  // 處理員工選擇
  const handleQuickPanelEmployeeToggle = async (employee: Employee) => {
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
      const scheduleData: ScheduleData = {
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
  const getPrimaryTypographyProps = (isScheduled: boolean) => {
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
              value={selectedLeaveType ?? ''}
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
                    secondary={`${employee.department ?? ''}`}
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

export default ShiftSection;