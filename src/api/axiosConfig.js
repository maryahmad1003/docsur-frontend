import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const responseCache = new Map();
const inFlightRequests = new Map();

function stableStringify(value) {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

function buildCacheKey(url, config = {}) {
  const params = config?.params ?? {};
  const token = localStorage.getItem('token') || 'guest';
  return `${url}::${stableStringify(params)}::${token}`;
}

function cloneResponse(response) {
  return {
    ...response,
    data: response?.data,
    headers: response?.headers,
    status: response?.status ?? 200,
    statusText: response?.statusText ?? 'OK',
  };
}

function clearApiCache() {
  responseCache.clear();
  inFlightRequests.clear();
}

function invalidateByPrefix(prefix) {
  if (!prefix) {
    return;
  }
  for (const key of responseCache.keys()) {
    if (key.startsWith(prefix)) {
      responseCache.delete(key);
    }
  }
}

const originalGet = API.get.bind(API);
API.get = (url, config = {}) => {
  const useCache = config?.cache !== false;
  const cacheTtl = Number.isFinite(config?.cacheTtl) ? config.cacheTtl : DEFAULT_CACHE_TTL_MS;
  const cacheKey = buildCacheKey(url, config);
  const now = Date.now();

  if (useCache) {
    const cached = responseCache.get(cacheKey);
    if (cached && (now - cached.cachedAt) < cacheTtl) {
      return Promise.resolve(cloneResponse(cached.response));
    }

    if (inFlightRequests.has(cacheKey)) {
      return inFlightRequests.get(cacheKey).then(cloneResponse);
    }
  }

  const requestPromise = originalGet(url, config)
    .then((response) => {
      if (useCache) {
        responseCache.set(cacheKey, {
          cachedAt: Date.now(),
          response: cloneResponse(response),
        });
      }
      return cloneResponse(response);
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  if (useCache) {
    inFlightRequests.set(cacheKey, requestPromise);
  }

  return requestPromise;
};

const originalPost = API.post.bind(API);
API.post = async (...args) => {
  const response = await originalPost(...args);
  clearApiCache();
  return response;
};

const originalPut = API.put.bind(API);
API.put = async (...args) => {
  const response = await originalPut(...args);
  clearApiCache();
  return response;
};

const originalPatch = API.patch.bind(API);
API.patch = async (...args) => {
  const response = await originalPatch(...args);
  clearApiCache();
  return response;
};

const originalDelete = API.delete.bind(API);
API.delete = async (...args) => {
  const response = await originalDelete(...args);
  clearApiCache();
  return response;
};

// Ajouter le token Passport automatiquement
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Gérer les erreurs (token expiré = redirection login)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

API.clearCache = clearApiCache;
API.invalidateCache = invalidateByPrefix;

export default API;
