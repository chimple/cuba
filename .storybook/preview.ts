import type { Preview } from "@storybook/react";
import i18n from "./i18next";
import { setupIonicReact } from '@ionic/react';

setupIonicReact({
  mode: 'md'
});

const preview: Preview = {
  globals: {
    locale: 'en',
    locales: {
        en: 'English',
        kn: 'ಕನ್ನಡ',
        hi: 'हिंदी',
    },
},
  parameters: {
    i18n,
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};


export default preview;
