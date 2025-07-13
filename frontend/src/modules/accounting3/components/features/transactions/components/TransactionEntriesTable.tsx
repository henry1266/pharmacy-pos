import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
} from '@mui/material';
import { TransactionGroupWithEntries3, Account3 } from '@pharmacy-pos/shared/types/accounting3';
import { formatAmount } from '../utils/transactionUtils';

interface TransactionEntriesTableProps {
  transaction: TransactionGroupWithEntries3;
  accounts: Record<string, Account3>;
}

/**
 * 交易分錄明細表格組件
 */
export const TransactionEntriesTable: React.FC<TransactionEntriesTableProps> = ({
  transaction,
  accounts
}) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          分錄明細 ({transaction.entries.length} 筆)
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>序號</TableCell>
                <TableCell>科目</TableCell>
                <TableCell>描述</TableCell>
                <TableCell align="right">借方金額</TableCell>
                <TableCell align="right">貸方金額</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transaction.entries.map((entry, index) => {
                const accountId = typeof entry.accountId === 'string' 
                  ? entry.accountId 
                  : entry.accountId._id;
                const account = accounts[accountId] || 
                  (typeof entry.accountId === 'object' ? entry.accountId : null);
                
                return (
                  <TableRow key={entry._id || index}>
                    <TableCell>{entry.sequence || index + 1}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {account?.name || '未知科目'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {account?.code}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {entry.description}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {entry.debitAmount > 0 && (
                        <Typography variant="body2" color="success.main" fontWeight="medium">
                          {formatAmount(entry.debitAmount)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      {entry.creditAmount > 0 && (
                        <Typography variant="body2" color="error.main" fontWeight="medium">
                          {formatAmount(entry.creditAmount)}
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default TransactionEntriesTable;