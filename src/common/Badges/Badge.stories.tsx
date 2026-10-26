import type { Meta, StoryObj } from '@storybook/react';
import Badge from './Badge';

const meta = {
  title: 'Common/Badges/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    number: {
      control: 'text',
      description: 'Badge number to preview (for example 50, 100, or 3000).',
    },
  },
  // Text input keeps the full value editable while Badge still receives a number.
  render: ({ number }) => {
    const parsedNumber = Number.parseInt(String(number), 10);

    return <Badge number={parsedNumber} />;
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<{ number: number }>;

export const Preview: Story = {
  args: {
    number: 1500,
  },
};
