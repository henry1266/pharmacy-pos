import { TransactionGroupWithEntries3 } from '@pharmacy-pos/shared/types/accounting3';

/**
 * 主組件屬性介面
 */
export interface TransactionFundingFlowProps {
  transaction: TransactionGroupWithEntries3;
}

/**
 * 交易資訊介面
 */
export interface TransactionInfo {
  _id: string;
  description: string;
  transactionDate: string;
  groupNumber: string;
  totalAmount: number;
  usedAmount?: number;
  allocatedAmount?: number;
  availableAmount?: number;
}

/**
 * 餘額計算結果介面
 */
export interface BalanceCalculationResult {
  usedFromThisSource: number;
  availableAmount: number;
  totalAmount: number;
}

/**
 * 提示組件屬性介面
 */
export interface AmountTooltipProps {
  amount: number;
  tooltip: string;
}

/**
 * 餘額提示組件屬性介面
 */
export interface BalanceTooltipProps {
  availableAmount: number;
  totalAmount: number;
  tooltip: string;
}

/**
 * 導航按鈕組件屬性介面
 */
export interface NavigationButtonProps {
  transactionId: string | any;
  label?: string;
  navigate: (path: string) => void;
}

/**
 * 交易表格組件屬性介面
 */
export interface TransactionTableProps {
  children: React.ReactNode;
}

/**
 * 流向區塊組件屬性介面
 */
export interface FlowSectionProps {
  title: string;
  count?: number;
  children: React.ReactNode;
  summary?: React.ReactNode;
  statusChip?: React.ReactNode;
}

/**
 * 交易表格行組件屬性介面
 */
export interface TransactionTableRowProps {
  transactionInfo: any;
  transactionId: string | any;
  index?: number;
  type: 'source' | 'linked' | 'referenced' | 'current';
  navigate: (path: string) => void;
  calculateUsedAmount: (sourceInfo: any, isMultipleSource: boolean) => number;
  calculateBalanceInfo: (transactionId: string, sourceInfo: any, usedAmount: number) => BalanceCalculationResult;
  loading: boolean;
  linkedTransactionDetails: {[key: string]: any};
}

/**
 * 流向 Chip 組件屬性介面
 */
export interface FlowChipProps {
  label: string;
  color: 'primary' | 'secondary';
  margin?: string;
  accountId?: string | any;
  handleAccountClick?: (accountId: string | any) => void;
}

/**
 * 來源區塊組件屬性介面
 */
export interface SourceSectionProps {
  transaction: TransactionGroupWithEntries3;
  navigate: (path: string) => void;
  calculateUsedAmount: (sourceInfo: any, isMultipleSource: boolean) => number;
  calculateBalanceInfo: (transactionId: string, sourceInfo: any, usedAmount: number) => BalanceCalculationResult;
  loading: boolean;
  linkedTransactionDetails: {[key: string]: any};
}

/**
 * 流向區塊組件屬性介面
 */
export interface FlowToSectionProps {
  transaction: TransactionGroupWithEntries3;
  navigate: (path: string) => void;
  loading: boolean;
  linkedTransactionDetails: {[key: string]: any};
}

/**
 * 付款流向詳情組件屬性介面
 */
export interface PaymentFlowSectionProps {
  transaction: TransactionGroupWithEntries3;
  navigate: (path: string) => void;
}

/**
 * 應付帳款狀態組件屬性介面
 */
export interface PayableStatusSectionProps {
  transaction: TransactionGroupWithEntries3;
  navigate: (path: string) => void;
}