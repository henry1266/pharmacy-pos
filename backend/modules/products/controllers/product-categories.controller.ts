import { Router, type Request, type Response } from 'express'
import auth from '../../../middleware/auth'
import { ERROR_MESSAGES } from '@pharmacy-pos/shared/constants'
const INVALID_REQUEST_MESSAGE = ERROR_MESSAGES.GENERIC?.INVALID_REQUEST ?? '\u7121\u6548\u7684\u8ACB\u6C42'
const VALIDATION_FAILED_MESSAGE = ERROR_MESSAGES.GENERIC?.VALIDATION_FAILED ?? '\u8CC7\u6599\u9A57\u8B49\u5931\u6557'
const SERVER_ERROR_MESSAGE = ERROR_MESSAGES.GENERIC?.SERVER_ERROR ?? '\u4F3A\u670D\u5668\u767C\u751F\u932F\u8AA4'

import {
  productCategoryCreateSchema,
  productCategoryIdSchema,
  productCategoryUpdateSchema,
} from '../schemas/product-category.schema'
import {
  archiveProductCategory,
  createProductCategory,
  getProductCategory,
  listProductCategories,
  updateProductCategory,
  ProductCategoryServiceError,
} from '../services/product-category.service'
import logger from '../../../utils/logger'

const router: Router = Router()

router.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await listProductCategories()
    res.json({
      success: true,
      message: '\u53D6\u5F97\u7522\u54C1\u5206\u985E\u5217\u8868\u6210\u529F',
      data: categories,
      timestamp: new Date(),
    })
  } catch (error) {
    handleCategoryError(error, res, '\u53D6\u5F97\u7522\u54C1\u5206\u985E\u5217\u8868\u6642\u767C\u751F\u932F\u8AA4')
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  const parseParams = productCategoryIdSchema.safeParse(req.params)
  if (!parseParams.success) {
    res.status(400).json({
      success: false,
      message: INVALID_REQUEST_MESSAGE,
      issues: parseParams.error.flatten(),
    })
    return
  }

  try {
    const category = await getProductCategory(parseParams.data.id)
    if (!category) {
      res.status(404).json({
        success: false,
        message: '\u627E\u4E0D\u5230\u6307\u5B9A\u7684\u5206\u985E',
        timestamp: new Date(),
      })
      return
    }

    res.json({
      success: true,
      message: '\u53D6\u5F97\u7522\u54C1\u5206\u985E\u6210\u529F',
      data: category,
      timestamp: new Date(),
    })
  } catch (error) {
    handleCategoryError(error, res, '\u53D6\u5F97\u7522\u54C1\u5206\u985E\u6642\u767C\u751F\u932F\u8AA4')
  }
})

router.post('/', auth, async (req: Request, res: Response) => {
  const parseBody = productCategoryCreateSchema.safeParse(req.body)
  if (!parseBody.success) {
    res.status(400).json({
      success: false,
      message: VALIDATION_FAILED_MESSAGE,
      issues: parseBody.error.flatten(),
    })
    return
  }

  try {
    const category = await createProductCategory(parseBody.data)
    res.status(201).json({
      success: true,
      message: '\u65B0\u589E\u7522\u54C1\u5206\u985E\u6210\u529F',
      data: category,
      timestamp: new Date(),
    })
  } catch (error) {
    handleCategoryError(error, res, '\u65B0\u589E\u7522\u54C1\u5206\u985E\u6642\u767C\u751F\u932F\u8AA4')
  }
})

router.put('/:id', auth, async (req: Request, res: Response) => {
  const parseParams = productCategoryIdSchema.safeParse(req.params)
  if (!parseParams.success) {
    res.status(400).json({
      success: false,
      message: INVALID_REQUEST_MESSAGE,
      issues: parseParams.error.flatten(),
    })
    return
  }

  const parseBody = productCategoryUpdateSchema.safeParse(req.body)
  if (!parseBody.success) {
    res.status(400).json({
      success: false,
      message: VALIDATION_FAILED_MESSAGE,
      issues: parseBody.error.flatten(),
    })
    return
  }

  try {
    const category = await updateProductCategory(parseParams.data.id, parseBody.data)
    res.json({
      success: true,
      message: '\u66F4\u65B0\u7522\u54C1\u5206\u985E\u6210\u529F',
      data: category,
      timestamp: new Date(),
    })
  } catch (error) {
    handleCategoryError(error, res, '\u66F4\u65B0\u7522\u54C1\u5206\u985E\u6642\u767C\u751F\u932F\u8AA4')
  }
})

router.delete('/:id', auth, async (req: Request, res: Response) => {
  const parseParams = productCategoryIdSchema.safeParse(req.params)
  if (!parseParams.success) {
    res.status(400).json({
      success: false,
      message: INVALID_REQUEST_MESSAGE,
      issues: parseParams.error.flatten(),
    })
    return
  }

  try {
    const category = await archiveProductCategory(parseParams.data.id)
    res.json({
      success: true,
      message: '\u5206\u985E\u5DF2\u505C\u7528',
      data: category,
      timestamp: new Date(),
    })
  } catch (error) {
    handleCategoryError(error, res, '\u505C\u7528\u7522\u54C1\u5206\u985E\u6642\u767C\u751F\u932F\u8AA4')
  }
})

function isProductCategoryServiceError(error: unknown): error is ProductCategoryServiceError {
  return error instanceof ProductCategoryServiceError
}

function handleCategoryError(error: unknown, res: Response, fallbackMessage: string) {
  if (isProductCategoryServiceError(error)) {
    const { status, message } = error
    res.status(status).json({
      success: false,
      message,
      timestamp: new Date(),
    })
    return
  }

  logger.error(`${fallbackMessage}: ${error instanceof Error ? error.message : String(error)}`)
  res.status(500).json({
    success: false,
    message: SERVER_ERROR_MESSAGE,
    timestamp: new Date(),
  })
}

export default router
