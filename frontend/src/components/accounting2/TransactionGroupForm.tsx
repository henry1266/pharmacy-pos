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
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Upload as UploadIcon,
  Receipt as ReceiptIcon,
  Speed as SpeedIcon,
  Help as HelpIcon,
  Close as CloseIcon
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
  attachments?: File[];
  entries: AccountingEntryFormData[];
}

export interface AccountingEntryFormData {
  accountId: string;
  debitAmount: number;
  creditAmount: number;
  description: string;
}

// 資料轉換工具函數
const convertBackendEntryToFormData = (backendEntry: any): AccountingEntryFormData => {
  return {
    accountId: backendEntry.accountId || '',
    debitAmount: backendEntry.debitAmount || 0,
    creditAmount: backendEntry.creditAmount || 0,
    description: backendEntry.description || ''
  };
};

const convertBackendDataToFormData = (backendData: any): Partial<TransactionGroupFormData> => {
  if (!backendData) return {};
  
  return {
    description: backendData.description || '',
    transactionDate: backendData.transactionDate ? new Date(backendData.transactionDate) : new Date(),
    organizationId: backendData.organizationId || undefined,
    receiptUrl: backendData.receiptUrl || '',
    invoiceNo: backendData.invoiceNo || '',
    entries: Array.isArray(backendData.entries)
      ? backendData.entries.map(convertBackendEntryToFormData)
      : []
  };
};

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

  // 建立預設的兩個空分錄
  const createDefaultEntries = (): AccountingEntryFormData[] => [
    {
      accountId: '',
      debitAmount: 0,
      creditAmount: 0,
      description: ''
    },
    {
      accountId: '',
      debitAmount: 0,
      creditAmount: 0,
      description: ''
    }
  ];

  // 表單狀態
  const [formData, setFormData] = useState<TransactionGroupFormData>(() => {
    // 如果有初始資料，使用轉換後的資料初始化
    if (initialData) {
      const convertedData = convertBackendDataToFormData(initialData);
      const entries = convertedData.entries && convertedData.entries.length >= 2
        ? convertedData.entries
        : createDefaultEntries();
      
      return {
        description: convertedData.description || '',
        transactionDate: convertedData.transactionDate || new Date(),
        organizationId: convertedData.organizationId,
        receiptUrl: convertedData.receiptUrl || '',
        invoiceNo: convertedData.invoiceNo || '',
        attachments: [],
        entries
      };
    }
    
    // 預設狀態
    return {
      description: '',
      transactionDate: new Date(),
      organizationId: undefined,
      receiptUrl: '',
      invoiceNo: '',
      attachments: [],
      entries: createDefaultEntries()
    };
  });

  // 驗證狀態
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [balanceError, setBalanceError] = useState<string>('');

  // 檔案上傳狀態
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  // 對話框狀態
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [quickStartOpen, setQuickStartOpen] = useState(false);

  // 初始化表單資料
  useEffect(() => {
    if (initialData) {
      console.log('🔄 初始化表單資料:', initialData);
      
      // 使用轉換函數處理後端資料
      const convertedData = convertBackendDataToFormData(initialData);
      console.log('✅ 轉換後的表單資料:', convertedData);
      
      // 如果沒有分錄或分錄少於2筆，補充預設分錄
      const entries = convertedData.entries && convertedData.entries.length >= 2
        ? convertedData.entries
        : createDefaultEntries();
      
      // 完全重置表單資料，確保複製模式下能正常編輯
      setFormData({
        description: convertedData.description || '',
        transactionDate: convertedData.transactionDate || new Date(),
        organizationId: convertedData.organizationId,
        receiptUrl: convertedData.receiptUrl || '',
        invoiceNo: convertedData.invoiceNo || '',
        attachments: [],
        entries
      });
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

    // 分錄驗證邏輯
    if (mode === 'create') {
      // 建立模式：必須有完整的分錄
      if (!formData.entries || formData.entries.length === 0) {
        newErrors.entries = '請至少新增一筆分錄';
        setBalanceError('');
      } else if (formData.entries.length < 2) {
        newErrors.entries = '複式記帳至少需要兩筆分錄';
        setBalanceError('');
      } else {
        // 檢查每筆分錄是否完整
        const invalidEntries = formData.entries.filter(entry =>
          !entry.accountId ||
          (!entry.debitAmount && !entry.creditAmount) ||
          (entry.debitAmount > 0 && entry.creditAmount > 0)
        );

        if (invalidEntries.length > 0) {
          newErrors.entries = '請完整填寫所有分錄的會計科目和金額';
          setBalanceError('');
        } else {
          // 檢查借貸平衡
          const totalDebit = formData.entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
          const totalCredit = formData.entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
          const difference = Math.abs(totalDebit - totalCredit);

          if (difference > 0.01) {
            setBalanceError(`借貸不平衡，差額：NT$ ${difference.toFixed(2)}`);
          } else {
            setBalanceError('');
          }
        }
      }
    } else if (mode === 'edit') {
      // 編輯模式：分錄是可選的，但如果有分錄則必須完整
      if (formData.entries && formData.entries.length > 0) {
        if (formData.entries.length < 2) {
          newErrors.entries = '如要更新分錄，複式記帳至少需要兩筆分錄';
          setBalanceError('');
        } else {
          // 檢查每筆分錄是否完整
          const invalidEntries = formData.entries.filter(entry =>
            !entry.accountId ||
            (!entry.debitAmount && !entry.creditAmount) ||
            (entry.debitAmount > 0 && entry.creditAmount > 0)
          );

          if (invalidEntries.length > 0) {
            newErrors.entries = '如要更新分錄，請完整填寫所有分錄的會計科目和金額';
            setBalanceError('');
          } else {
            // 檢查借貸平衡
            const totalDebit = formData.entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
            const totalCredit = formData.entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
            const difference = Math.abs(totalDebit - totalCredit);

            if (difference > 0.01) {
              setBalanceError(`借貸不平衡，差額：NT$ ${difference.toFixed(2)}`);
            } else {
              setBalanceError('');
            }
          }
        }
      } else {
        // 編輯模式沒有分錄，清除相關錯誤
        setBalanceError('');
      }
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
      description: entry.description || `${template.name} - 分錄 ${index + 1}`
    }));

    setFormData(prev => ({
      ...prev,
      description: prev.description || template.name,
      entries: templateEntries
    }));

    // 選擇範本後關閉對話框
    setTemplateDialogOpen(false);
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
    
    console.log('🔍 表單提交前檢查:', {
      mode,
      description: formData.description,
      transactionDate: formData.transactionDate,
      organizationId: formData.organizationId,
      entriesCount: formData.entries?.length || 0,
      entries: formData.entries
    });
    
    if (!validateForm()) {
      console.log('❌ 表單驗證失敗:', errors);
      console.log('❌ 借貸平衡錯誤:', balanceError);
      return;
    }

    try {
      // 清理表單資料，確保 organizationId 格式正確
      const cleanedFormData: any = {
        description: formData.description,
        transactionDate: formData.transactionDate,
        receiptUrl: formData.receiptUrl,
        invoiceNo: formData.invoiceNo,
        // 如果 organizationId 是空字串或 undefined，則設為 null
        organizationId: formData.organizationId && formData.organizationId.trim() !== ''
          ? formData.organizationId
          : null
      };

      // 檢查分錄是否完整且有效
      const hasValidEntries = formData.entries &&
        formData.entries.length >= 2 &&
        formData.entries.every(entry =>
          entry.accountId &&
          (entry.debitAmount > 0 || entry.creditAmount > 0) &&
          !(entry.debitAmount > 0 && entry.creditAmount > 0)
        );

      // 檢查借貸平衡
      const totalDebit = formData.entries?.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0) || 0;
      const totalCredit = formData.entries?.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0) || 0;
      const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

      // 只有在以下情況才傳送分錄：
      // 1. 建立模式 (必須有分錄)
      // 2. 編輯模式且分錄完整有效且平衡
      if (mode === 'create') {
        // 建立模式必須有分錄
        cleanedFormData.entries = formData.entries;
      } else if (mode === 'edit' && hasValidEntries && isBalanced) {
        // 編輯模式只有在分錄完整有效時才更新分錄
        cleanedFormData.entries = formData.entries;
        console.log('📝 編輯模式：將更新分錄');
      } else {
        // 編輯模式但分錄不完整，只更新基本資訊
        console.log('📝 編輯模式：僅更新基本資訊，不更新分錄');
      }
      
      console.log('✅ 表單驗證通過，提交資料:', cleanedFormData);
      console.log('📊 分錄詳情:', cleanedFormData.entries);
      console.log('🔍 分錄驗證結果:', { hasValidEntries, isBalanced, totalDebit, totalCredit });
      
      await onSubmit(cleanedFormData);
    } catch (error) {
      console.error('❌ 提交交易群組失敗:', error);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
      <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
        {/* 基本資訊卡片 */}
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title={mode === 'create' ? '基本資訊' : '基本資訊'}
            avatar={<ReceiptIcon color="primary" />}
            action={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  disabled={uploadingReceipt}
                  size="small"
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
                  <Typography variant="body2" color="success.main" sx={{ ml: 1 }}>
                    ✓
                  </Typography>
                )}
              </Box>
            }
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

            </Grid>
          </CardContent>
        </Card>


        {/* 借貸分錄表單 */}
        <Card sx={{ mb: 3, boxShadow: 2 }}>
          <CardHeader
            title="借貸分錄"
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SpeedIcon />}
                  onClick={() => setTemplateDialogOpen(true)}
                  sx={{
                    color: 'primary.contrastText',
                    borderColor: 'primary.contrastText',
                    '&:hover': {
                      borderColor: 'primary.contrastText',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  快速範本
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<HelpIcon />}
                  onClick={() => setQuickStartOpen(true)}
                  sx={{
                    color: 'primary.contrastText',
                    borderColor: 'primary.contrastText',
                    '&:hover': {
                      borderColor: 'primary.contrastText',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  快速入門
                </Button>
              </Box>
            }
            sx={{
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '& .MuiCardHeader-subheader': {
                color: 'primary.contrastText',
                opacity: 0.8
              }
            }}
          />
          <CardContent sx={{ pt: 3 }}>
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
          
          <Tooltip
            title={
              isLoading ? '處理中...' :
              !!balanceError ? balanceError :
              mode === 'create' && formData.entries.length === 0 ? '請先新增分錄' :
              mode === 'create' && formData.entries.length < 2 ? '至少需要兩筆分錄' :
              Object.keys(errors).length > 0 ? '請修正表單錯誤' :
              mode === 'create' ? '點擊建立交易' : '點擊更新交易'
            }
          >
            <span>
              <Button
                type="submit"
                variant="contained"
                disabled={
                  isLoading ||
                  !!balanceError ||
                  (mode === 'create' && formData.entries.length < 2) ||
                  Object.keys(errors).length > 0
                }
                startIcon={<SaveIcon />}
              >
                {isLoading ? '儲存中...' : mode === 'create' ? '建立交易' : '更新交易'}
              </Button>
            </span>
          </Tooltip>
        </Box>

        {/* 快速範本對話框 */}
        <Dialog
          open={templateDialogOpen}
          onClose={() => setTemplateDialogOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: 4
            }
          }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SpeedIcon color="primary" />
                <Typography variant="h6" component="div">
                  快速範本選擇
                </Typography>
              </Box>
              <IconButton
                onClick={() => setTemplateDialogOpen(false)}
                size="small"
                sx={{ color: 'grey.500' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              選擇適合的交易範本可以快速建立標準的複式記帳分錄
            </Typography>
            <TransactionTemplateSelector
              onSelectTemplate={handleTemplateSelect}
              organizationId={formData.organizationId}
            />
          </DialogContent>
          
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              onClick={() => setTemplateDialogOpen(false)}
              variant="outlined"
            >
              取消
            </Button>
          </DialogActions>
        </Dialog>

        {/* 快速入門對話框 */}
        <Dialog
          open={quickStartOpen}
          onClose={() => setQuickStartOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 2,
              boxShadow: 4
            }
          }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <HelpIcon color="info" />
                <Typography variant="h6" component="div">
                  複式記帳快速入門
                </Typography>
              </Box>
              <IconButton
                onClick={() => setQuickStartOpen(false)}
                size="small"
                sx={{ color: 'grey.500' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ pt: 2 }}>
            <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
              複式記帳是一種確保財務記錄準確性的會計方法，每筆交易都會同時影響兩個或多個會計科目。
            </Typography>

            <Typography variant="h6" sx={{ mb: 2, color: 'primary.main' }}>
              📝 操作步驟：
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2">
                <strong>💡 請為每筆分錄選擇會計科目並輸入金額</strong>
              </Typography>
            </Alert>

            <Box component="ol" sx={{ pl: 2, mb: 3, '& li': { mb: 1.5 } }}>
              <li>
                <Typography variant="body2">
                  <strong>選擇第一筆分錄的會計科目</strong>並輸入金額（借方或貸方）
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>選擇第二筆分錄的會計科目</strong>並輸入對應金額
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  <strong>確保借方總額 = 貸方總額</strong>（系統會自動檢查平衡）
                </Typography>
              </li>
              <li>
                <Typography variant="body2">
                  可使用上方<strong>「快速範本」</strong>快速建立常用交易類型
                </Typography>
              </li>
            </Box>

            <Alert severity="success" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>💡 小提示：</strong>
                每筆交易的借方總額必須等於貸方總額，這是複式記帳的基本原則。
              </Typography>
            </Alert>

            <Typography variant="h6" sx={{ mb: 2, color: 'success.main' }}>
              🎯 常見交易範例：
            </Typography>
            
            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.primary' }}>
                現金收入（例如：銷售商品收到現金）
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 借方：現金 $1,000<br/>
                • 貸方：銷售收入 $1,000
              </Typography>
            </Box>

            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.primary' }}>
                費用支出（例如：支付辦公用品費用）
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • 借方：辦公費用 $500<br/>
                • 貸方：現金 $500
              </Typography>
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button
              onClick={() => setQuickStartOpen(false)}
              variant="contained"
              sx={{ minWidth: 100 }}
            >
              開始記帳
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default TransactionGroupForm;