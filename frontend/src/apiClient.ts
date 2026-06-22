const IS_PROD = import.meta.env.PROD;

export const API_BASE_URL = IS_PROD ? (import.meta.env.VITE_API_BASE_URL || 'https://tradepulse-backend-2533.onrender.com') : 'http://localhost:8000';

/**
 * Global wrapper to guarantee consistent endpoint parsing without protocol loss
 */
export const fetchFromBackend = async (endpoint: string, options: RequestInit = {}) => {
  // Strips accidental leading slashes to prevent url structure doubling
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  return fetch(`${API_BASE_URL}${cleanEndpoint}`, {
    ...options,
    headers,
  });
};