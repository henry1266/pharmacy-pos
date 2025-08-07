import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { keyframes } from '@emotion/react';
import {
  Box,
  Card,
  CardContent,
  Paper,
  IconButton,
  Chip,
  Typography,
  Button,
  Tooltip,
  Alert,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Stack,
  Fade,
  Skeleton
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, GridLocaleText } from '@mui/x-data-grid';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Receipt as ReceiptIcon,
  Visibility as ViewIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ContentCopy as CopyIcon,
  CheckCircle as ConfirmIcon,
  LockOpen as UnlockIcon,
  Link as LinkIcon,
  ArrowForward as ArrowForwardIcon,
  OpenInNew as OpenInNewIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { BreadcrumbNavigation } from '../ui/BreadcrumbNavigation';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zhTW } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { TransactionGroupWithEntries, EmbeddedAccountingEntry } from '@pharmacy-pos/shared';
import { useAppSelector, useAppDispatch } from '../../../../hooks/redux';
import { fetchTransactionGroupsWithEntries } from '../../../../redux/actions';

// 定義 fadeIn 動畫
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

// 直接在組件文件中定義 useDebounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// 臨時型別擴展，確保 referencedByInfo 和 fundingSourceUsages 屬性可用
interface ExtendedTransactionGroupWithEntries extends TransactionGroupWithEntries {
  referencedByInfo?: Array<{
    _id: string;
    groupNumber: string;
    description: string;
    transactionDate: Date | string;
    totalAmount: number;
    status: 'draft' | 'confirmed' | 'cancelled';
  }>;
  fundingSourceUsages?: Array<{
    sourceTransactionId: string;
    usedAmount: number;
    sourceTransactionDescription?: string;
    sourceTransactionGroupNumber?: string;
    sourceTransactionDate?: Date | string;
    sourceTransactionAmount?: number;
  }>;
}

// DataGrid 行數據介面
interface TransactionRow extends ExtendedTransactionGroupWithEntries {
  id: string; // DataGrid需要唯一的id字段
}

// 定義分頁模型介面
interface PaginationModel {
  page: number;
  pageSize: number;
}

interface AccountingDataGridWithEntries3Props {
  organizationId?: string;
  showFilters?: boolean;
  onCreateNew: () => void;
  onEdit: (transactionGroup: ExtendedTransactionGroupWithEntries) => void;
  onCopy: (transactionGroup: ExtendedTransactionGroupWithEntries) => void;
  onDelete: (id: string) => void;
  onView: (transactionGroup: ExtendedTransactionGroupWithEntries) => void;
  onConfirm: (id: string) => void;
  onUnlock: (id: string) => void;
  onToggleFilters?: () => void;
  paginationModel?: PaginationModel;
  setPaginationModel?: (model: PaginationModel) => void;
}

interface FilterOptions {
  search: string;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  page: number;
  limit: number;
}

