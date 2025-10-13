import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { fifoSaleResponseSchema, fifoErrorResponseSchema } from '../../schemas/zod/fifo';
import { zodId } from '../../utils/zodUtils';

const c = initContract();

const saleIdParamsSchema = z.object({
  saleId: zodId,
});

export const fifoContract = c.router({
  getSaleFifo: {
    method: 'GET',
    path: '/fifo/sale/:saleId',
    pathParams: saleIdParamsSchema,
    responses: {
      200: fifoSaleResponseSchema,
      404: fifoErrorResponseSchema,
      500: fifoErrorResponseSchema,
    },
    metadata: {
      summary: 'FIFO analysis for sale',
      tags: ['FIFO'],
    },
  },
});

export type FifoContract = typeof fifoContract;
