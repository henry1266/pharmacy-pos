import type { NextFunction, Request, Response } from 'express'
import { check, validationResult } from 'express-validator'
import { API_CONSTANTS, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants'
import type { ApiResponse } from '@pharmacy-pos/shared/types/api'

const baseCreateRules = [
  check('name').notEmpty().withMessage('產品名稱為必填欄位'),
  check('unit').notEmpty().withMessage('基本單位為必填欄位'),
  check('purchasePrice').optional().isNumeric().withMessage('進貨價格必須為數字'),
  check('sellingPrice').optional().isNumeric().withMessage('售價必須為數字'),
]

export const createProductValidators = baseCreateRules
export const createMedicineValidators = baseCreateRules

export const updateProductValidators = [
  check('name').notEmpty().withMessage('產品名稱不可為空'),
  check('unit').notEmpty().withMessage('基本單位不可為空'),
  check('purchasePrice').optional().isNumeric().withMessage('進貨價格格式錯誤'),
  check('sellingPrice').optional().isNumeric().withMessage('售價格式錯誤'),
  check('minStock').optional().isInt({ min: 0 }).withMessage('最低庫存量須為非負整數'),
  check('healthInsurancePrice').optional().isNumeric().withMessage('健保價格必須為數字'),
]

export function validateRequest(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(API_CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: ERROR_MESSAGES.GENERIC.VALIDATION_FAILED,
      details: errors.array(),
      timestamp: new Date(),
    } as ApiResponse)
    return
  }
  next()
}
