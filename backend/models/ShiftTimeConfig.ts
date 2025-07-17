import mongoose, { Schema, Model, Document } from 'mongoose';

/**
 * 班次時間配置文檔介面
 */
export interface IShiftTimeConfigDocument extends Document {
  _id: mongoose.Types.ObjectId;
  shift: 'morning' | 'afternoon' | 'evening';
  startTime: string;
  endTime: string;
  isActive: boolean;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 班次時間配置 Schema
 */
const ShiftTimeConfigSchema = new Schema({
  shift: {
    type: String,
    enum: ['morning', 'afternoon', 'evening'],
    required: true,
    unique: true
  },
  startTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v: string) {
        // 驗證時間格式 HH:MM
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: '時間格式必須為 HH:MM'
    }
  },
  endTime: {
    type: String,
    required: true,
    validate: {
      validator: function(v: string) {
        // 驗證時間格式 HH:MM
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: '時間格式必須為 HH:MM'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    maxlength: 200
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'user'
  }
}, {
  timestamps: true
});

// 建立索引
ShiftTimeConfigSchema.index({ shift: 1 }, { unique: true });
ShiftTimeConfigSchema.index({ isActive: 1 });

/**
 * 班次時間配置模型
 */
const ShiftTimeConfig: Model<IShiftTimeConfigDocument> = mongoose.model<IShiftTimeConfigDocument>(
  'shiftTimeConfig', 
  ShiftTimeConfigSchema
);

export default ShiftTimeConfig;