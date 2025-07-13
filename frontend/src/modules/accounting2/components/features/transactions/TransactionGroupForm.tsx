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
  DialogActions,
  Chip,
  FormControlLabel,
  Switch,
  Badge
} from '@mui/material';
//import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zhTW } from 'date-fns/locale';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
//import { DoubleEntryForm } from './DoubleEntryForm';
//import { TransactionTemplateSelector } from './TransactionTemplateSelector';
//import { FundingSourceSelector } from '../../ui/FundingSourceSelector';
import {
  FUNDING_TYPES,
  TRANSACTION_STATUS,
  TransactionValidator,
  TransactionDataConverter,
  TransactionStatusManager
} from '@pharmacy-pos/shared';
//import { transactionGroupService } from '@services/transactionGroupService';
//import { TransactionUtils } from '@utils/transactionUtils';

export interface TransactionGroupFormData {
  description: string;
  transactionDate: Date;
  organizationId?: string;
  receiptUrl?: string;
  invoiceNo?: string;
  attachments?: File[];
  entries: AccountingEntryFormData[];
  // 資金來源追蹤欄位
  linkedTransactionIds?: string[];
  sourceTransactionId?: string;
  fundingType?: 'original' | 'extended' | 'transfer';
}

export interface AccountingEntryFormData {
  accountId: string;
  debitAmount: number;
  creditAmount: number;
  description: string;
  // 資金來源追蹤欄位
  sourceTransactionId?: string;
  fundingPath?: string[];
}

// 使用 shared 的資料轉換工具
const convertBackendDataToFormData = (backendData: any): Partial<TransactionGroupFormData> => {
  if (!backendData) {
    console.warn('⚠️ convertBackendDataToFormData: 收到空的後端資料');
    return {};
  }
  
  console.log('🔍 convertBackendDataToFormData - 原始資料:', {
    hasData: !!backendData,
    description: backendData.description,
    transactionDate: backendData.transactionDate,
    organizationId: backendData.organizationId,
    hasTransactionGroup: !!backendData.transactionGroup,
    hasEntries: !!backendData.entries,
    dataKeys: Object.keys(backendData)
  });
  
  try {
    // 使用 shared 的轉換工具
    const standardData = TransactionDataConverter.convertBackendToStandard(backendData);
    console.log('✅ 轉換後的標準資料:', {
      hasStandardData: !!standardData,
      description: standardData?.description,
      transactionDate: standardData?.transactionDate,
      organizationId: standardData?.organizationId,
      entriesCount: standardData?.entries?.length || 0,
      standardDataKeys: standardData ? Object.keys(standardData) : []
    });
    
    // 檢查轉換結果是否有效
    if (!standardData || Object.keys(standardData).length === 0) {
      console.error('❌ shared 轉換工具回傳空結果');
      throw new Error('轉換結果為空');
    }
    
    // 確保所有必要欄位都有預設值
    const result = {
      description: standardData.description || '',
      transactionDate: standardData.transactionDate || new Date(),
      organizationId: standardData.organizationId || undefined,
      receiptUrl: standardData.receiptUrl || '',
      invoiceNo: standardData.invoiceNo || '',
      entries: Array.isArray(standardData.entries) ? standardData.entries : [],
      linkedTransactionIds: standardData.linkedTransactionIds || undefined,
      sourceTransactionId: standardData.sourceTransactionId || undefined,
      fundingType: standardData.fundingType || 'original'
    };
    
    console.log('🎯 最終表單資料:', {
      description: result.description,
      transactionDate: result.transactionDate,
      organizationId: result.organizationId,
      entriesCount: result.entries.length,
      fundingType: result.fundingType,
      hasDescription: !!result.description,
      hasValidDate: result.transactionDate instanceof Date && !isNaN(result.transactionDate.getTime())
    });
    
    // 最終驗證
    if (!result.description && !result.transactionDate) {
      console.error('❌ 最終結果缺少必要欄位');
      throw new Error('轉換結果缺少必要欄位');
    }
    
    return result;
  } catch (error) {
    console.error('❌ 資料轉換失敗:', error, backendData);
    
    // 嘗試直接從原始資料提取
    console.log('🔄 嘗試直接提取資料...');
    
    // 安全的日期轉換函數
    const safeDateConvert = (dateValue: any): Date => {
      if (!dateValue) return new Date();
      try {
        if (typeof dateValue === 'object' && dateValue.$date) {
          const converted = new Date(dateValue.$date);
          return isNaN(converted.getTime()) ? new Date() : converted;
        }
        const converted = new Date(dateValue);
        return isNaN(converted.getTime()) ? new Date() : converted;
      } catch {
        return new Date();
      }
    };
    
    const fallbackResult = {
      description: backendData.description || backendData.transactionGroup?.description || '',
      transactionDate: safeDateConvert(
        backendData.transactionDate || backendData.transactionGroup?.transactionDate
      ),
      organizationId: backendData.organizationId || backendData.transactionGroup?.organizationId || undefined,
      receiptUrl: backendData.receiptUrl || backendData.transactionGroup?.receiptUrl || '',
      invoiceNo: backendData.invoiceNo || backendData.transactionGroup?.invoiceNo || '',
      entries: [],
      linkedTransactionIds: undefined,
      sourceTransactionId: undefined,
      fundingType: 'original' as const
    };
    
    console.log('🆘 fallback 結果:', fallbackResult);
    return fallbackResult;
  }
};

