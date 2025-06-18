import React from 'react';
import {
  TableRow,
  TableCell,
  Box,
  Typography,
  Chip,
  Tooltip,
  IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockResetIcon from '@mui/icons-material/LockReset';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { EmployeeAccount, Role, EmployeeWithAccount } from '../../../types/entities';

// 定義元件 Props 介面
interface EmployeeAccountRowProps {
  employee: EmployeeWithAccount;
  onEdit: (employee: EmployeeWithAccount, account: EmployeeAccount) => void;
  onResetPassword: (employee: EmployeeWithAccount) => void;
  onUnbind: (employee: EmployeeWithAccount) => void;
  onDelete: (employee: EmployeeWithAccount) => void;
  getRoleName: (role: Role) => string;
  getRoleColor: (role: Role) => "error" | "success" | "primary" | "default" | "info" | "warning" | "secondary";
}

/**
 * 員工帳號表格行組件
 * 重構自 EmployeeAccountsPage 中重複的表格行邏輯
 */
const EmployeeAccountRow: React.FC<EmployeeAccountRowProps> = ({
  employee,
  onEdit,
  onResetPassword,
  onUnbind,
  onDelete,
  getRoleName,
  getRoleColor
}) => {
  return (
    <TableRow key={employee._id}>
      <TableCell>{employee.name}</TableCell>
      <TableCell>{employee.account?.username || '未設置'}</TableCell>
      <TableCell>{employee.account?.email || '未設置'}</TableCell>
      <TableCell>
        {employee.account ? (
          <Chip
            label={getRoleName(employee.account.role)}
            color={getRoleColor(employee.account.role)}
            size="small"
          />
        ) : (
          '未設置'
        )}
      </TableCell>
      <TableCell>
        {employee.account ? (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="編輯帳號">
              <IconButton
                size="small"
                color="primary"
                onClick={() => onEdit(employee, employee.account!)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="重設密碼">
              <IconButton
                size="small"
                color="warning"
                onClick={() => onResetPassword(employee)}
              >
                <LockResetIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="解除綁定">
              <IconButton
                size="small"
                color="info"
                onClick={() => onUnbind(employee)}
              >
                <LinkOffIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="刪除帳號">
              <IconButton
                size="small"
                color="error"
                onClick={() => onDelete(employee)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            無帳號
          </Typography>
        )}
      </TableCell>
    </TableRow>
  );
};

export default EmployeeAccountRow;