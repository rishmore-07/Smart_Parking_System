const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

export async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('auth_token');

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    if (response.status === 401 && token) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }

    let errorMsg = 'Request failed';
    if (typeof data?.detail === 'string') {
      errorMsg = data.detail;
    } else if (Array.isArray(data?.detail) && data.detail.length > 0) {
      errorMsg = data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
    } else if (data?.message) {
      errorMsg = data.message;
    } else if (response.statusText) {
      errorMsg = response.statusText;
    }

    throw new ApiError(errorMsg, response.status, data);
  }

  return data as T;
}
