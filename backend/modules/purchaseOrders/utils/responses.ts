import { API_CONSTANTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from "@pharmacy-pos/shared/constants";
import type { PurchaseOrderDetail, PurchaseOrderSummary, PurchaseOrderError } from "@pharmacy-pos/shared/schemas/purchase-orders";
import type { ApiErrorResponse } from "@pharmacy-pos/shared/schemas/zod/common";
import logger from "../../../utils/logger";

export interface ResolvedServiceError {
  status: number;
  code: PurchaseOrderError["code"];
  message: string;
  error?: string | undefined;
  details?: PurchaseOrderError["details"] | undefined;
  errors?: ApiErrorResponse["errors"] | undefined;
}

const ALLOWED_ERROR_STATUSES = new Set<number>([
  API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
  API_CONSTANTS.HTTP_STATUS.UNAUTHORIZED,
  API_CONSTANTS.HTTP_STATUS.FORBIDDEN,
  API_CONSTANTS.HTTP_STATUS.NOT_FOUND,
  API_CONSTANTS.HTTP_STATUS.CONFLICT,
  API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR,
]);

const STATUS_CODE_MAP: Partial<Record<number, PurchaseOrderError["code"]>> = {
  [API_CONSTANTS.HTTP_STATUS.BAD_REQUEST]: "VALIDATION_FAILED",
  [API_CONSTANTS.HTTP_STATUS.UNAUTHORIZED]: "UNAUTHORIZED",
  [API_CONSTANTS.HTTP_STATUS.FORBIDDEN]: "FORBIDDEN",
  [API_CONSTANTS.HTTP_STATUS.NOT_FOUND]: "NOT_FOUND",
  [API_CONSTANTS.HTTP_STATUS.CONFLICT]: "CONFLICT",
  [API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR]: "SERVER_ERROR",
};

const ERROR_MATCHERS: Array<{
  status: number;
  code: PurchaseOrderError["code"];
  patterns: string[];
}> = [
  {
    status: API_CONSTANTS.HTTP_STATUS.NOT_FOUND,
    code: "NOT_FOUND",
    patterns: ["not found", "does not exist", "missing", "\u4e0d\u5b58\u5728", "\u627e\u4e0d\u5230"],
  },
  {
    status: API_CONSTANTS.HTTP_STATUS.CONFLICT,
    code: "CONFLICT",
    patterns: ["already exists", "conflict", "duplicate", "\u5df2\u5b58\u5728", "\u91cd\u8907"],
  },
  {
    status: API_CONSTANTS.HTTP_STATUS.UNAUTHORIZED,
    code: "UNAUTHORIZED",
    patterns: ["unauthorized", "not authorized", "\u672a\u6388\u6b0a", "\u6b0a\u9650\u4e0d\u8db3"],
  },
  {
    status: API_CONSTANTS.HTTP_STATUS.FORBIDDEN,
    code: "FORBIDDEN",
    patterns: ["forbidden", "permission denied", "\u7981\u6b62", "\u6b0a\u9650"],
  },
  {
    status: API_CONSTANTS.HTTP_STATUS.BAD_REQUEST,
    code: "VALIDATION_FAILED",
    patterns: [
      "validation",
      "invalid",
      "required",
      "missing field",
      "\u9a57\u8b49",
      "\u683c\u5f0f",
      "\u7f3a\u5c11",
      "\u932f\u8aa4",
    ],
  },
];

const ERROR_CODES: PurchaseOrderError["code"][] = [
  "VALIDATION_FAILED",
  "NOT_FOUND",
  "CONFLICT",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "SERVER_ERROR",
];

const includesPattern = (source: string, lowerSource: string, pattern: string): boolean => {
  const trimmed = pattern.trim();
  if (trimmed.length === 0) {
    return false;
  }

  const hasAlpha = /[a-z]/i.test(trimmed);
  if (hasAlpha) {
    return lowerSource.includes(trimmed.toLowerCase());
  }

  return source.includes(trimmed);
};

const normalizeMessage = (value: unknown): string | undefined => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  if (value instanceof Error && value.message.trim().length > 0) {
    return value.message.trim();
  }

  if (typeof value === "object" && value !== null) {
    const { message, error } = value as { message?: unknown; error?: unknown };
    if (typeof message === "string" && message.trim().length > 0) {
      return message.trim();
    }
    if (typeof error === "string" && error.trim().length > 0) {
      return error.trim();
    }
  }

  return undefined;
};

