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
  Badge,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Upload as UploadIcon,
  Receipt as ReceiptIcon,
  Speed as SpeedIcon,
  Help as HelpIcon,
  Close as CloseIcon,
  AccountTree as AccountTreeIcon,
  Link as LinkIcon,
  CheckCircle as CheckCircleIcon,
  Drafts as DraftIcon,
  Cancel as CancelledIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { zhTW } from 'date-fns/locale';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { DoubleEntryFormWithEntries } from './DoubleEntryFormWithEntries';
import { TransactionTemplateSelector } from './TransactionTemplateSelector';
import { FundingSourceSelector } from './FundingSourceSelector';
import {
  FUNDING_TYPES,
  TRANSACTION_STATUS,
  TransactionValidator,
  TransactionDataConverter,
  TransactionStatusManager,
  EmbeddedAccountingEntryFormData,
  TransactionGroupWithEntriesFormData
} from '@pharmacy-pos/shared';
import { transactionGroupWithEntriesService } from '../../services/transactionGroupWithEntriesService';
import { TransactionUtils } from '../../utils/transactionUtils';

// 使用 shared 的資料轉換工具
const convertBackendDataToFormData = (backendData: any): Partial<TransactionGroupWithEntriesFormData> => {
  if (!backendData) {
    console.warn('⚠️ convertBackendDataToFormData: 收到空的後端資料');
    return {};
  }
  
  console.log('🔍 convertBackendDataToFormData - 原始資料:', {
    hasData: !!backendData,
    description: backendData.description,
    transactionDate: backendData.transactionDate,
    organizationId: backendData.organizationId,
    hasEntries: !!backendData.entries,
    entriesCount: backendData.entries?.length || 0,
    dataKeys: Object.keys(backendData)
  });
  
  try {
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

    // 轉換內嵌分錄
    const convertEntries = (entries: any[]): EmbeddedAccountingEntryFormData[] => {
      if (!Array.isArray(entries)) return [];
      
      return entries.map((entry, index) => ({
        _id: entry._id || undefined,
        sequence: entry.sequence || index + 1,
        accountId: entry.accountId || '',
        debitAmount: entry.debitAmount || 0,
        creditAmount: entry.creditAmount || 0,
        description: entry.description || '',
        sourceTransactionId: entry.sourceTransactionId || undefined,
        fundingPath: entry.fundingPath || undefined
      }));
    };
    
    const result: Partial<TransactionGroupWithEntriesFormData> = {
      description: backendData.description || '',
      transactionDate: safeDateConvert(backendData.transactionDate),
      organizationId: backendData.organizationId || undefined,
      receiptUrl: backendData.receiptUrl || '',
      invoiceNo: backendData.invoiceNo || '',
      entries: convertEntries(backendData.entries || []),
      linkedTransactionIds: backendData.linkedTransactionIds || undefined,
      sourceTransactionId: backendData.sourceTransactionId || undefined,
      fundingType: backendData.fundingType || 'original'
    };
    
    console.log('🎯 轉換後的表單資料:', {
      description: result.description,
      transactionDate: result.transactionDate,
      organizationId: result.organizationId,
      entriesCount: result.entries?.length || 0,
      fundingType: result.fundingType,
      hasDescription: !!result.description,
      hasValidDate: result.transactionDate instanceof Date && !isNaN(result.transactionDate.getTime())
    });
    
    return result;
  } catch (error) {
    console.error('❌ 資料轉換失敗:', error, backendData);
    
    // 嘗試直接從原始資料提取
    console.log('🔄 嘗試直接提取資料...');
    
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
    
    const fallbackResult: Partial<TransactionGroupWithEntriesFormData> = {
      description: backendData.description || '',
      transactionDate: safeDateConvert(backendData.transactionDate),
      organizationId: backendData.organizationId || undefined,
      receiptUrl: backendData.receiptUrl || '',
      invoiceNo: backendData.invoiceNo || '',
      entries: [],
      linkedTransactionIds: undefined,
      sourceTransactionId: undefined,
      fundingType: 'original'
    };
    
    console.log('🆘 fallback 結果:', fallbackResult);
    return fallbackResult;
  }
};

