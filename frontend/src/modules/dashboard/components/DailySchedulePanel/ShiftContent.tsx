import React, { memo } from 'react';
import { Box } from '@mui/material';
import EmployeeAvatar from './EmployeeAvatar';
import OvertimeRecord from './OvertimeRecord';
import EmptyStateMessage from './EmptyStateMessage';
import { ShiftSchedule, isOvertimeShift, getLeaveTypeLabel, getLeaveTypeColor } from '../../utils/scheduleUtils';
import type { Employee } from '@pharmacy-pos/shared/types/entities';

interface ShiftContentProps {
  shift: ShiftSchedule;
  getEmployeeInfo: (id: string) => { name: string; position: string | undefined; phone: string | undefined };
}

/**
 * 班次內容元件
 * 顯示班次的員工列表或加班記錄
 */
const ShiftContent: React.FC<ShiftContentProps> = ({ shift, getEmployeeInfo }) => {
  if (isOvertimeShift(shift)) {
    // 加班記錄顯示
    if (shift.overtimeRecords && shift.overtimeRecords.length > 0) {
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', pl: 1, pr: 1, pb: 1 }}>
          {shift.overtimeRecords.map((overtimeRecord) => (
            <OvertimeRecord
              key={overtimeRecord._id}
              record={overtimeRecord}
              getEmployeeInfo={getEmployeeInfo}
            />
          ))}
        </Box>
      );
    } else {
      return (
        <EmptyStateMessage message="當日無加班記錄" />
      );
    }
  } else {
    // 正常班次員工顯示
    if (shift.employees.length === 0) {
      return (
        <EmptyStateMessage message="此班次無排班" />
      );
    } else {
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', pl: 1, pr: 1, pb: 1 }}>
          {shift.employees.map((employee) => (
            <EmployeeAvatar
              key={employee._id}
              id={employee.employeeId}
              name={getEmployeeInfo(employee.employeeId).name}
              position={getEmployeeInfo(employee.employeeId).position}
              leaveType={employee.leaveType}
              leaveTypeLabel={getLeaveTypeLabel(employee.leaveType)}
              leaveTypeColor={getLeaveTypeColor(employee.leaveType)}
            />
          ))}
        </Box>
      );
    }
  }
};

export default memo(ShiftContent);