import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { validateEnv } from './env';

describe('validateEnv', () => {
  const originalEnv = process.env;
  const mockExit = vi.spyOn(process, 'exit').mockImplementation((code?: number) => {
    throw new Error(`Process.exit: ${code}`);
  });
  const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    mockExit.mockClear();
    mockConsoleError.mockClear();
  });

  it('throws an error and exits if required variables are missing', () => {
    process.env = {}; // clear env
    expect(() => validateEnv()).toThrowError('Process.exit: 1');
    expect(mockConsoleError).toHaveBeenCalled();
  });

  it('applies defaults and returns parsed env when valid', () => {
    process.env = {
      MONGODB_URI: 'mongodb://localhost:27017/test',
      AWS_REGION: 'us-east-1',
      AWS_ACCESS_KEY_ID: 'test',
      AWS_SECRET_ACCESS_KEY: 'test',
      S3_RAW_BUCKET: 'raw',
      S3_DERIVED_BUCKET: 'derived',
      COGNITO_USER_POOL_ID: 'pool',
      COGNITO_CLIENT_ID: 'client',
      CORS_ORIGIN: 'http://localhost:5173'
    };

    const env = validateEnv();
    expect(env.PORT).toBe(3001);
    expect(env.NODE_ENV).toBe('development');
    expect(env.BEDROCK_MODEL_ID).toBe('anthropic.claude-sonnet-4-20250514-v1:0');
    expect(env.MONGODB_URI).toBe('mongodb://localhost:27017/test');
  });
});
