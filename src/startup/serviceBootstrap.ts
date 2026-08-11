import { APIMode, ServiceConfig } from '../services/ServiceConfig';
import { SqliteApi } from '../services/api/SqliteApi';
import { persistor, store } from '../redux/store';
import logger from '../utility/logger';
import { isNativePlatform } from './nativeRuntime';

const serviceInstance = ServiceConfig.getInstance(APIMode.SQLITE);

export const bootstrapServicesAndRender = (renderApp: () => void) => {
  if (persistor.getState().bootstrapped) {
    void bootstrapAndRender(renderApp);
    return;
  }

  const unsubscribe = persistor.subscribe(() => {
    if (!persistor.getState().bootstrapped) return;
    unsubscribe();
    void bootstrapAndRender(renderApp);
  });
};

const bootstrapAndRender = async (renderApp: () => void) => {
  const isOpsUser = store.getState().auth.isOpsUser;
  if (isOpsUser) {
    serviceInstance.switchMode(APIMode.SUPABASE);
    renderApp();
    return;
  }

  if (isNativePlatform) {
    serviceInstance.switchMode(APIMode.SQLITE);
    renderApp();

    void SqliteApi.getInstance().catch((error) => {
      logger.error('Sqlite init failed during bootstrap', error);
    });
    return;
  }

  await SqliteApi.getInstance();
  serviceInstance.switchMode(APIMode.SQLITE);
  renderApp();
};
