//@ts-nocheck
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import NewProgram from '../../../ops-console/components/NewProgram';
import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { ServiceConfig } from '../../../services/ServiceConfig';

const theme = createTheme();

const mockApiHandler = {
  getProgramManagers: () => Promise.resolve(['Alice Smith', 'Bob Johnson']),
  getUniqueGeoData: () => Promise.resolve({
    Country: ['India'],
    State: ['Maharashtra'],
    District: ['Pune'],
    Block: ['Block A'],
    Cluster: ['Cluster 1'],
  }),
};

(ServiceConfig.getI as any) = () => ({
  apiHandler: mockApiHandler,
});

const meta: Meta<typeof NewProgram> = {
  title: "OpsConsole/Component/NewProgram",
  component: NewProgram,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => {
      return React.createElement(
        ThemeProvider,
        { theme },
        React.createElement(
          React.Fragment,
          null,
          React.createElement(CssBaseline),
          React.createElement(Story)
        )
      );
    },
  ],
};

export default meta;

type Story = StoryObj<typeof NewProgram>;

export const Default: Story = {};
