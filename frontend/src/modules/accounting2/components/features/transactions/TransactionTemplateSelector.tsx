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

  return (
    <Box>

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

    </Box>
  );
};

export default TransactionTemplateSelector;