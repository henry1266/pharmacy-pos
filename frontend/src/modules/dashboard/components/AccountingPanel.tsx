import React, { FC } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton
} from '@mui/material';
import {
  AccountBalance as AccountBalanceIcon,
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import StatusChip from '../../../components/common/StatusChip';
import type { ExtendedAccountingRecord } from '@pharmacy-pos/shared/types/accounting';
import { formatCurrency } from '../utils/dashboardUtils';

/**
 * 記帳記錄面板屬性
 */
interface AccountingPanelProps {
  /** 記帳記錄列表 */
  accountingRecords: ExtendedAccountingRecord[];
  /** 記帳記錄總金額 */
  accountingTotal: number;
  /** 記帳記錄載入中狀態 */
  accountingLoading: boolean;
  /** 當前選中的日期 */
  selectedDate: string;
  /** 處理編輯記帳記錄的函數 */
  onEditRecord: (record: ExtendedAccountingRecord) => void;
  /** 處理刪除記帳記錄的函數 */
  onDeleteRecord: (id: string) => void;
  /** 處理解鎖記帳記錄的函數 */
  onUnlockRecord: (record: ExtendedAccountingRecord) => void;
}

/**
 * 記帳記錄面板組件
 * 
 * @description 顯示指定日期的記帳記錄，包括早中晚班的記錄和總金額
 * 
 * @component
 * @example
 * ```tsx
 * <AccountingPanel
 *   accountingRecords={accountingRecords}
 *   accountingTotal={accountingTotal}
 *   accountingLoading={accountingLoading}
 *   selectedDate={selectedDate}
 *   onEditRecord={handleEditRecord}
 *   onDeleteRecord={handleDeleteRecord}
 *   onUnlockRecord={handleUnlockRecord}
 * />
 * ```
 */
export const AccountingPanel: FC<AccountingPanelProps> = ({
  accountingRecords,
  accountingTotal,
  accountingLoading,
  selectedDate,
  onEditRecord,
  onDeleteRecord,
  onUnlockRecord
}) => {
  return (
    <Card elevation={2}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <AccountBalanceIcon sx={{ color: 'info.main', mr: 1 }} />
          <Typography variant="h6" color="info.main">
            記帳記錄
          </Typography>
          <Typography variant="h6" sx={{ ml: 'auto', fontWeight: 'bold' }}>
            總計：{formatCurrency(accountingTotal)}
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          選擇日期：{format(new Date(selectedDate), 'yyyy年MM月dd日')}
        </Typography>
        
        {accountingLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {['早', '中', '晚'].map((shift) => {
              const shiftRecords = accountingRecords.filter(record => record.shift === shift);
              const shiftTotal = shiftRecords.reduce((sum, record) => sum + (record.totalAmount || 0), 0);
              
              return (
                <Paper key={shift} elevation={1} sx={{ p: 1.5, mb: 1.5 }}>
                  {shiftRecords.length > 0 && shiftRecords[0] ? (
                    <Accordion sx={{ '&:before': { display: 'none' }, boxShadow: 'none' }}>
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                          minHeight: 48,
                          '&.Mui-expanded': {
                            minHeight: 48,
                          },
                          '& .MuiAccordionSummary-content': {
                            margin: '12px 0',
                            '&.Mui-expanded': {
                              margin: '12px 0',
                            },
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mr: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" fontWeight="medium">
                              {shift}班
                            </Typography>
                            <StatusChip status={shiftRecords[0].status || 'pending'} />
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" color="primary.main" fontWeight="bold">
                              {formatCurrency(shiftTotal)}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              {shiftRecords[0]?.status === 'completed' ? (
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (shiftRecords[0]) {
                                      onUnlockRecord(shiftRecords[0]);
                                    }
                                  }}
                                  title="解鎖並改為待處理"
                                >
                                  <LockIcon fontSize="small" />
                                </IconButton>
                              ) : (
                                <>
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (shiftRecords[0]) {
                                        onEditRecord(shiftRecords[0]);
                                      }
                                    }}
                                    title="編輯"
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (shiftRecords[0]) {
                                        onDeleteRecord(shiftRecords[0]._id);
                                      }
                                    }}
                                    title="刪除"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails sx={{ pt: 0, pb: 1 }}>
                        <Box>
                          {shiftRecords.map((record) => (
                            <Box key={record._id} sx={{ mb: 2, pl: 2, borderLeft: '3px solid', borderColor: 'primary.main' }}>
                              <Box sx={{ ml: 1 }}>
                                {record.items?.map((item, index) => (
                                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="body2" color="text.secondary">
                                      {item.category}
                                    </Typography>
                                    <Typography variant="body2" fontWeight="medium">
                                      {formatCurrency(item.amount)}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  ) : (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {shift}班
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        無記錄
                      </Typography>
                    </Box>
                  )}
                </Paper>
              );
            })}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AccountingPanel;