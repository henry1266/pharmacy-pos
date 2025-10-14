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
import supplierAccountMappingClient from '../api/accountMappingClient';

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
    } else if (typeof account.organizationName === 'string' && account.organizationName.trim().length > 0) {
      hierarchy.push(account.organizationName.trim());
    } else if (typeof account.organizationId === 'string' && account.organizationId.trim().length > 0) {
      hierarchy.push(account.organizationId.trim());
    }
    
    // 遞迴建構父科目階層
    const buildParentHierarchy = (acc: any): string[] => {
      const parents: string[] = [];
      if (acc.parentId && typeof acc.parentId === 'object') {
        parents.push(...buildParentHierarchy(acc.parentId));
        parents.push(acc.parentId.name || acc.parentId.code);
      }
      return parents;
    };
    
    // 添加父科目階層
    hierarchy.push(...buildParentHierarchy(account));
    
    // 添加當前科目
    const displayName =
      (typeof account.name === 'string' && account.name.trim().length > 0 ? account.name.trim() : undefined) ??
      (typeof account.accountName === 'string' && account.accountName.trim().length > 0
        ? account.accountName.trim()
        : undefined) ??
      (typeof account.code === 'string' && account.code.trim().length > 0 ? account.code.trim() : undefined) ??
      undefined;

    if (displayName) {
      hierarchy.push(displayName);
    }

    if (hierarchy.length === 0) {
      return (
        (typeof account.code === 'string' && account.code.trim().length > 0 ? account.code.trim() : undefined) ??
        (typeof account._id === 'string' && account._id.trim().length > 0 ? account._id.trim() : undefined) ??
        'Account'
      );
    }

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
    setError('');

    try {
      const result = await supplierAccountMappingClient.listMappings({ query: { supplierId } });
      console.log('SupplierAccountMappingDisplay: 契約回應狀態:', result.status);

      if (!(result.status === 200 && result.body?.success)) {
        const message =
          typeof result.body === 'object' && result.body && 'message' in result.body
            ? String((result.body as { message?: unknown }).message ?? '載入供應商帳務對應失敗')
            : '載入供應商帳務對應失敗';
        throw new Error(message);
      }

      const mappingsArray = Array.isArray(result.body.data) ? result.body.data : [];
      console.log('SupplierAccountMappingDisplay: 回傳筆數:', mappingsArray.length);

      if (mappingsArray.length > 0) {
        const existingMapping = mappingsArray[0] as SupplierAccountMapping;
        console.log('SupplierAccountMappingDisplay: 取得帳務對應:', existingMapping);

        if (Array.isArray(existingMapping.accountMappings) && existingMapping.accountMappings.length > 0) {
          console.log('SupplierAccountMappingDisplay: 科目明細:', existingMapping.accountMappings);
          setMapping(existingMapping);
        } else {
          console.log('SupplierAccountMappingDisplay: 回應缺少科目資料');
          setMapping(null);
        }
      } else {
        console.log('SupplierAccountMappingDisplay: 尚未建立帳務對應');
        setMapping(null);
      }
    } catch (caught) {
      console.error('SupplierAccountMappingDisplay: 載入失敗:', caught);
      setError(caught instanceof Error ? caught.message : '載入供應商帳務對應失敗');
      setMapping(null);
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
            會計科目配對12
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
                const accountDocument =
                  (accountMapping as any).accountId && typeof (accountMapping as any).accountId === 'object'
                    ? (accountMapping as any).accountId
                    : accountMapping.account && typeof accountMapping.account === 'object'
                    ? accountMapping.account
                    : null;

                const code =
                  typeof accountMapping.accountCode === 'string' && accountMapping.accountCode.trim().length > 0
                    ? accountMapping.accountCode.trim()
                    : undefined;

                const name =
                  (typeof accountMapping.accountName === 'string' && accountMapping.accountName.trim().length > 0
                    ? accountMapping.accountName.trim()
                    : undefined) ??
                  (typeof accountDocument?.name === 'string' && accountDocument.name.trim().length > 0
                    ? accountDocument.name.trim()
                    : undefined) ??
                  code ??
                  `Account-${index + 1}`;

                const documentId =
                  accountDocument && typeof accountDocument._id === 'string'
                    ? accountDocument._id.trim()
                    : undefined;

                const fallbackLabel = name ?? code ?? `Account-${index + 1}`;

                const hierarchyPath =
                  accountDocument && typeof accountDocument === 'object'
                    ? buildAccountHierarchy(accountDocument)
                    : code && name && name !== code
                    ? `${code} - ${name}`
                    : fallbackLabel;

                const mappingKey =
                  (typeof accountMapping.accountId === 'string' && accountMapping.accountId.trim().length > 0
                    ? accountMapping.accountId.trim()
                    : undefined) ??
                  (documentId && documentId.length > 0 ? documentId : undefined) ??
                  (code ?? `account-${index}`);
                
                return (
                  <React.Fragment key={mappingKey}>
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