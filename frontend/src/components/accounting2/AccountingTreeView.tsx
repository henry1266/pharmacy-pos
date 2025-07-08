import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  Collapse
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  AccountBalance as AccountIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  Business as EquityIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Business,
  Category as CategoryIcon,
  ChevronRight as ChevronRightIcon,
  Receipt as ReceiptIcon,
  Speed as QuickRecordIcon
} from '@mui/icons-material';
import { Organization } from '@pharmacy-pos/shared/types/organization';
import { Account2, Category2, AccountingRecord2 } from '@pharmacy-pos/shared/types/accounting2';
import { accountApiClient, transactionApiClient, categoryApiClient } from './core/api-clients';

interface AccountingTreeViewProps {
  selectedOrganizationId: string | null;
  organizations: Organization[];
  onAddAccount?: () => void;
  onAddCategory?: (type: 'income' | 'expense', parentId?: string, organizationId?: string | null) => void;
  onAddRecord?: () => void;
  onQuickRecord?: (type: 'income' | 'expense', categoryId: string, organizationId?: string | null) => void;
}

interface CategorySummary {
  type: 'equity' | 'account' | 'income' | 'expense';
  name: string;
  icon: React.ReactNode;
  color: string;
  total: number;
  count: number;
  items: (Account2 | Category2)[];
}

interface CategoryWithChildren extends Category2 {
  children: Category2[];
  records: AccountingRecord2[];
}

