//@ts-nocheck
import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import ProgramDetailsPage from '../../../ops-console/pages/ProgramDetailsPage'; // must be .tsx
import { ServiceConfig } from '../../../services/ServiceConfig';
import { ApiHandler } from '../../../services/api/ApiHandler';
import { AuthHandler } from '../../../services/auth/AuthHandler';
import { MemoryRouter, Route } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';


i18n.init({
  lng: 'en',
  fallbackLng: 'en',
  resources: {},
  interpolation: { escapeValue: false },
});

ServiceConfig.getI = () =>
  ({
    apiHandler: {
      getProgramData: async (programId: string) => ({
        programDetails: [
          { label: 'Program Name', value: 'Sample Program A' },
          { label: 'Program Type  ', value: 'Govt' },
          { label: 'Start Date', value: '2023-01-01' },
          { label: 'Program Model', value: 'At Home' },
          { label: 'End Date', value: '2023-12-31' },
        ],
        locationDetails: [
          { label: 'Country', value: 'India' },
          { label: 'State', value: 'Karnataka' },
          { label: 'District', value: 'Bangalore Urban' },
          { label: 'Block', value: 'Koramangala' },
          { label: 'Cluster', value: 'Cluster A' },
          { label: 'Village', value: 'Village' },
        ],
        partnerDetails: [
          { label: 'Implementation Partner', value: 'Sutara' },
          { label: 'Funding Partner', value: 'Chimple' },
          { label: 'Institute Partner', value: 'XYZ' },
        ],
        programManagers: [
          {
            name: 'XYZ',
            role: 'Program Manager',
            phone: '9876543210',
          },
        ],
      }),
    } as Partial<ApiHandler>,
    authHandler: {
      getCurrentUser: async () => ({ id: 'test-user-id' }),
    } as Partial<AuthHandler>,
  }) as any;

const meta: Meta<typeof ProgramDetailsPage> = {
  title: 'OpsConsole/pages/ProgramDetailsPage',
  component: ProgramDetailsPage,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <I18nextProvider i18n={i18n}>
        <MemoryRouter initialEntries={['/programs/123']}>
        <Route path="/programs/:programId" component={Story} />
        </MemoryRouter>
      </I18nextProvider>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Page: Story = {};