const extractStatus = (value: unknown): number | undefined => {
  const pick = (input: unknown): number | undefined => {
    if (typeof input === "number" && Number.isFinite(input)) {
      return input;
    }
    return undefined;
  };

  if (typeof value === "object" && value !== null) {
    const { status, statusCode } = value as { status?: unknown; statusCode?: unknown };
    const candidate = pick(status) ?? pick(statusCode);
    if (candidate !== undefined && ALLOWED_ERROR_STATUSES.has(candidate)) {
      return candidate;
    }
  }

  const direct = pick(value);
  if (direct !== undefined && ALLOWED_ERROR_STATUSES.has(direct)) {
    return direct;
  }

  return undefined;
};

const extractCode = (value: unknown): PurchaseOrderError["code"] | undefined => {
  const toKnownCode = (candidate: unknown): PurchaseOrderError["code"] | undefined => {
    if (typeof candidate !== "string") {
      return undefined;
    }
    const upper = candidate.toUpperCase() as PurchaseOrderError["code"];
    return ERROR_CODES.includes(upper) ? upper : undefined;
  };

  const direct = toKnownCode(value);
  if (direct) {
    return direct;
  }

  if (typeof value === "object" && value !== null) {
    const candidate = toKnownCode((value as { code?: unknown }).code);
    if (candidate) {
      return candidate;
    }
  }

  return undefined;
};

const sanitizeStatus = (status: number): PurchaseOrderError["statusCode"] => {
  return ALLOWED_ERROR_STATUSES.has(status) ? (status as PurchaseOrderError["statusCode"]) : API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR;
};

type OkStatus = typeof API_CONSTANTS.HTTP_STATUS.OK;

export const createSummaryListResponse = (
  data: PurchaseOrderSummary[],
  message: string = SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS ?? "OK",
) => {
  return {
    status: API_CONSTANTS.HTTP_STATUS.OK as OkStatus,
    body: {
      success: true as const,
      message,
      data,
      timestamp: new Date().toISOString(),
    },
  };
};

export const createDetailResponse = (
  data: PurchaseOrderDetail,
  status: OkStatus = API_CONSTANTS.HTTP_STATUS.OK,
  message?: string,
) => {
  const resolvedMessage = message ?? SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS ?? "OK";

  return {
    status,
    body: {
      success: true as const,
      message: resolvedMessage,
      data,
      timestamp: new Date().toISOString(),
    },
  };
};

export const createDeleteResponse = (
  id: string,
  status: OkStatus = API_CONSTANTS.HTTP_STATUS.OK,
  message: string = SUCCESS_MESSAGES.GENERIC.OPERATION_SUCCESS ?? "OK",
) => {
  return {
    status,
    body: {
      success: true as const,
      message,
      data: { id },
      timestamp: new Date().toISOString(),
    },
  };
};

export const createErrorResponse = ({
  status,
  code,
  message,
  error,
  details,
  errors,
}: ResolvedServiceError) => {
  const responseStatus = sanitizeStatus(status);

  return {
    status: responseStatus,
    body: {
      success: false as const,
      message,
      error,
      code,
      statusCode: responseStatus,
      details,
      errors,
      timestamp: new Date().toISOString(),
    },
  };
};

export const resolveServiceError = (error: unknown): ResolvedServiceError => {
  const message = normalizeMessage(error) ?? ERROR_MESSAGES.GENERIC.SERVER_ERROR;
  const lowerMessage = message.toLowerCase();
  const matcher = ERROR_MATCHERS.find(({ patterns }) =>
    patterns.some((pattern) => includesPattern(message, lowerMessage, pattern)),
  );

  const providedStatus = extractStatus(error);
  const status = providedStatus ?? matcher?.status ?? API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR;

  const providedCode = extractCode(error);
  const statusDerivedCode = STATUS_CODE_MAP[status];
  const code = providedCode ?? matcher?.code ?? statusDerivedCode ?? "SERVER_ERROR";

  const details =
    typeof error === "object" && error !== null ? (error as { details?: ResolvedServiceError["details"] }).details : undefined;
  const errors =
    typeof error === "object" && error !== null ? (error as { errors?: ResolvedServiceError["errors"] }).errors : undefined;

  const errorMessage =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null
          ? ((error as { error?: string }).error ?? undefined)
          : undefined;

  return {
    status,
    code,
    message,
    error: errorMessage,
    details,
    errors,
  };
};

export const handleException = (error: unknown, fallbackMessage: string) => {
  if (error instanceof Error) {
    logger.error(fallbackMessage, error);
  } else {
    logger.error(fallbackMessage, { error });
  }

  return createErrorResponse({
    status: API_CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR,
    code: "SERVER_ERROR",
    message: fallbackMessage,
    error: error instanceof Error ? error.message : normalizeMessage(error),
  });
};
