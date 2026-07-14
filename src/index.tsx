/*
 * Copyright (C) 2015 Chimple
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import './index.css';
import './mobileWebBrowserFixes.css';
import 'leaflet/dist/leaflet.css';
import './i18n';
import { initializeErrorReporting } from './startup/errorReporting';
import {
  createGrowthBookClient,
  initializeGrowthBook,
} from './startup/growthbookClient';
import {
  initializeNativeRuntime,
  isNativePlatform,
} from './startup/nativeRuntime';
import { initializePlatformSetup } from './startup/platformSetup';
import { createAppRoot, renderRoot } from './startup/renderRoot';
import { bootstrapServicesAndRender } from './startup/serviceBootstrap';
import Loading from './components/Loading';
import {
  clearWebGoogleLoginPending,
  isWebGoogleLoginPending,
} from './services/auth/webGoogleLoginLoading';
initializeErrorReporting();
initializePlatformSetup();

const root = createAppRoot();
const growthbook = createGrowthBookClient();
const shouldShowWebGoogleLoginLoading =
  !isNativePlatform && isWebGoogleLoginPending();
let hasRenderedApp = false;
let webGoogleLoginLoadingTimeout: number | undefined;

const renderApp = () => {
  if (hasRenderedApp) return;
  hasRenderedApp = true;

  if (webGoogleLoginLoadingTimeout !== undefined) {
    window.clearTimeout(webGoogleLoginLoadingTimeout);
  }
  if (shouldShowWebGoogleLoginLoading) clearWebGoogleLoginPending();

  renderRoot(root, growthbook);
};

if (shouldShowWebGoogleLoginLoading) {
  root.render(<Loading isLoading={true} />);
  webGoogleLoginLoadingTimeout = window.setTimeout(renderApp, 30_000);
}

void initializeGrowthBook(growthbook);
initializeNativeRuntime();

bootstrapServicesAndRender(renderApp);
serviceWorkerRegistration.unregister();
