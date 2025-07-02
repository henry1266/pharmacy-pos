import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Chip,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse
} from '@mui/material';
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  ColumnDef,
  flexRender,
  Row,
  ExpandedState
} from '@tanstack/react-table';
import {
  AccountBalance as AccountIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  Business as EquityIcon,
  Speed as QuickRecordIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Receipt as ReceiptIcon,
  Business,
  ExpandMore as ExpandMoreIcon,
  ChevronRight as ChevronRightIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Organization } from '@pharmacy-pos/shared/types/organization';
import { Account2, Category2, AccountingRecord2 } from '@pharmacy-pos/shared/types/accounting2';
import { accounting2Service } from '../../services/accounting2Service';

interface AccountingDataGridProps {
  selectedOrganizationId: string | null;
  organizations: Organization[];
  onAddAccount?: () => void;
  onAddCategory?: (type: 'income' | 'expense', parentId?: string, organizationId?: string | null) => void;
  onAddRecord?: () => void;
  onQuickRecord?: (type: 'income' | 'expense', categoryId: string, organizationId?: string | null) => void;
}

interface TreeRowData {
  id: string;
  name: string;
  type: 'organization' | 'section' | 'account' | 'category' | 'record';
  amount?: number;
  count?: number;
  icon?: React.ReactNode;
  color?: string;
  parentId?: string;
  level: number;
  isExpandable: boolean;
  organizationId?: string | null;
  categoryType?: 'income' | 'expense';
  originalData?: Account2 | Category2 | AccountingRecord2;
  subRows?: TreeRowData[];
}

