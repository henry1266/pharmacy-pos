import { DoubleEntryValidator } from '../../modules/accounting/utils/doubleEntryValidation';
import { IAccountingEntry } from '../../models/AccountingEntry';

describe('DoubleEntryValidator', () => {
  describe('validateDebitCreditBalance', () => {
    it('應該驗證借貸平衡的分錄', () => {
      const entries = [
        { debitAmount: 1000, creditAmount: 0 },
        { debitAmount: 0, creditAmount: 1000 }
      ];

      const result = DoubleEntryValidator.validateDebitCreditBalance(entries);

      expect(result.totalDebit).toBe(1000);
      expect(result.totalCredit).toBe(1000);
      expect(result.difference).toBe(0);
      expect(result.isBalanced).toBe(true);
      expect(result.message).toBe('借貸平衡');
    });

    it('應該檢測借貸不平衡的分錄', () => {
      const entries = [
        { debitAmount: 1000, creditAmount: 0 },
        { debitAmount: 0, creditAmount: 500 }
      ];

      const result = DoubleEntryValidator.validateDebitCreditBalance(entries);

      expect(result.totalDebit).toBe(1000);
      expect(result.totalCredit).toBe(500);
      expect(result.difference).toBe(500);
      expect(result.isBalanced).toBe(false);
      expect(result.message).toBe('借貸不平衡，差額：500.00');
    });

    it('應該容許小數點誤差', () => {
      const entries = [
        { debitAmount: 100.01, creditAmount: 0 },
        { debitAmount: 0, creditAmount: 100.005 }
      ];

      const result = DoubleEntryValidator.validateDebitCreditBalance(entries);

      expect(result.isBalanced).toBe(true);
      expect(result.message).toBe('借貸平衡');
    });

    it('應該處理空陣列', () => {
      const entries: { debitAmount: number; creditAmount: number }[] = [];

      const result = DoubleEntryValidator.validateDebitCreditBalance(entries);

      expect(result.totalDebit).toBe(0);
      expect(result.totalCredit).toBe(0);
      expect(result.difference).toBe(0);
      expect(result.isBalanced).toBe(true);
    });

    it('應該處理多筆複雜分錄', () => {
      const entries = [
        { debitAmount: 500, creditAmount: 0 },
        { debitAmount: 300, creditAmount: 0 },
        { debitAmount: 0, creditAmount: 200 },
        { debitAmount: 0, creditAmount: 600 }
      ];

      const result = DoubleEntryValidator.validateDebitCreditBalance(entries);

      expect(result.totalDebit).toBe(800);
      expect(result.totalCredit).toBe(800);
      expect(result.isBalanced).toBe(true);
    });
  });

  describe('validateAccountingEntriesBalance', () => {
    it('應該驗證完整記帳分錄的借貸平衡', () => {
      const entries: IAccountingEntry[] = [
        {
          accountId: 'account1',
          debitAmount: 1000,
          creditAmount: 0,
          description: '測試借方',
          sequence: 1
        } as IAccountingEntry,
        {
          accountId: 'account2',
          debitAmount: 0,
          creditAmount: 1000,
          description: '測試貸方',
          sequence: 2
        } as IAccountingEntry
      ];

      const result = DoubleEntryValidator.validateAccountingEntriesBalance(entries);

      expect(result.isBalanced).toBe(true);
      expect(result.totalDebit).toBe(1000);
      expect(result.totalCredit).toBe(1000);
    });
  });

  describe('validateSingleEntry', () => {
    it('應該驗證有效的借方分錄', () => {
      const entry: IAccountingEntry = {
        accountId: 'account1',
        debitAmount: 1000,
        creditAmount: 0,
        description: '測試借方',
        sequence: 1
      } as IAccountingEntry;

      const result = DoubleEntryValidator.validateSingleEntry(entry);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('應該驗證有效的貸方分錄', () => {
      const entry: IAccountingEntry = {
        accountId: 'account1',
        debitAmount: 0,
        creditAmount: 1000,
        description: '測試貸方',
        sequence: 1
      } as IAccountingEntry;

      const result = DoubleEntryValidator.validateSingleEntry(entry);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('應該拒絕借方和貸方金額都為0的分錄', () => {
      const entry: IAccountingEntry = {
        accountId: 'account1',
        debitAmount: 0,
        creditAmount: 0,
        description: '無效分錄',
        sequence: 1
      } as IAccountingEntry;

      const result = DoubleEntryValidator.validateSingleEntry(entry);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('借方金額或貸方金額至少要有一個大於0');
    });

    it('應該拒絕借方和貸方金額同時大於0的分錄', () => {
      const entry: IAccountingEntry = {
        accountId: 'account1',
        debitAmount: 500,
        creditAmount: 300,
        description: '無效分錄',
        sequence: 1
      } as IAccountingEntry;

      const result = DoubleEntryValidator.validateSingleEntry(entry);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('借方金額和貸方金額不能同時大於0');
    });

    it('應該拒絕負數金額的分錄', () => {
      const entry: IAccountingEntry = {
        accountId: 'account1',
        debitAmount: -100,
        creditAmount: 0,
        description: '無效分錄',
        sequence: 1
      } as IAccountingEntry;

      const result = DoubleEntryValidator.validateSingleEntry(entry);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('借方金額和貸方金額不能為負數');
    });

    it('應該拒絕貸方負數金額的分錄', () => {
      const entry: IAccountingEntry = {
        accountId: 'account1',
        debitAmount: 0,
        creditAmount: -200,
        description: '無效分錄',
        sequence: 1
      } as IAccountingEntry;

      const result = DoubleEntryValidator.validateSingleEntry(entry);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('借方金額和貸方金額不能為負數');
    });
  });

  describe('validateTransactionGroup', () => {
    it('應該驗證有效的交易群組', () => {
      const entries: IAccountingEntry[] = [
        {
          accountId: 'account1',
          debitAmount: 1000,
          creditAmount: 0,
          description: '測試借方',
          sequence: 1
        } as IAccountingEntry,
        {
          accountId: 'account2',
          debitAmount: 0,
          creditAmount: 1000,
          description: '測試貸方',
          sequence: 2
        } as IAccountingEntry
      ];

      const result = DoubleEntryValidator.validateTransactionGroup(entries);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.balanceInfo.isBalanced).toBe(true);
    });

    it('應該拒絕少於兩筆分錄的交易群組', () => {
      const entries: IAccountingEntry[] = [
        {
          accountId: 'account1',
          debitAmount: 1000,
          creditAmount: 0,
          description: '單一分錄',
          sequence: 1
        } as IAccountingEntry
      ];

      const result = DoubleEntryValidator.validateTransactionGroup(entries);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('交易群組至少需要兩筆分錄');
    });

    it('應該檢測交易群組中的無效分錄', () => {
      const entries: IAccountingEntry[] = [
        {
          accountId: 'account1',
          debitAmount: 0,
          creditAmount: 0,
          description: '無效分錄',
          sequence: 1
        } as IAccountingEntry,
        {
          accountId: 'account2',
          debitAmount: 0,
          creditAmount: 1000,
          description: '有效分錄',
          sequence: 2
        } as IAccountingEntry
      ];

      const result = DoubleEntryValidator.validateTransactionGroup(entries);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('第 1 筆分錄'))).toBe(true);
    });

    it('應該檢測借貸不平衡的交易群組', () => {
      const entries: IAccountingEntry[] = [
        {
          accountId: 'account1',
          debitAmount: 1000,
          creditAmount: 0,
          description: '借方分錄',
          sequence: 1
        } as IAccountingEntry,
        {
          accountId: 'account2',
          debitAmount: 0,
          creditAmount: 500,
          description: '貸方分錄',
          sequence: 2
        } as IAccountingEntry
      ];

      const result = DoubleEntryValidator.validateTransactionGroup(entries);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('借貸不平衡'))).toBe(true);
    });
  });

  describe('calculateAccountBalance', () => {
    const mockEntries: IAccountingEntry[] = [
      {
        accountId: 'account1',
        debitAmount: 1000,
        creditAmount: 0,
        description: '借方分錄1',
        sequence: 1
      } as IAccountingEntry,
      {
        accountId: 'account1',
        debitAmount: 500,
        creditAmount: 0,
        description: '借方分錄2',
        sequence: 2
      } as IAccountingEntry,
      {
        accountId: 'account1',
        debitAmount: 0,
        creditAmount: 300,
        description: '貸方分錄1',
        sequence: 3
      } as IAccountingEntry,
      {
        accountId: 'account2',
        debitAmount: 0,
        creditAmount: 1200,
        description: '其他帳戶分錄',
        sequence: 4
      } as IAccountingEntry
    ];

    it('應該計算借方科目餘額', () => {
      const result = DoubleEntryValidator.calculateAccountBalance('account1', mockEntries, 'debit');

      expect(result.totalDebit).toBe(1500);
      expect(result.totalCredit).toBe(300);
      expect(result.balance).toBe(1200); // 借方餘額 = 借方總額 - 貸方總額
      expect(result.normalBalance).toBe('debit');
    });

    it('應該計算貸方科目餘額', () => {
      const result = DoubleEntryValidator.calculateAccountBalance('account1', mockEntries, 'credit');

      expect(result.totalDebit).toBe(1500);
      expect(result.totalCredit).toBe(300);
      expect(result.balance).toBe(-1200); // 貸方餘額 = 貸方總額 - 借方總額
      expect(result.normalBalance).toBe('credit');
    });

    it('應該處理不存在的帳戶', () => {
      const result = DoubleEntryValidator.calculateAccountBalance('nonexistent', mockEntries, 'debit');

      expect(result.totalDebit).toBe(0);
      expect(result.totalCredit).toBe(0);
      expect(result.balance).toBe(0);
    });

    it('應該正確過濾帳戶分錄', () => {
      const result = DoubleEntryValidator.calculateAccountBalance('account2', mockEntries, 'credit');

      expect(result.totalDebit).toBe(0);
      expect(result.totalCredit).toBe(1200);
      expect(result.balance).toBe(1200);
    });
  });

  describe('getStandardTemplates', () => {
    it('應該返回標準會計分錄範本', () => {
      const templates = DoubleEntryValidator.getStandardTemplates();

      expect(templates).toHaveProperty('cashIncome');
      expect(templates).toHaveProperty('cashExpense');
      expect(templates).toHaveProperty('bankTransfer');
      expect(templates).toHaveProperty('salaryPayment');

      // 檢查現金收入範本
      expect(templates.cashIncome.name).toBe('現金收入');
      expect(templates.cashIncome.entries).toHaveLength(2);
      expect(templates.cashIncome.entries[0].side).toBe('debit');
      expect(templates.cashIncome.entries[1].side).toBe('credit');

      // 檢查現金支出範本
      expect(templates.cashExpense.name).toBe('現金支出');
      expect(templates.cashExpense.entries).toHaveLength(2);

      // 檢查銀行轉帳範本
      expect(templates.bankTransfer.name).toBe('銀行轉帳');
      expect(templates.bankTransfer.entries).toHaveLength(2);

      // 檢查薪資發放範本
      expect(templates.salaryPayment.name).toBe('薪資發放');
      expect(templates.salaryPayment.entries).toHaveLength(2);
    });
  });
});