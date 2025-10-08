import { Router, type Request, type Response } from 'express'
import { productDescriptionParamsSchema, productDescriptionUpdateSchema } from '../../schemas/product-description.schema'
import {
  getProductDescription,
  upsertProductDescription,
  ProductDescriptionServiceError,
} from '../../services/product-description.service'
import { ERROR_MESSAGES } from '@pharmacy-pos/shared/constants'
const INVALID_REQUEST_MESSAGE = ERROR_MESSAGES.GENERIC?.INVALID_REQUEST ?? '\u7121\u6548\u7684\u8ACB\u6C42'
const VALIDATION_FAILED_MESSAGE = ERROR_MESSAGES.GENERIC?.VALIDATION_FAILED ?? '\u8CC7\u6599\u9A57\u8B49\u5931\u6557'
const SERVER_ERROR_MESSAGE = ERROR_MESSAGES.GENERIC?.SERVER_ERROR ?? '\u4F3A\u670D\u5668\u767C\u751F\u932F\u8AA4'

import logger from '../../../../utils/logger'

const router: Router = Router()

router.get('/:productId/description', async (req: Request, res: Response) => {
  const parseParams = productDescriptionParamsSchema.safeParse(req.params)
  if (!parseParams.success) {
    res.status(400).json({
      success: false,
      message: INVALID_REQUEST_MESSAGE,
      issues: parseParams.error.flatten(),
    })
    return
  }

  const { productId } = parseParams.data

  try {
    const description = await getProductDescription(productId)
    const hasContent = description.summary.trim().length > 0 || description.description.trim().length > 0

    res.json({
      success: true,
      message: hasContent ? '\u53D6\u5F97\u5546\u54C1\u63CF\u8FF0\u6210\u529F' : '\u5C1A\u672A\u5EFA\u7ACB\u5546\u54C1\u63CF\u8FF0',
      data: description,
      timestamp: new Date(),
    })
  } catch (error) {
    handleProductDescriptionError(error, res, '\u8B80\u53D6\u5546\u54C1\u63CF\u8FF0\u6642\u767C\u751F\u932F\u8AA4')
  }
})

router.patch('/:productId/description', async (req: Request, res: Response) => {
  const parseParams = productDescriptionParamsSchema.safeParse(req.params)
  if (!parseParams.success) {
    res.status(400).json({
      success: false,
      message: INVALID_REQUEST_MESSAGE,
      issues: parseParams.error.flatten(),
    })
    return
  }

  const parseBody = productDescriptionUpdateSchema.safeParse(req.body)
  if (!parseBody.success) {
    res.status(400).json({
      success: false,
      message: VALIDATION_FAILED_MESSAGE,
      issues: parseBody.error.flatten(),
    })
    return
  }

  const { productId } = parseParams.data
  const payload = parseBody.data

  try {
    const { data, hasChanged } = await upsertProductDescription(productId, payload)
    const message = payload.isAutoSave
      ? '\u81EA\u52D5\u5132\u5B58\u6210\u529F'
      : hasChanged
        ? '\u5132\u5B58\u5546\u54C1\u63CF\u8FF0\u6210\u529F'
        : '\u5167\u5BB9\u672A\u8B8A\u66F4'

    res.json({
      success: true,
      message,
      data,
      timestamp: new Date(),
    })
  } catch (error) {
    handleProductDescriptionError(error, res, '\u66F4\u65B0\u5546\u54C1\u63CF\u8FF0\u6642\u767C\u751F\u932F\u8AA4')
  }
})

function handleProductDescriptionError(error: unknown, res: Response, fallbackMessage: string) {
  if (error instanceof ProductDescriptionServiceError) {
    res.status(error.status).json({
      success: false,
      message: error.message,
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
