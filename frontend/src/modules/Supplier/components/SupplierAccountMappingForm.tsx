import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { 
  SupplierAccountMapping, 
  SupplierAccountMappingFormData, 
  SelectedAccount 
} from '@pharmacy-pos/shared/types/entities';
import AccountSelector3 from '../../../modules/accounting3/accounts/components/AccountSelector';
import { useAppDispatch } from '../../../hooks/redux';
import { fetchAccounts2, fetchOrganizations2 } from '../../../redux/actions';

interface SupplierAccountMappingFormProps {
  supplierId: string;
  supplierName: string;
  onMappingChange?: (mapping: SupplierAccountMapping | null) => void;
}

const SupplierAccountMappingForm: React.FC<SupplierAccountMappingFormProps> = ({
  supplierId,
  onMappingChange
}) => {
  const [mapping, setMapping] = useState<SupplierAccountMapping | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedAccounts, setSelectedAccounts] = useState<SelectedAccount[]>([]);
  const [showAccountSelector, setShowAccountSelector] = useState(false);

  const dispatch = useAppDispatch();

  useEffect(() => {
    // 載入會計科目和組織資料
    dispatch(fetchAccounts2());
    dispatch(fetchOrganizations2());
  }, [dispatch]);

  useEffect(() => {
    // 載入現有的配對資料 - 只有在 supplierId 存在且不是 'new' 時才載入
    if (supplierId && supplierId !== 'new') {
      fetchMapping();
    } else {
      // 清空現有資料
      setMapping(null);
      setSelectedAccounts([]);
    }
  }, [supplierId]);

  const fetchMapping = async () => {
    if (!supplierId) return;
    
    console.log('正在載入供應商科目配對，供應商ID:', supplierId);
    setLoading(true);
    try {
      const response = await fetch(`/api/supplier-account-mappings?supplierId=${supplierId}`);
      console.log('API 回應狀態:', response.status);
      
      if (!response.ok) {
        throw new Error('無法載入供應商科目配對');
      }
      const apiResponse = await response.json();
      console.log('API 回應資料:', apiResponse);
      
      // 處理 ApiResponse 格式
      if (!apiResponse.success) {
        throw new Error(apiResponse.message || '載入配對失敗');
      }
      
      const mappingsArray = Array.isArray(apiResponse.data) ? apiResponse.data : [];
      console.log('配對資料陣列:', mappingsArray);
      console.log('配對資料陣列長度:', mappingsArray.length);
      
      if (mappingsArray.length > 0) {
        const existingMapping = mappingsArray[0];
        console.log('找到現有配對:', existingMapping);
        console.log('配對的科目數量:', existingMapping.accountMappings?.length || 0);
        setMapping(existingMapping);
        
        // 設置選中的會計科目
        if (existingMapping.accountMappings && Array.isArray(existingMapping.accountMappings)) {
          const accounts: SelectedAccount[] = existingMapping.accountMappings.map((am: any) => ({
            _id: am.accountId,
            name: am.accountName,
            code: am.accountCode,
            accountType: '',
            organizationId: existingMapping.organizationId
          }));
          console.log('設置選中的會計科目:', accounts);
          setSelectedAccounts(accounts);
        } else {
          console.log('配對資料中沒有有效的科目配對');
          setSelectedAccounts([]);
        }
      } else {
        console.log('未找到現有配對');
        setMapping(null);
        setSelectedAccounts([]);
      }
    } catch (error) {
      console.error('載入配對失敗:', error);
      setError(error instanceof Error ? error.message : '載入配對失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMapping = async () => {
    if (selectedAccounts.length === 0) {
      setError('請選擇至少一個會計科目');
      return;
    }

    console.log('開始儲存供應商科目配對');
    console.log('供應商ID:', supplierId);
    console.log('選中的科目:', selectedAccounts);

    setLoading(true);
    try {
      const formData: SupplierAccountMappingFormData = {
        supplierId,
        accountIds: selectedAccounts.map(a => a._id)
      };

      console.log('發送的表單資料:', formData);

      const url = mapping
        ? `/api/supplier-account-mappings/${mapping._id}`
        : '/api/supplier-account-mappings';
      
      const method = mapping ? 'PUT' : 'POST';
      
      console.log('API 請求:', method, url);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      console.log('API 回應狀態:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API 錯誤回應:', errorData);
        throw new Error(errorData.message || '儲存失敗');
      }

      const apiResponse = await response.json();
      console.log('API 成功回應:', apiResponse);
      
      // 處理 ApiResponse 格式
      if (!apiResponse.success) {
        throw new Error(apiResponse.message || '儲存失敗');
      }
      
      const savedMapping = apiResponse.data;
      console.log('儲存的配對資料:', savedMapping);
      setMapping(savedMapping);
      
      if (onMappingChange) {
        onMappingChange(savedMapping);
      }
      
      setError('');
      console.log('配對儲存成功');
    } catch (error) {
      console.error('儲存失敗:', error);
      setError(error instanceof Error ? error.message : '儲存失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMapping = async () => {
    if (!mapping || !window.confirm('確定要刪除此科目配對嗎？')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/supplier-account-mappings/${mapping._id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('刪除失敗');
      }

      setMapping(null);
      setSelectedAccounts([]);
      
      if (onMappingChange) {
        onMappingChange(null);
      }
    } catch (error) {
      console.error('刪除失敗:', error);
      setError(error instanceof Error ? error.message : '刪除失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAccount = (accountId: string) => {
    const newAccounts = selectedAccounts.filter(a => a._id !== accountId);
    setSelectedAccounts(newAccounts);
  };

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
        會計科目配對
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          已配對的會計科目：
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: 1, 
          mb: 2, 
          minHeight: 40, 
          p: 1, 
          border: '1px solid #ccc', 
          borderRadius: 1,
          backgroundColor: '#fafafa'
        }}>
          {selectedAccounts.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ alignSelf: 'center' }}>
              尚未配對任何會計科目
            </Typography>
          ) : (
            selectedAccounts.map((account) => (
              <Chip
                key={account._id}
                label={`${account.code} - ${account.name}`}
                onDelete={() => handleRemoveAccount(account._id)}
                size="small"
                color="primary"
                variant="outlined"
              />
            ))
          )}
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setShowAccountSelector(true)}
            startIcon={<AddIcon />}
            size="small"
          >
            選擇會計科目
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            onClick={handleSaveMapping}
            variant="contained"
            disabled={loading || selectedAccounts.length === 0}
            startIcon={loading ? <CircularProgress size={20} /> : null}
            size="small"
          >
            {mapping ? '更新配對' : '建立配對'}
          </Button>
          
          {mapping && (
            <Button
              onClick={handleDeleteMapping}
              variant="outlined"
              color="error"
              disabled={loading}
              startIcon={<DeleteIcon />}
              size="small"
            >
              刪除配對
            </Button>
          )}
        </Box>
      </Box>

      {/* 會計科目選擇器對話框 */}
      <Dialog open={showAccountSelector} onClose={() => setShowAccountSelector(false)} maxWidth="lg" fullWidth>
        <DialogTitle>選擇會計科目</DialogTitle>
        <DialogContent>
          <AccountSelector3
            onAccountSelect={(account) => {
              const newAccount: SelectedAccount = {
                _id: account._id,
                name: account.name,
                code: account.code,
                accountType: account.accountType
              };
              
              // 檢查是否已經選擇過這個科目
              if (!selectedAccounts.find(a => a._id === account._id)) {
                setSelectedAccounts([...selectedAccounts, newAccount]);
              }
              
              setShowAccountSelector(false);
            }}
            onCancel={() => setShowAccountSelector(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default SupplierAccountMappingForm;