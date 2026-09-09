import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';

export interface ApiClientConfig {
  baseURL: string;
  onAuthFailure: () => void;
}

interface FailedRequest {
  resolve: (value: AxiosResponse | Promise<AxiosResponse>) => void;
  reject: (reason: unknown) => void;
  config: InternalAxiosRequestConfig;
}

const MAX_RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 1000;

declare function setTimeout(callback: () => void, ms: number): unknown;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createApiClient(config: ApiClientConfig): AxiosInstance {
  const { baseURL, onAuthFailure } = config;

  const client = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true, // Send HttpOnly cookies with every request
  });

  let isRefreshing = false;
  let failedQueue: FailedRequest[] = [];

  function processQueue(error: unknown): void {
    failedQueue.forEach((request) => {
      if (error) {
        request.reject(error);
      } else {
        request.resolve(client(request.config));
      }
    });
    failedQueue = [];
  }

  // Response interceptor: handle 401 (token refresh) and 500 (retry)
  client.interceptors.response.use(
    (response: AxiosResponse) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
        _retryCount?: number;
      };

      if (!originalRequest) {
        return Promise.reject(error);
      }

      // Skip silent refresh for ALL /auth/* endpoints:
      // - /auth/login returns 401 for wrong credentials — that's NOT an expired token
      // - /auth/refresh-token failing would recurse into this same interceptor
      // - /auth/register, /auth/verify-otp, etc. are pre-authentication calls
      // Only attempt refresh for non-auth API calls where 401 means "token expired".
      const isAuthCall = typeof originalRequest.url === 'string'
        && originalRequest.url.includes('/auth/');

      // Handle 401 Unauthorized — attempt silent refresh via cookie
      if (!isAuthCall && error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        if (isRefreshing) {
          // Queue this request until refresh completes
          return new Promise<AxiosResponse>((resolve, reject) => {
            failedQueue.push({ resolve, reject, config: originalRequest });
          });
        }

        isRefreshing = true;

        try {
          // Cookie-only refresh: no body needed, refresh_token cookie is sent
          // automatically because withCredentials is set on this client instance.
          await client.post('/auth/refresh-token');

          processQueue(null);
          isRefreshing = false;

          // Retry original request — new access_token cookie is now set
          return client(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError);
          isRefreshing = false;
          onAuthFailure();
          return Promise.reject(refreshError);
        }
      }

      // Handle 500 Internal Server Error — retry with delay
      if (error.response?.status === 500) {
        const retryCount = originalRequest._retryCount ?? 0;

        if (retryCount < MAX_RETRY_ATTEMPTS) {
          originalRequest._retryCount = retryCount + 1;
          await delay(RETRY_DELAY_MS);
          return client(originalRequest);
        }
      }

      return Promise.reject(error);
    }
  );

  return client;
}
