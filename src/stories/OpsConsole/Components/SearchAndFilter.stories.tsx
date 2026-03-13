//@ts-nocheck
import type { Meta, StoryObj } from '@storybook/react';
import SearchAndFilter from '../../../ops-console/components/SearchAndFilter';
import { useState } from 'react';

const meta: Meta<typeof SearchAndFilter> = {
  title: 'OpsConsole/Component/SearchAndFilter',
  component: SearchAndFilter,
  tags: ['autodocs'],
  argTypes: {
    searchTerm: {
      control: 'text',
      description: 'Current value of the search input',
    },
    onSearchChange: { action: 'searchChanged', description: 'Search input change handler' },
    filters: {
      control: 'object',
      description: 'Active filters',
    },
    onFilterClick: { action: 'filterClicked', description: 'Filter button click handler' },
  },
} satisfies Meta<typeof SearchAndFilter>;

export default meta;
type Story = StoryObj<typeof SearchAndFilter>;

const InteractiveTemplate = (args: any) => {
  const [searchTerm, setSearchTerm] = useState(args.searchTerm || '');
  const [filters, setFilters] = useState(args.filters || {});

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    args.onSearchChange?.(event);
  };

  const handleFilterClick = () => {
    args.onFilterClick?.();
    // Example: toggle a dummy filter for demonstration
    setFilters((prev: any) =>
      Object.keys(prev).length === 0
        ? { example: ['value'] }
        : {}
    );
  };

  return (
    <SearchAndFilter
      {...args}
      searchTerm={searchTerm}
      onSearchChange={handleSearchChange}
      filters={filters}
      onFilterClick={handleFilterClick}
    />
  );
};

export const Default: Story = {
  render: InteractiveTemplate,
  args: {
    searchTerm: '',
    filters: {},
  },
};

export const WithFilters: Story = {
  render: InteractiveTemplate,
  args: {
    searchTerm: 'Test',
    filters: { state: ['Karnataka'], model: ['Model X'] },
  },
};
