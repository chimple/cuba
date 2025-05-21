import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import NewProgram from '../../../ops-console/components/NewProgram';
import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme();

const meta: Meta<typeof NewProgram> = {
  title: "OpsConsole/Component/NewProgram",
  tags: ['autodocs'],
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
