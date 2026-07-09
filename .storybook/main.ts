import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-onboarding',
    '@storybook/addon-links',
    '@storybook/addon-docs',
    '@chromatic-com/storybook',
    'storybook-react-i18next',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
  staticDirs: ['../public'],
  async viteFinal(baseConfig) {
    return mergeConfig(baseConfig, {
      resolve: {
        alias: {
          '@': fileURLToPath(new URL('../src', import.meta.url)),
          '@storybook/addon-actions': 'storybook/actions',
          '@storybook/addon-actions/decorator': 'storybook/actions/decorator',
          '@storybook/test': 'storybook/test',
        },
      },
      define: {
        'process.env.REACT_APP_ENV': JSON.stringify(
          process.env.REACT_APP_ENV ??
            process.env.VITE_ENV ??
            process.env.VITE_ENVIRONMENT ??
            'local',
        ),
      },
    });
  },
};

export default config;