interface TransactionGroupFormProps {
  initialData?: Partial<TransactionGroupFormData>;
  onSubmit: (data: TransactionGroupFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
  defaultAccountId?: string;
  defaultOrganizationId?: string;
  isCopyMode?: boolean;
  transactionId?: string; // 用於確認交易
  currentStatus?: 'draft' | 'confirmed' | 'cancelled'; // 當前交易狀態
  onStatusChange?: (newStatus: 'draft' | 'confirmed' | 'cancelled') => void; // 狀態變更回調
}

export const TransactionGroupForm: React.FC<TransactionGroupFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create',
  defaultAccountId,
  defaultOrganizationId,
  isCopyMode = false,
  transactionId,
  currentStatus = 'draft',
  onStatusChange
}) => {
  const dispatch = useAppDispatch();
  const { organizations } = useAppSelector(state => state.organization);
  const { user } = useAppSelector(state => state.auth);

  // 建立預設的兩個空分錄
  const createDefaultEntries = (presetAccountId?: string): AccountingEntryFormData[] => [
    {
      accountId: presetAccountId || '',
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
    console.log('🏗️ 初始化 formData state:', {
      hasInitialData: !!initialData,
      isCopyMode,
      defaultAccountId,
      defaultOrganizationId
    });
    
    // 如果有初始資料，使用轉換後的資料初始化
    if (initialData && Object.keys(initialData).length > 0) {
      console.log('🔄 使用 initialData 初始化:', initialData);
      
      try {
        const convertedData = convertBackendDataToFormData(initialData);
        console.log('✅ 初始狀態轉換結果:', convertedData);
        
        // 驗證轉換結果
        if (!convertedData || Object.keys(convertedData).length === 0) {
          console.warn('⚠️ 轉換結果為空，使用預設值');
          return {
            description: '',
            transactionDate: new Date(),
            organizationId: defaultOrganizationId,
            receiptUrl: '',
            invoiceNo: '',
            attachments: [],
            entries: createDefaultEntries(defaultAccountId)
          };
        }
        
        const entries = convertedData.entries && Array.isArray(convertedData.entries) && convertedData.entries.length >= 2
          ? convertedData.entries
          : createDefaultEntries(defaultAccountId);
        
        const description = isCopyMode ? '' : (convertedData.description || '');
        const transactionDate = convertedData.transactionDate || new Date();
        
        console.log('🔍 初始狀態設定:', {
          isCopyMode,
          originalDescription: convertedData.description,
          finalDescription: description,
          transactionDate: transactionDate,
          organizationId: convertedData.organizationId,
          entriesCount: entries.length
        });
        
        const initialFormData: TransactionGroupFormData = {
          description,
          transactionDate,
          organizationId: convertedData.organizationId,
          receiptUrl: convertedData.receiptUrl || '',
          invoiceNo: convertedData.invoiceNo || '',
          attachments: [],
          entries,
          // 資金來源追蹤欄位 - 複製模式下清空
          linkedTransactionIds: isCopyMode ? undefined : convertedData.linkedTransactionIds,
          sourceTransactionId: isCopyMode ? undefined : convertedData.sourceTransactionId,
          fundingType: isCopyMode ? 'original' : (convertedData.fundingType || 'original')
        };
        
        console.log('🎯 初始 formData 設定完成:', {
          description: initialFormData.description,
          transactionDate: initialFormData.transactionDate,
          organizationId: initialFormData.organizationId,
          entriesCount: initialFormData.entries.length
        });
        
        return initialFormData;
        
      } catch (error) {
        console.error('❌ 初始狀態轉換失敗:', error);
        // 回傳安全的預設值
        return {
          description: '',
          transactionDate: new Date(),
          organizationId: defaultOrganizationId,
          receiptUrl: '',
          invoiceNo: '',
          attachments: [],
          entries: createDefaultEntries(defaultAccountId)
        };
      }
    }
    
    // 預設狀態
    console.log('📝 使用預設狀態初始化');
    return {
      description: '',
      transactionDate: new Date(),
      organizationId: defaultOrganizationId,
      receiptUrl: '',
      invoiceNo: '',
      attachments: [],
      entries: createDefaultEntries(defaultAccountId)
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

  // 資金來源追蹤狀態
  const [enableFundingTracking, setEnableFundingTracking] = useState(false);
  const [fundingSourceDialogOpen, setFundingSourceDialogOpen] = useState(false);
  
  // 交易狀態管理
  const [confirmingTransaction, setConfirmingTransaction] = useState(false);

  // 初始化表單資料
  useEffect(() => {
    console.log('🔄 useEffect 觸發 - initialData 變化:', {
      hasInitialData: !!initialData,
      isCopyMode,
      initialDataKeys: initialData ? Object.keys(initialData) : [],
      initialDataDescription: initialData?.description,
      initialDataTransactionDate: initialData?.transactionDate,
      timestamp: new Date().toISOString()
    });
    
    if (initialData && Object.keys(initialData).length > 0) {
      console.log('🔄 開始初始化表單資料:', {
        initialData,
        isCopyMode,
        defaultAccountId
      });
      
      try {
        // 使用轉換函數處理後端資料
        const convertedData = convertBackendDataToFormData(initialData);
        console.log('✅ 轉換後的表單資料:', convertedData);
        
        // 驗證轉換結果
        if (!convertedData || Object.keys(convertedData).length === 0) {
          console.error('❌ 轉換結果為空，使用預設值');
          return;
        }
        
        // 如果沒有分錄或分錄少於2筆，補充預設分錄
        const entries = convertedData.entries && Array.isArray(convertedData.entries) && convertedData.entries.length >= 2
          ? convertedData.entries
          : createDefaultEntries(defaultAccountId);
        
        // 完全重置表單資料，確保複製模式下能正常編輯
        const description = isCopyMode ? '' : (convertedData.description || '');
        const transactionDate = convertedData.transactionDate || new Date();
        
        console.log('🔍 準備設定表單資料:', {
          isCopyMode,
          originalDescription: convertedData.description,
          finalDescription: description,
          transactionDate: transactionDate,
          organizationId: convertedData.organizationId,
          entriesCount: entries.length
        });
        
        const newFormData: TransactionGroupFormData = {
          description,
          transactionDate,
          organizationId: convertedData.organizationId,
          receiptUrl: convertedData.receiptUrl || '',
          invoiceNo: convertedData.invoiceNo || '',
          attachments: [],
          entries,
          // 資金來源追蹤欄位 - 複製模式下清空
          linkedTransactionIds: isCopyMode ? undefined : convertedData.linkedTransactionIds,
          sourceTransactionId: isCopyMode ? undefined : convertedData.sourceTransactionId,
          fundingType: isCopyMode ? 'original' : (convertedData.fundingType || 'original')
        };
        
        console.log('🎯 即將設定新的 formData:', {
          description: newFormData.description,
          transactionDate: newFormData.transactionDate,
          organizationId: newFormData.organizationId,
          entriesCount: newFormData.entries.length,
          fundingType: newFormData.fundingType
        });
        
        setFormData(newFormData);
        
        // 設定資金追蹤開關狀態
        const hasLinkedTransactions = !isCopyMode && convertedData.linkedTransactionIds && convertedData.linkedTransactionIds.length > 0;
        setEnableFundingTracking(hasLinkedTransactions);
        
        console.log('✅ 表單資料設定完成');
        
      } catch (error) {
        console.error('❌ 初始化表單資料失敗:', error);
        // 設定安全的預設值
        setFormData({
          description: '',
          transactionDate: new Date(),
          organizationId: undefined,
          receiptUrl: '',
          invoiceNo: '',
          attachments: [],
          entries: createDefaultEntries(defaultAccountId)
        });
      }
    } else {
      console.log('⚠️ 沒有 initialData 或資料為空，跳過初始化');
    }
  }, [initialData, isCopyMode, defaultAccountId]);

  // 監控 formData.description 的變化
  useEffect(() => {
    console.log('🔍 formData.description 變化:', {
      description: formData.description,
      isCopyMode,
      timestamp: new Date().toISOString()
    });
  }, [formData.description, isCopyMode]);

  // 當 defaultOrganizationId 變化時，重新設置預設機構
  useEffect(() => {
    if (defaultOrganizationId && mode === 'create' && !initialData) {
      console.log('🔄 TransactionGroupForm - 重新設置預設機構，defaultOrganizationId:', defaultOrganizationId);
      setFormData(prev => ({
        ...prev,
        organizationId: defaultOrganizationId
      }));
    }
  }, [defaultOrganizationId, mode, initialData]);

  // 使用 shared 的表單驗證
  const validateForm = (): boolean => {
    try {
      // 準備驗證資料
      const transactionData = {
        description: formData.description,
        transactionDate: formData.transactionDate,
        entries: formData.entries || []
      };

      console.log('🔍 開始驗證交易資料:', transactionData);

      // 根據模式進行不同的驗證
      let validationResult;
      
      if (mode === 'create') {
        // 建立模式：完整驗證
        validationResult = TransactionValidator.validateTransaction(transactionData);
      } else {
        // 編輯模式：基本資訊驗證 + 可選的分錄驗證
        const basicValidation = TransactionValidator.validateBasicInfo(transactionData);
        
        if (formData.entries && formData.entries.length > 0) {
          // 如果有分錄，則驗證分錄
          const entriesValidation = TransactionValidator.validateEntries(formData.entries);
          const balanceValidation = TransactionValidator.validateBalance(formData.entries);
          
          validationResult = {
            isValid: basicValidation.isValid && entriesValidation.isValid && balanceValidation.isValid,
            errors: [...basicValidation.errors, ...entriesValidation.errors, ...balanceValidation.errors]
          };
        } else {
          // 編輯模式沒有分錄，只驗證基本資訊
          validationResult = basicValidation;
        }
      }
      
      console.log('✅ 驗證結果:', validationResult);

      if (validationResult.isValid) {
        setErrors({});
        setBalanceError('');
        return true;
      } else {
        // 處理驗證錯誤
        const newErrors: Record<string, string> = {};
        let balanceErrorMessage = '';
        
        validationResult.errors.forEach(errorMessage => {
          // 檢查是否為借貸平衡錯誤
          if (errorMessage.includes('借貸不平衡')) {
            balanceErrorMessage = errorMessage;
          } else if (errorMessage.includes('請輸入交易描述')) {
            newErrors.description = errorMessage;
          } else if (errorMessage.includes('請選擇交易日期')) {
            newErrors.transactionDate = errorMessage;
          } else {
            // 其他分錄相關錯誤
            newErrors.entries = errorMessage;
          }
        });

        setErrors(newErrors);
        setBalanceError(balanceErrorMessage);
        return false;
      }
    } catch (error) {
      console.error('❌ 驗證過程發生錯誤:', error);
      setErrors({ general: '驗證過程發生錯誤' });
      return false;
    }
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

  // 處理資金來源選擇
  const handleFundingSourceSelect = (sources: any[]) => {
    const linkedTransactionIds = sources.map(source => source._id);
    
    setFormData(prev => ({
      ...prev,
      linkedTransactionIds,
      fundingType: linkedTransactionIds.length > 0 ? 'extended' : 'original'
    }));

    setFundingSourceDialogOpen(false);
  };

  // 處理資金追蹤開關
  const handleFundingTrackingToggle = (enabled: boolean) => {
    setEnableFundingTracking(enabled);
    
    if (!enabled) {
      // 關閉資金追蹤時清除相關資料
      setFormData(prev => ({
        ...prev,
        linkedTransactionIds: undefined,
        sourceTransactionId: undefined,
        fundingType: 'original'
      }));
    }
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
          : null,
        // 資金來源追蹤欄位
        linkedTransactionIds: enableFundingTracking ? formData.linkedTransactionIds : undefined,
        sourceTransactionId: enableFundingTracking ? formData.sourceTransactionId : undefined,
        fundingType: enableFundingTracking ? (formData.fundingType || 'original') : 'original'
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
          
        </Dialog>

      </Box>
    </LocalizationProvider>
  );
};

export default TransactionGroupForm;
