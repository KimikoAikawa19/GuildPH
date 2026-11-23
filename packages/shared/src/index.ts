export type ApiResponse<T> =
  | { data: T; pagination?: { page: number; limit: number; total: number } }
  | { error: { code: string; message: string; details?: unknown } };
