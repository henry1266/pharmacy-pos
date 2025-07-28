import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { SupplierAccountMapping } from '@pharmacy-pos/shared/types/entities';

interface SupplierAccountMappingDisplayProps {
  supplierId: string;
  supplierName: string;
  onEditClick?: () => void;
}

const SupplierAccountMappingDisplay: React.FC<SupplierAccountMappingDisplayProps> = ({
  supplierId,
  onEditClick
}) => {
  const [mapping, setMapping] = useState<SupplierAccountMapping | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // 建構會計科目的階層路徑
  const buildAccountHierarchy = (account: any): string => {
    const hierarchy: string[] = [];
    
    // 添加機構名稱
    if (account.organizationId?.name) {
      hierarchy.push(account.organizationId.name);
    }
    
    // 遞迴建構父科目階層
    const buildParentHierarchy = (acc: any): string[] => {
      const parents: string[] = [];
      if (acc.parentId) {
        parents.push(...buildParentHierarchy(acc.parentId));
        parents.push(acc.parentId.name || acc.parentId.code);
      }
      return parents;
    };
    
    // 添加父科目階層
    hierarchy.push(...buildParentHierarchy(account));
    
    // 添加當前科目
    hierarchy.push(account.name || account.code);
    
    return hierarchy.join(' > ');
  };

  useEffect(() => {
    console.log('SupplierAccountMappingDisplay: useEffect 觸發，供應商ID:', supplierId);
    
    // 載入現有的配對資料 - 只有在 supplierId 存在且不是 'new' 時才載入
    if (supplierId && supplierId !== 'new') {
      console.log('SupplierAccountMappingDisplay: 符合載入條件，開始載入配對資料');
      fetchMapping();
    } else {
      console.log('SupplierAccountMappingDisplay: 不符合載入條件，清空現有資料');
      // 清空現有資料
      setMapping(null);
      setError('');
    }
  }, [supplierId]);

  const fetchMapping = async () => {
    if (!supplierId) return;
    
    console.log('SupplierAccountMappingDisplay: 開始載入配對資料，供應商ID:', supplierId);
    setLoading(true);
    setError(''); // 清除之前的錯誤
    
    try {
      const url = `/api/supplier-account-mappings?supplierId=${supplierId}`;
      console.log('SupplierAccountMappingDisplay: API 請求 URL:', url);
      
      const response = await fetch(url);
      console.log('SupplierAccountMappingDisplay: API 回應狀態:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('SupplierAccountMappingDisplay: API 錯誤回應:', errorText);
        throw new Error(`無法載入供應商科目配對 (${response.status})`);
      }
      
      const apiResponse = await response.json();
      console.log('SupplierAccountMappingDisplay: API 回應資料:', apiResponse);
      
      // 處理 ApiResponse 格式
      if (!apiResponse.success) {
        console.error('SupplierAccountMappingDisplay: API 回應失敗:', apiResponse.message);
        throw new Error(apiResponse.message || '載入配對失敗');
      }
      
      const mappingsArray = Array.isArray(apiResponse.data) ? apiResponse.data : [];
      console.log('SupplierAccountMappingDisplay: 配對資料陣列:', mappingsArray);
      console.log('SupplierAccountMappingDisplay: 配對資料陣列長度:', mappingsArray.length);
      
      if (mappingsArray.length > 0) {
        const existingMapping = mappingsArray[0];
        console.log('SupplierAccountMappingDisplay: 找到現有配對:', existingMapping);
        console.log('SupplierAccountMappingDisplay: 配對的科目數量:', existingMapping.accountMappings?.length || 0);
        
        // 確保 accountMappings 存在且為陣列
        if (existingMapping.accountMappings && Array.isArray(existingMapping.accountMappings)) {
          console.log('SupplierAccountMappingDisplay: 科目配對詳細資料:', existingMapping.accountMappings);
          setMapping(existingMapping);
        } else {
          console.log('SupplierAccountMappingDisplay: 配對資料中沒有有效的科目配對');
          setMapping(null);
        }
      } else {
        console.log('SupplierAccountMappingDisplay: 未找到現有配對');
        setMapping(null);
      }
    } catch (error) {
      console.error('SupplierAccountMappingDisplay: 載入配對失敗:', error);
      setError(error instanceof Error ? error.message : '載入配對失敗');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 2 }}>
        <CircularProgress size={24} />
        <Typography variant="body2" sx={{ ml: 1 }}>載入配對資料...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            <AccountBalanceIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
            會計科目配對
          </Typography>
          {onEditClick && (
            <Button
              size="small"
              startIcon={<EditIcon />}
              onClick={onEditClick}
              sx={{ textTransform: 'none' }}
            >
              編輯
            </Button>
          )}
        </Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          <Button 
            size="small" 
            onClick={fetchMapping} 
            sx={{ ml: 1, textTransform: 'none' }}
          >
            重試
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
          <AccountBalanceIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
          會計科目配對 {mapping?.accountMappings?.length || 0}
        </Typography>
        {onEditClick && (
          <Button
            size="small"
            startIcon={<EditIcon />}
            onClick={onEditClick}
            sx={{ textTransform: 'none' }}
          >
            編輯
          </Button>
        )}
      </Box>

      {!mapping || !mapping.accountMappings || mapping.accountMappings.length === 0 ? (
        <Box sx={{ 
          textAlign: 'center', 
          py: 3, 
          border: '1px dashed #ccc', 
          borderRadius: 1,
          backgroundColor: '#fafafa'
        }}>
          <Typography variant="body2" color="text.secondary">
            尚未設定會計科目配對
          </Typography>
          {onEditClick && (
            <Button
              size="small"
              variant="outlined"
              onClick={onEditClick}
              sx={{ mt: 1, textTransform: 'none' }}
            >
              立即設定
            </Button>
          )}
        </Box>
      ) : (
        <Box>
          <List dense sx={{ py: 0 }}>
            {mapping?.accountMappings
              ?.sort((a, b) => a.priority - b.priority)
              ?.map((accountMapping, index) => {
                // 獲取完整的會計科目資料（包含階層資訊）
                const accountData = (accountMapping as any).accountId;
                const hierarchyPath = accountData ? buildAccountHierarchy(accountData) :
                  `${accountMapping.accountCode} - ${accountMapping.accountName}`;
                
                return (
                  <React.Fragment key={accountMapping.accountId}>
                    <ListItem sx={{ px: 0, py: 1 }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.4 }}>
                              {hierarchyPath}
                            </Typography>
                            {accountMapping.isDefault && (
                              <Chip
                                label="預設"
                                size="small"
                                color="primary"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="caption" color="text.secondary">
                              科目代碼: {accountMapping.accountCode} | 優先順序: {accountMapping.priority}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < (mapping?.accountMappings?.length || 0) - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
          </List>

          {mapping.notes && (
            <Box sx={{ mt: 2, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">備註：</Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {mapping.notes}
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default SupplierAccountMappingDisplay;