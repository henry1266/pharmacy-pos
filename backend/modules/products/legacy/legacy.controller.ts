import type { Request, Response } from 'express'
import { API_CONSTANTS, ERROR_MESSAGES } from '@pharmacy-pos/shared/constants'
import type { ApiResponse } from '@pharmacy-pos/shared/types/api'
import { ProductType } from '@pharmacy-pos/shared/enums'
import {
  LegacyProductServiceError,
  type LegacyProductPayload,
  createLegacyMedicine,
  createLegacyProduct,
  createLegacyTestData,
  findProductByCode,
  findProductById,
  listBaseProducts,
  listMedicines,
  listProducts,
  softDeleteProduct,
  updateLegacyProduct,
  updateProductPackageUnits,
} from './legacy.service'

const RESPONSE_MESSAGES = {
  PRODUCT_LIST_SUCCESS: '產品列表獲取成功',
  BASE_PRODUCT_LIST_SUCCESS: '商品列表獲取成功',
  MEDICINE_LIST_SUCCESS: '藥品列表獲取成功',
  PRODUCT_FETCH_SUCCESS: '產品獲取成功',
  PRODUCT_CREATE_SUCCESS: '商品創建成功',
  MEDICINE_CREATE_SUCCESS: '藥品創建成功',
  PRODUCT_UPDATE_SUCCESS: '產品更新成功',
  PRODUCT_DELETE_SUCCESS: '產品刪除成功',
  PACKAGE_UNITS_UPDATE_SUCCESS: '包裝單位更新成功',
  PACKAGE_UNITS_UPDATE_FAILED: '包裝單位更新失敗',
  TEST_DATA_EXISTS: '測試數據已存在',
  TEST_DATA_CREATE_SUCCESS: '測試數據創建成功',
  TEST_DATA_CREATE_FAILED: '創建測試數據失敗',
} as const

type SuccessMessageKey = keyof typeof RESPONSE_MESSAGES

type SuccessStatus =
  | typeof API_CONSTANTS.HTTP_STATUS.OK
  | typeof API_CONSTANTS.HTTP_STATUS.CREATED

function respondSuccess<T>(
  res: Response,
  status: SuccessStatus,
  messageKey: SuccessMessageKey,
  data?: T,
  extra?: Record<string, unknown>,
): void {
  res.status(status).json({
    success: true,
    message: RESPONSE_MESSAGES[messageKey],
    ...(data !== undefined ? { data } : {}),
    ...(extra ?? {}),
    timestamp: new Date(),
  } as ApiResponse<T>)
}

function handleControllerError(error: unknown, res: Response, logMessage: string): void {
  if (error instanceof LegacyProductServiceError) {
    res.status(error.status).json({
      success: false,
      message: error.message,
      ...(error.details ? { error: error.details } : {}),
      timestamp: new Date(),
    } as ApiResponse)
    return
  }

  console.error(logMessage, error)
  res.status(API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: ERROR_MESSAGES.GENERIC.INTERNAL_ERROR,
    error: error instanceof Error ? error.message : String(error),
    timestamp: new Date(),
  } as ApiResponse)
}

export async function listProductsHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await listProducts(req.query)
    respondSuccess(res, API_CONSTANTS.HTTP_STATUS.OK, 'PRODUCT_LIST_SUCCESS', result.data, {
      filters: result.filters,
      count: result.count,
    })
  } catch (error) {
    handleControllerError(error, res, '查詢產品列表錯誤：')
  }
}

export async function listBaseProductsHandler(_req: Request, res: Response): Promise<void> {
  try {
    const products = await listBaseProducts()
    respondSuccess(res, API_CONSTANTS.HTTP_STATUS.OK, 'BASE_PRODUCT_LIST_SUCCESS', products)
  } catch (error) {
    handleControllerError(error, res, '查詢商品列表錯誤：')
  }
}

