/**
 * HTTP Client Service
 * A centralized service for handling HTTP requests with interceptors,
 * error handling, and response transformation.
 */

type RequestOptions = {
  headers?: Record<string, string>;
  params?: Record<string, string>;
  timeout?: number;
};

type HttpResponse<T> = {
  data: T;
  status: number;
  statusText: string;
  headers: Headers;
};

export class HttpClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private defaultTimeout: number;

  constructor(
    baseUrl: string = '',
    defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    },
    defaultTimeout: number = 30000
  ) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = defaultHeaders;
    this.defaultTimeout = defaultTimeout;
  }

  /**
   * Performs a GET request
   */
  async get<T>(url: string, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('GET', url, undefined, options);
  }

  /**
   * Performs a POST request
   */
  async post<T>(url: string, data?: any, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('POST', url, data, options);
  }

  /**
   * Performs a PUT request
   */
  async put<T>(url: string, data?: any, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('PUT', url, data, options);
  }

  /**
   * Performs a DELETE request
   */
  async delete<T>(url: string, options?: RequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('DELETE', url, undefined, options);
  }

  /**
   * Core request method that handles all HTTP requests
   */
  private async request<T>(
    method: string,
    url: string,
    data?: any,
    options?: RequestOptions
  ): Promise<HttpResponse<T>> {
    const fullUrl = this.buildUrl(url, options?.params);
    const headers = this.buildHeaders(options?.headers);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, options?.timeout || this.defaultTimeout);

    try {
      const response = await fetch(fullUrl, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw await this.handleErrorResponse(response);
      }

      const responseData = await response.json();
      
      return {
        data: responseData as T,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw this.handleError(error);
    }
  }

  /**
   * Builds the full URL with query parameters
   */
  private buildUrl(url: string, params?: Record<string, string>): string {
    const fullUrl = this.baseUrl + url;
    
    if (!params) {
      return fullUrl;
    }

    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      queryParams.append(key, value);
    });

    return `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}${queryParams.toString()}`;
  }

  /**
   * Builds request headers by merging default and custom headers
   */
  private buildHeaders(customHeaders?: Record<string, string>): Headers {
    const headers = new Headers();
    
    // Add default headers
    Object.entries(this.defaultHeaders).forEach(([key, value]) => {
      headers.append(key, value);
    });
    
    // Add custom headers
    if (customHeaders) {
      Object.entries(customHeaders).forEach(([key, value]) => {
        headers.append(key, value);
      });
    }
    
    return headers;
  }

  /**
   * Handles error responses
   */
  private async handleErrorResponse(response: Response): Promise<Error> {
    let errorMessage = `HTTP error! status: ${response.status}`;
    
    try {
      const errorData = await response.json() as Record<string, any>;
      errorMessage = (errorData.message as string) || (errorData.error as string) || errorMessage;
    } catch (e) {
      // If we can't parse the error as JSON, just use the status text
      errorMessage = response.statusText || errorMessage;
    }
    
    const error = new Error(errorMessage);
    (error as any).status = response.status;
    (error as any).statusText = response.statusText;
    
    return error;
  }

  /**
   * General error handler
   */
  private handleError(error: any): Error {
    if (error.name === 'AbortError') {
      return new Error('Request timeout');
    }
    
    return error;
  }
}

// Create and export a default instance
export const httpClient = new HttpClient();