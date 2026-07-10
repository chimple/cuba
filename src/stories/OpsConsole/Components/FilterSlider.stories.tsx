//@ts-nocheck
import type { Meta, StoryObj } from '@storybook/react';
import FilterSlider from '../../../ops-console/components/FilterSlider';
import { useState } from 'react';

const meta: Meta<typeof FilterSlider> = {
  title: 'OpsConsole/Component/FilterSlider',
  component: FilterSlider,
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the filter slider is open',
    },
    filters: {
      control: 'object',
      description: 'Current selected filters',
    },
    filterOptions: {
      control: 'object',
      description: 'Available filter options',
    },
    onFilterChange: { action: 'filterChanged', description: 'Filter change handler' },
    onApply: { action: 'apply', description: 'Apply button handler' },
    onCancel: { action: 'cancel', description: 'Cancel button handler' },
    onClose: { action: 'close', description: 'Close drawer handler' },
    autocompleteStyles: { control: 'object', description: 'Custom styles for autocomplete' },
  },
} satisfies Meta<typeof FilterSlider>;

export default meta;
type Story = StoryObj<typeof FilterSlider>;

const InteractiveTemplate = (args: any) => {
  const [filters, setFilters] = useState(args.filters || {});
  const [isOpen, setIsOpen] = useState(args.isOpen ?? true);

  const handleFilterChange = (name: string, value: string[]) => {
    setFilters((prev: any) => ({ ...prev, [name]: value }));
    args.onFilterChange?.(name, value);
  };

  const handleApply = () => {
    args.onApply?.();
    setIsOpen(false);
  };

  const handleCancel = () => {
    args.onCancel?.();
    setIsOpen(false);
  };

  const handleClose = () => {
    args.onClose?.();
    setIsOpen(false);
  };

  return (
    <FilterSlider
      {...args}
      isOpen={isOpen}
      filters={filters}
      onFilterChange={handleFilterChange}
      onApply={handleApply}
      onCancel={handleCancel}
      onClose={handleClose}
    />
  );
};

export const Default: Story = {
  render: InteractiveTemplate,
  args: {
    isOpen: true,
    filters: {},
    filterOptions: {
      state: ['Karnataka', 'Maharashtra', 'Tamil Nadu'],
      model: ['Model X', 'Model Y'],
      partner: ['Partner 1', 'Partner 2'],
    },
    autocompleteStyles: {},
  },
};

export const WithFilters: Story = {
  render: InteractiveTemplate,
  args: {
    isOpen: true,
    filters: {
      state: ['Karnataka'],
      model: ['Model X'],
    },
    filterOptions: {
      state: ['Karnataka', 'Maharashtra', 'Tamil Nadu'],
      model: ['Model X', 'Model Y'],
      partner: ['Partner 1', 'Partner 2'],
    },
    autocompleteStyles: {},
  },
};