const AccountingDataGrid: React.FC<AccountingDataGridProps> = ({
  selectedOrganizationId,
  organizations,
  onAddAccount,
  onAddCategory,
  onAddRecord,
  onQuickRecord
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account2[]>([]);
  const [categories, setCategories] = useState<Category2[]>([]);
  const [records, setRecords] = useState<AccountingRecord2[]>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  // 載入資料
  useEffect(() => {
    loadData();
  }, [selectedOrganizationId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [accountsRes, categoriesRes, recordsRes] = await Promise.all([
        accounting2Service.accounts.getAll(selectedOrganizationId),
        accounting2Service.categories.getAll({ organizationId: selectedOrganizationId }),
        // 載入所有記錄，不限制機構，讓前端進行過濾
        accounting2Service.records.getAll({
          organizationId: undefined, // 不限制機構，載入所有記錄
          page: 1,
          limit: 1000
        })
      ]);

      console.log('🔍 DataGrid 載入資料結果:', {
        selectedOrganizationId,
        accounts: accountsRes.success ? accountsRes.data.length : 0,
        categories: categoriesRes.success ? categoriesRes.data.length : 0,
        records: recordsRes.success ? recordsRes.data.records.length : 0,
        recordsWithOrgId: recordsRes.success ? recordsRes.data.records.filter(r => r.organizationId === selectedOrganizationId).length : 0
      });

      if (accountsRes.success) setAccounts(accountsRes.data);
      if (categoriesRes.success) setCategories(categoriesRes.data);
      if (recordsRes.success) setRecords(recordsRes.data.records);
    } catch (error) {
      console.error('載入資料失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 計算帳戶餘額
  const calculateAccountBalance = (accountId: string): number => {
    return records
      .filter(record => {
        const recordAccountId = typeof record.accountId === 'string'
          ? record.accountId
          : record.accountId._id;
        return recordAccountId === accountId;
      })
      .reduce((total, record) => {
        if (record.type === 'income') {
          return total + record.amount;
        } else if (record.type === 'expense') {
          return total - record.amount;
        }
        return total;
      }, 0);
  };

  // 計算類別總額
  const calculateCategoryTotal = (categoryId: string, includeChildren: boolean = true): number => {
    let total = 0;
    
    // 找到目標類別
    const targetCategory = categories.find(cat => cat._id === categoryId);
    if (!targetCategory) {
      console.warn(`⚠️ 找不到類別 ${categoryId}`);
      return 0;
    }

    // 如果選擇了機構，檢查類別是否屬於該機構
    if (selectedOrganizationId) {
      const categoryOrgId = targetCategory.organizationId;
      if (categoryOrgId !== selectedOrganizationId) {
        console.log(`🚫 類別 ${targetCategory.name} 不屬於選擇的機構 ${selectedOrganizationId}，跳過計算`);
        return 0;
      }
    }
    
    const categoryRecords = records.filter(record => {
      const recordCategoryId = typeof record.categoryId === 'string'
        ? record.categoryId
        : record.categoryId._id;
      
      // 只檢查類別ID匹配，不再檢查記錄的機構ID
      // 因為已經在上面檢查過類別是否屬於選擇的機構
      return recordCategoryId === categoryId;
    });

    console.log(`💰 計算類別 ${targetCategory.name} (${categoryId}) 總額:`, {
      categoryId,
      categoryName: targetCategory.name,
      categoryOrgId: targetCategory.organizationId,
      selectedOrganizationId,
      matchedRecords: categoryRecords.length,
      recordDetails: categoryRecords.map(r => ({
        id: r._id,
        amount: r.amount,
        type: r.type,
        organizationId: r.organizationId,
        description: r.description
      }))
    });

    total += categoryRecords.reduce((sum, record) => {
      if (record.type === 'income') {
        return sum + record.amount;
      } else if (record.type === 'expense') {
        return sum + record.amount;
      }
      return sum;
    }, 0);

    if (includeChildren) {
      const childCategories = categories.filter(cat => cat.parentId === categoryId);
      childCategories.forEach(child => {
        total += calculateCategoryTotal(child._id, true);
      });
    }

    return total;
  };

  // 建立樹狀資料結構
  const treeData = useMemo((): TreeRowData[] => {
    const getOrganizationName = (): string => {
      if (!selectedOrganizationId) return '個人帳務';
      const org = organizations.find(o => o._id === selectedOrganizationId);
      return org?.name || '未知機構';
    };

    // 調試：輸出所有類別信息
    console.log('🔍 所有類別數據:', categories.map(cat => ({
      id: cat._id,
      name: cat.name,
      type: cat.type,
      parentId: cat.parentId || 'ROOT'
    })));

    // 股東權益分類
    const equityKeywords = ['股東', '資本', '保留', '盈餘', '權益', '股本'];
    const equityCategories = categories.filter(cat =>
      equityKeywords.some(keyword => cat.name.includes(keyword))
    );
    
    const incomeCategories = categories.filter(cat =>
      cat.type === 'income' && !equityKeywords.some(keyword => cat.name.includes(keyword))
    );
    
    const expenseCategories = categories.filter(cat => cat.type === 'expense');

    // 調試：輸出分類結果
    console.log('📊 分類結果:', {
      equity: equityCategories.map(c => c.name),
      income: incomeCategories.map(c => c.name),
      expense: expenseCategories.map(c => c.name)
    });

    // 計算總額
    const totalAccountBalance = accounts.reduce((sum, acc) => {
      const recordBalance = calculateAccountBalance(acc._id);
      return sum + acc.initialBalance + recordBalance;
    }, 0);

    const equityTotal = equityCategories
      .filter(cat => !cat.parentId)
      .reduce((sum, cat) => sum + calculateCategoryTotal(cat._id), 0);

    const incomeTotal = incomeCategories
      .filter(cat => !cat.parentId)
      .reduce((sum, cat) => sum + calculateCategoryTotal(cat._id), 0);

    const expenseTotal = expenseCategories
      .filter(cat => !cat.parentId)
      .reduce((sum, cat) => sum + calculateCategoryTotal(cat._id), 0);

    // 建立類別子樹 - 支援多層級遞歸
    const buildCategoryTree = (categoryList: Category2[], level: number): TreeRowData[] => {
      console.log(`🌳 buildCategoryTree 輸入 (level ${level}):`, categoryList.map(c => ({
        id: c._id,
        name: c.name,
        parentId: c.parentId || 'ROOT'
      })));

      // 如果是第一層調用，只取根類別（沒有 parentId 的）
      // 如果是遞歸調用，則使用傳入的 categoryList
      const categoriesToProcess = level === 1
        ? categoryList.filter(cat => !cat.parentId)
        : categoryList;
      
      console.log(`🔧 處理類別 (level ${level}):`, categoriesToProcess.map(c => c.name));
      
      return categoriesToProcess.map(category => {
        // 找出當前類別的直接子類別
        const children = categories.filter(cat => cat.parentId === category._id);
        console.log(`👶 ${category.name} 的子類別:`, children.map(c => c.name));
        
        const categoryTotal = calculateCategoryTotal(category._id, true);
        const categoryRecords = records.filter(record => {
          const recordCategoryId = typeof record.categoryId === 'string'
            ? record.categoryId
            : record.categoryId._id;
          return recordCategoryId === category._id;
        });

        const subRows: TreeRowData[] = [];
        
        // 遞歸添加子類別
        if (children.length > 0) {
          console.log(`🔄 遞歸處理 ${category.name} 的 ${children.length} 個子類別`);
          subRows.push(...buildCategoryTree(children, level + 1));
        }

        const result: TreeRowData = {
          id: `category-${category._id}`,
          name: category.name,
          type: 'category' as const,
          amount: categoryTotal,
          count: categoryRecords.length,
          level,
          isExpandable: children.length > 0,
          organizationId: category.organizationId,
          categoryType: category.type,
          originalData: category,
          subRows
        };

        console.log(`✅ 建立節點: ${category.name} (level ${level}, 子項目: ${subRows.length})`);
        return result;
      });
    };

    // 建立帳戶子樹
    const buildAccountTree = (level: number): TreeRowData[] => {
      return accounts.map(account => {
        const accountBalance = account.initialBalance + calculateAccountBalance(account._id);
        const accountRecords = records.filter(record => {
          const recordAccountId = typeof record.accountId === 'string'
            ? record.accountId
            : record.accountId._id;
          return recordAccountId === account._id;
        });

        return {
          id: `account-${account._id}`,
          name: account.name,
          type: 'account',
          amount: accountBalance,
          count: accountRecords.length,
          level,
          isExpandable: false,
          organizationId: account.organizationId,
          originalData: account,
          subRows: []
        };
      });
    };

    // 主樹狀結構 - 直接從四大分類開始
    const tree: TreeRowData[] = [
      // 股東權益
      {
        id: 'equity-section',
        name: '股東權益',
        type: 'section',
        amount: equityTotal,
        count: equityCategories.length,
        level: 0,
        isExpandable: true,
        icon: <EquityIcon />,
        color: '#2e7d32',
        categoryType: 'income',
        subRows: buildCategoryTree(equityCategories, 1)
      },
      // 資產帳戶
      {
        id: 'account-section',
        name: '資產帳戶',
        type: 'section',
        amount: totalAccountBalance,
        count: accounts.length,
        level: 0,
        isExpandable: true,
        icon: <AccountIcon />,
        color: '#1976d2',
        subRows: buildAccountTree(1)
      },
      // 收入類別
      {
        id: 'income-section',
        name: '收入類別',
        type: 'section',
        amount: incomeTotal,
        count: incomeCategories.length,
        level: 0,
        isExpandable: true,
        icon: <IncomeIcon />,
        color: '#388e3c',
        categoryType: 'income',
        subRows: buildCategoryTree(incomeCategories, 1)
      },
      // 支出類別
      {
        id: 'expense-section',
        name: '支出類別',
        type: 'section',
        amount: expenseTotal,
        count: expenseCategories.length,
        level: 0,
        isExpandable: true,
        icon: <ExpenseIcon />,
        color: '#d32f2f',
        categoryType: 'expense',
        subRows: buildCategoryTree(expenseCategories, 1)
      }
    ];

    return tree;
  }, [accounts, categories, records, organizations, selectedOrganizationId]);

  // 定義表格欄位
  const columns = useMemo<ColumnDef<TreeRowData>[]>(() => [
    {
      id: 'name',
      header: '項目名稱',
      cell: ({ row, getValue }) => {
        const canExpand = row.getCanExpand();
        const isExpanded = row.getIsExpanded();
        const level = row.original.level;
        const paddingLeft = level * 24;

        return (
          <Box sx={{ display: 'flex', alignItems: 'center', pl: `${paddingLeft}px` }}>
            {canExpand && (
              <IconButton
                size="small"
                onClick={row.getToggleExpandedHandler()}
                sx={{ mr: 1 }}
              >
                {isExpanded ? <ExpandMoreIcon /> : <ChevronRightIcon />}
              </IconButton>
            )}
            {row.original.icon && (
              <Box sx={{ mr: 1, color: row.original.color || 'inherit' }}>
                {row.original.icon}
              </Box>
            )}
            <Typography variant="body2" fontWeight={level === 0 ? 'bold' : 'normal'}>
              {getValue() as string}
            </Typography>
          </Box>
        );
      },
      accessorKey: 'name'
    },
    {
      id: 'count',
      header: '項目數',
      cell: ({ getValue }) => {
        const count = getValue() as number;
        return count ? (
          <Chip label={`${count} 項目`} size="small" variant="outlined" />
        ) : null;
      },
      accessorKey: 'count'
    },
    {
      id: 'amount',
      header: '金額',
      cell: ({ row, getValue }) => {
        const amount = getValue() as number;
        const type = row.original.type;
        
        if (amount === undefined) return null;

        const color = type === 'section' && row.original.categoryType === 'expense' 
          ? 'error.main' 
          : 'success.main';

        return (
          <Typography
            variant="body2"
            sx={{
              color,
              fontWeight: 'medium',
              textAlign: 'right'
            }}
          >
            {new Intl.NumberFormat('zh-TW', {
              style: 'currency',
              currency: 'TWD',
              minimumFractionDigits: 0
            }).format(amount)}
          </Typography>
        );
      },
      accessorKey: 'amount'
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => {
        const rowData = row.original;
        
        if (rowData.type === 'category') {
          return (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="查看詳細">
                <IconButton
                  size="small"
                  onClick={() => {
                    const category = rowData.originalData as Category2;
                    navigate(`/accounting2/category/${category._id}`);
                  }}
                  sx={{ color: 'info.main' }}
                >
                  <ViewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="快速記帳">
                <IconButton
                  size="small"
                  onClick={() => {
                    const category = rowData.originalData as Category2;
                    onQuickRecord?.(category.type, category._id, rowData.organizationId);
                  }}
                  sx={{ color: 'success.main' }}
                >
                  <QuickRecordIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="新增子類別">
                <IconButton
                  size="small"
                  onClick={() => {
                    const category = rowData.originalData as Category2;
                    onAddCategory?.(category.type, category._id, rowData.organizationId);
                  }}
                  sx={{ color: 'primary.main' }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          );
        }

        if (rowData.type === 'account') {
          return (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Tooltip title="查看詳細">
                <IconButton
                  size="small"
                  onClick={() => {
                    const account = rowData.originalData as Account2;
                    navigate(`/accounting2/account/${account._id}`);
                  }}
                  sx={{ color: 'info.main' }}
                >
                  <ViewIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          );
        }

        if (rowData.type === 'section') {
          return (
            <Tooltip title={`新增${rowData.name}`}>
              <IconButton
                size="small"
                onClick={() => {
                  if (rowData.id === 'account-section') {
                    onAddAccount?.();
                  } else if (rowData.categoryType) {
                    onAddCategory?.(rowData.categoryType, undefined, selectedOrganizationId);
                  }
                }}
                sx={{ color: 'primary.main' }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          );
        }

        return null;
      }
    }
  ], [onQuickRecord, onAddCategory, onAddAccount, selectedOrganizationId]);

  // 建立表格實例
  const table = useReactTable({
    data: treeData,
    columns,
    state: {
      expanded
    },
    onExpandedChange: setExpanded,
    getSubRows: row => row.subRows,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel()
  });

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>載入中...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* 標題區域 */}
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Business />
          財務總覽 - 樹狀表格視圖
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9 }}>
          使用 TanStack Table 實現的專業樹狀結構
        </Typography>
      </Paper>

      {/* 表格容器 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableCell key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.map(row => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 操作說明 */}
      <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
        <Typography variant="body2" color="text.secondary">
          💡 使用說明：點擊箭頭展開/收合項目，點擊 👁️ 查看詳細，點擊 ⚡ 快速記帳，點擊 ➕ 新增子項目
        </Typography>
      </Paper>
    </Box>
  );
};

export default AccountingDataGrid;