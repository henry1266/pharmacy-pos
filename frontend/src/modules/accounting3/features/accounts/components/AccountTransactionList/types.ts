import { TransactionGroupWithEntries } from '@pharmacy-pos/shared/types/accounting2';

/**
 * 擴展的交易群組型別，包含資金追蹤相關資訊
 */
export interface ExtendedTransactionGroupWithEntries extends TransactionGroupWithEntries {
  referencedByInfo?: Array<{
    _id: string;
    groupNumber: string;
    description: string;
    transactionDate: Date | string;
    totalAmount: number;
    status: 'draft' | 'confirmed' | 'cancelled';
  }>;
  fundingSourceUsages?: Array<{
    sourceTransactionId: string;
    usedAmount: number;
    sourceTransactionDescription?: string;
    sourceTransactionGroupNumber?: string;
    sourceTransactionDate?: Date | string;
    sourceTransactionAmount?: number;
  }>;
  accountAmount?: number;
  runningBalance?: number;
  displayOrder?: number;
}

/**
 * 交易狀態型別
 */
export type TransactionStatus = 'draft' | 'confirmed' | 'cancelled';

/**
 * MUI Chip 顏色型別
 */
export type ChipColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';