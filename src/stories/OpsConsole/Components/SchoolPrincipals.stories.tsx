import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';

import SchoolPrincipalsComponent, { Principal } from "../../../ops-console/components/SchoolDetailsComponents/SchoolPrincipals"; // Adjust path
import { Column } from "../../../ops-console/components/DataTableBody";


const samplePrincipals: Principal[] = [
  { id: 'P001', name: 'Principal Skinner', gender: 'Male', phoneNumber: '555-1234', email: 'skinner@springfield.edu' },
  { id: 'P002', name: 'Angela Li', gender: 'Female', phoneNumber: '555-5678', email: 'angela.li@lawndalehigh.org' },
  { id: 'P003', name: 'Mr. Richard Belding', gender: 'Male', phoneNumber: '555-8765', email: 'belding@baysidehigh.edu' },
  { id: 'P004', name: 'Principal Prickly', gender: 'Male', phoneNumber: '555-4321', email: 'prickly@thirdstreet.edu' },
  { id: 'P005', name: 'Dean Hardscrabble', gender: 'Female', phoneNumber: '555-9900', email: 'hardscrabble@monstersu.edu' },
];

const meta = {
  title: 'SchoolManagement/SchoolPrincipalsPage', // Updated title
  component: SchoolPrincipalsComponent,
  parameters: {
    // layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
        <MemoryRouter>
          <Story />
        </MemoryRouter>
    ),
  ],
  tags: ['autodocs'],
  args: {
    isMobile: false,
    data: {
      principals: [], // Default to no principals
    },
  },
  argTypes: {
    data: { control: 'object' },
    isMobile: { control: 'boolean' },
  },
} satisfies Meta<typeof SchoolPrincipalsComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyState: Story = {
  args: {
    data: {
      principals: [],
    },
  },
};

export const WithPrincipals: Story = {
  args: {
    data: {
      principals: samplePrincipals,
    },
  },
};

export const MobileView: Story = {
  args: {
    data: {
      principals: samplePrincipals.slice(0, 2), // Fewer principals for mobile
    },
    isMobile: true,
  },
  parameters: {
    viewport: { defaultViewport: 'iphone6' },
  },
};
