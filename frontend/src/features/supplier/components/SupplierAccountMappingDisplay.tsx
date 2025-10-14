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
import { useOrganizations } from '../../../hooks/useOrganizations';

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
  const { organizations } = useOrganizations();

  // 建構會計科目的階層路徑
  const sanitizeDisplayName = (value: unknown): string | undefined => {
    if (typeof value !== 'string') {
      return undefined;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    if (/^[0-9a-fA-F]{24}$/.test(trimmed)) {
      return undefined;
    }
    return trimmed;
  };

const resolveOrganizationName = (organizationId?: string, fallbackName?: string): string | undefined => {
    const nameFromFallback = sanitizeDisplayName(fallbackName);
    if (nameFromFallback) {
      return nameFromFallback;
    }

    if (typeof organizationId !== 'string') {
      return undefined;
    }
    const trimmedId = organizationId.trim();
    if (!trimmedId) {
      return undefined;
    }

    return sanitizeDisplayName(
      organizations.find((org) => org._id === trimmedId)?.name,
    );
  };

  const buildAccountHierarchy = (account: any, fallbackOrganizationName?: string): string => {
    const hierarchy: string[] = [];

    let organizationName = resolveOrganizationName(
      typeof account.organizationId === 'string' ? account.organizationId : account.organizationId?._id,
      account.organizationName,
    );

    if (!organizationName && fallbackOrganizationName) {
      organizationName = sanitizeDisplayName(fallbackOrganizationName);
    }

    if (!organizationName && typeof account.organizationId === 'string') {
      organizationName = resolveOrganizationName(account.organizationId);
    }

    if (organizationName) {
      hierarchy.push(organizationName);
    }

    const buildParentHierarchy = (acc: any): string[] => {
      const parents: string[] = [];
      if (acc.parentId && typeof acc.parentId === 'object') {
        parents.push(...buildParentHierarchy(acc.parentId));
        const parentName = sanitizeDisplayName(acc.parentId.name) ?? sanitizeDisplayName(acc.parentId.code);
        if (parentName) {
          parents.push(parentName);
        }
      }
      return parents;
    };

    hierarchy.push(...buildParentHierarchy(account));

    const displayName =
      sanitizeDisplayName(account.name) ??
      sanitizeDisplayName(account.accountName) ??
      sanitizeDisplayName(account.code);

    if (displayName) {
      hierarchy.push(displayName);
    }

    if (hierarchy.length === 0) {
      const fallbackCode = sanitizeDisplayName(account.code) ?? sanitizeDisplayName(account._id);
      return fallbackCode ?? 'Account';
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
                  sanitizeDisplayName(accountMapping.accountCode) ??
                  (typeof accountMapping.accountCode === 'string' ? accountMapping.accountCode.trim() : undefined);

                const name =
                  sanitizeDisplayName(accountMapping.accountName) ??
                  sanitizeDisplayName(accountDocument?.name) ??
                  code ??
                  `Account-${index + 1}`;
                const documentId =
                  accountDocument && typeof accountDocument._id === 'string'
                    ? accountDocument._id.trim()
                    : undefined;

                const fallbackOrganizationName =
                  resolveOrganizationName(accountMapping.account?.organizationId, (accountMapping as any).organizationName) ??
                  resolveOrganizationName(mapping.organizationId, mapping.organizationName);

                const hierarchyPath =
                  accountDocument && typeof accountDocument === 'object'
                    ? buildAccountHierarchy(accountDocument, fallbackOrganizationName)
                    : (() => {
                        const baseLabel = name;
                        return fallbackOrganizationName ? `${fallbackOrganizationName} > ${baseLabel}` : baseLabel;
                      })();

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






