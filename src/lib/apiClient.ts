import { authManager } from './auth.ts';

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Standardized API client complying with ADR-004 JSON Envelope.
 */
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = authManager.getToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorPayload = json.error || {};
    throw new ApiError(
      errorPayload.code || 'HTTP_ERROR',
      errorPayload.message || `Request failed with status ${response.status}`,
      response.status,
      errorPayload.details
    );
  }

  return (json.data !== undefined ? json.data : json) as T;
}
