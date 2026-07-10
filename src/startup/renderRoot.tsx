import { createRoot } from 'react-dom/client';
import { GrowthBook, GrowthBookProvider } from '@growthbook/growthbook-react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import App from '../App';
import Loading from '../components/Loading';
import { GbProvider } from '../growthbook/Growthbook';
import { persistor, store } from '../redux/store';
import { finalizeFirstRenderNativeRuntime } from './nativeRuntime';
import { reactRootErrorHandlers } from './errorReporting';

export const createAppRoot = () => {
  const container = document.getElementById('root');
  return createRoot(container!, reactRootErrorHandlers);
};

export const renderRoot = (
  root: ReturnType<typeof createRoot>,
  growthbook: GrowthBook,
) => {
  root.render(
    <Provider store={store}>
      <PersistGate loading={<Loading isLoading={true} />} persistor={persistor}>
        <GrowthBookProvider growthbook={growthbook}>
          <GbProvider>
            <App />
          </GbProvider>
        </GrowthBookProvider>
      </PersistGate>
    </Provider>,
  );
  finalizeFirstRenderNativeRuntime();
};
