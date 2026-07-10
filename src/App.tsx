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

import { IonApp, setupIonicReact } from '@ionic/react';
import { IonReactHashRouter } from '@ionic/react-router';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme variables */
import './theme/variables.css';
import './App.css';

import React from 'react';

import { useGlobalBrowserEffects } from './hooks/useGlobalBrowserEffects';
import { useGrowthBookFeatureCache } from './hooks/useGrowthBookFeatureCache';
import { useHotUpdate } from './hooks/useHotUpdate';
import { useNativeAppListeners } from './hooks/useNativeAppListeners';
import { useRemoteAssetFlags } from './hooks/useRemoteAssetFlags';

import AppContent from './app/AppContent';

setupIonicReact();

const App: React.FC = () => {
  useGrowthBookFeatureCache();
  useRemoteAssetFlags();
  useGlobalBrowserEffects();
  useNativeAppListeners();
  useHotUpdate();

  return (
    <IonApp>
      <IonReactHashRouter>
        <AppContent />
      </IonReactHashRouter>
    </IonApp>
  );
};

export default App;