export async function listMedicinesHandler(_req: Request, res: Response): Promise<void> {
  try {
    const medicines = await listMedicines()
    respondSuccess(res, API_CONSTANTS.HTTP_STATUS.OK, 'MEDICINE_LIST_SUCCESS', medicines)
  } catch (error) {
    handleControllerError(error, res, '查詢藥品列表錯誤：')
  }
}

export async function getProductByCodeHandler(req: Request, res: Response): Promise<void> {
  try {
    const product = await findProductByCode(req.params.code)
    respondSuccess(res, API_CONSTANTS.HTTP_STATUS.OK, 'PRODUCT_FETCH_SUCCESS', product)
  } catch (error) {
    handleControllerError(error, res, '依代碼查詢產品錯誤：')
  }
}

export async function getProductByIdHandler(req: Request, res: Response): Promise<void> {
  try {
    const product = await findProductById(req.params.id)
    respondSuccess(res, API_CONSTANTS.HTTP_STATUS.OK, 'PRODUCT_FETCH_SUCCESS', product)
  } catch (error) {
    handleControllerError(error, res, '依 ID 查詢產品錯誤：')
  }
}

export async function createProductHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await createLegacyProduct(req.body as LegacyProductPayload)
    const messageKey =
      result.productType === ProductType.MEDICINE ? 'MEDICINE_CREATE_SUCCESS' : 'PRODUCT_CREATE_SUCCESS'
    respondSuccess(res, API_CONSTANTS.HTTP_STATUS.CREATED, messageKey, result.document)
  } catch (error) {
    handleControllerError(error, res, '建立產品時發生錯誤：')
  }
}

export async function createMedicineHandler(req: Request, res: Response): Promise<void> {
  try {
    const result = await createLegacyMedicine(req.body as LegacyProductPayload)
    respondSuccess(res, API_CONSTANTS.HTTP_STATUS.CREATED, 'MEDICINE_CREATE_SUCCESS', result.document)
  } catch (error) {
    handleControllerError(error, res, '建立藥品時發生錯誤：')
  }
}

export async function updateProductHandler(req: Request, res: Response): Promise<void> {
  try {
    const updatedProduct = await updateLegacyProduct(req.params.id, req.body as LegacyProductPayload)
    respondSuccess(res, API_CONSTANTS.HTTP_STATUS.OK, 'PRODUCT_UPDATE_SUCCESS', updatedProduct)
  } catch (error) {
    handleControllerError(error, res, '更新產品時發生錯誤：')
  }
}

export async function deleteProductHandler(req: Request, res: Response): Promise<void> {
  try {
    const deletedProduct = await softDeleteProduct(req.params.id)
    respondSuccess(res, API_CONSTANTS.HTTP_STATUS.OK, 'PRODUCT_DELETE_SUCCESS', deletedProduct)
  } catch (error) {
    handleControllerError(error, res, '刪除產品時發生錯誤：')
  }
}

export async function updatePackageUnitsHandler(req: Request, res: Response): Promise<void> {
  try {
    const { packageUnits } = (req.body ?? {}) as { packageUnits?: unknown }
    const updatedUnits = await updateProductPackageUnits(req.params.id, packageUnits)
    respondSuccess(res, API_CONSTANTS.HTTP_STATUS.OK, 'PACKAGE_UNITS_UPDATE_SUCCESS', updatedUnits)
  } catch (error) {
    handleControllerError(error, res, '更新包裝單位失敗：')
  }
}

export async function createTestDataHandler(_req: Request, res: Response): Promise<void> {
  try {
    const result = await createLegacyTestData()
    if (result.alreadyExists) {
      respondSuccess(res, API_CONSTANTS.HTTP_STATUS.OK, 'TEST_DATA_EXISTS', {
        count: result.count ?? 0,
      })
      return
    }

    respondSuccess(res, API_CONSTANTS.HTTP_STATUS.OK, 'TEST_DATA_CREATE_SUCCESS', result.summary)
  } catch (error) {
    handleControllerError(error, res, '創建測試數據失敗：')
  }
}
