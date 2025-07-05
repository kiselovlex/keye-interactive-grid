export interface APIResponse<T> {
    data: T;
    status: number;
    message?: string;
    timestamp: string;
  } 