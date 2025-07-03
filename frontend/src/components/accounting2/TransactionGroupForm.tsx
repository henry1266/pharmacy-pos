import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Grid,
  Typography,
  Alert,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Upload as UploadIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zhTW } from 'date-fns/locale';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { DoubleEntryForm } from './DoubleEntryForm';
import { TransactionTemplateSelector } from './TransactionTemplateSelector';

export interface TransactionGroupFormData {
  description: string;
  transactionDate: Date;
  organizationId?: string;
  receiptUrl?: string;
  invoiceNo?: string;
  entries: AccountingEntryFormData[];
}

export interface AccountingEntryFormData {
  accountId: string;
  debitAmount: number;
  creditAmount: number;
  categoryId?: string;
  description: string;
}

interface TransactionGroupFormProps {
  initialData?: Partial<TransactionGroupFormData>;
  onSubmit: (data: TransactionGroupFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
}

export const TransactionGroupForm: React.FC<TransactionGroupFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create'
}) => {
  const dispatch = useAppDispatch();
  const { organizations } = useAppSelector(state => state.organization);
  const { user } = useAppSelector(state => state.auth);

  // 表單狀態
  const [formData, setFormData] = useState<TransactionGroupFormData>({
    description: '',
    transactionDate: new Date(),
    organizationId: undefined,
    receiptUrl: '',
    invoiceNo: '',
    entries: [],
    ...initialData
  });

  // 驗證狀態
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [balanceError, setBalanceError] = useState<string>('');

  // 檔案上傳狀態
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // 初始化表單資料
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [initialData]);

  // 表單驗證
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = '請輸入交易描述';
    }

    if (!formData.transactionDate) {
      newErrors.transactionDate = '請選擇交易日期';
    }

    if (formData.entries.length < 2) {
      newErrors.entries = '至少需要兩筆分錄';
    }

    // 檢查借貸平衡
    const totalDebit = formData.entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
    const totalCredit = formData.entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
    const difference = Math.abs(totalDebit - totalCredit);

    if (difference > 0.01) {
      setBalanceError(`借貸不平衡，差額：${difference.toFixed(2)}`);
    } else {
      setBalanceError('');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && !balanceError;
  };

  // 處理基本資訊變更
  const handleBasicInfoChange = (field: keyof TransactionGroupFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // 清除對應的錯誤
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // 處理分錄變更
  const handleEntriesChange = (entries: AccountingEntryFormData[]) => {
    setFormData(prev => ({
      ...prev,
      entries
    }));

    // 清除分錄錯誤
    if (errors.entries) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.entries;
        return newErrors;
      });
    }
  };

  // 處理範本選擇
  const handleTemplateSelect = (template: any, accountMappings: { [key: string]: string }) => {
    // 根據範本建立分錄
    const templateEntries: AccountingEntryFormData[] = template.entries.map((entry: any, index: number) => ({
      accountId: '', // 需要用戶選擇會計科目
      debitAmount: entry.debitAmount || 0,
      creditAmount: entry.creditAmount || 0,
      categoryId: '',
      description: entry.description || `${template.name} - 分錄 ${index + 1}`
    }));

    setFormData(prev => ({
      ...prev,
      description: prev.description || template.name,
      entries: templateEntries
    }));
  };

  // 處理憑證上傳
  const handleReceiptUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingReceipt(true);
    try {
      // TODO: 實作檔案上傳邏輯
      // const uploadResult = await uploadFile(file);
      // handleBasicInfoChange('receiptUrl', uploadResult.url);
      
      // 暫時模擬上傳
      setTimeout(() => {
        handleBasicInfoChange('receiptUrl', `https://example.com/receipts/${file.name}`);
        setUploadingReceipt(false);
      }, 1000);
    } catch (error) {
      console.error('憑證上傳失敗:', error);
      setUploadingReceipt(false);
    }
  };

  // 提交表單
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // 清理表單資料，確保 organizationId 格式正確
      const cleanedFormData = {
        ...formData,
        // 如果 organizationId 是空字串或 undefined，則設為 null
        organizationId: formData.organizationId && formData.organizationId.trim() !== ''
          ? formData.organizationId
          : null
      };
      
      console.log('🔍 提交表單資料:', cleanedFormData);
      await onSubmit(cleanedFormData);
    } catch (error) {
      console.error('提交交易群組失敗:', error);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
      <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
        {/* 基本資訊卡片 */}
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title={mode === 'create' ? '建立交易群組' : '編輯交易群組'}
            avatar={<ReceiptIcon color="primary" />}
          />
          <CardContent>
            <Grid container spacing={3}>
              {/* 交易描述 */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="交易描述"
                  value={formData.description}
                  onChange={(e) => handleBasicInfoChange('description', e.target.value)}
                  error={!!errors.description}
                  helperText={errors.description}
                  required
                  placeholder="例如：購買辦公用品"
                />
              </Grid>

              {/* 交易日期 */}
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="交易日期"
                  value={formData.transactionDate}
                  onChange={(date) => handleBasicInfoChange('transactionDate', date)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!errors.transactionDate}
                      helperText={errors.transactionDate}
                      required
                    />
                  )}
                />
              </Grid>

              {/* 機構選擇 */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>機構</InputLabel>
                  <Select
                    value={formData.organizationId || ''}
                    onChange={(e) => handleBasicInfoChange('organizationId', e.target.value || undefined)}
                    label="機構"
                  >
                    <MenuItem value="">
                      <em>個人記帳</em>
                    </MenuItem>
                    {organizations.map((org) => (
                      <MenuItem key={org._id} value={org._id}>
                        {org.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* 發票號碼 */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="發票號碼"
                  value={formData.invoiceNo}
                  onChange={(e) => handleBasicInfoChange('invoiceNo', e.target.value)}
                  placeholder="例如：AB-12345678"
                />
              </Grid>

              {/* 憑證上傳 */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<UploadIcon />}
                    disabled={uploadingReceipt}
                  >
                    {uploadingReceipt ? '上傳中...' : '上傳憑證'}
                    <input
                      type="file"
                      hidden
                      accept="image/*,.pdf"
                      onChange={handleReceiptUpload}
                    />
                  </Button>
                  
                  {formData.receiptUrl && (
                    <Typography variant="body2" color="success.main">
                      憑證已上傳
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* 交易範本選擇器 */}
        <Card sx={{ mb: 3 }}>
          <CardHeader title="快速範本" />
          <CardContent>
            <TransactionTemplateSelector
              onSelectTemplate={handleTemplateSelect}
              organizationId={formData.organizationId}
            />
          </CardContent>
        </Card>

        {/* 借貸分錄表單 */}
        <Card sx={{ mb: 3 }}>
          <CardHeader title="借貸分錄" />
          <CardContent>
            {errors.entries && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.entries}
              </Alert>
            )}
            
            {balanceError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {balanceError}
              </Alert>
            )}

            <DoubleEntryForm
              entries={formData.entries}
              onChange={handleEntriesChange}
              organizationId={formData.organizationId}
            />
          </CardContent>
        </Card>

        {/* 操作按鈕 */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={isLoading}
            startIcon={<CancelIcon />}
          >
            取消
          </Button>
          
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading || !!balanceError}
            startIcon={<SaveIcon />}
          >
            {isLoading ? '儲存中...' : mode === 'create' ? '建立交易' : '更新交易'}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default TransactionGroupForm;