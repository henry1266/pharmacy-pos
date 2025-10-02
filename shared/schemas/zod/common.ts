import { z, type ZodTypeAny } from 'zod';

const timestampSchema = z.union([z.string(), z.date()]);

export const apiSuccessEnvelopeSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
  timestamp: timestampSchema.optional(),
});

export const createApiResponseSchema = <T extends ZodTypeAny>(dataSchema: T) =>
  apiSuccessEnvelopeSchema.extend({
    data: dataSchema.optional(),
  });

export const paginationInfoSchema = z.object({
  total: z.number().optional(),
  currentPage: z.number().optional(),
  page: z.number().optional(),
  totalPages: z.number().optional(),
  totalItems: z.number().optional(),
  limit: z.number().optional(),
  itemsPerPage: z.number().optional(),
  hasNextPage: z.boolean(),
  hasPrevPage: z.boolean(),
});

export const createPaginatedResponseSchema = <T extends ZodTypeAny>(itemSchema: T) =>
  apiSuccessEnvelopeSchema.extend({
    data: z.array(itemSchema),
    pagination: paginationInfoSchema,
  });

export const apiErrorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  error: z.string().optional(),
  errors: z
    .array(
      z.object({
        msg: z.string(),
        param: z.string().optional(),
        location: z.string().optional(),
      }),
    )
    .optional(),
  details: z.record(z.unknown()).optional(),
  statusCode: z.number().optional(),
  timestamp: timestampSchema.optional(),
});

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
