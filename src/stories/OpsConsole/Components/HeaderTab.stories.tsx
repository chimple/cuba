//@ts-nocheck
import type { Meta, StoryObj } from '@storybook/react';
import TabComponent from '../../../ops-console/components/HeaderTab';
import { useState } from 'react';

const meta: Meta<typeof TabComponent> = {
  title: 'OpsConsole/Component/HeaderTab',
  component: TabComponent,
  tags: ['autodocs'],
  argTypes: {
    activeTab: {
      control: { type: 'number', min: 0 },
      description: 'Index of the currently active tab',
    },
    handleTabChange: {
      action: 'tabChanged',
      description: 'Callback fired when tab changes',
    },
    tabs: {
      control: 'object',
      description: 'Array of tab objects with label properties',
    },
  },
} satisfies Meta<typeof TabComponent>;

export default meta;
type Story = StoryObj<typeof TabComponent>;

const InteractiveTemplate = (args: any) => {
  const [activeTab, setActiveTab] = useState(args.activeTab || 0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    args.handleTabChange?.(event, newValue);
  };

  return (
    <TabComponent
      {...args}
      activeTab={activeTab}
      handleTabChange={handleTabChange}
    />
  );
};

export const Default: Story = {
  render: InteractiveTemplate,
  args: {
    activeTab: 0,
    tabs: [
      { label: 'All Programs' },
      { label: 'At School' },
      { label: 'At Home' },
    ],
  },
};

export const SecondTabActive: Story = {
  render: InteractiveTemplate,
  args: {
    activeTab: 1,
    tabs: [
      { label: 'All Programs' },
      { label: 'At School' },
      { label: 'At Home' },
    ],
  },
};
