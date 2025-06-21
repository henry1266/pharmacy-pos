import mongoose, { Schema } from 'mongoose';
import { IMonitoredProduct, IMonitoredProductDocument } from '../src/types/models';

// 用於儲存需要監控的產品編號的模型
const MonitoredProductSchema = new Schema<IMonitoredProductDocument>({
  productCode: {
    type: String,
    required: [true, "產品編號為必填欄位"],
    unique: true, // 確保每個監控的產品編號是唯一的
    trim: true, // 去除前後空格
    index: true // 為 productCode 添加索引以優化查詢
  },
  // 可選：記錄添加者和添加時間
  addedBy: {
    // 恢復為 ObjectId 並保留 ref
    type: Schema.Types.ObjectId,
    ref: "User" 
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

// 實例方法：驗證產品編號是否有效
MonitoredProductSchema.methods.isProductCodeValid = async function(
  this: IMonitoredProductDocument
): Promise<boolean> {
  const BaseProduct = mongoose.model('baseproduct');
  const product = await BaseProduct.findOne({ productCode: this.productCode });
  return !!product;
};

// 實例方法：獲取產品資訊
MonitoredProductSchema.methods.getProductInfo = async function(
  this: IMonitoredProductDocument
): Promise<any> {
  const BaseProduct = mongoose.model('baseproduct');
  return BaseProduct.findOne({ productCode: this.productCode })
    .populate('category', 'name')
    .lean();
};

// 靜態方法：根據產品編號查找
MonitoredProductSchema.statics.findByProductCode = function(productCode: string) {
  return this.findOne({ productCode: productCode.trim() });
};

// 靜態方法：獲取所有監控產品的詳細資訊
MonitoredProductSchema.statics.getMonitoredProductsWithDetails = async function() {
  const BaseProduct = mongoose.model('baseproduct');
  const monitoredProducts = await this.find().sort({ addedAt: -1 });
  
  const productsWithDetails = await Promise.all(
    monitoredProducts.map(async (monitored: IMonitoredProductDocument) => {
      const product = await BaseProduct.findOne({ productCode: monitored.productCode })
        .populate('category', 'name')
        .lean();
      
      return {
        _id: monitored._id,
        productCode: monitored.productCode,
        addedBy: monitored.addedBy,
        addedAt: monitored.addedAt,
        product: product,
        isValid: !!product
      };
    })
  );
  
  return productsWithDetails;
};

// 靜態方法：批量添加監控產品
MonitoredProductSchema.statics.addMultipleProducts = async function(
  productCodes: string[],
  addedBy?: mongoose.Types.ObjectId
) {
  const uniqueCodes = [...new Set(productCodes.map(code => code.trim()))];
  const existingCodes = await this.find({ 
    productCode: { $in: uniqueCodes } 
  }).distinct('productCode');
  
  const newCodes = uniqueCodes.filter(code => !existingCodes.includes(code));
  
  if (newCodes.length === 0) {
    return { added: 0, skipped: uniqueCodes.length, errors: [] };
  }
  
  const documents = newCodes.map(code => ({
    productCode: code,
    addedBy,
    addedAt: new Date()
  }));
  
  try {
    const result = await this.insertMany(documents, { ordered: false });
    return { 
      added: result.length, 
      skipped: uniqueCodes.length - newCodes.length, 
      errors: [] 
    };
  } catch (error: any) {
    const errors = error.writeErrors || [];
    const successCount = newCodes.length - errors.length;
    
    return { 
      added: successCount, 
      skipped: uniqueCodes.length - newCodes.length, 
      errors: errors.map((err: any) => err.errmsg) 
    };
  }
};

// 靜態方法：清理無效的監控產品
MonitoredProductSchema.statics.cleanupInvalidProducts = async function() {
  const BaseProduct = mongoose.model('baseproduct');
  const monitoredProducts = await this.find();
  
  const invalidIds = [];
  for (const monitored of monitoredProducts) {
    const product = await BaseProduct.findOne({ productCode: monitored.productCode });
    if (!product) {
      invalidIds.push(monitored._id);
    }
  }
  
  if (invalidIds.length > 0) {
    await this.deleteMany({ _id: { $in: invalidIds } });
  }
  
  return { removed: invalidIds.length };
};

export default mongoose.model<IMonitoredProductDocument>("MonitoredProduct", MonitoredProductSchema);