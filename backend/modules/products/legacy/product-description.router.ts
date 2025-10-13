import { Router, Request, Response } from 'express'
import { ZodError } from 'zod'
import { ERROR_MESSAGES } from '@pharmacy-pos/shared/constants'
import {
  productDescriptionParamsSchema,
  productDescriptionUpdateSchema,
} from '@pharmacy-pos/shared/schemas/zod/productDescription'
import {
  getProductDescription,
  upsertProductDescription,
  ProductDescriptionServiceError,
} from '../services/product-description.service'

const router: Router = Router()

const SERVER_ERROR_MESSAGE =
  ERROR_MESSAGES.GENERIC?.SERVER_ERROR ?? '\u4F3A\u670D\u5668\u767C\u751F\u932F\u8AA4'

type ErrorBody = {
  success: false
  message: string
  statusCode: number
  timestamp: Date
  error?: string
  errors?: ReturnType<ZodError['flatten']>
}

type SuccessBody<TData> = {
  success: true
  message: string
  timestamp: Date
  data?: TData
}

const createSuccessBody = <TData>(message: string, data?: TData): SuccessBody<TData> => ({
  success: true,
  message,
  timestamp: new Date(),
  ...(data === undefined ? {} : { data }),
})

const createErrorBody = (
  statusCode: number,
  message: string,
  error?: unknown,
  errors?: ReturnType<ZodError['flatten']>,
): ErrorBody => ({
  success: false,
  message,
  statusCode,
  timestamp: new Date(),
  ...(error instanceof Error ? { error: error.message } : {}),
  ...(errors ? { errors } : {}),
})

const handleServiceError = (res: Response, error: unknown) => {
  if (error instanceof ProductDescriptionServiceError) {
    return res.status(error.status).json(createErrorBody(error.status, error.message))
  }

  return res
    .status(500)
    .json(createErrorBody(500, SERVER_ERROR_MESSAGE, error))
}

const validateParams = (req: Request, res: Response) => {
  const parseResult = productDescriptionParamsSchema.safeParse(req.params)
  if (!parseResult.success) {
    res
      .status(400)
      .json(createErrorBody(400, 'Invalid request parameters', undefined, parseResult.error.flatten()))
    return null
  }

  return parseResult.data
}

router.get('/:productId/description', async (req, res) => {
  const params = validateParams(req, res)
  if (!params) {
    return
  }

  try {
    const description = await getProductDescription(params.productId)

    const hasContent =
      (description.summary ?? '').trim().length > 0 || (description.description ?? '').trim().length > 0

    const message = hasContent
      ? '\u53D6\u5F97\u5546\u54C1\u63CF\u8FF0\u6210\u529F'
      : '\u5C1A\u672A\u5EFA\u7ACB\u5546\u54C1\u63CF\u8FF0'

    res.status(200).json(createSuccessBody(message, description))
  } catch (error) {
    handleServiceError(res, error)
  }
})

router.patch('/:productId/description', async (req, res) => {
  const params = validateParams(req, res)
  if (!params) {
    return
  }

  const bodyResult = productDescriptionUpdateSchema.safeParse(req.body)
  if (!bodyResult.success) {
    res
      .status(400)
      .json(createErrorBody(400, 'Invalid request body', undefined, bodyResult.error.flatten()))
    return
  }

  try {
    const payload = bodyResult.data
    const { data, hasChanged } = await upsertProductDescription(params.productId, payload)

    const message = payload.isAutoSave
      ? '\u81EA\u52D5\u5132\u5B58\u6210\u529F'
      : hasChanged
        ? '\u5132\u5B58\u5546\u54C1\u63CF\u8FF0\u6210\u529F'
        : '\u5167\u5BB9\u672A\u8B8A\u66F4'

    res.status(200).json(createSuccessBody(message, data))
  } catch (error) {
    handleServiceError(res, error)
  }
})

export default router
