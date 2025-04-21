const mongoose = require('mongoose');

// 基礎產品模型
const BaseProductSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  shortCode: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String
  },
  unit: {
    type: String
  },
  purchasePrice: {
    type: Number,
    default: 0
  },
  sellingPrice: {
    type: Number,
    default: 0
  },
  description: {
    type: String
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'supplier'
  },
  minStock: {
    type: Number,
    default: 10
  },
  productType: {
    type: String,
    required: true,
    enum: ['product', 'medicine']
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { discriminatorKey: 'productType' });

// 創建基礎模型
const BaseProduct = mongoose.model('baseproduct', BaseProductSchema);

// 商品擴展模型
const Product = BaseProduct.discriminator('product', new mongoose.Schema({
  barcode: {
    type: String
  }
}));

// 藥品擴展模型
const Medicine = BaseProduct.discriminator('medicine', new mongoose.Schema({
  barcode: {
    type: String
  },
  healthInsuranceCode: {
    type: String
  },
  healthInsurancePrice: {
    type: Number,
    default: 0
  }
}));

module.exports = {
  BaseProduct,
  Product,
  Medicine
};
