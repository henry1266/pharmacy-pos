const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// 記帳系統資料模型
const AccountingSchema = new Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ["pending", "completed"],
    default: "pending",
    index: true
  },
  shift: {
    type: String,
    required: true,
    enum: ["早", "中", "晚"],
    index: true
  },
  items: [{
    amount: {
      type: Number,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "AccountingCategory"
    },
    note: {
      type: String,
      default: ""
    }
  }],
  totalAmount: {
    type: Number,
    required: true,
    default: 0
  },
  createdBy: {
    type: Schema.Types.Mixed, // Keep Mixed for bypass user compatibility
    ref: "User",
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// 確保同一日期和班別只能有一筆記錄
AccountingSchema.index({ date: 1, shift: 1 }, { unique: true });

// REMOVED: 計算總金額的 pre-save hook，因為總額計算已在路由中處理
// AccountingSchema.pre("save", function(next) {
//   this.totalAmount = this.items.reduce((sum, item) => sum + item.amount, 0);
//   next();
// });

module.exports = mongoose.model("Accounting", AccountingSchema);

