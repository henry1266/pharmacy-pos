import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Alert
} from '@mui/material';
import {
  AccountBalance as BankIcon,
  AttachMoney as CashIcon,
  Receipt as ExpenseIcon,
  Work as SalaryIcon,
  SwapHoriz as TransferIcon,
  ShoppingCart as PurchaseIcon,
  Sell as SaleIcon,
  Preview as PreviewIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { AccountingEntryFormData } from './DoubleEntryForm';

export interface TransactionTemplate {
  id: string;
  name: string;
  description: string;
  category: 'income' | 'expense' | 'transfer' | 'adjustment';
  icon: React.ReactNode;
  color: string;
  entries: Omit<AccountingEntryFormData, 'accountId'>[];
  accountMappings: {
    [key: string]: {
      name: string;
      accountType: string;
      normalBalance: 'debit' | 'credit';
      required: boolean;
    };
  };
}

interface TransactionTemplateSelectorProps {
  onSelectTemplate: (template: TransactionTemplate, accountMappings: { [key: string]: string }) => void;
  organizationId?: string;
}

// 預設交易範本
const defaultTemplates: TransactionTemplate[] = [
  {
    id: 'cash-income',
    name: '現金收入',
    description: '現金銷售、服務收入等',
    category: 'income',
    icon: <CashIcon />,
    color: '#4caf50',
    entries: [
      { debitAmount: 0, creditAmount: 0, description: '現金收入' },
      { debitAmount: 0, creditAmount: 0, description: '銷售收入' }
    ],
    accountMappings: {
      'cash': {
        name: '現金',
        accountType: '資產',
        normalBalance: 'debit',
        required: true
      },
      'revenue': {
        name: '銷售收入',
        accountType: '收入',
        normalBalance: 'credit',
        required: true
      }
    }
  },
  {
    id: 'bank-transfer',
    name: '銀行轉帳',
    description: '銀行間資金轉移',
    category: 'transfer',
    icon: <TransferIcon />,
    color: '#2196f3',
    entries: [
      { debitAmount: 0, creditAmount: 0, description: '轉入銀行' },
      { debitAmount: 0, creditAmount: 0, description: '轉出銀行' }
    ],
    accountMappings: {
      'bank_in': {
        name: '轉入銀行',
        accountType: '資產',
        normalBalance: 'debit',
        required: true
      },
      'bank_out': {
        name: '轉出銀行',
        accountType: '資產',
        normalBalance: 'debit',
        required: true
      }
    }
  },
  {
    id: 'expense-payment',
    name: '費用支出',
    description: '一般營業費用支付',
    category: 'expense',
    icon: <ExpenseIcon />,
    color: '#f44336',
    entries: [
      { debitAmount: 0, creditAmount: 0, description: '費用支出' },
      { debitAmount: 0, creditAmount: 0, description: '現金/銀行' }
    ],
    accountMappings: {
      'expense': {
        name: '費用科目',
        accountType: '費用',
        normalBalance: 'debit',
        required: true
      },
      'payment': {
        name: '付款方式',
        accountType: '資產',
        normalBalance: 'debit',
        required: true
      }
    }
  },
  {
    id: 'salary-payment',
    name: '薪資發放',
    description: '員工薪資及相關費用',
    category: 'expense',
    icon: <SalaryIcon />,
    color: '#ff9800',
    entries: [
      { debitAmount: 0, creditAmount: 0, description: '薪資費用' },
      { debitAmount: 0, creditAmount: 0, description: '勞保費' },
      { debitAmount: 0, creditAmount: 0, description: '健保費' },
      { debitAmount: 0, creditAmount: 0, description: '應付薪資' }
    ],
    accountMappings: {
      'salary_expense': {
        name: '薪資費用',
        accountType: '費用',
        normalBalance: 'debit',
        required: true
      },
      'labor_insurance': {
        name: '勞保費',
        accountType: '費用',
        normalBalance: 'debit',
        required: false
      },
      'health_insurance': {
        name: '健保費',
        accountType: '費用',
        normalBalance: 'debit',
        required: false
      },
      'payable_salary': {
        name: '應付薪資',
        accountType: '負債',
        normalBalance: 'credit',
        required: true
      }
    }
  },
  {
    id: 'purchase-inventory',
    name: '進貨付款',
    description: '商品進貨及付款',
    category: 'expense',
    icon: <PurchaseIcon />,
    color: '#9c27b0',
    entries: [
      { debitAmount: 0, creditAmount: 0, description: '進貨' },
      { debitAmount: 0, creditAmount: 0, description: '應付帳款/現金' }
    ],
    accountMappings: {
      'inventory': {
        name: '存貨',
        accountType: '資產',
        normalBalance: 'debit',
        required: true
      },
      'payment_method': {
        name: '付款方式',
        accountType: '資產或負債',
        normalBalance: 'credit',
        required: true
      }
    }
  },
  {
    id: 'sales-receivable',
    name: '賒銷交易',
    description: '賒帳銷售交易',
    category: 'income',
    icon: <SaleIcon />,
    color: '#00bcd4',
    entries: [
      { debitAmount: 0, creditAmount: 0, description: '應收帳款' },
      { debitAmount: 0, creditAmount: 0, description: '銷售收入' }
    ],
    accountMappings: {
      'receivable': {
        name: '應收帳款',
        accountType: '資產',
        normalBalance: 'debit',
        required: true
      },
      'sales_revenue': {
        name: '銷售收入',
        accountType: '收入',
        normalBalance: 'credit',
        required: true
      }
    }
  }
];

export const TransactionTemplateSelector: React.FC<TransactionTemplateSelectorProps> = ({
  onSelectTemplate,
  organizationId
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TransactionTemplate | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // 按類別分組範本
  const templatesByCategory = defaultTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, TransactionTemplate[]>);

  const categoryLabels = {
    income: '收入類',
    expense: '支出類',
    transfer: '轉帳類',
    adjustment: '調整類'
  };

  const handleTemplateSelect = (template: TransactionTemplate) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const handleConfirmSelection = () => {
    if (selectedTemplate) {
      // 這裡應該開啟會計科目對應選擇器
      // 暫時使用空的對應
      onSelectTemplate(selectedTemplate, {});
      setPreviewOpen(false);
      setSelectedTemplate(null);
    }
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setSelectedTemplate(null);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        選擇交易範本
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        選擇適合的交易範本可以快速建立標準的複式記帳分錄
      </Alert>

      {Object.entries(templatesByCategory).map(([category, templates]) => (
        <Box key={category} sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
            {categoryLabels[category as keyof typeof categoryLabels]}
          </Typography>
          
          <Grid container spacing={2}>
            {templates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 4
                    }
                  }}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box 
                        sx={{ 
                          color: template.color,
                          mr: 2,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {template.icon}
                      </Box>
                      <Typography variant="h6" component="div">
                        {template.name}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {template.description}
                    </Typography>
                    
                    <Chip 
                      label={`${template.entries.length} 筆分錄`}
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: template.color, color: template.color }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}

      {/* 範本預覽對話框 */}
      <Dialog 
        open={previewOpen} 
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {selectedTemplate?.icon && (
                <Box sx={{ color: selectedTemplate.color, mr: 2 }}>
                  {selectedTemplate.icon}
                </Box>
              )}
              <Typography variant="h6">
                {selectedTemplate?.name} - 範本預覽
              </Typography>
            </Box>
            <IconButton onClick={handleClosePreview}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          {selectedTemplate && (
            <Box>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {selectedTemplate.description}
              </Typography>

              <Typography variant="subtitle2" sx={{ mb: 2 }}>
                需要對應的會計科目：
              </Typography>
              
              <List>
                {Object.entries(selectedTemplate.accountMappings).map(([key, mapping]) => (
                  <ListItem key={key}>
                    <ListItemIcon>
                      <PreviewIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={mapping.name}
                      secondary={`${mapping.accountType} | 正常餘額：${mapping.normalBalance === 'debit' ? '借方' : '貸方'} | ${mapping.required ? '必填' : '選填'}`}
                    />
                  </ListItem>
                ))}
              </List>

              <Typography variant="subtitle2" sx={{ mt: 3, mb: 2 }}>
                將產生 {selectedTemplate.entries.length} 筆分錄：
              </Typography>
              
              <List>
                {selectedTemplate.entries.map((entry, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={`分錄 ${index + 1}`}
                      secondary={entry.description}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClosePreview}>
            取消
          </Button>
          <Button 
            variant="contained" 
            onClick={handleConfirmSelection}
            sx={{ bgcolor: selectedTemplate?.color }}
          >
            使用此範本
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TransactionTemplateSelector;