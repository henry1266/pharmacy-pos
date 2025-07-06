const mongoose = require('mongoose');

// 連接資料庫
mongoose.connect('mongodb://192.168.68.79:27017/pharmacy-pos')
  .then(async () => {
    console.log('✅ 資料庫連接成功');
    
    // 開始事務
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        // 1. 建立交易群組
        const transactionGroup = {
          _id: new mongoose.Types.ObjectId("68694fce42e80ef7457d06ce"),
          groupNumber: "TXN-20250705-001",
          description: "投資",
          transactionDate: new Date("2024-07-31T16:00:00.000Z"),
          organizationId: new mongoose.Types.ObjectId("686390c76ac0ff7bb8bb8387"),
          receiptUrl: "",
          invoiceNo: "",
          totalAmount: 650000,
          status: "confirmed",
          linkedTransactionIds: [],
          sourceTransactionId: null,
          fundingType: "original",
          createdBy: "68116da97e7357593011e2af",
          createdAt: new Date("2025-07-05T16:16:14.441Z"),
          updatedAt: new Date("2025-07-05T16:18:33.510Z"),
          __v: 0
        };

        // 2. 建立會計分錄陣列
        const accountingEntries = [
          {
            _id: new mongoose.Types.ObjectId("68694fce42e80ef7457d06d0"),
            transactionGroupId: new mongoose.Types.ObjectId("68694fce42e80ef7457d06ce"),
            sequence: 1,
            accountId: new mongoose.Types.ObjectId("6865ca8f6826486eeb78c8ea"),
            debitAmount: 650000,
            creditAmount: 0,
            categoryId: null,
            description: "投資",
            sourceTransactionId: null,
            fundingPath: [],
            organizationId: new mongoose.Types.ObjectId("686390c76ac0ff7bb8bb8387"),
            createdBy: "68116da97e7357593011e2af",
            createdAt: new Date("2025-07-05T16:16:14.496Z"),
            updatedAt: new Date("2025-07-05T16:16:14.496Z"),
            __v: 0
          },
          {
            _id: new mongoose.Types.ObjectId("68694fce42e80ef7457d06d1"),
            transactionGroupId: new mongoose.Types.ObjectId("68694fce42e80ef7457d06ce"),
            sequence: 2,
            accountId: new mongoose.Types.ObjectId("68674ae587107c6d64bd19ae"),
            debitAmount: 0,
            creditAmount: 650000,
            categoryId: null,
            description: "投資",
            sourceTransactionId: null,
            fundingPath: [],
            organizationId: new mongoose.Types.ObjectId("686390c76ac0ff7bb8bb8387"),
            createdBy: "68116da97e7357593011e2af",
            createdAt: new Date("2025-07-05T16:16:14.496Z"),
            updatedAt: new Date("2025-07-05T16:16:14.496Z"),
            __v: 0
          }
        ];

        // 3. 驗證借貸平衡
        const totalDebit = accountingEntries.reduce((sum, entry) => sum + entry.debitAmount, 0);
        const totalCredit = accountingEntries.reduce((sum, entry) => sum + entry.creditAmount, 0);
        
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
          throw new Error(`借貸不平衡：借方 ${totalDebit}，貸方 ${totalCredit}`);
        }

        console.log('✅ 借貸平衡驗證通過');
        console.log(`   借方總額：${totalDebit}`);
        console.log(`   貸方總額：${totalCredit}`);

        // 4. 插入交易群組
        await mongoose.connection.db.collection('transactionGroups').insertOne(
          transactionGroup, 
          { session }
        );
        console.log('✅ 交易群組建立成功');

        // 5. 插入會計分錄
        await mongoose.connection.db.collection('accountingentries').insertMany(
          accountingEntries, 
          { session }
        );
        console.log('✅ 會計分錄建立成功');

        // 6. 驗證資料完整性
        const createdGroup = await mongoose.connection.db.collection('transactionGroups').findOne(
          { _id: transactionGroup._id },
          { session }
        );
        
        const createdEntries = await mongoose.connection.db.collection('accountingentries').find(
          { transactionGroupId: transactionGroup._id },
          { session }
        ).toArray();

        console.log('📊 建立結果驗證：');
        console.log(`   交易群組：${createdGroup ? '✅' : '❌'}`);
        console.log(`   分錄數量：${createdEntries.length} 筆`);
        console.log(`   預期分錄：${accountingEntries.length} 筆`);

        if (createdEntries.length !== accountingEntries.length) {
          throw new Error('分錄數量不符合預期');
        }

        console.log('🎉 投資交易建立完成！');
      });

    } catch (error) {
      console.error('❌ 交易建立失敗:', error.message);
      throw error;
    } finally {
      await session.endSession();
    }

  })
  .catch(err => {
    console.error('❌ 資料庫連接錯誤:', err.message);
  })
  .finally(() => {
    mongoose.disconnect();
    console.log('🔌 資料庫連接已關閉');
  });