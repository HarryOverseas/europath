/**
 * Test configuration for EuroPath automated test suite.
 * Supports configurable API base URL and admin credentials.
 */

import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  baseUrl: process.env.TEST_API_URL || 'http://localhost:5000',
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
  jwtSecret: process.env.JWT_SECRET || 'harry_global_secret_key_2026_secure',
  timeoutMs: 10000,
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};
