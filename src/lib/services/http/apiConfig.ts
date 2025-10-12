/**
 * API Configuration
 * Central configuration for API endpoints and settings
 */

export const API_CONFIG = {
  // Base URLs
  BASE_URL: 'http://localhost:54321',
  
  // API Endpoints
  ENDPOINTS: {
    ARTIFACTS: '/rest/v1/artifacts',
    ANNOTATIONS: 'https://annotations.allmaps.org/images'
  },
  
  // Default request configuration
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  
  // Timeout in milliseconds
  TIMEOUT: 30000
};

// Export specific API URLs for convenience
export const API_URLS = {
  getArtifacts: () => `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ARTIFACTS}`,
  getAnnotation: (mapId: string) => `${API_CONFIG.ENDPOINTS.ANNOTATIONS}/${mapId}`
};