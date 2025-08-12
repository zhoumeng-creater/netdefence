// src/utils/AppError.ts
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;  // 添加 details 字段用于存储额外信息

  constructor(
    message: string, 
    statusCode: number = 500, 
    isOperational: boolean = true,
    details?: any  // 新增可选的 details 参数
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;  // 存储验证错误等详细信息
    
    Error.captureStackTrace(this, this.constructor);
  }
}