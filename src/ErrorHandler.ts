import { Request, Response, NextFunction } from 'express';

export interface ResponseError {
  statusCode: number;
  remediation?: string;
  occurredAt: string;
}

export class ServerError implements Error, ResponseError {
  name: string;
  message: string;
  stack?: string;
  code: number;
  type?: string;

  statusCode: number;
  remediation?: string;
  occurredAt: string;

  static readonly statusCode: number = 500;

  constructor(message?: string) {
    this.message = message || '';
    this.name = this.constructor.name;
    this.statusCode = ServerError.statusCode;
    Error.captureStackTrace(this, ServerError);
  }
}

export function enumerableErrors(key: string, value: any) {
  if (value instanceof Error) {
    // copy non-enumerable properties from error object
    const plainObject: { [key: string]: any } = {};
    const errorObject: { [key: string]: any } = value;
    Object.getOwnPropertyNames(value).forEach((key) => {
      plainObject[key] = errorObject[key];
    });
    // format error stack as array
    plainObject.stack = plainObject.stack?.split('\n');
    return plainObject;
  }
  return value;
}

// express middleware for error handling
export function errorHandler(err: ServerError, req: Request, res: Response, next: NextFunction) {
  console.error('apiInternalError::', JSON.stringify(err, enumerableErrors));

  const code = err.statusCode || 500;
  const error = {
    statusCode: code,
    type: err.type,
    message: err.message,
    remediation: err.remediation,
    occurredAt: new Date().toISOString(),
  };
  console.error('apiResponseError::', JSON.stringify(error));
  res.status(code).json(error);
}
