//@ts-nocheck
import type { Meta, StoryObj } from '@storybook/react';
import AddStudent from '../pages/AddStudent';

const meta: Meta = {
  title: 'Pages/Malta/AddStudent',
  component: AddStudent,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = () => <AddStudent />;
