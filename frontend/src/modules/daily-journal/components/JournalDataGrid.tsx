import React from 'react';
import { DataGrid, GridColDef, GridRowHeightParams, GridValueFormatterParams } from '@mui/x-data-grid';
import { Paper, IconButton, Box, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import { format } from 'date-fns';
import StatusChip from '../../../components/common/StatusChip';
import type { AccountingItem, ExtendedAccountingRecord } from '@pharmacy-pos/shared/types/accounting';

// DataGrid 行數據介面
interface GridRow {
  id: string;
  date: Date;
  shift: string;
  status: string;
  items: AccountingItem[];
  totalAmount: number;
  rawRecord: ExtendedAccountingRecord;
}

// 組件 Props 介面
interface JournalDataGridProps {
  records: ExtendedAccountingRecord[];
  loading: boolean;
  onEdit: (record: ExtendedAccountingRecord) => void;
  onDelete: (id: string) => void;
  onUnlock?: (record: ExtendedAccountingRecord) => void;
}

/**
 * 日常記帳數據表格組件
 */
const JournalDataGrid: React.FC<JournalDataGridProps> = ({
  records,
  loading,
  onEdit,
  onDelete,
  onUnlock
}) => {
  // 定義班別顏色
  const shiftColors: Record<string, string> = {
    '早': '#e3f2fd', // 淺藍色
    '中': '#e8f5e9', // 淺綠色
    '晚': '#fff8e1'  // 淺黃色
  };

  // 將記錄轉換為DataGrid所需的行數據格式
  const rows: GridRow[] = records.map(record => ({
    id: record._id,
    date: new Date(record.date),
    shift: record.shift,
    status: record.status || 'pending',
    items: record.items,
    totalAmount: record.totalAmount,
    rawRecord: record // 保存原始記錄以便編輯時使用
  }));

  // 定義列配置
  const columns: GridColDef[] = [
    { 
      field: 'date', 
      headerName: '日期', 
      width: 150,
      valueFormatter: (params: GridValueFormatterParams<Date>) => 
        params.value ? format(params.value, 'yyyy-MM-dd') : ''
    },
    { 
      field: 'status',
      headerName: '狀態',
      width: 120,
      renderCell: (params) => <StatusChip status={params.value as string} />
    },
    { 
      field: 'shift', 
      headerName: '班別', 
      width: 120,
      valueFormatter: (params: GridValueFormatterParams<string>) => `${params.value}班`,
      cellClassName: (params) => `shift-${params.value}`
    },
    { 
      field: 'items', 
      headerName: '項目', 
      width: 300,
      sortable: false,
      renderCell: (params) => (
        <div>
          {(params.value as AccountingItem[]).map((item, index) => (
            <div key={`${item.category}-${item.amount}-${item.notes ?? ''}-${index}`}>
              {item.category}: ${item.amount}
              {item.notes && ` (${item.notes})`}
            </div>
          ))}
        </div>
      )
    },
    { 
      field: 'totalAmount', 
      headerName: '總金額', 
      width: 150,
      align: 'right',
      headerAlign: 'right',
      valueFormatter: (params: GridValueFormatterParams<number>) => `$${params.value}`
    },
    {
      field: 'actions',
      headerName: '操作',
      width: 150,
      sortable: false,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params) => {
        const row = params.row as GridRow;
        const isCompleted = row.status === 'completed';
        
        return (
          <div>
            {isCompleted ? (
              <Tooltip title="點擊解鎖並改為待處理">
                <IconButton
                  color="primary"
                  onClick={() => onUnlock?.(row.rawRecord)}
                >
                  <LockIcon />
                </IconButton>
              </Tooltip>
            ) : (
              <>
                <IconButton
                  color="primary"
                  onClick={() => onEdit(row.rawRecord)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  color="error"
                  onClick={() => onDelete(params.row.id as string)}
                >
                  <DeleteIcon />
                </IconButton>
              </>
            )}
          </div>
        );
      }
    }
  ];

  // 根據項目數量計算行高
  const getRowHeight = (params: GridRowHeightParams): number => {
    const row = params.model as GridRow;
    const itemCount = row.items?.length || 0;
    // 基本行高為52px，每個項目增加24px，最小高度為52px
    const baseHeight = 52;
    const itemHeight = 24;
    return Math.max(baseHeight, baseHeight + (itemCount - 1) * itemHeight);
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{ height: 540, width: '100%' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          disableSelectionOnClick
          getRowHeight={getRowHeight}
          initialState={{
            sorting: {
              sortModel: [
                { field: 'date', sort: 'desc' },
                { field: 'shift', sort: 'asc' }
              ],
            },
          }}
          sx={{
            '& .shift-早': {
              backgroundColor: shiftColors['早'],
            },
            '& .shift-中': {
              backgroundColor: shiftColors['中'],
            },
            '& .shift-晚': {
              backgroundColor: shiftColors['晚'],
            },
          }}
        />
      </Box>
    </Paper>
  );
};

export default JournalDataGrid;