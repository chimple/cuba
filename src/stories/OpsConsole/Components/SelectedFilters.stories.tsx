//@ts-nocheck
import type { Meta, StoryObj } from '@storybook/react';
import SelectedFilters from '../../../ops-console/components/SelectedFilters';

const meta: Meta<typeof SelectedFilters> = {
  title: 'OpsConsole/Component/SelectedFilters',
  component: SelectedFilters,
  tags: ['autodocs'],
  argTypes: {
    filters: {
      control: 'object',
      description: 'Active filters as a record of string arrays',
    },
    onDeleteFilter: { action: 'deleteFilter', description: 'Delete filter handler' },
  },
} satisfies Meta<typeof SelectedFilters>;

export default meta;
type Story = StoryObj<typeof SelectedFilters>;

export const Default: Story = {
  args: {
    filters: {},
    onDeleteFilter: () => {},
  },
};

export const WithFilters: Story = {
  args: {
    filters: {
      state: ['Karnataka', 'Maharashtra'],
      model: ['Model X'],
      partner: ['Partner 1', 'Partner 2'],
    },
    onDeleteFilter: (key: string, value: string) => {
      
    },
  },
};
