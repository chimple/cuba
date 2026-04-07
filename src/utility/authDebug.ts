import logger from './logger';

export const AUTH_DEBUG_KEY = 'AUTH_FLOW_TRACE_V1';

type AuthDebugContext = Record<string, unknown>;

export const getAuthDebugContext = (
  context: AuthDebugContext = {},
): AuthDebugContext => {
  return {
    auth_debug_key: AUTH_DEBUG_KEY,
    timestamp: new Date().toISOString(),
    ...context,
  };
};

export const logAuthDebug = (
  message: string,
  context: AuthDebugContext = {},
) => {
  logger.info(message, getAuthDebugContext(context));
};
