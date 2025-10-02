/**
 * Zod 工具函數和基礎類型定義
 */
import { z } from 'zod';
import { VALIDATION_CONSTANTS } from '../constants';

// 基礎 Zod 類型
export const zodId = z.string().length(24, { message: 'ID 格式錯誤' });
export const zodOptionalId = zodId.optional();
export const zodDate = z.date();
export const zodDateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: '日期格式必須是 YYYY-MM-DD' });
export const zodTimestamp = z.object({
  createdAt: z.date().or(z.string().datetime()),
  updatedAt: z.date().or(z.string().datetime())
});

// 常用驗證模式
export const zodEmail = z.string().email({ message: '電子郵件格式錯誤' }).max(VALIDATION_CONSTANTS.EMAIL.MAX_LENGTH);
export const zodPhone = z.string().regex(VALIDATION_CONSTANTS.PHONE.PATTERN, { message: '電話號碼格式錯誤' });
export const zodIdNumber = z.string().regex(VALIDATION_CONSTANTS.ID_NUMBER.PATTERN, { message: '身分證字號格式錯誤' });
export const zodTaxId = z.string().regex(VALIDATION_CONSTANTS.TAX_ID.PATTERN, { message: '統一編號格式錯誤' });

// 轉換工具函數
export function createZodSchema<T>(schema: z.ZodSchema<T>) {
  return {
    schema,
    validate: (data: unknown) => {
      const result = schema.safeParse(data);
      if (result.success) {
        return { isValid: true, data: result.data, errors: [] };
      } else {
        return {
          isValid: false,
          errors: result.error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
            value: undefined // Zod 3.x 沒有 input 屬性
          }))
        };
      }
    }
  };
}

// 分頁參數 Schema
export const zodPagination = z.object({
  page: z.number().min(1, { message: '頁碼必須大於 0' }).optional(),
  limit: z.number().min(1, { message: '每頁筆數必須大於 0' }).max(100, { message: '每頁筆數不能超過 100' }).optional(),
  sortBy: z.string().max(50, { message: '排序欄位長度不能超過 50 字元' }).optional(),
  sortOrder: z.enum(['asc', 'desc'], { message: '排序方向必須是 asc 或 desc' }).optional(),
  search: z.string().max(200, { message: '搜尋關鍵字長度不能超過 200 字元' }).optional()
});

// 查詢參數 Schema
export const zodQuery = zodPagination.extend({
  category: zodOptionalId,
  status: z.string().max(50, { message: '狀態長度不能超過 50 字元' }).optional(),
  startDate: zodDateString.optional(),
  endDate: zodDateString.optional(),
  isActive: z.boolean().optional()
});