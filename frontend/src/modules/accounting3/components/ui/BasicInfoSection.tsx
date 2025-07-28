import React from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
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
  Upload as UploadIcon,
  Receipt as ReceiptIcon,
  Help as HelpIcon,
  AccountTree as AccountTreeIcon,
  Link as LinkIcon,
  CheckCircle as CheckCircleIcon,
  Drafts as DraftIcon,
  Cancel as CancelledIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TransactionGroupWithEntries3FormData } from '@pharmacy-pos/shared/types/accounting3';

// 型別定義
interface FundingSource {
  _id: string;
  groupNumber: string;
  description: string;
  transactionDate: Date;
  totalAmount: number;
  availableAmount: number;
  fundingType: string;
}

interface ReferencedTransaction {
  _id: string;
  groupNumber: string;
  description: string;
  transactionDate: Date;
  totalAmount: number;
  status: 'draft' | 'confirmed' | 'cancelled';
}

interface Organization {
  _id: string;
  name: string;
}

interface StatusInfo {
  label: string;
  color: 'warning' | 'success' | 'error';
  bgColor: string;
}

interface Permissions {
  canEdit: boolean;
}

export interface BasicInfoSectionProps {
  // 表單資料
  formData: TransactionGroupWithEntries3FormData;
  onFormDataChange: (field: keyof TransactionGroupWithEntries3FormData, value: any) => void;
  
  // 驗證錯誤
  errors: Record<string, string>;
  
  // 選項資料
  organizations: Organization[];
  
  // 模式和權限
  mode: 'create' | 'edit' | 'view';
  permissions: Permissions;
  isCopyMode?: boolean;
  
  // 狀態資訊
  currentStatus?: 'draft' | 'confirmed' | 'cancelled';
  statusInfo?: StatusInfo;
  
  // 資金來源追蹤
  enableFundingTracking: boolean;
  onFundingTrackingToggle: (enabled: boolean) => void;
  selectedFundingSources: FundingSource[];
  onRemoveFundingSource: (sourceId: string) => void;
  onOpenFundingSourceDialog: () => void;
  
  // 被引用資訊
  referencedByInfo?: ReferencedTransaction[];
  
