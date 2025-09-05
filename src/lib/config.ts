// Configuration utilities for environment variables
// This file provides type-safe access to environment variables

export const config = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Chess Bot Master',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    debugMode: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
  },
  
  engine: {
    threads: parseInt(process.env.STOCKFISH_THREADS || '4'),
    hash: parseInt(process.env.STOCKFISH_HASH || '256'),
    defaultDepth: parseInt(process.env.DEFAULT_ENGINE_DEPTH || '15'),
    defaultSkillLevel: parseInt(process.env.DEFAULT_SKILL_LEVEL || '20'),
  },
  
  api: {
    rateLimit: parseInt(process.env.API_RATE_LIMIT || '100'),
    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT || '3600000'),
  },
  
  development: {
    logLevel: process.env.LOG_LEVEL || 'info',
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',
  },
} as const;

export type Config = typeof config;
