import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { TransactionTableProps } from './types';
import { TABLE_HEADERS } from './constants';

/**
 * 交易表格組件
 * 提供統一的表格結構，包含標準表頭
 */
const TransactionTable: React.FC<TransactionTableProps> = ({ children }) => (
  <TableContainer component={Paper} sx={{ mt: 1 }}>
    <Table size="small">
      <TableHead>
        <TableRow>
          {TABLE_HEADERS.map((header) => (
            <TableCell 
              key={header} 
              align={header === '日期' || header === '交易描述' ? 'left' : 'center'}
            >
              {header}
            </TableCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {children}
      </TableBody>
    </Table>
  </TableContainer>
);

export default TransactionTable;