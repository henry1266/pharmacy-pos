import React, { memo } from 'react';
import { Box, Typography } from '@mui/material';
import EmployeeAvatar from './EmployeeAvatar';
import { ExtendedOvertimeRecord } from '../../utils/scheduleUtils';

interface OvertimeRecordProps {
  record: ExtendedOvertimeRecord;
  getEmployeeInfo: (id: string) => { name: string; position: string | undefined; phone: string | undefined };
}

/**
 * 加班記錄元件
 * 顯示加班員工頭像和加班信息
 */
const OvertimeRecord: React.FC<OvertimeRecordProps> = ({ record, getEmployeeInfo }) => {
  // 優化的員工資訊提取邏輯
  const getEmployeeData = (employeeId: string | { _id: string; name: string; position?: string; phone?: string }) => {
    if (typeof employeeId === 'object' && employeeId) {
      return {
        id: employeeId._id,
        name: employeeId.name,
        position: employeeId.position,
        phone: employeeId.phone
      };
    }
    
    const id = employeeId as string || '';
    const info = getEmployeeInfo(id);
    
    return {
      id,
      name: info.name,
      position: info.position,
      phone: info.phone
    };
  };
  
  const employeeInfo = getEmployeeData(record.employeeId);
  
  // 根據加班狀態決定顏色
  const getChipColor = () => {
    switch (record.status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };
  
  return (
    <EmployeeAvatar
      id={employeeInfo.id}
      name={employeeInfo.name}
      position={employeeInfo.position}
      chipLabel={`${record.hours * 60}m`}
      chipColor={getChipColor()}
      additionalInfo={
        <Box>
          <Typography variant="caption" color="inherit">
            加班時數: {(record.hours * 60)} 分鐘
          </Typography>
          {record.description && (
            <Typography variant="caption" color="inherit" display="block">
              說明: {record.description}
            </Typography>
          )}
          <Typography variant="caption" color="inherit" display="block">
            狀態: {record.status === 'approved' ? '已核准' :
                  record.status === 'pending' ? '待審核' : '已拒絕'}
          </Typography>
        </Box>
      }
    />
  );
};

export default memo(OvertimeRecord);