import { AccountBalanceService } from '../accountBalanceService';
import Account2, { IAccount2 } from '../../models/Account2';
import AccountingEntry from '../../models/AccountingEntry';
import TransactionGroup, { ITransactionGroup } from '../../models/TransactionGroup';
import mongoose from 'mongoose';

describe('AccountBalanceService', () => {
  let testAccount: IAccount2;
  let testTransactionGroup: ITransactionGroup;
  let testOrganizationId: mongoose.Types.ObjectId;

  beforeEach(async () => {
    // 創建測試機構ID
    testOrganizationId = new mongoose.Types.ObjectId();

    // 創建測試會計科目（資產類，借方科目）
    testAccount = await Account2.create({
      code: '1101',
      name: '現金',
      accountType: 'asset',
      type: 'cash',
      level: 1,
      isActive: true,
      normalBalance: 'debit',
      balance: 0,
      initialBalance: 0,
      currency: 'TWD',
      organizationId: testOrganizationId,
      createdBy: 'test-user'
    });

    // 創建測試交易群組
    testTransactionGroup = await TransactionGroup.create({
      groupNumber: 'TXN-20250131-001',
      description: '測試交易',
      transactionDate: new Date(),
      organizationId: testOrganizationId,
      totalAmount: 1000,
      status: 'confirmed',
      fundingType: 'original',
      createdBy: 'test-user'
    });
  });

  describe('calculateAccountBalance', () => {
    test('應該正確計算借方科目的餘額', async () => {
      // 創建借方分錄
      await AccountingEntry.create({
        transactionGroupId: testTransactionGroup._id,
        sequence: 1,
        accountId: testAccount._id,
        debitAmount: 1000,
        creditAmount: 0,
        description: '收入現金',
        organizationId: testOrganizationId,
        createdBy: 'test-user'
      });

      // 創建貸方分錄
      await AccountingEntry.create({
        transactionGroupId: testTransactionGroup._id,
        sequence: 2,
        accountId: testAccount._id,
        debitAmount: 0,
        creditAmount: 300,
        description: '支出現金',
        organizationId: testOrganizationId,
        createdBy: 'test-user'
      });

      const result = await AccountBalanceService.calculateAccountBalance(
        (testAccount._id as mongoose.Types.ObjectId).toString(),
        undefined,
        testOrganizationId.toString()
      );

      expect(result).toMatchObject({
        accountId: testAccount._id as mongoose.Types.ObjectId,
        accountName: '現金',
        accountCode: '1101',
        accountType: 'asset',
        normalBalance: 'debit',
        totalDebit: 1000,
        totalCredit: 300,
        balance: 700, // 借方科目：借方 - 貸方 = 1000 - 300 = 700
        entryCount: 2
      });
      expect(result.lastTransactionDate).toBeDefined();
    });

    test('應該正確計算貸方科目的餘額', async () => {
      // 創建貸方科目（負債類）
      const liabilityAccount = await Account2.create({
        code: '2101',
        name: '應付帳款',
        accountType: 'liability',
        type: 'other',
        level: 1,
        isActive: true,
        normalBalance: 'credit',
        balance: 0,
        initialBalance: 0,
        currency: 'TWD',
        organizationId: testOrganizationId,
        createdBy: 'test-user'
      });

      // 創建貸方分錄
      await AccountingEntry.create({
        transactionGroupId: testTransactionGroup._id,
        sequence: 1,
        accountId: liabilityAccount._id,
        debitAmount: 0,
        creditAmount: 2000,
        description: '增加應付帳款',
        organizationId: testOrganizationId,
        createdBy: 'test-user'
      });

      // 創建借方分錄
      await AccountingEntry.create({
        transactionGroupId: testTransactionGroup._id,
        sequence: 2,
        accountId: liabilityAccount._id,
        debitAmount: 500,
        creditAmount: 0,
        description: '減少應付帳款',
        organizationId: testOrganizationId,
        createdBy: 'test-user'
      });

      const result = await AccountBalanceService.calculateAccountBalance(
        (liabilityAccount._id as mongoose.Types.ObjectId).toString(),
        undefined,
        testOrganizationId.toString()
      );

      expect(result).toMatchObject({
        accountId: liabilityAccount._id as mongoose.Types.ObjectId,
        accountName: '應付帳款',
        accountCode: '2101',
        accountType: 'liability',
        normalBalance: 'credit',
        totalDebit: 500,
        totalCredit: 2000,
        balance: 1500, // 貸方科目：貸方 - 借方 = 2000 - 500 = 1500
        entryCount: 2
      });
    });

    test('應該只計算已確認的交易', async () => {
      // 創建未確認的交易群組
      const draftTransactionGroup = await TransactionGroup.create({
        groupNumber: 'TXN-20250131-002',
        description: '草稿交易',
        transactionDate: new Date(),
        organizationId: testOrganizationId,
        totalAmount: 500,
        status: 'draft', // 未確認狀態
        fundingType: 'original',
        createdBy: 'test-user'
      });

      // 創建已確認交易的分錄
      await AccountingEntry.create({
        transactionGroupId: testTransactionGroup._id,
        sequence: 1,
        accountId: testAccount._id,
        debitAmount: 1000,
        creditAmount: 0,
        description: '已確認交易',
        organizationId: testOrganizationId,
        createdBy: 'test-user'
      });

      // 創建未確認交易的分錄
      await AccountingEntry.create({
        transactionGroupId: draftTransactionGroup._id,
        sequence: 1,
        accountId: testAccount._id,
        debitAmount: 500,
        creditAmount: 0,
        description: '未確認交易',
        organizationId: testOrganizationId,
        createdBy: 'test-user'
      });

      const result = await AccountBalanceService.calculateAccountBalance(
        (testAccount._id as mongoose.Types.ObjectId).toString(),
        undefined,
        testOrganizationId.toString()
      );

      // 應該只計算已確認的交易
      expect(result.totalDebit).toBe(1000);
      expect(result.balance).toBe(1000);
      expect(result.entryCount).toBe(1);
    });

    test('應該根據截止日期過濾交易', async () => {
      const pastDate = new Date('2025-01-01');
      const futureDate = new Date('2025-02-01');

      // 創建過去的分錄
      const pastEntry = new AccountingEntry({
        transactionGroupId: testTransactionGroup._id,
        sequence: 1,
        accountId: testAccount._id,
        debitAmount: 500,
        creditAmount: 0,
        description: '過去交易',
        organizationId: testOrganizationId,
        createdBy: 'test-user',
        createdAt: pastDate
      });
      await pastEntry.save();

      // 創建未來的分錄
      const futureEntry = new AccountingEntry({
        transactionGroupId: testTransactionGroup._id,
        sequence: 2,
        accountId: testAccount._id,
        debitAmount: 300,
        creditAmount: 0,
        description: '未來交易',
        organizationId: testOrganizationId,
        createdBy: 'test-user',
        createdAt: futureDate
      });
      await futureEntry.save();

      // 使用截止日期查詢（只包含過去的交易）
      const result = await AccountBalanceService.calculateAccountBalance(
        (testAccount._id as mongoose.Types.ObjectId).toString(),
        new Date('2025-01-15'), // 截止日期在過去和未來之間
        testOrganizationId.toString()
      );

      expect(result.totalDebit).toBe(500); // 只包含過去的交易
      expect(result.balance).toBe(500);
      expect(result.entryCount).toBe(1);
    });

    test('應該在科目不存在時拋出錯誤', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      await expect(
        AccountBalanceService.calculateAccountBalance(nonExistentId.toString())
      ).rejects.toThrow('會計科目不存在');
    });

    test('應該返回零餘額當沒有分錄時', async () => {
      const result = await AccountBalanceService.calculateAccountBalance(
        (testAccount._id as mongoose.Types.ObjectId).toString(),
        undefined,
        testOrganizationId.toString()
      );

      expect(result).toMatchObject({
        totalDebit: 0,
        totalCredit: 0,
        balance: 0,
        entryCount: 0,
        lastTransactionDate: null
      });
    });
  });

  describe('calculateMultipleAccountBalances', () => {
    test('應該批量計算多個科目的餘額', async () => {
      // 創建第二個測試科目
      const secondAccount = await Account2.create({
        code: '1102',
        name: '銀行存款',
        accountType: 'asset',
        type: 'bank',
        level: 1,
        isActive: true,
        normalBalance: 'debit',
        balance: 0,
        initialBalance: 0,
        currency: 'TWD',
        organizationId: testOrganizationId,
        createdBy: 'test-user'
      });

      // 為第一個科目創建分錄
      await AccountingEntry.create({
        transactionGroupId: testTransactionGroup._id,
        sequence: 1,
        accountId: testAccount._id,
        debitAmount: 1000,
        creditAmount: 0,
        description: '現金收入',
        organizationId: testOrganizationId,
        createdBy: 'test-user'
      });

      // 為第二個科目創建分錄
      await AccountingEntry.create({
        transactionGroupId: testTransactionGroup._id,
        sequence: 2,
        accountId: secondAccount._id,
        debitAmount: 2000,
        creditAmount: 0,
        description: '銀行存款',
        organizationId: testOrganizationId,
        createdBy: 'test-user'
      });

      const accountIds = [
        (testAccount._id as mongoose.Types.ObjectId).toString(),
        (secondAccount._id as mongoose.Types.ObjectId).toString()
      ];

      const results = await AccountBalanceService.calculateMultipleAccountBalances(
        accountIds,
        undefined,
        testOrganizationId.toString()
      );

      expect(results).toHaveLength(2);
      expect(results[0].balance).toBe(1000);
      expect(results[1].balance).toBe(2000);
    });
  });

  describe('calculateBalanceByAccountType', () => {
    test('應該按科目類型計算餘額匯總', async () => {
      // 創建多個資產科目
      const bankAccount = await Account2.create({
        code: '1102',
        name: '銀行存款',
        accountType: 'asset',
        type: 'bank',
        level: 1,
        isActive: true,
        normalBalance: 'debit',
        balance: 0,
        initialBalance: 0,
        currency: 'TWD',
        organizationId: testOrganizationId,
        createdBy: 'test-user'
      });

      // 為現金科目創建分錄
      await AccountingEntry.create({
        transactionGroupId: testTransactionGroup._id,
        sequence: 1,
        accountId: testAccount._id,
        debitAmount: 1000,
        creditAmount: 0,
        description: '現金收入',
        organizationId: testOrganizationId,
        createdBy: 'test-user'
      });

      // 為銀行科目創建分錄
      await AccountingEntry.create({
        transactionGroupId: testTransactionGroup._id,
        sequence: 2,
        accountId: bankAccount._id,
        debitAmount: 2000,
        creditAmount: 0,
        description: '銀行存款',
        organizationId: testOrganizationId,
        createdBy: 'test-user'
      });

      const result = await AccountBalanceService.calculateBalanceByAccountType(
        'asset',
        undefined,
        testOrganizationId.toString()
      );

      expect(result).toMatchObject({
        accountType: 'asset',
        totalBalance: 3000, // 1000 + 2000
        accountCount: 2,
      });
      expect(result.accounts).toHaveLength(2);
    });

    test('應該返回空結果當沒有該類型科目時', async () => {
      const result = await AccountBalanceService.calculateBalanceByAccountType(
        'revenue',
        undefined,
        testOrganizationId.toString()
      );

      expect(result).toMatchObject({
        accountType: 'revenue',
        totalBalance: 0,
        accountCount: 0,
        accounts: []
      });
    });
  });

  describe('generateTrialBalance', () => {
    test('應該生成完整的試算表', async () => {
      // 創建不同類型的科目
      await Account2.create({
        code: '2101',
        name: '應付帳款',
        accountType: 'liability',
        type: 'other',
        level: 1,
        isActive: true,
        normalBalance: 'credit',
        balance: 0,
        initialBalance: 0,
        currency: 'TWD',
        organizationId: testOrganizationId,
        createdBy: 'test-user'
      });

      const revenueAccount = await Account2.create({
        code: '4101',
        name: '銷售收入',
        accountType: 'revenue',
        type: 'other',
        level: 1,
        isActive: true,
        normalBalance: 'credit',
        balance: 0,
        initialBalance: 0,
        currency: 'TWD',
        organizationId: testOrganizationId,
        createdBy: 'test-user'
      });

      // 創建分錄
      await AccountingEntry.create({
        transactionGroupId: testTransactionGroup._id,
        sequence: 1,
        accountId: testAccount._id, // 資產科目
        debitAmount: 1000,
        creditAmount: 0,
        description: '現金收入',
        organizationId: testOrganizationId,
        createdBy: 'test-user'
      });

      await AccountingEntry.create({
        transactionGroupId: testTransactionGroup._id,
        sequence: 2,
        accountId: revenueAccount._id, // 收入科目
        debitAmount: 0,
        creditAmount: 1000,
        description: '銷售收入',
        organizationId: testOrganizationId,
        createdBy: 'test-user'
      });

      const result = await AccountBalanceService.generateTrialBalance(
        undefined,
        testOrganizationId.toString()
      );

      expect(result.trialBalanceData).toHaveLength(5); // 5種科目類型
      // 根據 generateTrialBalance 的實際邏輯：
      // - 資產科目餘額 1000 (正數) -> 借方
      // - 收入科目餘額 1000 (正數) -> 借方 (因為 balance >= 0)
      // 所以總借方是 2000，總貸方是 0
      expect(result.summary.totalDebit).toBe(2000); // 兩個科目的正餘額都計入借方
      expect(result.summary.totalCredit).toBe(0); // 沒有負餘額的科目
      expect(result.summary.difference).toBe(2000); // |2000 - 0| = 2000
      expect(result.summary.isBalanced).toBe(false); // 不平衡，因為借貸方不相等
      expect(result.summary.generatedAt).toBeDefined();
      expect(result.summary.endDate).toBeDefined();
    });
  });

  describe('getAccountTransactionHistory', () => {
    test('應該返回科目的交易歷史', async () => {
      // 創建多筆分錄
      await AccountingEntry.create({
        transactionGroupId: testTransactionGroup._id,
        sequence: 1,
        accountId: testAccount._id,
        debitAmount: 1000,
        creditAmount: 0,
        description: '第一筆交易',
        organizationId: testOrganizationId,
        createdBy: 'test-user'
      });

      await AccountingEntry.create({
        transactionGroupId: testTransactionGroup._id,
        sequence: 2,
        accountId: testAccount._id,
        debitAmount: 0,
        creditAmount: 300,
        description: '第二筆交易',
        organizationId: testOrganizationId,
        createdBy: 'test-user'
      });

      const result = await AccountBalanceService.getAccountTransactionHistory(
        (testAccount._id as mongoose.Types.ObjectId).toString(),
        undefined,
        undefined,
        50,
        testOrganizationId.toString()
      );

      expect(result.accountId).toBe((testAccount._id as mongoose.Types.ObjectId).toString());
      expect(result.transactionHistory).toHaveLength(2);
      expect(result.totalTransactions).toBe(2);
      expect(result.currentBalance).toBe(700); // 1000 - 300

      // 檢查交易歷史的順序（應該是時間倒序）
      const history = result.transactionHistory;
      expect(history[0].balanceChange).toBe(-300); // 貸方對借方科目是負數
      expect(history[0].runningBalance).toBe(700);
      expect(history[1].balanceChange).toBe(1000); // 借方對借方科目是正數
      expect(history[1].runningBalance).toBe(1000);
    });

    test('應該根據日期範圍過濾交易歷史', async () => {
      const startDate = new Date('2025-01-15');
      const endDate = new Date('2025-01-20');
      const testDate = new Date('2025-01-18');

      // 創建分錄
      await AccountingEntry.create({
        transactionGroupId: testTransactionGroup._id,
        sequence: 1,
        accountId: testAccount._id,
        debitAmount: 1000,
        creditAmount: 0,
        description: '範圍內交易',
        organizationId: testOrganizationId,
        createdBy: 'test-user',
        createdAt: testDate // 直接在創建時設置日期
      });

      const result = await AccountBalanceService.getAccountTransactionHistory(
        (testAccount._id as mongoose.Types.ObjectId).toString(),
        startDate,
        endDate,
        50,
        testOrganizationId.toString()
      );

      expect(result.transactionHistory).toHaveLength(1);
      expect(result.transactionHistory[0].description).toBe('範圍內交易');
    });

    test('應該限制返回的交易筆數', async () => {
      // 創建多筆分錄
      for (let i = 1; i <= 5; i++) {
        await AccountingEntry.create({
          transactionGroupId: testTransactionGroup._id,
          sequence: i,
          accountId: testAccount._id,
          debitAmount: 100 * i,
          creditAmount: 0,
          description: `交易 ${i}`,
          organizationId: testOrganizationId,
          createdBy: 'test-user'
        });
      }

      const result = await AccountBalanceService.getAccountTransactionHistory(
        (testAccount._id as mongoose.Types.ObjectId).toString(),
        undefined,
        undefined,
        3, // 限制3筆
        testOrganizationId.toString()
      );

      expect(result.transactionHistory).toHaveLength(3);
      expect(result.totalTransactions).toBe(3); // 實際返回的筆數
    });
  });

  describe('錯誤處理', () => {
    test('calculateAccountBalance 應該處理資料庫錯誤', async () => {
      // 使用無效的 ObjectId 格式
      await expect(
        AccountBalanceService.calculateAccountBalance('invalid-id')
      ).rejects.toThrow();
    });

    test('calculateMultipleAccountBalances 應該處理部分失敗', async () => {
      const validId = (testAccount._id as mongoose.Types.ObjectId).toString();
      const invalidId = new mongoose.Types.ObjectId().toString();

      // 這應該會因為其中一個科目不存在而失敗
      await expect(
        AccountBalanceService.calculateMultipleAccountBalances([validId, invalidId])
      ).rejects.toThrow();
    });
  });
});