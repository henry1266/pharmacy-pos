import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { JWTPayload } from './api';

// Express Request 擴展
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    username: string;
    role: string;
    isAdmin?: boolean;
  };
}

export interface AdminRequest extends AuthenticatedRequest {
  user: AuthenticatedRequest['user'] & {
    isAdmin: true;
  };
}

// 檔案上傳相關的 Request 擴展
export interface FileUploadRequest extends Request {
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

export interface AuthenticatedFileUploadRequest extends AuthenticatedRequest {
  file?: Express.Multer.File;
  files?: Express.Multer.File[] | { [fieldname: string]: Express.Multer.File[] };
}

// 分頁查詢相關的 Request 擴展
export interface PaginatedRequest extends Request {
  query: Request['query'] & {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
  };
}

export interface AuthenticatedPaginatedRequest extends AuthenticatedRequest {
  query: PaginatedRequest['query'];
}

// 自訂中間件型別
export type AuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

export type AdminAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

export type ValidationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

export type FileUploadMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

// 錯誤處理中間件型別
export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
  isOperational?: boolean;
}

export type ErrorHandler = (
  error: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => void;

// API 回應輔助函數型別
export interface ApiResponseHelpers {
  success<T = any>(data?: T, message?: string): void;
  error(message: string, statusCode?: number, details?: any): void;
  paginated<T = any>(
    data: T[],
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    },
    message?: string
  ): void;
  notFound(message?: string): void;
  unauthorized(message?: string): void;
  forbidden(message?: string): void;
  badRequest(message?: string, details?: any): void;
  serverError(message?: string, error?: any): void;
}

export interface ExtendedResponse extends Response {
  api: ApiResponseHelpers;
}

// 路由處理器型別
export type RouteHandler = (
  req: Request,
  res: Response,
  next?: NextFunction
) => void | Promise<void>;

export type AuthenticatedRouteHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next?: NextFunction
) => void | Promise<void>;

export type AdminRouteHandler = (
  req: AdminRequest,
  res: Response,
  next?: NextFunction
) => void | Promise<void>;

export type FileUploadRouteHandler = (
  req: AuthenticatedFileUploadRequest,
  res: Response,
  next?: NextFunction
) => void | Promise<void>;

export type PaginatedRouteHandler = (
  req: AuthenticatedPaginatedRequest,
  res: Response,
  next?: NextFunction
) => void | Promise<void>;

// 驗證規則型別
export interface ValidationSchema {
  [field: string]: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'objectId';
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: any[];
    custom?: (value: any) => boolean | string;
    sanitize?: (value: any) => any;
  };
}

export interface ValidationOptions {
  abortEarly?: boolean;
  allowUnknown?: boolean;
  stripUnknown?: boolean;
  skipMissing?: boolean;
}

// 中間件配置型別
export interface MiddlewareConfig {
  auth?: {
    required?: boolean;
    roles?: string[];
    permissions?: string[];
  };
  validation?: {
    body?: ValidationSchema;
    query?: ValidationSchema;
    params?: ValidationSchema;
    options?: ValidationOptions;
  };
  fileUpload?: {
    maxSize?: number;
    allowedTypes?: string[];
    maxFiles?: number;
    destination?: string;
  };
  rateLimit?: {
    windowMs?: number;
    max?: number;
    message?: string;
  };
  cache?: {
    ttl?: number;
    key?: string | ((req: Request) => string);
  };
}

// 路由配置型別
export interface RouteConfig {
  path: string;
  method: 'get' | 'post' | 'put' | 'patch' | 'delete';
  handler: RouteHandler;
  middleware?: MiddlewareConfig;
  description?: string;
  tags?: string[];
  deprecated?: boolean;
}

// 控制器基礎型別
export interface BaseController {
  index?: PaginatedRouteHandler;
  show?: AuthenticatedRouteHandler;
  create?: AuthenticatedRouteHandler;
  update?: AuthenticatedRouteHandler;
  destroy?: AuthenticatedRouteHandler;
}

// 服務層介面型別
export interface BaseService<T = any> {
  findAll(filter?: any, options?: any): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  count(filter?: any): Promise<number>;
}

// 資料庫查詢選項型別
export interface QueryOptions {
  select?: string | string[];
  populate?: string | string[] | any;
  sort?: string | { [key: string]: 1 | -1 };
  limit?: number;
  skip?: number;
  lean?: boolean;
}

export interface PaginationOptions extends QueryOptions {
  page: number;
  limit: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// WebSocket 相關型別
export interface SocketUser {
  id: string;
  username: string;
  role: string;
  socketId: string;
  connectedAt: Date;
}

export interface SocketMessage {
  type: string;
  payload: any;
  timestamp: Date;
  from?: string;
  to?: string | string[];
}

export interface SocketEventHandler {
  event: string;
  handler: (socket: any, data: any) => void | Promise<void>;
  middleware?: (socket: any, next: Function) => void;
}

// 快取中間件型別
export interface CacheMiddlewareOptions {
  ttl?: number;
  key?: string | ((req: Request) => string);
  condition?: (req: Request) => boolean;
  vary?: string[];
  tags?: string[];
}

// 日誌中間件型別
export interface LoggingMiddlewareOptions {
  level?: 'debug' | 'info' | 'warn' | 'error';
  format?: string;
  skip?: (req: Request, res: Response) => boolean;
  meta?: (req: Request, res: Response) => any;
}

// 安全中間件型別
export interface SecurityMiddlewareOptions {
  cors?: {
    origin?: string | string[] | boolean;
    credentials?: boolean;
    methods?: string[];
    allowedHeaders?: string[];
  };
  helmet?: any;
  rateLimit?: {
    windowMs?: number;
    max?: number;
    message?: string;
    standardHeaders?: boolean;
    legacyHeaders?: boolean;
  };
  csrf?: {
    cookie?: boolean;
    value?: (req: Request) => string;
  };
}

// API 版本控制型別
export interface ApiVersion {
  version: string;
  deprecated?: boolean;
  sunset?: Date;
  routes: RouteConfig[];
}

export interface VersioningOptions {
  type: 'header' | 'query' | 'path';
  key?: string;
  default?: string;
  versions: ApiVersion[];
}