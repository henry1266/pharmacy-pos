const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 記帳名目類別資料模型
const AccountingCategorySchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    default: 999 // 預設排序值，新增的類別會排在最後
  },
  isActive: {
    type: Boolean,
    default: true
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

module.exports = mongoose.model('AccountingCategory', AccountingCategorySchema);