export const AccountingDataGridWithEntries3: React.FC<AccountingDataGridWithEntries3Props> = ({
  organizationId,
  showFilters = false,
  onCreateNew,
  onEdit,
  onCopy,
  onDelete,
  onView,
  onConfirm,
  onUnlock,
  onToggleFilters,
  paginationModel = { page: 0, pageSize: 25 },
  setPaginationModel
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  // 使用 Redux 狀態
  const { transactionGroups, loading, error, pagination } = useAppSelector(state => state.transactionGroupWithEntries);

  // 定義 DataGrid 列
  const columns: GridColDef[] = [
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
      renderCell: (params: GridRenderCellParams) => renderTransactionFlow(params.row as ExtendedTransactionGroupWithEntries)
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
      renderCell: (params: GridRenderCellParams) => getStatusChip(params.value)
    },
    {
      field: 'fundingStatus',
      headerName: '資金狀態',
      flex: 1,
      align: 'center',
      sortable: false,
      renderCell: (params: GridRenderCellParams) => renderIntegratedFundingStatus(params.row as ExtendedTransactionGroupWithEntries)
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
                  navigate(`/accounting3/transaction/${group._id}`);
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
            {group.status === 'draft' && isBalanced(group.entries) && (
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

  // 提取帳戶ID的工具函數
  const extractAccountId = (accountId: string | any): string | null => {
    if (typeof accountId === 'string') {
      return accountId;
    }
    if (typeof accountId === 'object' && accountId?._id) {
      return accountId._id;
    }
    return null;
  };

  // 處理帳戶點擊事件
  const handleAccountClick = (accountId: string | any) => {
    const cleanId = extractAccountId(accountId);
    if (cleanId) {
      navigate(`/accounting3/accounts/${cleanId}`);
    }
  };
  
  // 本地狀態管理
  const [filter, setFilter] = useState<FilterOptions>({
    search: '',
    status: '',
    startDate: null,
    endDate: null,
    page: 1,
    limit: 25
  });
  
  // 使用 debounce 處理搜索輸入
  const debouncedSearch = useDebounce(filter.search, 500);
  
  // 為 DataGrid 準備行數據 - 使用 useMemo 優化
  const rows: TransactionRow[] = useMemo(() => transactionGroups.map(group => ({
    ...group,
    id: group._id, // DataGrid 需要唯一的 id 字段
  })), [transactionGroups]);
  
  // 移除這裡的 fundingStatusMap 定義，我們將在 renderIntegratedFundingStatus 函數定義後重新添加

  // 載入交易群組資料
  const loadTransactionGroups = () => {
    console.log('[Accounting3] 🔍 AccountingDataGridWithEntries3 - 載入交易群組:', {
      organizationId
    });

    const params: any = {
      organizationId,
      page: filter.page,
      limit: filter.limit
    };

    if (filter.search) params.search = filter.search;
    if (filter.status) params.status = filter.status;
    if (filter.startDate) params.startDate = filter.startDate.toISOString();
    if (filter.endDate) params.endDate = filter.endDate.toISOString();

    if (process.env.NODE_ENV === 'development') {
      console.log('[Accounting3] 🔍 發送分頁請求:', {
        page: filter.page,
        limit: filter.limit
      });
    }

    dispatch(fetchTransactionGroupsWithEntries(params) as any);
  };

  // 初始載入和篩選變更時重新載入
  useEffect(() => {
    console.log('[Accounting3] 🔍 AccountingDataGridWithEntries3 - 載入交易群組:', {
      organizationId,
      search: debouncedSearch, // 使用 debouncedSearch 而不是 filter.search
      status: filter.status,
      startDate: filter.startDate,
      endDate: filter.endDate
    });

    const params: any = {
      organizationId,
      page: filter.page,
      limit: filter.limit
    };

    if (debouncedSearch) params.search = debouncedSearch; // 使用 debouncedSearch
    if (filter.status) params.status = filter.status;
    if (filter.startDate) params.startDate = filter.startDate.toISOString();
    if (filter.endDate) params.endDate = filter.endDate.toISOString();

    if (process.env.NODE_ENV === 'development') {
      console.log('[Accounting3] 🔍 發送分頁請求:', {
        page: filter.page,
        limit: filter.limit
      });
    }

    dispatch(fetchTransactionGroupsWithEntries(params) as any);
  }, [
    dispatch,
    organizationId,
    debouncedSearch, // 使用 debouncedSearch 替換 filter.search
    filter.status,
    filter.startDate,
    filter.endDate,
    filter.page,
    filter.limit
  ]);

  // 監聽 Redux 狀態變化
  useEffect(() => {
    console.log('[Accounting3] 📊 AccountingDataGridWithEntries3 Redux 狀態變化:', {
      transactionGroupsLength: transactionGroups.length,
      loading,
      error,
      pagination
    });
  }, [transactionGroups, loading, error, pagination]);

  // 使用 useCallback 記憶化事件處理函數
  const handleFilterChange = useCallback((field: keyof FilterOptions, value: any) => {
    setFilter(prev => ({
      ...prev,
      [field]: value,
      page: field !== 'page' ? 1 : value // 非分頁變更時重置到第一頁
    }));
    
    // 如果是篩選條件變更，重置分頁到第一頁
    if (field !== 'page' && field !== 'limit' && setPaginationModel) {
      setPaginationModel({
        ...paginationModel,
        page: 0 // DataGrid 的頁碼從 0 開始
      });
    }
  }, [paginationModel, setPaginationModel]);

  // 處理分頁變更 - 這個函數不再需要，因為 DataGrid 會直接調用 onPageChange

  // 清除篩選，但保留每頁顯示數量
  const handleClearFilter = () => {
    setFilter(prevFilter => ({
      search: '',
      status: '',
      startDate: null,
      endDate: null,
      page: 1,
      limit: prevFilter.limit // 保留用戶選擇的每頁顯示數量
    }));
    
    // 重置分頁到第一頁
    if (setPaginationModel) {
      setPaginationModel({
        ...paginationModel,
        page: 0 // DataGrid 的頁碼從 0 開始
      });
    }
  };

  // 格式化日期
  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return date.toLocaleDateString('zh-TW');
  };

  // 格式化貨幣
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD'
    }).format(amount);
  };

  // 取得狀態標籤
  const getStatusChip = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Chip label="已確認" color="success" size="small" />;
      case 'draft':
        return <Chip label="草稿" color="warning" size="small" />;
      case 'cancelled':
        return <Chip label="已取消" color="error" size="small" />;
      default:
        return <Chip label="未知" color="default" size="small" />;
    }
  };

  // 計算交易群組總金額
  const calculateTotalAmount = (entries: EmbeddedAccountingEntry[]) => {
    return entries.reduce((total, entry) => total + (entry.debitAmount || 0), 0);
  };

  // 檢查借貸平衡
  const isBalanced = (entries: EmbeddedAccountingEntry[]) => {
    const totalDebit = entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
    const totalCredit = entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
    return Math.abs(totalDebit - totalCredit) < 0.01; // 允許小數點誤差
  };

  // 計算剩餘可用金額（使用後端提供的精確資料）
  const calculateAvailableAmount = (group: ExtendedTransactionGroupWithEntries) => {
    const totalAmount = calculateTotalAmount(group.entries);
    
    if (!group.referencedByInfo || group.referencedByInfo.length === 0) {
      return totalAmount; // 沒有被引用，全額可用
    }
    
    // 🎯 使用後端提供的精確已使用金額資料
    // 計算實際已使用金額（從 referencedByInfo 中獲取，排除已取消的交易）
    const actualUsedAmount = group.referencedByInfo
      .filter(ref => ref.status !== 'cancelled') // 排除已取消的交易
      .reduce((sum, ref) => sum + (ref.totalAmount || 0), 0);
    
    // 剩餘可用金額 = 總金額 - 實際已使用金額
    const availableAmount = totalAmount - actualUsedAmount;
    
    console.log(`[Accounting3] 💰 交易 ${group.groupNumber} 剩餘可用金額計算:`, {
      totalAmount,
      actualUsedAmount,
      availableAmount,
      referencedByCount: group.referencedByInfo.length,
      referencedBy: group.referencedByInfo.map(ref => ({
        groupNumber: ref.groupNumber,
        amount: ref.totalAmount,
        status: ref.status
      }))
    });
    
    // 確保不會是負數
    return Math.max(0, availableAmount);
  };

  // 取得剩餘可用狀態顏色
  const getAvailableAmountColor = (availableAmount: number, totalAmount: number) => {
    if (totalAmount === 0) return 'default';
    const percentage = (availableAmount / totalAmount) * 100;
    if (percentage >= 100) return 'success';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  // 渲染整合的資金狀態
  const renderIntegratedFundingStatus = (group: ExtendedTransactionGroupWithEntries) => {
    const totalAmount = calculateTotalAmount(group.entries);
    const availableAmount = calculateAvailableAmount(group);
    const hasReferences = group.referencedByInfo && group.referencedByInfo.length > 0;
    const hasFundingSources = group.fundingSourceUsages && group.fundingSourceUsages.length > 0;
    
    // 如果有資金來源使用，優先顯示資金來源資訊
    if (hasFundingSources) {
      const totalUsedAmount = group.fundingSourceUsages!.reduce((sum, usage) => sum + usage.usedAmount, 0);
      
      return (
        <Tooltip
          title={
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                💰 資金來源追蹤 ({group.fundingSourceUsages!.length} 筆)
              </Typography>
              
              {group.fundingSourceUsages!.map((usage, index) => (
                <Box key={usage.sourceTransactionId} sx={{ mb: 1, pb: 1, borderBottom: index < group.fundingSourceUsages!.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>
                  <Typography variant="caption" display="block" sx={{ mb: 0.5, fontWeight: 'bold' }}>
                    來源 {index + 1}: {usage.sourceTransactionDescription || '未知交易'}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                    <strong>編號：</strong>{usage.sourceTransactionGroupNumber || 'N/A'}
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                    <strong>使用金額：</strong>{formatCurrency(usage.usedAmount)}
                  </Typography>
                </Box>
              ))}
              
              <Typography variant="caption" display="block" sx={{ mt: 1, fontWeight: 'bold', borderTop: '1px solid rgba(255,255,255,0.2)', pt: 1 }}>
                <strong>總使用金額：</strong>{formatCurrency(totalUsedAmount)}
              </Typography>
            </Box>
          }
          arrow
          placement="left"
        >
          <Stack direction="column" spacing={0.5} alignItems="center">
            <Chip
              label={`💰 ${group.fundingSourceUsages!.length} 筆`}
              size="small"
              variant="outlined"
              color="primary"
              sx={{ cursor: 'help' }}
            />
            <Typography variant="caption" color="text.secondary">
              {formatCurrency(totalUsedAmount)}
            </Typography>
          </Stack>
        </Tooltip>
      );
    }
    
    // 如果被引用，顯示被引用和剩餘可用狀態
    if (hasReferences) {
      const color = getAvailableAmountColor(availableAmount, totalAmount);
      
      return (
        <Tooltip
          title={
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                🔗 被引用情況 ({group.referencedByInfo!.length} 筆)
              </Typography>
              
              {group.referencedByInfo!.map((ref, index) => (
                <Box key={ref._id} sx={{ mb: 1, pb: 1, borderBottom: index < group.referencedByInfo!.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>
                  <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>
                    <strong>{formatDate(ref.transactionDate)}</strong> - {ref.groupNumber}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    {ref.description} ({formatCurrency(ref.totalAmount)})
                  </Typography>
                </Box>
              ))}
              
              <Typography variant="caption" display="block" sx={{ mt: 1, fontWeight: 'bold', borderTop: '1px solid rgba(255,255,255,0.2)', pt: 1 }}>
                <strong>總金額：</strong>{formatCurrency(totalAmount)}
              </Typography>
              <Typography variant="caption" display="block">
                <strong>已使用：</strong>{formatCurrency(totalAmount - availableAmount)}
              </Typography>
              <Typography variant="caption" display="block" sx={{ fontWeight: 'bold' }}>
                <strong>剩餘可用：</strong>{formatCurrency(availableAmount)}
              </Typography>
            </Box>
          }
          arrow
          placement="left"
        >
          <Stack direction="column" spacing={0.5} alignItems="center">
            <Chip
              icon={<LinkIcon />}
              label={` ${group.referencedByInfo!.length} 筆`}
              color="warning"
              size="small"
              variant="outlined"
              sx={{ cursor: 'help' }}
            />
            <Chip
              label={formatCurrency(availableAmount)}
              color={color}
              size="small"
              variant={availableAmount === totalAmount ? 'filled' : 'outlined'}
            />
          </Stack>
        </Tooltip>
      );
    }
    
    // 沒有資金追蹤的情況
    if (totalAmount === 0) {
      return (
        <Typography variant="caption" color="text.secondary">
          無金額交易
        </Typography>
      );
    }
    
    return (
      <Typography variant="body2" color="success.main" sx={{ textAlign: 'center' }}>
        ✓
      </Typography>
    );
  };

  // 渲染交易流向圖
  const renderTransactionFlow = (group: ExtendedTransactionGroupWithEntries) => {
    if (!group.entries || group.entries.length < 2) {
      return <Typography variant="caption" color="text.disabled">-</Typography>;
    }

    // 找到主要的借方和貸方科目
    const debitEntries = group.entries.filter(entry => (entry.debitAmount || 0) > 0);
    const creditEntries = group.entries.filter(entry => (entry.creditAmount || 0) > 0);

    if (debitEntries.length === 0 || creditEntries.length === 0) {
      return <Typography variant="caption" color="text.disabled">-</Typography>;
    }

    // 取第一個借方和貸方科目作為代表
    const fromAccount = creditEntries[0];
    const toAccount = debitEntries[0];

    // 獲取科目名稱
    const fromAccountName = (fromAccount as any).accountName || '未知科目';
    const toAccountName = (toAccount as any).accountName || '未知科目';

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5, minWidth: 180 }}>
        <Chip
          label={fromAccountName}
          size="medium"
          color="secondary"
          clickable
          onClick={() => fromAccount?.accountId && handleAccountClick(fromAccount.accountId)}
          sx={{
            fontSize: '0.8rem',
            height: 28,
            mr: 0.5,
            maxWidth: 90,
            cursor: 'pointer',
            '& .MuiChip-label': {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: '0.8rem'
            },
            '&:hover': {
              backgroundColor: 'secondary.dark'
            }
          }}
        />
        <ArrowForwardIcon sx={{ fontSize: 18, color: 'primary.main', mx: 0.25 }} />
        <Chip
          label={toAccountName}
          size="medium"
          color="primary"
          clickable
          onClick={() => toAccount?.accountId && handleAccountClick(toAccount?.accountId)}
          sx={{
            fontSize: '0.8rem',
            height: 28,
            ml: 0.5,
            maxWidth: 90,
            cursor: 'pointer',
            '& .MuiChip-label': {
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontSize: '0.8rem'
            },
            '&:hover': {
              backgroundColor: 'primary.dark'
            }
          }}
        />
      </Box>
    );
  };

  // 創建骨架屏載入效果
  const renderSkeleton = () => (
    <Box sx={{
      width: '100%',
      mt: 1,
      bgcolor: 'background.paper', // 使用主題的背景色
      borderRadius: 1,
      height: '100%',
      minHeight: '70vh', // 確保至少佔據70%的視窗高度
      p: 2 // 添加內邊距
    }}>
      {[...Array(15)].map((_, index) => ( // 增加到15行以填滿更多空間
        <Box
          key={index}
          sx={{
            display: 'flex',
            mb: 1.5,
            opacity: 0,
            animation: `${fadeIn} 0.8s ease-in-out forwards`,
            animationDelay: `${index * 0.08}s`,
            transform: 'translateY(10px)',
            // animationFillMode 已經在上面定義了
          }}
        >
          {[...Array(6)].map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="rectangular"
              width={`${100 / 6}%`}
              height={52}
              animation="pulse" // 使用 pulse 動畫
              sx={{
                mx: 0.5,
                borderRadius: 1,
                opacity: 1 - (index * 0.05), // 更輕微的漸變效果
                bgcolor: 'action.hover', // 使用主題的懸停色，通常是淺灰色
                '&::after': {
                  background: 'linear-gradient(90deg, transparent, rgba(0, 0, 0, 0.06), transparent)'
                }
              }}
            />
          ))}
        </Box>
      ))}
      {/* 使用標準的 React 方式添加動畫 */}
    </Box>
  );

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        [Accounting3] {error}
        <Button onClick={loadTransactionGroups} sx={{ ml: 2 }}>
          重新載入
        </Button>
      </Alert>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
      <Paper sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* 會計交易列表標題區域 */}
        <Box sx={{
          p: 1.5,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            minHeight: 48 // 確保最小高度一致
          }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              height: '100%' // 確保高度一致
            }}>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                height: 44 // 增加高度與其他元素一致
              }}>
                <Box sx={{
                  '& > div': {
                    marginBottom: 0, // 覆蓋 StyledBreadcrumbContainer 的 marginBottom
                    display: 'flex',
                    alignItems: 'center'
                  }
                }}>
                  <BreadcrumbNavigation
                    items={[
                      {
                        label: '會計首頁',
                        path: '/accounting3',
                        icon: <HomeIcon sx={{ fontSize: '1.1rem' }} />
                      },
                      {
                        label: '交易列表',
                        icon: <ReceiptIcon sx={{ fontSize: '1.1rem' }} />
                      }
                    ]}
                    fontSize="0.975rem"
                    padding={0}
                  />
                </Box>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'secondary.main',
                  color: 'secondary.contrastText',
                  px: 2,
                  py: 0.5, // 減少上下內邊距
                  ml: 2,
                  borderRadius: 2,
                  minWidth: 'fit-content',
                  height: 36 // 增加高度
                }}>
                  <Typography variant="caption" sx={{ fontSize: '0.85rem', mr: 0.75 }}>
                    總筆數
                  </Typography>
                  <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 'bold', lineHeight: 1 }}>
                    {pagination?.total || 0}
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{
              display: 'flex',
              gap: 1,
              alignItems: 'center',
              height: '100%' // 確保高度一致
            }}>
              <TextField
                size="small"
                label="搜尋"
                value={filter.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="交易..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  sx: { height: 44 } // 增加輸入框高度
                }}
                sx={{
                  mr: 1,
                  '& .MuiInputBase-root': {
                    height: 44 // 增加輸入框高度
                  }
                }}
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<FilterIcon />}
                onClick={() => onToggleFilters && onToggleFilters()}
                sx={{
                  height: 44, // 增加按鈕高度
                  minWidth: 110 // 確保按鈕有足夠寬度
                }}
              >
                {showFilters ? '隱藏篩選' : '顯示篩選'}
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={onCreateNew}
                sx={{
                  height: 44, // 增加按鈕高度
                  minWidth: 110 // 確保按鈕有足夠寬度
                }}
              >
                新增交易
              </Button>
            </Box>
          </Box>
        </Box>
        
        <Box>
          {/* 篩選器 */}
          {showFilters && (
            <Paper sx={{
              p: 1.5,
              mb: 2,
              bgcolor: 'background.paper',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              borderRadius: 1
            }} variant="outlined">
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                justifyContent: 'flex-end',
                minHeight: 48 // 確保最小高度一致
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FilterIcon fontSize="small" />
                  <Typography variant="subtitle2">時間範圍</Typography>
                </Box>
                <DatePicker
                  label="開始日期"
                  value={filter.startDate}
                  onChange={(newValue) => handleFilterChange('startDate', newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      sx={{
                        width: 180,
                        '& .MuiInputBase-root': {
                          height: 44 // 增加輸入框高度
                        }
                      }}
                    />
                  )}
                />
                <DatePicker
                  label="結束日期"
                  value={filter.endDate}
                  onChange={(newValue) => handleFilterChange('endDate', newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      sx={{
                        width: 180,
                        '& .MuiInputBase-root': {
                          height: 44 // 增加輸入框高度
                        }
                      }}
                    />
                  )}
                />
                <Button
                  size="small"
                  onClick={handleClearFilter}
                  sx={{
                    height: 44, // 增加按鈕高度
                    minWidth: 90 // 確保按鈕有足夠寬度
                  }}
                >
                  清除篩選
                </Button>
              </Box>
            </Paper>
          )}

          {/* 交易群組表格 - 使用 DataGrid */}
          <Box sx={{ p: 2, width: '100%', maxWidth: '100%', overflow: 'hidden', bgcolor: 'background.default' }}>
            <Fade in={!loading} timeout={800} appear={true}>
              <Box sx={{
                position: 'relative',
                width: '100%',
                opacity: loading ? 0 : 1,
                transition: 'opacity 0.8s ease-in-out, transform 0.6s ease-out',
                transform: loading ? 'translateY(10px)' : 'translateY(0)',
                bgcolor: 'background.paper',
                borderRadius: 1,
                border: 1,
                borderColor: 'divider',
                boxShadow: 1,
                overflow: 'hidden'
              }}>
                {transactionGroups.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <ReceiptIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      尚無交易記錄
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      開始建立您的第一筆複式記帳交易
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={onCreateNew}
                    >
                      建立交易
                    </Button>
                  </Box>
                ) : (
                 <DataGrid
                   rows={rows}
                   columns={columns}
                   checkboxSelection={false}
                   disableSelectionOnClick
                   loading={false} // 由於我們自己控制載入效果，這裡設為false
                   autoHeight
                   getRowId={(row) => row.id}
                   rowBuffer={10} // 優化虛擬滾動，減少預渲染的行數
                   rowsPerPageOptions={[25, 50, 100]}
                   initialState={{
                     pagination: {
                       pageSize: 25,
                     },
                   }}
                   pagination
                   paginationMode="server"
                   page={filter.page - 1} // DataGrid 頁碼從 0 開始，而 API 從 1 開始
                   pageSize={filter.limit}
                   onPageChange={(newPage) => handleFilterChange('page', newPage + 1)} // +1 轉換為 API 頁碼
                   onPageSizeChange={(newPageSize) => handleFilterChange('limit', newPageSize)}
                   rowCount={pagination?.total || 0} // 使用後端返回的總記錄數
                   rowHeight={70} // 增加列高，給按鈕更多空間
                   columnVisibilityModel={{
                     // 確保操作列始終可見
                     actions: true
                   }}
                   sx={{
                     // 基本樣式
                     '& .MuiDataGrid-main': {
                       bgcolor: 'background.paper'
                     },
                     '& .MuiDataGrid-root': {
                       border: 'none', // 移除 DataGrid 自帶的邊框，因為我們已經為容器添加了邊框
                       boxShadow: '0 2px 4px rgba(0,0,0,0.05)' // 添加輕微陰影
                     },
                     // 表頭樣式 - 使用主題的淡色
                     '& .MuiDataGrid-columnHeaders': {
                       bgcolor: 'action.hover', // 使用主題的淡色
                       borderBottom: '1px solid',
                       borderColor: 'divider',
                       height: 48, // 固定表頭高度
                       '& .MuiDataGrid-columnHeaderTitle': {
                         fontWeight: 600 // 加粗表頭文字
                       }
                     },
                     // 基本行樣式 - 簡化，移除動畫效果
                     '& .MuiDataGrid-row': {
                       bgcolor: 'background.paper',
                       '&:hover': {
                         bgcolor: 'action.hover' // 懸停效果
                       },
                       '&:nth-of-type(even)': {
                         bgcolor: 'action.hover' // 斑馬紋效果
                       }
                     },
                     // 分頁控制區域
                     '& .MuiDataGrid-footerContainer': {
                       borderTop: '1px solid',
                       borderColor: 'divider',
                       bgcolor: 'background.paper'
                     }
                   }}
                   localeText={{
                     noRowsLabel: '沒有交易記錄',
                     footerRowSelected: (count: number) => `已選擇 ${count} 個項目`,
                     columnMenuLabel: '選單',
                     columnMenuShowColumns: '顯示欄位',
                     columnMenuFilter: '篩選',
                     columnMenuHideColumn: '隱藏',
                     columnMenuUnsort: '取消排序',
                     columnMenuSortAsc: '升序排列',
                     columnMenuSortDesc: '降序排列',
                     filterPanelAddFilter: '新增篩選',
                     filterPanelDeleteIconLabel: '刪除',
                     filterPanelOperator: '運算子',
                     filterPanelOperatorAnd: '與',
                     filterPanelOperatorOr: '或',
                     filterPanelColumns: '欄位',
                     filterPanelInputLabel: '值',
                     filterPanelInputPlaceholder: '篩選值',
                     columnsPanelTextFieldLabel: '尋找欄位',
                     columnsPanelTextFieldPlaceholder: '欄位名稱',
                     columnsPanelDragIconLabel: '重新排序欄位',
                     columnsPanelShowAllButton: '顯示全部',
                     columnsPanelHideAllButton: '隱藏全部',
                     toolbarDensity: '密度',
                     toolbarDensityLabel: '密度',
                     toolbarDensityCompact: '緊湊',
                     toolbarDensityStandard: '標準',
                     toolbarDensityComfortable: '舒適',
                     toolbarExport: '匯出',
                     toolbarExportLabel: '匯出',
                     toolbarExportCSV: '下載CSV',
                     toolbarExportPrint: '列印',
                     toolbarColumns: '欄位',
                     toolbarColumnsLabel: '選擇欄位',
                     toolbarFilters: '篩選',
                     toolbarFiltersLabel: '顯示篩選',
                     toolbarFiltersTooltipHide: '隱藏篩選',
                     toolbarFiltersTooltipShow: '顯示篩選',
                     toolbarQuickFilterPlaceholder: '搜尋...',
                     toolbarQuickFilterLabel: '搜尋',
                     toolbarQuickFilterDeleteIconLabel: '清除',
                     paginationRowsPerPage: '每頁行數:',
                     paginationPageSize: '頁面大小',
                     paginationLabelDisplayedRows: ({ from, to, count }: { from: number; to: number; count: number }) => {
                       const countDisplay = count !== -1 ? count.toString() : '超過 ' + to;
                       return `${from}-${to} / ${countDisplay}`;
                     },
                     paginationLabelRowsPerPage: '每頁行數:'
                   } as Partial<GridLocaleText>}
                 />
               )}
             </Box>
           </Fade>
           
           <Box
             sx={{
               position: 'absolute',
               top: 0,
               left: 0,
               width: '100%',
               height: '100%', // 確保填滿整個容器高度
               minHeight: '70vh', // 確保至少佔據70%的視窗高度
               opacity: loading ? 1 : 0,
               visibility: loading ? 'visible' : 'hidden',
               transition: 'opacity 0.8s ease-in-out, visibility 0.8s ease-in-out',
               overflow: 'hidden',
               bgcolor: 'background.paper',
               borderRadius: 1,
               border: 'none', // 不需要為骨架屏添加邊框，因為它在容器內部
               zIndex: 1 // 確保骨架屏在數據表格之上
             }}
           >
             {renderSkeleton()}
           </Box>
         </Box>
       </Box>
     </Paper>
   </LocalizationProvider>
  );
};

export default AccountingDataGridWithEntries3;