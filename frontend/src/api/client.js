let csrfToken = null;
let csrfPromise = null;

const BASE_URL = '/api/v1';

/**
 * Fetch and cache CSRF synchronizer token from server session
 */
export async function getCsrfToken(forceRefresh = false) {
  if (csrfToken && !forceRefresh) {
    return csrfToken;
  }

  if (csrfPromise && !forceRefresh) {
    return csrfPromise;
  }

  csrfPromise = fetch(`${BASE_URL}/auth/csrf`, {
    method: 'GET',
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
  })
    .then((res) => res.json())
    .then((data) => {
      csrfToken = data.data?.csrf_token || data.csrf_token || null;
      csrfPromise = null;
      return csrfToken;
    })
    .catch(() => {
      csrfPromise = null;
      return null;
    });

  return csrfPromise;
}

async function request(endpoint, options = {}, isRetry = false) {
  const url = endpoint.startsWith('/api') ? endpoint : `${BASE_URL}${endpoint}`;
  const method = (options.method || 'GET').toUpperCase();
  const defaultHeaders = {
    'Accept': 'application/json',
  };

  // Attach CSRF token on state-mutating requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const token = await getCsrfToken();
    if (token) {
      defaultHeaders['X-CSRF-Token'] = token;
    }
  }

  if (options.body && !(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const config = {
    ...options,
    credentials: 'include', // Include HttpOnly session cookies
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  // Automatic retry on CSRF token expiration/mismatch
  if (response.status === 403 && data.code === 'CSRF_VALIDATION_FAILED' && !isRetry) {
    await getCsrfToken(true);
    return request(endpoint, options, true);
  }

  if (!response.ok || data.success === false) {
    const errorMsg = data.error || (data.data && data.data.error) || 'حدث خطأ في الاتصال بالخادم / Server request failed';
    const error = new Error(errorMsg);
    error.status = response.status;
    error.code = data.code;
    error.requestId = data.request_id;
    error.data = data;
    throw error;
  }

  // Update cached CSRF token if returned in response
  if (data.data?.csrf_token) {
    csrfToken = data.data.csrf_token;
  } else if (data.csrf_token) {
    csrfToken = data.csrf_token;
  }

  return data.data !== undefined ? data.data : data;
}

export const api = {
  get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => request(endpoint, { method: 'POST', body, ...options }),
  put: (endpoint, body, options) => request(endpoint, { method: 'PUT', body, ...options }),
  delete: (endpoint, options) => request(endpoint, { method: 'DELETE', ...options }),
  getCsrfToken,
};

export default api;
