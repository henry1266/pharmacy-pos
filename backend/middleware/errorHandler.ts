import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

// 定義錯誤類型
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string | undefined;

  constructor(message: string, statusCode: number, code?: string | undefined) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code || undefined;

    Error.captureStackTrace(this, this.constructor);
  }
}

// 驗證錯誤類
export class ValidationError extends AppError {
  public details: any[];

  constructor(message: string, details: any[] = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

// 資料庫錯誤類
export class DatabaseError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(message, 500, 'DATABASE_ERROR');
    if (originalError && originalError.stack) {
      this.stack = originalError.stack;
    }
  }
}

// 認證錯誤類
export class AuthenticationError extends AppError {
  constructor(message: string = '認證失敗') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

// 授權錯誤類
export class AuthorizationError extends AppError {
  constructor(message: string = '權限不足') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

// 資源不存在錯誤類
export class NotFoundError extends AppError {
  constructor(resource: string = '資源') {
    super(`${resource}不存在`, 404, 'NOT_FOUND_ERROR');
  }
}

// 衝突錯誤類
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

// 業務邏輯錯誤類
export class BusinessLogicError extends AppError {
  constructor(message: string) {
    super(message, 422, 'BUSINESS_LOGIC_ERROR');
  }
}

// 處理 Mongoose 驗證錯誤
const handleValidationError = (err: mongoose.Error.ValidationError): ValidationError => {
  const details = Object.values(err.errors).map(error => ({
    field: error.path,
    message: error.message,
    value: (error as any).value
  }));

  return new ValidationError('資料驗證失敗', details);
};

// 處理 Mongoose CastError
const handleCastError = (_err: mongoose.Error.CastError): NotFoundError => {
  return new NotFoundError('資源');
};

// 處理 MongoDB 重複鍵錯誤
const handleDuplicateKeyError = (err: any): ConflictError => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  return new ConflictError(`${field} "${value}" 已經存在`);
};

// 處理 JWT 錯誤
const handleJWTError = (): AuthenticationError => {
  return new AuthenticationError('無效的認證令牌');
};

const handleJWTExpiredError = (): AuthenticationError => {
  return new AuthenticationError('認證令牌已過期');
};

// 開發環境錯誤響應
const sendErrorDev = (err: AppError, res: Response) => {
  res.status(err.statusCode).json({
    success: false,
    error: {
      message: err.message,
      code: err.code,
      stack: err.stack,
      details: (err as any).details || undefined
    },
    timestamp: new Date().toISOString()
  });
};

// 生產環境錯誤響應
const sendErrorProd = (err: AppError, res: Response) => {
  // 只發送操作性錯誤給客戶端
  if (err.isOperational) {
    const response: any = {
      success: false,
      message: err.message,
      code: err.code,
      timestamp: new Date().toISOString()
    };

    // 如果是驗證錯誤，包含詳細信息
    if (err instanceof ValidationError && err.details) {
      response.details = err.details;
    }

    res.status(err.statusCode).json(response);
  } else {
    // 程式錯誤：不洩露錯誤詳情
    console.error('ERROR 💥', err);
    
    res.status(500).json({
      success: false,
      message: '伺服器內部錯誤',
      code: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString()
    });
  }
};

// 主要錯誤處理中間件
export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // 記錄錯誤
  console.error('Error caught by global handler:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Mongoose 驗證錯誤
  if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  }
  
  // Mongoose CastError
  else if (err.name === 'CastError') {
    error = handleCastError(err);
  }
  
  // MongoDB 重複鍵錯誤
  else if (err.code === 11000) {
    error = handleDuplicateKeyError(err);
  }
  
  // JWT 錯誤
  else if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }
  
  // JWT 過期錯誤
  else if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }
  
  // 如果不是 AppError 實例，轉換為通用錯誤
  else if (!(err instanceof AppError)) {
    error = new AppError(
      err.message || '伺服器內部錯誤',
      err.statusCode || 500,
      err.code || 'INTERNAL_SERVER_ERROR'
    );
    error.isOperational = false; // 標記為非操作性錯誤
  }

  // 根據環境發送錯誤響應
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

// 處理未捕獲的路由
export const handleNotFound = (req: Request, _res: Response, next: NextFunction) => {
  const error = new NotFoundError(`路由 ${req.originalUrl}`);
  next(error);
};

// 非同步錯誤包裝器
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 驗證中間件包裝器
export const validateRequest = (validationRules: any[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // 執行所有驗證規則
      await Promise.all(validationRules.map(rule => rule.run(req)));

      // 檢查驗證結果
      const { validationResult } = require('express-validator');
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        const details = errors.array().map((error: any) => ({
          field: error.param,
          message: error.msg,
          value: error.value,
          location: error.location
        }));

        throw new ValidationError('請求資料驗證失敗', details);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// 權限檢查中間件
export const requirePermission = (permission: string) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      if (!user) {
        throw new AuthenticationError('請先登入');
      }

      if (!user.permissions || !user.permissions.includes(permission)) {
        throw new AuthorizationError(`需要 ${permission} 權限`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// 角色檢查中間件
export const requireRole = (roles: string | string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      if (!user) {
        throw new AuthenticationError('請先登入');
      }

      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      
      if (!allowedRoles.includes(user.role)) {
        throw new AuthorizationError(`需要以下角色之一: ${allowedRoles.join(', ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// 資源擁有者檢查中間件
export const requireOwnership = (_resourceIdParam: string = 'id', _userIdField: string = 'userId') => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;
      
      if (!user) {
        throw new AuthenticationError('請先登入');
      }

      // 管理員可以訪問所有資源
      if (user.role === 'admin') {
        return next();
      }

      // 檢查資源是否屬於當前用戶
      // 這裡需要根據具體的資源類型來實現檢查邏輯
      // 示例：檢查訂單是否屬於當前用戶
      // const resourceId = req.params[resourceIdParam];
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// 速率限制錯誤處理
export const handleRateLimitError = (_req: Request, res: Response) => {
  const error = new AppError('請求過於頻繁，請稍後再試', 429, 'RATE_LIMIT_EXCEEDED');
  
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

// 健康檢查錯誤
export class HealthCheckError extends AppError {
  public checks: any;

  constructor(message: string, checks: any) {
    super(message, 503, 'HEALTH_CHECK_FAILED');
    this.checks = checks;
  }
}

// 業務規則驗證器
export const validateBusinessRule = (
  ruleName: string,
  validator: (data: any) => boolean | Promise<boolean>,
  errorMessage: string
) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const isValid = await validator(req.body);
      
      if (!isValid) {
        throw new BusinessLogicError(`${ruleName}: ${errorMessage}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default globalErrorHandler;