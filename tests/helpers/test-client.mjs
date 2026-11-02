/**
 * HTTP test client for opaque-box E2E testing against the EuroPath REST API.
 */

import { CONFIG } from './config.mjs';

export class TestClient {
  constructor(baseUrl) {
    this._baseUrl = baseUrl;
  }

  get baseUrl() {
    return (process.env.TEST_API_URL || this._baseUrl || CONFIG.baseUrl).replace(/\/+$/, '');
  }

  set baseUrl(val) {
    this._baseUrl = val;
    process.env.TEST_API_URL = val;
  }

  async request(path, options = {}) {
    const url = new URL(path.startsWith('http') ? path : `${this.baseUrl}${path}`);
    if (options.query) {
      for (const [key, val] of Object.entries(options.query)) {
        if (val !== undefined && val !== null) {
          url.searchParams.set(key, String(val));
        }
      }
    }

    const headers = {
      ...CONFIG.defaultHeaders,
      ...(options.headers || {}),
    };

    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }

    const fetchOptions = {
      method: options.method || 'GET',
      headers,
      signal: AbortSignal.timeout(options.timeout || CONFIG.timeoutMs),
    };

    if (options.body !== undefined) {
      if (typeof options.body === 'string') {
        fetchOptions.body = options.body;
      } else {
        fetchOptions.body = JSON.stringify(options.body);
      }
    }

    const response = await fetch(url.toString(), fetchOptions);
    const contentType = response.headers.get('content-type') || '';
    let body = null;
    let rawText = '';

    try {
      rawText = await response.text();
      if (contentType.includes('application/json') || rawText.startsWith('{') || rawText.startsWith('[')) {
        body = JSON.parse(rawText);
      } else {
        body = rawText;
      }
    } catch {
      body = rawText;
    }

    return {
      status: response.status,
      ok: response.ok,
      headers: response.headers,
      body,
      rawText,
    };
  }

  get(path, options = {}) {
    return this.request(path, { ...options, method: 'GET' });
  }

  post(path, body, options = {}) {
    return this.request(path, { ...options, method: 'POST', body });
  }

  patch(path, body, options = {}) {
    return this.request(path, { ...options, method: 'PATCH', body });
  }

  del(path, options = {}) {
    return this.request(path, { ...options, method: 'DELETE' });
  }

  /**
   * Helper to perform admin login and return the token and user object.
   */
  async loginAdmin(username = CONFIG.admin.username, password = CONFIG.admin.password) {
    const res = await this.post('/api/auth/login', { username, password });
    if (res.status === 200 && res.body?.token) {
      return {
        token: res.body.token,
        user: res.body.user,
        response: res,
      };
    }
    return {
      token: null,
      user: null,
      response: res,
    };
  }

  /**
   * Health check to see if the server is actively reachable.
   */
  async isServerReachable(timeout = 1500) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      // Attempt to hit the base url or an open endpoint
      await fetch(`${this.baseUrl}/api/auth/verify`, {
        method: 'GET',
        signal: controller.signal,
      });
      clearTimeout(id);
      return true;
    } catch (err) {
      // 401 response counts as reachable! Only network connection refusal or timeout throws
      if (err.name === 'AbortError' || err.code === 'ECONNREFUSED' || err.cause?.code === 'ECONNREFUSED') {
        return false;
      }
      return true;
    }
  }
}

export const client = new TestClient();
