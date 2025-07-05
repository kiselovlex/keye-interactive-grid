import type { APIResponse } from "@/types/api";

export const createAPIResponse = <T>(
    data: T,
    status = 200,
    message?: string
  ): APIResponse<T> => ({
    data,
    status,
    message,
    timestamp: new Date().toISOString(),
  }); 