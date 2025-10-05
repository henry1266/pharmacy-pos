import type { z } from 'zod';
import { productQuerySchema, productSchema } from '@pharmacy-pos/shared';

export type ProductResponseDto = z.infer<typeof productSchema>;
export type ProductQueryParams = z.infer<typeof productQuerySchema>;

export interface ProductListEnvelope<T = ProductResponseDto[]> {
  success: true;
  data?: T;
  message?: string;
  timestamp?: string;
  filters?: unknown;
  count?: number;
}
