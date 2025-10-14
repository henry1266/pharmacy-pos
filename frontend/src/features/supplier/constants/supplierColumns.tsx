import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { Visibility as VisibilityIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { SupplierData } from '../types/supplier.types';

interface ColumnActions {
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

export const getSupplierColumns = (actions: ColumnActions) => {
  return [
    { field: 'code', headerName: '供應商編號', flex: 1.5 },
    { field: 'shortCode', headerName: '簡碼', flex: 1.5 },
    { field: 'name', headerName: '供應商名稱', flex: 1.5 },
    { field: 'contactPerson', headerName: '聯絡人', flex: 1.5 },
    { field: 'phone', headerName: '電話', flex: 1.5 },
    {
      field: 'actions',
      headerName: '操作',
      flex: 2,
      renderCell: (params: { row: SupplierData }) => (
        <Box>
          <Tooltip title="查看詳情">
            <IconButton
              color="info"
              onClick={(e) => {
                e.stopPropagation();
                actions.onView(params.row.id);
              }}
              size="small"
            >
              <VisibilityIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="編輯">
            <IconButton
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                actions.onEdit(params.row.id);
              }}
              size="small"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="刪除">
            <IconButton
              color="error"
              onClick={(e) => {
                e.stopPropagation();
                actions.onDelete(params.row.id);
              }}
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];
};