/**
 * Accounting2 Frontend Service Layer
 *
 * 統一導出所有前端業務邏輯服務
 * 提供帳戶管理、交易處理、資金追蹤等核心功能
 */

// 導入服務類別
import { AccountService } from './AccountService';
import { TransactionService } from './TransactionService';
import { FundingService } from './FundingService';

// 重新導出服務類別
export { AccountService, TransactionService, FundingService };

// 預設導出 (使用別名避免衝突)
export { AccountService as DefaultAccountService } from './AccountService';
export { TransactionService as DefaultTransactionService } from './TransactionService';
export { FundingService as DefaultFundingService } from './FundingService';

// 服務集合導出
export const Services = {
  Account: AccountService,
  Transaction: TransactionService,
  Funding: FundingService
} as const;

// 型別導出 (從共享型別檔案重新導出)
export type {
  Account2,
  Category2,
  TransactionGroupWithEntries,
  AccountingEntry,
  EmbeddedAccountingEntry,
  FundingSource,
  FundingFlowData
} from '@pharmacy-pos/shared/types/accounting2';

/**
 * 使用範例:
 *
 * // 方式 1: 直接導入特定服務
 * import { AccountService } from '@/modules/accounting2/core/services';
 *
 * // 方式 2: 導入服務集合
 * import { Services } from '@/modules/accounting2/core/services';
 * const accounts = await Services.Account.getAll();
 *
 * // 方式 3: 導入預設服務 (使用別名)
 * import { DefaultAccountService } from '@/modules/accounting2/core/services';
 */