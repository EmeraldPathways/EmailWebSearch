export interface ApiSuccessResponse<T> {
  data: T;
}

export interface ApiPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
}

export type ApiErrorCode =
  | 'NOT_FOUND'
  | 'APIFY_RUN_FAILED'
  | 'APIFY_TIMEOUT'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INVALID_PARAMS'
  | 'UNAUTHORIZED'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  constructor(
    public readonly code: ApiErrorCode,
    message: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}
