import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountTree as AccountTreeIcon,
  MonetizationOn as MonetizationOnIcon
} from '@mui/icons-material';

// 科目類型定義
interface AccountType {
  value: string;
  label: string;
  description: string;
  normalBalance: 'debit' | 'credit';
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  icon: React.ReactNode;
  examples: string[];
}

// 預設科目類型
const DEFAULT_ACCOUNT_TYPES: AccountType[] = [
  {
    value: 'asset',
    label: '資產',
    description: '企業擁有的經濟資源，能為企業帶來未來經濟效益',
    normalBalance: 'debit',
    color: 'success',
    icon: <MonetizationOnIcon />,
    examples: ['現金', '銀行存款', '應收帳款', '存貨', '固定資產']
  },
  {
    value: 'liability',
    label: '負債',
    description: '企業對外部的債務或義務',
    normalBalance: 'credit',
    color: 'error',
    icon: <TrendingDownIcon />,
    examples: ['應付帳款', '短期借款', '長期負債', '應付薪資']
  },
  {
    value: 'equity',
    label: '權益',
    description: '股東對企業的所有權權益',
    normalBalance: 'credit',
    color: 'primary',
    icon: <AccountBalanceIcon />,
    examples: ['股本', '保留盈餘', '資本公積', '未分配盈餘']
  },
  {
    value: 'revenue',
    label: '收入',
    description: '企業營業活動產生的收入',
    normalBalance: 'credit',
    color: 'info',
    icon: <TrendingUpIcon />,
    examples: ['銷貨收入', '服務收入', '利息收入', '其他收入']
  },
  {
    value: 'expense',
    label: '費用',
    description: '企業為獲得收入而發生的成本支出',
    normalBalance: 'debit',
    color: 'warning',
    icon: <AccountTreeIcon />,
    examples: ['銷貨成本', '管理費用', '營業費用', '利息費用']
  }
];

/**
 * 帳戶類型管理組件
 * 
 * 功能：
 * - 顯示所有科目類型的詳細資訊
 * - 提供科目類型的說明和範例
 * - 管理科目類型的設定（未來擴展）
 */
const AccountTypeManagement: React.FC = () => {
  const [accountTypes] = useState<AccountType[]>(DEFAULT_ACCOUNT_TYPES);
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // 處理查看詳情
  const handleViewDetails = (accountType: AccountType) => {
    setSelectedType(accountType);
    setEditMode(false);
    setDialogOpen(true);
  };

  // 處理編輯（預留功能）
  const handleEdit = (accountType: AccountType) => {
    setSelectedType(accountType);
    setEditMode(true);
    setDialogOpen(true);
  };

  // 關閉對話框
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedType(null);
    setEditMode(false);
  };

  // 取得餘額方向的中文說明
  const getBalanceDirectionLabel = (direction: 'debit' | 'credit') => {
    return direction === 'debit' ? '借方' : '貸方';
  };

  // 取得餘額方向的顏色
  const getBalanceDirectionColor = (direction: 'debit' | 'credit') => {
    return direction === 'debit' ? 'success' : 'error';
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* 頁面標題和說明 */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          會計科目類型管理
        </Typography>
        <Typography variant="body1" color="text.secondary">
          管理和查看會計科目的分類設定，包括資產、負債、權益、收入、費用等基本類型
        </Typography>
      </Box>

      {/* 統計概覽卡片 */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MonetizationOnIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" color="success.main">
                資產
              </Typography>
              <Typography variant="body2" color="text.secondary">
                借方餘額
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingDownIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" color="error.main">
                負債
              </Typography>
              <Typography variant="body2" color="text.secondary">
                貸方餘額
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AccountBalanceIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" color="primary.main">
                權益
              </Typography>
              <Typography variant="body2" color="text.secondary">
                貸方餘額
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" color="info.main">
                收入
              </Typography>
              <Typography variant="body2" color="text.secondary">
                貸方餘額
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <AccountTreeIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6" color="warning.main">
                費用
              </Typography>
              <Typography variant="body2" color="text.secondary">
                借方餘額
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 科目類型表格 */}
      <Paper elevation={1}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>類型</TableCell>
                <TableCell>名稱</TableCell>
                <TableCell>說明</TableCell>
                <TableCell>正常餘額</TableCell>
                <TableCell>常見科目範例</TableCell>
                <TableCell align="center">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {accountTypes.map((accountType) => (
                <TableRow key={accountType.value} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {accountType.icon}
                      <Chip
                        label={accountType.value.toUpperCase()}
                        color={accountType.color}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {accountType.label}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {accountType.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getBalanceDirectionLabel(accountType.normalBalance)}
                      color={getBalanceDirectionColor(accountType.normalBalance)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {accountType.examples.slice(0, 3).map((example, index) => (
                        <Chip
                          key={index}
                          label={example}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      ))}
                      {accountType.examples.length > 3 && (
                        <Chip
                          label={`+${accountType.examples.length - 3}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.75rem' }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="查看詳情">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(accountType)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 詳情對話框 */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {selectedType?.icon}
            {selectedType?.label} 類型詳情
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedType && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    類型代碼
                  </Typography>
                  <Chip
                    label={selectedType.value.toUpperCase()}
                    color={selectedType.color}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    正常餘額方向
                  </Typography>
                  <Chip
                    label={getBalanceDirectionLabel(selectedType.normalBalance)}
                    color={getBalanceDirectionColor(selectedType.normalBalance)}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    類型說明
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {selectedType.description}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    常見科目範例
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedType.examples.map((example, index) => (
                      <Chip
                        key={index}
                        label={example}
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Alert severity="info">
                    <Typography variant="body2">
                      <strong>會計原理說明：</strong><br />
                      • <strong>借方餘額</strong>：增加時記借方，減少時記貸方<br />
                      • <strong>貸方餘額</strong>：增加時記貸方，減少時記借方<br />
                      • 所有交易都必須遵循「借貸平衡」原則
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleCloseDialog}>
            關閉
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccountTypeManagement;