/**
 * Accounting2 控制器層統一匯出
 * 提供會計系統的 API 端點控制器
 */

import AccountController from '../../accounting-new/controllers/AccountController';
import TransactionController from '../../accounting-new/controllers/TransactionController';
import FundingController from './FundingController';

export {
  AccountController,
  TransactionController,
  FundingController
};

export default {
  AccountController,
  TransactionController,
  FundingController
};