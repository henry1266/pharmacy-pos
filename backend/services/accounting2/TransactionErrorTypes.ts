/**
 * 自定義錯誤類別：交易錯誤
 */
export class TransactionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TransactionError';
  }
}

/**
 * 自定義錯誤類別：驗證錯誤
 */
export class ValidationError extends Error {
  errors: string[];
  
  constructor(message: string, errors: string[] = []) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

/**
 * 自定義錯誤類別：權限錯誤
 */
export class PermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionError';
  }
}

/**
 * 自定義錯誤類別：資源不存在錯誤
 */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}