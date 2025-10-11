/**
 * Error Handler Service
 * Centralized error handling for HTTP requests
 */

// Custom error class for API errors
export class ApiError extends Error {
  status: number;
  statusText: string;
  data: any;

  constructor(message: string, status: number, statusText: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

// Error handler function
export function handleApiError(error: any): never {
  // If it's already an ApiError, just throw it
  if (error instanceof ApiError) {
    throw error;
  }

  // If it's a fetch error with status
  if (error.status) {
    throw new ApiError(
      error.message || `HTTP error ${error.status}`,
      error.status,
      error.statusText || '',
      error.data
    );
  }

  // Network errors or other errors
  throw new ApiError(
    error.message || 'Unknown error occurred',
    500,
    'Internal Error',
    null
  );
}

// Function to log errors (can be expanded to send to monitoring services)
export function logError(error: any): void {
  console.error('API Error:', error);
  
  // Here you could add integration with error monitoring services
  // like Sentry, LogRocket, etc.
}