/**
 * HTTP Interceptors
 * Functions that can modify requests before they are sent and responses before they are returned
 */

// Request interceptor type
export type RequestInterceptor = (
  method: string,
  url: string,
  headers: Headers,
  body?: any
) => { method: string; url: string; headers: Headers; body?: any };

// Response interceptor type
export type ResponseInterceptor = <T>(response: Response, data: T) => T;

// Error interceptor type
export type ErrorInterceptor = (error: any) => any;

// Add authentication headers
export const authInterceptor: RequestInterceptor = (method, url, headers, body) => {
  // Add auth token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers.append('Authorization', `Bearer ${token}`);
  }
  
  return { method, url, headers, body };
};

// Add common headers like device info, app version, etc.
export const commonHeadersInterceptor: RequestInterceptor = (method, url, headers, body) => {
  // Add app version with proper type
  const appVersion: string = '1.0.0';
  headers.append('X-App-Version', appVersion);
  
  return { method, url, headers, body };
};

// Response data transformer
export const responseDataInterceptor: ResponseInterceptor = <T>(response: Response, data: T) => {
  // You can transform response data here if needed
  return data;
};

// Global error handler
export const errorInterceptor: ErrorInterceptor = (error) => {
  // Log errors to monitoring service
  console.error('API Error:', error);
  
  // You could add error reporting to a service like Sentry here
  
  // Rethrow the error for the calling code to handle
  throw error;
};