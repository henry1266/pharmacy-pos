import React, { memo } from 'react';
import { Avatar, Box, Chip, Tooltip, Typography } from '@mui/material';
import { getEmployeeAvatarColor } from '../../utils/scheduleUtils';

interface EmployeeAvatarProps {
  id: string;
  name: string;
  position?: string | undefined;
  leaveType?: string | null | undefined;
  leaveTypeLabel?: string | undefined;
  leaveTypeColor?: 'default' | 'warning' | 'error' | 'info' | undefined;
  additionalInfo?: React.ReactNode | undefined;
  chipLabel?: string | undefined;
  chipColor?: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | undefined;
}

/**
 * 員工頭像元件
 * 顯示員工頭像、請假標籤和提示信息
 */
const EmployeeAvatar: React.FC<EmployeeAvatarProps> = ({
  id,
  name,
  position,
  leaveType,
  leaveTypeLabel,
  leaveTypeColor = 'default',
  additionalInfo,
  chipLabel,
  chipColor = 'default'
}) => {
  return (
    <Tooltip
      title={
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {name}
          </Typography>
          {position && (
            <Typography variant="caption" color="inherit">
              職位: {position}
            </Typography>
          )}
          {additionalInfo}
        </Box>
      }
      placement="top"
      arrow
    >
      <Box sx={{ position: 'relative' }}>
        <Avatar
          sx={{
            width: 40,
            height: 40,
            fontSize: '0.875rem',
            bgcolor: getEmployeeAvatarColor(id),
            cursor: 'pointer',
            '&:hover': {
              transform: 'scale(1.1)',
              transition: 'transform 0.2s ease-in-out'
            }
          }}
        >
          {name.charAt(0)}
        </Avatar>
        
        {/* 請假標籤或自定義標籤 */}
        {(leaveType || chipLabel) && (
          <Chip
            label={chipLabel || leaveTypeLabel}
            size="small"
            color={chipColor !== 'default' ? chipColor : leaveTypeColor}
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              fontSize: '0.6rem',
              height: 16,
              '& .MuiChip-label': {
                px: 0.5
              }
            }}
          />
        )}
      </Box>
    </Tooltip>
  );
};

export default memo(EmployeeAvatar);