  // 檔案上傳
  uploadingReceipt: boolean;
  onReceiptUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  formData,
  onFormDataChange,
  errors,
  organizations,
  mode,
  permissions,
  isCopyMode = false,
  currentStatus = 'draft',
  statusInfo,
  enableFundingTracking,
  onFundingTrackingToggle,
  selectedFundingSources,
  onRemoveFundingSource,
  onOpenFundingSourceDialog,
  referencedByInfo,
  uploadingReceipt,
  onReceiptUpload
}) => {
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
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">
              {mode === 'create' ? '基本資訊' : mode === 'view' ? '交易詳情' : '基本資訊'}
            </Typography>
            {mode === 'edit' && statusInfo && (
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
                onChange={onReceiptUpload}
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
        {/* 基本資訊 - 四個項目在同一列 */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'flex-start' }}>
          {/* 交易日期 - 占20%寬度 */}
          <Box sx={{ flex: '0 0 20%' }}>
            <DatePicker
              label="交易日期"
              value={formData.transactionDate}
              onChange={(date) => onFormDataChange('transactionDate', date)}
              disabled={!permissions.canEdit}
              renderInput={(params) => (
                <TextField
                  {...params}
                  fullWidth
                  error={!!errors.transactionDate}
                  helperText={errors.transactionDate}
                  required
                  disabled={!permissions.canEdit}
                />
              )}
            />
          </Box>
          
          
          {/* 交易描述 - 占30%寬度 */}
          <Box sx={{ flex: '0 0 30%' }}>
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
                onFormDataChange('description', e.target.value);
              }}
              error={!!errors.description}
              helperText={errors.description}
              required
              disabled={!permissions.canEdit}
              placeholder={isCopyMode ? "複製模式：請輸入新的交易描述" : "例如：購買辦公用品"}
              autoComplete="off"
              inputProps={{
                autoComplete: 'off',
                'data-lpignore': 'true'
              }}
            />
          </Box>

          

          {/* 機構選擇 - 占25%寬度 */}
          <Box sx={{ flex: '0 0 20%' }}>
            <FormControl fullWidth disabled={!permissions.canEdit}>
              <InputLabel>機構</InputLabel>
              <Select
                value={formData.organizationId || ''}
                onChange={(e) => onFormDataChange('organizationId', e.target.value || undefined)}
                label="機構"
                disabled={!permissions.canEdit}
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
          </Box>

          {/* 發票號碼 - 占20%寬度 */}
          <Box sx={{ flex: '0 0 20%' }}>
            <TextField
              fullWidth
              label="發票號碼"
              value={formData.invoiceNo}
              onChange={(e) => onFormDataChange('invoiceNo', e.target.value)}
              placeholder="例如：AB-12345678"
              disabled={!permissions.canEdit}
            />
          </Box>
        </Box>

        <Grid container spacing={3}>

          {/* 資金來源追蹤開關 */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={enableFundingTracking}
                    onChange={(e) => onFundingTrackingToggle(e.target.checked)}
                    color="primary"
                    disabled={!permissions.canEdit}
                  />
                }
                label="啟用資金來源追蹤"
                disabled={!permissions.canEdit}
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
                      onClick={onOpenFundingSourceDialog}
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
                                  onClick={() => onRemoveFundingSource(source._id)}
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

          {/* 被引用情況顯示 */}
          {referencedByInfo && referencedByInfo.length > 0 && (
            <Grid item xs={12}>
              <Box sx={{
                p: 2,
                border: '1px solid',
                borderColor: 'warning.main',
                borderRadius: 1,
                bgcolor: 'warning.50'
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'warning.main' }}>
                    <LinkIcon color="warning" />
                    被引用情況
                  </Typography>
                  <Chip
                    label={`${referencedByInfo.length} 筆交易引用`}
                    color="warning"
                    size="small"
                  />
                </Box>

                {/* 顯示被引用的交易列表 - 表格格式 */}
                <Box sx={{ mt: 2 }}>
                  <Table size="small" sx={{ bgcolor: 'background.paper', borderRadius: 1, overflow: 'hidden' }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'warning.100' }}>
                        <TableCell sx={{ fontWeight: 'bold', color: 'warning.dark' }}>日期</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'warning.dark' }}>交易編號</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'warning.dark' }}>描述</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'warning.dark' }} align="right">金額</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: 'warning.dark' }} align="center">狀態</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {referencedByInfo.map((referencedTx) => (
                        <TableRow
                          key={referencedTx._id}
                          sx={{
                            '&:nth-of-type(odd)': { bgcolor: 'warning.25' },
                            '&:hover': { bgcolor: 'warning.50' }
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(referencedTx.transactionDate).toLocaleDateString('zh-TW')}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {referencedTx.groupNumber}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {referencedTx.description}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ color: 'warning.dark', fontWeight: 'medium' }}>
                              ${referencedTx.totalAmount?.toLocaleString() || 0}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip
                              label={
                                referencedTx.status === 'confirmed' ? '已確認' :
                                referencedTx.status === 'draft' ? '草稿' :
                                referencedTx.status === 'cancelled' ? '已取消' : '未知'
                              }
                              color={
                                referencedTx.status === 'confirmed' ? 'success' :
                                referencedTx.status === 'draft' ? 'warning' :
                                referencedTx.status === 'cancelled' ? 'error' : 'default'
                              }
                              size="small"
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableBody>
                      <TableRow sx={{ bgcolor: 'warning.200', borderTop: '2px solid', borderColor: 'warning.main' }}>
                        <TableCell colSpan={3} sx={{ fontWeight: 'bold', color: 'warning.dark' }}>
                          總計被引用金額
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold', color: 'warning.dark', fontSize: '1.1rem' }}>
                          ${referencedByInfo.reduce((total, tx) =>
                            tx.status !== 'cancelled' ? total + (tx.totalAmount || 0) : total, 0
                          ).toLocaleString()}
                        </TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    💡 此交易被以上 {referencedByInfo.length} 筆交易引用作為資金來源
                  </Typography>
                </Box>
              </Box>
            </Grid>
          )}

        </Grid>
      </CardContent>
    </Card>
  );
};

export default BasicInfoSection;