import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Box,
  Typography,
  Tooltip,
  Collapse
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WorkIcon from '@mui/icons-material/Work';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventNoteIcon from '@mui/icons-material/EventNote';
import { OvertimeRecord, OvertimeRecordType, OvertimeRecordStatus } from './OvertimeRecordRow';

/**
 * 加班記錄原始數據接口
 */
interface OriginalOvertimeRecord {
  _id?: string;
  date: string | Date;
  hours: number;
  description?: string;
  status?: string;
  employeeId?: Employee | string;
  [key: string]: any;
}

/**
 * 排班系統加班記錄原始數據接口
 */
interface OriginalScheduleRecord {
  _id?: string;
  date?: string | Date;
  shift?: string;
  employeeId?: Employee;
  employee?: Employee;
  [key: string]: any;
}

/**
 * 員工數據接口
 */
interface Employee {
  _id: string;
  name: string;
  position?: string;
  department?: string;
  [key: string]: any;
}

/**
 * 員工加班記錄組接口
 */
interface EmployeeOvertimeGroup {
  employee: Employee;
  records: OriginalOvertimeRecord[];
  scheduleRecords: OriginalScheduleRecord[];
  independentHours: number;
  scheduleHours: number;
  totalHours: number;
  scheduleRecordCount: number;
  latestDate?: Date;
}

/**
 * 加班記錄表格組件的 Props 接口
 */
interface OvertimeRecordTableProps {
  groupedRecords: [string, EmployeeOvertimeGroup][];
  expandedEmployees: Record<string, boolean>;
  selectedMonth: number;
  isAdmin: boolean;
  onToggleExpanded: (employeeId: string) => void;
  onEditRecord: (record: OriginalOvertimeRecord) => void;
  onDeleteRecord: (record: OriginalOvertimeRecord) => void;
  onApproveRecord: (record: OriginalOvertimeRecord) => void;
  onRejectRecord: (record: OriginalOvertimeRecord) => void;
}

/**
 * 加班記錄表格組件
 * 顯示員工的加班記錄，支援展開/收合詳細記錄
 */
const OvertimeRecordTable: React.FC<OvertimeRecordTableProps> = ({
  groupedRecords,
  expandedEmployees,
  selectedMonth,
  isAdmin,
  onToggleExpanded,
  onEditRecord,
  onDeleteRecord,
  onApproveRecord,
  onRejectRecord
}) => {
  // 獲取狀態顯示文字
  const getStatusText = (status: OvertimeRecordStatus): string => {
    switch (status) {
      case 'pending': return '待審核';
      case 'approved': return '已核准';
      case 'rejected': return '已拒絕';
      default: return String(status);
    }
  };

  // 獲取狀態顏色
  const getStatusColor = (status: OvertimeRecordStatus): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (status) {
      case 'pending': return 'warning';
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'default';
    }
  };

  // 格式化日期顯示
  const formatDate = (dateString: string | Date): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-TW');
  };

  // 渲染記錄詳細列表
  const renderRecordDetails = (group: EmployeeOvertimeGroup) => {
    const allRecords: OvertimeRecord[] = [
      // 獨立加班記錄
      ...group.records.map(record => ({
        id: `independent-${record._id}`,
        type: 'independent' as OvertimeRecordType,
        date: new Date(record.date),
        originalRecord: record,
        hours: record.hours,
        description: record.description || '-',
        status: (record.status as OvertimeRecordStatus) || 'pending'
      })),
      // 排班系統加班記錄
      ...group.scheduleRecords.map(record => {
        const hours = record.shift ? {
          'morning': 3.5,
          'afternoon': 3,
          'evening': 1.5
        }[record.shift] || 0 : 0;

        const shiftName = record.shift ? {
          'morning': '早班 (08:30-12:00)',
          'afternoon': '中班 (15:00-18:00)',
          'evening': '晚班 (19:00-20:30)'
        }[record.shift] || `${record.shift}` : '未知班次';

        return {
          id: `schedule-${record._id}`,
          type: 'schedule' as OvertimeRecordType,
          date: new Date(record.date || new Date()),
          originalRecord: record,
          hours: hours,
          description: shiftName,
          status: 'approved' as OvertimeRecordStatus,
          shift: record.shift
        };
      })
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
                {...({} as any)}
              />
            </TableCell>
            {isAdmin && (
              <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="編輯">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => onEditRecord(record.originalRecord)}
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
                          onClick={() => onApproveRecord(record.originalRecord)}
                        >
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="拒絕">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => onRejectRecord(record.originalRecord)}
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
                      onClick={() => onDeleteRecord(record.originalRecord)}
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
            <TableCell>{typeof record.hours === 'number' ? record.hours.toFixed(1) : record.hours} 小時</TableCell>
            <TableCell>
              <Chip
                label="已核准"
                color="success"
                size="small"
                {...({} as any)}
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
  };

  if (!groupedRecords || groupedRecords.length === 0) {
    return (
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
            <TableRow>
              <TableCell colSpan={6} align="center">
                <Typography color="textSecondary">
                  沒有找到加班記錄。請嘗試選擇其他月份查看加班記錄。
                  <br />
                  <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'block' }}>
                    根據系統記錄，2025年1月至8月有加班數據。
                  </Typography>
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    );
  }

  return (
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
          {groupedRecords.map(([employeeId, group]) => (
            <React.Fragment key={employeeId}>
              {/* 員工主行 */}
              <TableRow
                sx={{
                  '& > *': { borderBottom: 'unset' },
                  bgcolor: 'rgba(0, 0, 0, 0.04)',
                  cursor: 'pointer'
                }}
                onClick={() => onToggleExpanded(employeeId)}
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
                    {group.employee.name ?? `員工${(selectedMonth + 1).toString().padStart(2, '0')}`}
                  </Typography>
                </TableCell>
                <TableCell>{group.independentHours.toFixed(1)} 小時</TableCell>
                <TableCell>{group.scheduleHours.toFixed(1)} 小時</TableCell>
                <TableCell>{group.totalHours.toFixed(1)} 小時</TableCell>
                <TableCell>
                  {group.records.length} 筆獨立 + {group.scheduleRecordCount ?? 0} 筆排班
                </TableCell>
              </TableRow>
              
              {/* 詳細記錄 (可收折) */}
              <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                  <Collapse in={!!expandedEmployees[employeeId]} timeout="auto" unmountOnExit>
                    <Box sx={{ margin: 1, mb: 3 }}>
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
                          {renderRecordDetails(group, employeeId)}
                        </TableBody>
                      </Table>
                    </Box>
                  </Collapse>
                </TableCell>
              </TableRow>
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default OvertimeRecordTable;