import React from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  CheckCircle as ConfirmIcon,
  LockOpen as UnlockIcon,
  OpenInNew as OpenInNewIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';

import { ExtendedTransactionGroupWithEntries } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import StatusChip from '../components/StatusChip';
import TransactionFlow from '../components/TransactionFlow';
import FundingStatus from '../components/FundingStatus';

/**
 * 創建 DataGrid 列定義
 * @param props 列配置所需的屬性和回調函數
 * @returns DataGrid 列定義數組
 */
export const createColumns = ({
  onEdit,
  onCopy,
  onDelete,
  onView,
  onConfirm,
  onUnlock,
  onNavigateToDetail,
  handleAccountClick
}: {
  onEdit: (transactionGroup: ExtendedTransactionGroupWithEntries) => void;
  onCopy: (transactionGroup: ExtendedTransactionGroupWithEntries) => void;
  onDelete: (id: string) => void;
  onView: (transactionGroup: ExtendedTransactionGroupWithEntries) => void;
  onConfirm: (id: string) => void;
  onUnlock: (id: string) => void;
  onNavigateToDetail: (id: string) => void;
  handleAccountClick: (accountId: string | any) => void;
}): GridColDef[] => {
  return [
    {
      field: 'transactionDate',
      headerName: '交易日期',
      flex: 1,
      valueFormatter: (params) => {
        return formatDate(params.value);
      }
    },
    {
      field: 'description',
      headerName: '交易描述',
      flex: 2,
      renderCell: (params: GridRenderCellParams) => {
        const description = params.value || '';
        const groupNumber = params.row.groupNumber || '';
        
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2">{description}</Typography>
            <Typography variant="caption" color="text.secondary">{groupNumber}</Typography>
          </Box>
        );
      }
    },
    {
      field: 'flow',
      headerName: '交易流向',
      flex: 1.5,
      sortable: false,
      align: 'center',
      renderCell: (params: GridRenderCellParams) => (
        <TransactionFlow 
          group={params.row as ExtendedTransactionGroupWithEntries} 
          onAccountClick={handleAccountClick} 
        />
      )
    },
    {
      field: 'totalAmount',
      headerName: '金額',
      flex: 1,
      align: 'right',
      valueFormatter: (params) => {
        return formatCurrency(params.value || 0);
      }
    },
    {
      field: 'status',
      headerName: '狀態',
      flex: 1,
      align: 'center',
      renderCell: (params: GridRenderCellParams) => <StatusChip status={params.value} />
    },
    {
      field: 'fundingStatus',
      headerName: '資金狀態',
      flex: 1,
      align: 'center',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <FundingStatus group={params.row as ExtendedTransactionGroupWithEntries} />
      )
    },
    {
      field: 'actions',
      headerName: '操作',
      flex: 2, // 增加操作列寬度
      minWidth: 220, // 確保最小寬度，給按鈕足夠空間
      sortable: false,
      align: 'center',
      renderCell: (params: GridRenderCellParams) => {
        const group = params.row as ExtendedTransactionGroupWithEntries;
        return (
          <Box sx={{
            display: 'flex',
            gap: 1,
            flexWrap: 'wrap',
            justifyContent: 'center' // 確保按鈕居中對齊
          }}>
            {/* 查看詳情按鈕 - 確保在所有螢幕尺寸上都可見 */}
            <Tooltip title="查看詳情">
              <IconButton
                size="medium"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onNavigateToDetail(group._id);
                }}
                sx={{
                  border: '1px solid',
                  borderColor: 'primary.main',
                  zIndex: 2, // 確保按鈕在上層
                  '&:hover': { bgcolor: 'primary.light', color: 'common.white' }
                }}
              >
                <OpenInNewIcon />
              </IconButton>
            </Tooltip>
            
            {/* 快速檢視按鈕 - 確保在所有螢幕尺寸上都可見 */}
            <Tooltip title="快速檢視">
              <IconButton
                size="medium"
                color="info"
                onClick={(e) => {
                  e.stopPropagation();
                  onView(group);
                }}
                sx={{
                  zIndex: 2, // 確保按鈕在上層
                  ml: 1, // 增加左邊距，與查看詳情按鈕分開
                  '&:hover': { bgcolor: 'info.light', color: 'common.white' }
                }}
              >
                <ViewIcon />
              </IconButton>
            </Tooltip>
            
            {/* 編輯按鈕 - 只有草稿狀態可以編輯 */}
            {group.status === 'draft' && (
              <Tooltip title="編輯">
                <IconButton
                  size="small"
                  onClick={() => onEdit(group)}
                  sx={{
                    mx: 0.5, // 增加左右邊距
                    '&:hover': { bgcolor: 'action.hover' } // 懸停效果
                  }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
            )}
            
            <Tooltip title="複製">
              <IconButton
                size="small"
                onClick={() => onCopy(group)}
                sx={{
                  mx: 0.5, // 增加左右邊距
                  '&:hover': { bgcolor: 'action.hover' } // 懸停效果
                }}
              >
                <CopyIcon />
              </IconButton>
            </Tooltip>
            
            {/* 確認按鈕 - 只有草稿狀態且已平衡可以確認 */}
            {group.status === 'draft' && (
              <Tooltip title="確認交易">
                <IconButton
                  size="small"
                  color="success"
                  onClick={() => onConfirm(group._id)}
                  sx={{
                    mx: 0.5, // 增加左右邊距
                    '&:hover': { bgcolor: 'success.light', color: 'common.white' } // 懸停效果
                  }}
                >
                  <ConfirmIcon />
                </IconButton>
              </Tooltip>
            )}
            
            {/* 解鎖按鈕 - 只有已確認狀態可以解鎖 */}
            {group.status === 'confirmed' && (
              <Tooltip title="解鎖交易">
                <IconButton
                  size="small"
                  color="warning"
                  onClick={() => onUnlock(group._id)}
                  sx={{
                    mx: 0.5, // 增加左右邊距
                    '&:hover': { bgcolor: 'warning.light', color: 'common.white' } // 懸停效果
                  }}
                >
                  <UnlockIcon />
                </IconButton>
              </Tooltip>
            )}
            
            {/* 刪除按鈕 - 只有草稿狀態可以刪除 */}
            {group.status === 'draft' && (
              <Tooltip title="刪除">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onDelete(group._id)}
                  sx={{
                    mx: 0.5, // 增加左右邊距
                    '&:hover': { bgcolor: 'error.light', color: 'common.white' } // 懸停效果
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      }
    }
  ];
};

export default createColumns;