const AccountingTreeView: React.FC<AccountingTreeViewProps> = ({
  selectedOrganizationId,
  organizations,
  onAddAccount,
  onAddCategory,
  onAddRecord,
  onQuickRecord
}) => {
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account2[]>([]);
  const [categories, setCategories] = useState<Category2[]>([]);
  const [records, setRecords] = useState<AccountingRecord2[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['account']));
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // 載入資料
  useEffect(() => {
    loadData();
  }, [selectedOrganizationId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const accountParams = selectedOrganizationId ? { organizationId: selectedOrganizationId } : {};
      const categoryParams = selectedOrganizationId ? { organizationId: selectedOrganizationId } : {};
      const recordParams = {
        organizationId: selectedOrganizationId,
        page: 1,
        limit: 1000 // 載入所有記錄用於計算總額
      };

      const [accountsRes, categoriesRes, recordsRes] = await Promise.all([
        accountApiClient.getAccounts(accountParams),
        categoryApiClient.getCategories(categoryParams),
        transactionApiClient.getTransactions(recordParams)
      ]);

      setAccounts(accountsRes.data);
      setCategories(categoriesRes.data);
      // 注意：transactionApiClient 回傳的是 TransactionGroup[]，但此組件需要 AccountingRecord2[]
      // 暫時使用空陣列，後續需要建立適配器或使用不同的 API
      setRecords([]);
      
      console.log('⚠️ AccountingTreeView: 記錄載入暫時禁用，需要建立 TransactionGroup 到 AccountingRecord2 的適配器');
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

  // 計算類別總額（包含子類別）
  const calculateCategoryTotal = (categoryId: string, includeChildren: boolean = true): number => {
    let total = 0;
    
    // 計算當前類別的記錄
    const categoryRecords = records.filter(record => {
      const recordCategoryId = typeof record.categoryId === 'string'
        ? record.categoryId
        : record.categoryId._id;
      return recordCategoryId === categoryId;
    });

    total += categoryRecords.reduce((sum, record) => {
      if (record.type === 'income') {
        return sum + record.amount;
      } else if (record.type === 'expense') {
        return sum + record.amount; // 支出用正數顯示
      }
      return sum;
    }, 0);

    // 如果需要包含子類別，遞歸計算
    if (includeChildren) {
      const childCategories = categories.filter(cat => cat.parentId === categoryId);
      childCategories.forEach(child => {
        total += calculateCategoryTotal(child._id, true);
      });
    }

    return total;
  };

  // 獲取類別的記錄
  const getCategoryRecords = (categoryId: string): AccountingRecord2[] => {
    return records.filter(record => {
      const recordCategoryId = typeof record.categoryId === 'string'
        ? record.categoryId
        : record.categoryId._id;
      return recordCategoryId === categoryId;
    });
  };

  // 獲取帳戶的記錄
  const getAccountRecords = (accountId: string): AccountingRecord2[] => {
    return records.filter(record => {
      const recordAccountId = typeof record.accountId === 'string'
        ? record.accountId
        : record.accountId._id;
      return recordAccountId === accountId;
    });
  };

  // 建立類別樹狀結構
  const buildCategoryTree = (categoryType: 'income' | 'expense'): CategoryWithChildren[] => {
    const rootCategories = categories.filter(cat => 
      cat.type === categoryType && !cat.parentId
    );

    return rootCategories.map(category => ({
      ...category,
      children: categories.filter(cat => cat.parentId === category._id),
      records: getCategoryRecords(category._id)
    }));
  };

  // 組織分類摘要
  const getCategorySummaries = (): CategorySummary[] => {
    // 更智能的股東權益分類
    const equityKeywords = ['股東', '資本', '保留', '盈餘', '權益', '股本'];
    const equityCategories = categories.filter(cat =>
      equityKeywords.some(keyword => cat.name.includes(keyword))
    );
    
    const incomeCategories = categories.filter(cat =>
      cat.type === 'income' && !equityKeywords.some(keyword => cat.name.includes(keyword))
    );
    
    const expenseCategories = categories.filter(cat => cat.type === 'expense');

    // 計算帳戶總餘額（包含初始餘額）
    const totalAccountBalance = accounts.reduce((sum, acc) => {
      const recordBalance = calculateAccountBalance(acc._id);
      return sum + acc.initialBalance + recordBalance;
    }, 0);

    return [
      {
        type: 'equity',
        name: '股東權益',
        icon: <EquityIcon />,
        color: '#2e7d32',
        total: equityCategories
          .filter(cat => !cat.parentId) // 只計算根類別，避免重複計算
          .reduce((sum, cat) => sum + calculateCategoryTotal(cat._id), 0),
        count: equityCategories.length,
        items: equityCategories
      },
      {
        type: 'account',
        name: '資產帳戶',
        icon: <AccountIcon />,
        color: '#1976d2',
        total: totalAccountBalance,
        count: accounts.length,
        items: accounts
      },
      {
        type: 'income',
        name: '收入類別',
        icon: <IncomeIcon />,
        color: '#388e3c',
        total: incomeCategories
          .filter(cat => !cat.parentId) // 只計算根類別，避免重複計算
          .reduce((sum, cat) => sum + calculateCategoryTotal(cat._id), 0),
        count: incomeCategories.length,
        items: incomeCategories
      },
      {
        type: 'expense',
        name: '支出類別',
        icon: <ExpenseIcon />,
        color: '#d32f2f',
        total: expenseCategories
          .filter(cat => !cat.parentId) // 只計算根類別，避免重複計算
          .reduce((sum, cat) => sum + calculateCategoryTotal(cat._id), 0),
        count: expenseCategories.length,
        items: expenseCategories
      }
    ];
  };

  const handleSectionToggle = (sectionType: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionType)) {
      newExpanded.delete(sectionType);
    } else {
      newExpanded.add(sectionType);
    }
    setExpandedSections(newExpanded);
  };

  const handleCategoryToggle = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('zh-TW', {
      style: 'currency',
      currency: 'TWD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getOrganizationName = (): string => {
    if (!selectedOrganizationId) return '個人帳務';
    const org = organizations.find(o => o._id === selectedOrganizationId);
    return org?.name || '未知機構';
  };

  // 處理新增按鈕點擊
  const handleAddClick = (summaryType: string, parentId?: string) => {
    switch (summaryType) {
      case 'account':
        onAddAccount?.();
        break;
      case 'income':
        onAddCategory?.('income', parentId, selectedOrganizationId);
        break;
      case 'expense':
        onAddCategory?.('expense', parentId, selectedOrganizationId);
        break;
      case 'equity':
        // 股東權益通常是收入類別的特殊分類
        onAddCategory?.('income', parentId, selectedOrganizationId);
        break;
      default:
        console.warn('未知的新增類型:', summaryType);
    }
  };

  // 處理子類別新增
  const handleAddSubCategory = (parentCategory: Category2) => {
    // 從父類別中獲取機構ID
    const categoryOrgId = parentCategory.organizationId || null;
    
    console.log('handleAddSubCategory 調用:', {
      parentCategory: parentCategory.name,
      parentId: parentCategory._id,
      type: parentCategory.type,
      categoryOrgId,
      selectedOrganizationId
    });
    
    onAddCategory?.(parentCategory.type, parentCategory._id, categoryOrgId);
  };

  // 處理快速記帳
  const handleQuickRecord = (category: Category2) => {
    const categoryOrgId = category.organizationId || selectedOrganizationId;
    
    console.log('handleQuickRecord 調用:', {
      categoryName: category.name,
      categoryId: category._id,
      type: category.type,
      organizationId: categoryOrgId
    });
    
    onQuickRecord?.(category.type, category._id, categoryOrgId);
  };

  // 渲染類別項目（支援子類別）
  const renderCategoryItem = (category: Category2, level: number = 0) => {
    const children = categories.filter(cat => cat.parentId === category._id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedCategories.has(category._id);
    const categoryTotal = calculateCategoryTotal(category._id, true); // 包含子類別金額
    const categoryRecords = getCategoryRecords(category._id);

    return (
      <React.Fragment key={category._id}>
        <ListItem
          sx={{
            pl: 4 + level * 2,
            '&:hover': { bgcolor: 'action.hover' }
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            {hasChildren ? (
              <IconButton
                size="small"
                onClick={() => handleCategoryToggle(category._id)}
                sx={{ p: 0.5 }}
              >
                <ChevronRightIcon
                  sx={{
                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}
                />
              </IconButton>
            ) : (
              <CategoryIcon />
            )}
          </ListItemIcon>
          <ListItemText
            primary={category.name}
            secondary={`${categoryRecords.length} 筆記錄`}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="body2"
              sx={{
                color: category.type === 'expense' ? 'error.main' : 'success.main',
                fontWeight: 'medium',
                minWidth: '100px',
                textAlign: 'right'
              }}
            >
              {formatCurrency(categoryTotal)}
            </Typography>
            <Tooltip title="快速記帳">
              <IconButton
                size="small"
                onClick={() => handleQuickRecord(category)}
                sx={{
                  color: 'success.main',
                  '&:hover': { bgcolor: 'success.light', color: 'white' }
                }}
              >
                <QuickRecordIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="新增子類別">
              <IconButton
                size="small"
                onClick={() => handleAddSubCategory(category)}
                sx={{
                  color: 'primary.main',
                  '&:hover': { bgcolor: 'primary.light', color: 'white' }
                }}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="查看記錄">
              <IconButton size="small">
                <ReceiptIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </ListItem>

        {/* 顯示該類別的記錄 */}
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <List dense sx={{ pl: 2 }}>
            {categoryRecords.map((record) => {
              const account = accounts.find(acc => {
                const recordAccountId = typeof record.accountId === 'string'
                  ? record.accountId
                  : record.accountId._id;
                return acc._id === recordAccountId;
              });

              return (
                <ListItem
                  key={record._id}
                  sx={{
                    pl: 6 + level * 2,
                    bgcolor: 'grey.50',
                    '&:hover': { bgcolor: 'grey.100' }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <ReceiptIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={record.description || '無描述'}
                    secondary={`${account?.name || '未知帳戶'} • ${new Date(record.date).toLocaleDateString('zh-TW')}`}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: record.type === 'expense' ? 'error.main' : 'success.main',
                      fontWeight: 'medium',
                      minWidth: '100px',
                      textAlign: 'right'
                    }}
                  >
                    {formatCurrency(record.amount)}
                  </Typography>
                </ListItem>
              );
            })}
          </List>
        </Collapse>

        {/* 遞歸渲染子類別 */}
        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List dense>
              {children.map(child => renderCategoryItem(child, level + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  // 渲染帳戶項目（顯示相關記錄）
  const renderAccountItem = (account: Account2) => {
    const accountRecords = getAccountRecords(account._id);
    const accountBalance = account.initialBalance + calculateAccountBalance(account._id);
    const isExpanded = expandedCategories.has(account._id);

    return (
      <React.Fragment key={account._id}>
        <ListItem
          sx={{
            pl: 4,
            '&:hover': { bgcolor: 'action.hover' }
          }}
        >
          <ListItemIcon sx={{ minWidth: 40 }}>
            <IconButton
              size="small"
              onClick={() => handleCategoryToggle(account._id)}
              sx={{ p: 0.5 }}
            >
              <ChevronRightIcon
                sx={{
                  transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s'
                }}
              />
            </IconButton>
          </ListItemIcon>
          <ListItemText
            primary={account.name}
            secondary={`${account.type} • ${accountRecords.length} 筆記錄`}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="body2"
              sx={{
                color: accountBalance >= 0 ? 'success.main' : 'error.main',
                fontWeight: 'medium',
                minWidth: '100px',
                textAlign: 'right'
              }}
            >
              {formatCurrency(accountBalance)}
            </Typography>
            <Tooltip title="查看記錄">
              <IconButton size="small">
                <ReceiptIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </ListItem>

        {/* 顯示該帳戶的記錄 */}
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <List dense sx={{ pl: 2 }}>
            {accountRecords.map((record) => {
              const category = categories.find(cat => {
                const recordCategoryId = typeof record.categoryId === 'string'
                  ? record.categoryId
                  : record.categoryId._id;
                return cat._id === recordCategoryId;
              });

              return (
                <ListItem
                  key={record._id}
                  sx={{
                    pl: 6,
                    bgcolor: 'grey.50',
                    '&:hover': { bgcolor: 'grey.100' }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <ReceiptIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={record.description || '無描述'}
                    secondary={`${category?.name || '未知類別'} • ${new Date(record.date).toLocaleDateString('zh-TW')}`}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      color: record.type === 'expense' ? 'error.main' : 'success.main',
                      fontWeight: 'medium',
                      minWidth: '100px',
                      textAlign: 'right'
                    }}
                  >
                    {record.type === 'expense' ? '-' : '+'}{formatCurrency(record.amount)}
                  </Typography>
                </ListItem>
              );
            })}
          </List>
        </Collapse>
      </React.Fragment>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const categorySummaries = getCategorySummaries();

  return (
    <Box>
      {/* 機構標題 */}
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h5" component="h2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Business />
          {getOrganizationName()}
        </Typography>
      </Paper>

      {/* 分類樹狀結構 */}
      <Box>
        {categorySummaries.map((summary) => (
          <Accordion
            key={summary.type}
            expanded={expandedSections.has(summary.type)}
            onChange={() => handleSectionToggle(summary.type)}
            sx={{ mb: 1 }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                bgcolor: `${summary.color}10`,
                '&:hover': { bgcolor: `${summary.color}20` }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                <Box sx={{ color: summary.color }}>
                  {summary.icon}
                </Box>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  {summary.name}
                </Typography>
                <Chip
                  label={`${summary.count} 項目`}
                  size="small"
                  variant="outlined"
                  sx={{ mr: 2 }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    color: summary.type === 'expense' ? 'error.main' : 'success.main',
                    fontWeight: 'bold',
                    minWidth: '120px',
                    textAlign: 'right'
                  }}
                >
                  {formatCurrency(summary.total)}
                </Typography>
              </Box>
            </AccordionSummary>
            
            <AccordionDetails sx={{ p: 0 }}>
              {summary.items.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                  <Typography>尚無{summary.name}項目</Typography>
                </Box>
              ) : (
                <List dense>
                  {summary.type === 'account' 
                    ? summary.items.map(item => renderAccountItem(item as Account2))
                    : summary.items
                        .filter(item => !(item as Category2).parentId) // 只顯示根類別
                        .map(item => renderCategoryItem(item as Category2))
                  }
                </List>
              )}
              
              {/* 新增按鈕 */}
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
                <Tooltip title={`新增${summary.name}`}>
                  <IconButton
                    color="primary"
                    onClick={() => handleAddClick(summary.type)}
                    sx={{
                      border: 1,
                      borderColor: 'primary.main',
                      borderStyle: 'dashed',
                      width: '100%',
                      py: 1
                    }}
                  >
                    <AddIcon />
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      新增{summary.name}
                    </Typography>
                  </IconButton>
                </Tooltip>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>

      {/* 總計摘要 */}
      <Paper sx={{ p: 2, mt: 2, bgcolor: 'grey.100' }}>
        <Typography variant="h6" gutterBottom>
          財務摘要
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
          {categorySummaries.map((summary) => (
            <Box key={summary.type} sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                {summary.name}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: summary.type === 'expense' ? 'error.main' : 'success.main',
                  fontWeight: 'bold'
                }}
              >
                {formatCurrency(summary.total)}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default AccountingTreeView;