interface TransactionGroupFormWithEntriesProps {
  initialData?: Partial<TransactionGroupWithEntriesFormData>;
  onSubmit: (data: TransactionGroupWithEntriesFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit' | 'view';
  defaultAccountId?: string;
  defaultOrganizationId?: string;
  isCopyMode?: boolean;
  transactionId?: string; // 用於確認交易
  currentStatus?: 'draft' | 'confirmed' | 'cancelled'; // 當前交易狀態
  onStatusChange?: (newStatus: 'draft' | 'confirmed' | 'cancelled') => void; // 狀態變更回調
}

export const TransactionGroupFormWithEntries: React.FC<TransactionGroupFormWithEntriesProps> = ({
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
  const createDefaultEntries = (presetAccountId?: string): EmbeddedAccountingEntryFormData[] => [
    {
      sequence: 1,
      accountId: presetAccountId || '',
      debitAmount: 0,
      creditAmount: 0,
      description: ''
    },
    {
      sequence: 2,
      accountId: '',
      debitAmount: 0,
      creditAmount: 0,
      description: ''
    }
  ];

  // 表單狀態
  const [formData, setFormData] = useState<TransactionGroupWithEntriesFormData>(() => {
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
        
        const initialFormData: TransactionGroupWithEntriesFormData = {
          description,
          transactionDate,
          organizationId: convertedData.organizationId,
          receiptUrl: convertedData.receiptUrl || '',
          invoiceNo: convertedData.invoiceNo || '',
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
  const [selectedFundingSources, setSelectedFundingSources] = useState<Array<{
    _id: string;
    groupNumber: string;
    description: string;
    transactionDate: Date;
    totalAmount: number;
    availableAmount: number;
    fundingType: string;
  }>>([]);
  
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
        
        const newFormData: TransactionGroupWithEntriesFormData = {
          description,
          transactionDate,
          organizationId: convertedData.organizationId,
          receiptUrl: convertedData.receiptUrl || '',
          invoiceNo: convertedData.invoiceNo || '',
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
        
        // 編輯和檢視模式下都需要初始化 selectedFundingSources 狀態
        if (hasLinkedTransactions && convertedData.linkedTransactionIds) {
          console.log('🔍 初始化資金來源顯示狀態 (mode:', mode, ')');
          console.log('🔍 initialData.fundingSourcesInfo:', (initialData as any)?.fundingSourcesInfo);
          console.log('🔍 convertedData.linkedTransactionIds:', convertedData.linkedTransactionIds);
          
          // 優先使用 fundingSourcesInfo，如果沒有則嘗試從 linkedTransactionIds 中提取
          const fundingSourcesInfo = (initialData as any)?.fundingSourcesInfo;
          
          if (fundingSourcesInfo && Array.isArray(fundingSourcesInfo) && fundingSourcesInfo.length > 0) {
            console.log('✅ 使用後端提供的 fundingSourcesInfo');
            const fundingSources = fundingSourcesInfo.map((sourceInfo: any) => ({
              _id: sourceInfo._id,
              groupNumber: sourceInfo.groupNumber || 'TXN-未知',
              description: sourceInfo.description || '未知資金來源',
              transactionDate: new Date(sourceInfo.transactionDate || new Date()),
              totalAmount: sourceInfo.totalAmount || 0,
              availableAmount: sourceInfo.availableAmount || sourceInfo.totalAmount || 0,
              fundingType: sourceInfo.fundingType || '一般資金'
            }));
            
            setSelectedFundingSources(fundingSources);
            console.log('✅ 資金來源狀態初始化完成 (使用 fundingSourcesInfo):', fundingSources);
          } else {
            console.log('⚠️ 沒有 fundingSourcesInfo，嘗試從 linkedTransactionIds 建立基本資料');
            // 如果沒有詳細資訊，從 linkedTransactionIds 建立基本資料
            const fundingSources = convertedData.linkedTransactionIds.map((linkedId: any, index: number) => {
              // 檢查 linkedId 是否為物件（已 populate）還是字串，並確保不為 null
              if (linkedId && typeof linkedId === 'object' && linkedId._id) {
                console.log('✅ linkedTransactionIds 已 populate:', linkedId);
                return {
                  _id: linkedId._id,
                  groupNumber: linkedId.groupNumber || `TXN-${index + 1}`,
                  description: linkedId.description || `資金來源 ${index + 1}`,
                  transactionDate: new Date(linkedId.transactionDate || new Date()),
                  totalAmount: linkedId.totalAmount || 0,
                  availableAmount: linkedId.totalAmount || 0,
                  fundingType: linkedId.fundingType || '一般資金'
                };
              } else if (linkedId) {
                console.log('⚠️ linkedTransactionIds 未 populate，使用基本資料:', linkedId);
                return {
                  _id: typeof linkedId === 'string' ? linkedId : linkedId._id || `unknown-${index}`,
                  groupNumber: `TXN-${index + 1}`,
                  description: `資金來源 ${index + 1}`,
                  transactionDate: new Date(),
                  totalAmount: 0,
                  availableAmount: 0,
                  fundingType: '一般資金'
                };
              } else {
                console.log('⚠️ linkedId 為 null 或 undefined，使用預設資料');
                return {
                  _id: `unknown-${index}`,
                  groupNumber: `TXN-${index + 1}`,
                  description: `資金來源 ${index + 1}`,
                  transactionDate: new Date(),
                  totalAmount: 0,
                  availableAmount: 0,
                  fundingType: '一般資金'
                };
              }
            });
            
            setSelectedFundingSources(fundingSources);
            console.log('✅ 資金來源狀態初始化完成 (使用基本資料):', fundingSources);
          }
        }
        
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
      console.log('🔄 TransactionGroupFormWithEntries - 重新設置預設機構，defaultOrganizationId:', defaultOrganizationId);
      setFormData(prev => ({
        ...prev,
        organizationId: defaultOrganizationId
      }));
    }
  }, [defaultOrganizationId, mode, initialData]);

  // 使用內嵌分錄的表單驗證
  const validateForm = (): boolean => {
    try {
      // 準備驗證資料
      const transactionData = {
        description: formData.description,
        transactionDate: formData.transactionDate,
        entries: formData.entries || []
      };

      console.log('🔍 開始驗證交易資料:', transactionData);

      // 基本資訊驗證
      const errors: string[] = [];
      
      if (!transactionData.description || transactionData.description.trim() === '') {
        errors.push('請輸入交易描述');
      }
      
      if (!transactionData.transactionDate || (transactionData.transactionDate instanceof Date && isNaN(transactionData.transactionDate.getTime()))) {
        errors.push('請選擇有效的交易日期');
      }

      // 分錄驗證（如果有分錄）
      if (transactionData.entries && transactionData.entries.length > 0) {
        // 檢查分錄完整性
        const incompleteEntries = transactionData.entries.filter(entry => 
          !entry.accountId || 
          (entry.debitAmount === 0 && entry.creditAmount === 0) ||
          (entry.debitAmount > 0 && entry.creditAmount > 0)
        );
        
        if (incompleteEntries.length > 0) {
          errors.push('請完整填寫所有分錄資訊');
        }
        
        // 檢查借貸平衡
        const totalDebit = transactionData.entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
        const totalCredit = transactionData.entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);
        
        if (Math.abs(totalDebit - totalCredit) >= 0.01) {
          errors.push(`借貸不平衡：借方總額 ${totalDebit}，貸方總額 ${totalCredit}`);
        }
        
        // 檢查序號唯一性
        const sequences = transactionData.entries.map(entry => entry.sequence).filter(seq => seq !== undefined);
        const uniqueSequences = new Set(sequences);
        if (sequences.length !== uniqueSequences.size) {
          errors.push('分錄序號不能重複');
        }
      } else if (mode === 'create') {
        // 建立模式必須有分錄
        errors.push('請至少新增兩筆分錄');
      }
      
      console.log('✅ 驗證結果:', { isValid: errors.length === 0, errors });

      if (errors.length === 0) {
        setErrors({});
        setBalanceError('');
        return true;
      } else {
        // 處理驗證錯誤
        const newErrors: Record<string, string> = {};
        let balanceErrorMessage = '';
        
        errors.forEach(errorMessage => {
          // 檢查是否為借貸平衡錯誤
          if (errorMessage.includes('借貸不平衡')) {
            balanceErrorMessage = errorMessage;
          } else if (errorMessage.includes('請輸入交易描述')) {
            newErrors.description = errorMessage;
          } else if (errorMessage.includes('請選擇')) {
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
  const handleBasicInfoChange = (field: keyof TransactionGroupWithEntriesFormData, value: any) => {
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
  const handleEntriesChange = (entries: EmbeddedAccountingEntryFormData[]) => {
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
    const templateEntries: EmbeddedAccountingEntryFormData[] = template.entries.map((entry: any, index: number) => ({
      sequence: index + 1,
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
      // 關閉資金追蹤時的處理
      if (mode === 'create') {
        // 新增模式：清除相關資料
        setFormData(prev => ({
          ...prev,
          linkedTransactionIds: undefined,
          sourceTransactionId: undefined,
          fundingType: 'original'
        }));
        setSelectedFundingSources([]);
      } else {
        // 編輯模式：保持原有資料但標記為不啟用
        console.log('🔄 編輯模式：關閉資金追蹤開關但保持資料');
        // 不清除 formData 中的資金來源資料，讓用戶可以重新開啟
      }
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
        // 資金來源追蹤欄位 - 編輯模式下保持原有資料或更新
        linkedTransactionIds: enableFundingTracking ? formData.linkedTransactionIds :
                             (mode === 'edit' && formData.linkedTransactionIds) ? formData.linkedTransactionIds : undefined,
        sourceTransactionId: enableFundingTracking ? formData.sourceTransactionId :
                            (mode === 'edit' && formData.sourceTransactionId) ? formData.sourceTransactionId : undefined,
        fundingType: enableFundingTracking ? (formData.fundingType || 'original') :
                    (mode === 'edit' && formData.fundingType) ? formData.fundingType : 'original'
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

  // 確認交易
  const handleConfirmTransaction = async () => {
    if (!transactionId) {
      console.error('❌ 無法確認交易：缺少交易ID');
      return;
    }

    setConfirmingTransaction(true);
    try {
      console.log('🔍 確認交易:', transactionId);
      const result = await transactionGroupWithEntriesService.confirm(transactionId);
      
      if (result.success) {
        console.log('✅ 交易確認成功');
        // 通知父組件狀態已變更
        if (onStatusChange) {
          onStatusChange('confirmed');
        }
      }
    } catch (error) {
      console.error('❌ 確認交易失敗:', error);
    } finally {
      setConfirmingTransaction(false);
    }
  };

  // 使用 shared 的狀態管理工具
  const statusInfo = TransactionStatusManager.getDisplayInfo(currentStatus);
  const permissions = TransactionStatusManager.getPermissions(currentStatus);
  
  // 取得狀態圖示
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircleIcon />;
      case 'cancelled':
        return <CancelledIcon />;
      default:
        return <DraftIcon />;
    }
  };

  const statusIcon = getStatusIcon(currentStatus);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={zhTW}>
      <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 1200, mx: 'auto', p: 2 }}>
        {/* 基本資訊卡片 */}
        <Card sx={{ mb: 3 }}>
          <CardHeader
            title={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h6">
                  {mode === 'create' ? '基本資訊' : mode === 'view' ? '交易詳情' : '基本資訊'}
                </Typography>
                {mode === 'edit' && (
                  <Badge
                    badgeContent={statusInfo.label}
                    color={statusInfo.color}
                    sx={{
                      '& .MuiBadge-badge': {
                        backgroundColor: statusInfo.bgColor,
                        color: statusInfo.color === 'warning' ? '#ed6c02' :
                               statusInfo.color === 'success' ? '#2e7d32' : '#d32f2f',
                        fontWeight: 'bold',
                        fontSize: '0.75rem',
                        height: '24px',
                        minWidth: '60px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }
                    }}
                  >
                    {statusIcon}
                  </Badge>
                )}
              </Box>
            }
            avatar={<ReceiptIcon color="primary" />}
            action={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<UploadIcon />}
                  disabled={uploadingReceipt || mode === 'view'}
                  size="small"
                >
                  {uploadingReceipt ? '上傳中...' : '上傳憑證'}
                  <input
                    type="file"
                    hidden
                    accept="image/*,.pdf"
                    onChange={handleReceiptUpload}
                    disabled={mode === 'view'}
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
                  value={formData.description || ''}
                  onChange={(e) => {
                    console.log('🔍 描述欄位變更:', {
                      oldValue: formData.description,
                      newValue: e.target.value,
                      isCopyMode
                    });
                    handleBasicInfoChange('description', e.target.value);
                  }}
                  error={!!errors.description}
                  helperText={errors.description}
                  required
                  disabled={!permissions.canEdit} // 使用 shared 權限管理
                  placeholder={isCopyMode ? "複製模式：請輸入新的交易描述" : "例如：購買辦公用品"}
                  autoComplete="off"
                  inputProps={{
                    autoComplete: 'off',
                    'data-lpignore': 'true'
                  }}
                />
              </Grid>

              {/* 交易日期 */}
              <Grid item xs={12} md={6}>
                <DatePicker
                  label="交易日期"
                  value={formData.transactionDate}
                  onChange={(date) => handleBasicInfoChange('transactionDate', date)}
                  disabled={!permissions.canEdit} // 使用 shared 權限管理
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      fullWidth
                      error={!!errors.transactionDate}
                      helperText={errors.transactionDate}
                      required
                      disabled={!permissions.canEdit} // 使用 shared 權限管理
                    />
                  )}
                />
              </Grid>

              {/* 機構選擇 */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!permissions.canEdit}>
                  <InputLabel>機構</InputLabel>
                  <Select
                    value={formData.organizationId || ''}
                    onChange={(e) => handleBasicInfoChange('organizationId', e.target.value || undefined)}
                    label="機構"
                    disabled={!permissions.canEdit} // 使用 shared 權限管理
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
                  disabled={!permissions.canEdit} // 使用 shared 權限管理
                />
              </Grid>

              {/* 資金來源追蹤開關 */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={enableFundingTracking}
                        onChange={(e) => handleFundingTrackingToggle(e.target.checked)}
                        color="primary"
                        disabled={!permissions.canEdit} // 使用 shared 權限管理
                      />
                    }
                    label="啟用資金來源追蹤"
                    disabled={!permissions.canEdit} // 使用 shared 權限管理
                  />
                  <Tooltip title="啟用後可以追蹤此交易的資金來源，建立資金流向關聯">
                    <IconButton size="small">
                      <HelpIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>

              {/* 資金來源選擇 */}
              {enableFundingTracking && (
                <Grid item xs={12}>
                  <Box sx={{
                    p: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    bgcolor: 'grey.50'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccountTreeIcon color="primary" />
                        資金來源追蹤
                      </Typography>
                      {mode !== 'view' && (
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<LinkIcon />}
                          onClick={() => setFundingSourceDialogOpen(true)}
                        >
                          選擇資金來源
                        </Button>
                      )}
                    </Box>

                    {/* 顯示已選擇的資金來源 - 表格格式 */}
                    {selectedFundingSources.length > 0 ? (
                      <Box sx={{ mt: 2 }}>
                        <Table size="small" sx={{ bgcolor: 'background.paper', borderRadius: 1, overflow: 'hidden' }}>
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'primary.50' }}>
                              <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>日期</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>交易編號</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>描述</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }} align="right">金額</TableCell>
                              {mode !== 'view' && (
                                <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }} align="center">操作</TableCell>
                              )}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {selectedFundingSources.map((source, index) => (
                              <TableRow
                                key={source._id}
                                sx={{
                                  '&:nth-of-type(odd)': { bgcolor: 'grey.50' },
                                  '&:hover': { bgcolor: 'primary.25' }
                                }}
                              >
                                <TableCell>
                                  <Typography variant="body2">
                                    {new Date(source.transactionDate).toLocaleDateString('zh-TW')}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                    {source.groupNumber}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">
                                    {source.description || `資金來源 ${index + 1}`}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'medium' }}>
                                    ${source.availableAmount?.toLocaleString() || 0}
                                  </Typography>
                                </TableCell>
                                {mode !== 'view' && (
                                  <TableCell align="center">
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        // 從完整資金來源列表中移除
                                        setSelectedFundingSources(prev => prev.filter(s => s._id !== source._id));
                                        // 從 linkedTransactionIds 中移除
                                        const newIds = formData.linkedTransactionIds?.filter(linkedId => linkedId !== source._id);
                                        setFormData(prev => ({
                                          ...prev,
                                          linkedTransactionIds: newIds,
                                          fundingType: newIds && newIds.length > 0 ? 'extended' : 'original'
                                        }));
                                      }}
                                      sx={{ color: 'error.main' }}
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                          <TableBody>
                            <TableRow sx={{ bgcolor: 'primary.100', borderTop: '2px solid', borderColor: 'primary.main' }}>
                              <TableCell colSpan={mode === 'view' ? 3 : 3} sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                合計
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.1rem' }}>
                                ${selectedFundingSources.reduce((total, source) => total + (source.availableAmount || 0), 0).toLocaleString()}
                              </TableCell>
                              {mode !== 'view' && <TableCell></TableCell>}
                            </TableRow>
                          </TableBody>
                        </Table>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                          資金類型: {formData.fundingType === 'extended' ? '延伸使用' : '原始資金'}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        尚未選擇資金來源，此交易將標記為「原始資金」
                      </Typography>
                    )}
                  </Box>
                </Grid>
              )}

            </Grid>
          </CardContent>
        </Card>


        {/* 借貸分錄表單 */}
        <Card sx={{ mb: 3, boxShadow: 2 }}>
          <CardHeader
            title="借貸分錄"
            action={
              mode !== 'view' && (
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
              )
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


            <DoubleEntryFormWithEntries
              entries={formData.entries}
              onChange={handleEntriesChange}
              organizationId={formData.organizationId}
              isCopyMode={isCopyMode}
              disabled={!permissions.canEdit} // 使用 shared 權限管理
            />
          </CardContent>
        </Card>

        {/* 操作按鈕 */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onCancel}
            disabled={isLoading || confirmingTransaction}
            startIcon={<CancelIcon />}
          >
            {mode === 'view' ? '關閉' : '取消'}
          </Button>
          
          {/* 確認交易按鈕 - 使用 shared 權限管理 */}
          {mode === 'edit' && permissions.canConfirm && transactionId && (
            <Tooltip title={TransactionStatusManager.getStatusChangeMessage('draft', 'confirmed')}>
              <Button
                variant="outlined"
                color="success"
                onClick={handleConfirmTransaction}
                disabled={
                  confirmingTransaction ||
                  isLoading ||
                  !!balanceError ||
                  formData.entries.length < 2 ||
                  Object.keys(errors).length > 0
                }
                startIcon={confirmingTransaction ? <SaveIcon /> : <CheckCircleIcon />}
                sx={{
                  borderColor: 'success.main',
                  color: 'success.main',
                  '&:hover': {
                    borderColor: 'success.dark',
                    backgroundColor: 'success.light',
                    color: 'success.dark'
                  }
                }}
              >
                {confirmingTransaction ? '確認中...' : '確認交易'}
              </Button>
            </Tooltip>
          )}
          
          {mode !== 'view' && (
            <Tooltip
              title={
                !permissions.canEdit ? '已確認的交易無法修改' :
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
                    !permissions.canEdit || // 使用 shared 權限管理
                    isLoading ||
                    confirmingTransaction ||
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
          )}
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

        {/* 資金來源選擇對話框 */}
        <Dialog
          open={fundingSourceDialogOpen}
          onClose={() => setFundingSourceDialogOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              height: '80vh',
              maxHeight: '700px'
            }
          }}
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountTreeIcon color="primary" />
                <Typography variant="h6" component="div">
                  選擇資金來源
                </Typography>
              </Box>
              <IconButton
                onClick={() => setFundingSourceDialogOpen(false)}
                size="small"
                sx={{ color: 'grey.500' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          
          <DialogContent sx={{ p: 0 }}>
            <Typography variant="body2" color="text.secondary" sx={{ p: 3, pb: 0 }}>
              選擇此交易的資金來源，建立資金流向追蹤關聯
            </Typography>
            <FundingSourceSelector
              open={fundingSourceDialogOpen}
              onClose={() => setFundingSourceDialogOpen(false)}
              onSelect={(transaction) => {
                // 創建完整的資金來源資訊
                const fundingSourceInfo = {
                  _id: transaction._id,
                  groupNumber: transaction.groupNumber,
                  description: transaction.description,
                  transactionDate: new Date(transaction.transactionDate),
                  totalAmount: transaction.totalAmount,
                  availableAmount: transaction.totalAmount, // 假設全額可用，實際應該計算剩餘可用金額
                  fundingType: transaction.fundingType || '一般資金'
                };
                
                // 添加到完整資金來源列表
                setSelectedFundingSources(prev => [...prev, fundingSourceInfo]);
                
                const newIds = [...(formData.linkedTransactionIds || []), transaction._id];
                setFormData(prev => ({
                  ...prev,
                  linkedTransactionIds: newIds,
                  fundingType: 'extended'
                }));
                setFundingSourceDialogOpen(false);
              }}
              selectedTransactionId={formData.sourceTransactionId}
              organizationId={formData.organizationId}
              excludeTransactionIds={formData.linkedTransactionIds || []}
            />
          </DialogContent>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default TransactionGroupFormWithEntries;