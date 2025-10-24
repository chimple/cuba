//@ts-nocheck
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ProgramPage from '../../../ops-console/pages/ProgramPage';
import { ServiceConfig } from '../../../services/ServiceConfig';
import { ApiHandler } from '../../../services/api/ApiHandler';
import { AuthHandler } from '../../../services/auth/AuthHandler';


// Mock ServiceConfig
ServiceConfig.getI = () =>
  ({
    apiHandler: {
      getProgramFilterOptions: async () => ({
        partner: ['Partner A', 'Partner B'],
        programType: ['Type A', 'Type B'],
        state: ['State 1'],
        district: ['District X'],
        block: ['Block Y'],
        village: ['Village Z'],
        cluster: ['Cluster 1'],
        model: ['Model X'],
      }),
      getPrograms: async ({ currentUserId, filters, searchTerm, tab }) => ({
        data: [
          {
            name: 'Sample Program 1',
            state: 'State 1',
            institutes_count: 3,
            students_count: 150,
            devices_count: 120,
            manager_names: 'John Doe',
          },
          {
            name: 'Sample Program 2',
            state: 'State 2',
            institutes_count: 5,
            students_count: 300,
            devices_count: 250,
            manager_names: 'Jane Smith',
          },
        ],
      }),
    } as Partial<ApiHandler>,
    authHandler: {
      getCurrentUser: async () => ({ id: 'test-user-id' }),
    } as Partial<AuthHandler>,
  }) as any;

const meta: Meta<typeof ProgramPage> = {
  title: 'OpsConsole/pages/ProgramPage',
  component: ProgramPage,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Page: Story = {};
