//@ts-nocheck
import type { Meta, StoryObj } from '@storybook/react';
import { object } from 'prop-types';
import WeeklySummary from '../../components/homePage/WeeklySummary';

const meta = {
  title: 'teachers-module/home/WeeklySummary',
  component: WeeklySummary,
  tags: ['autodocs'],
  argTypes: {
    weeklySummary: object,
  },

  args: {
    weeklySummary: {
      activeStudents: {
        count: 11,
        totalStudents: 43,
        trend: 'up',
      },
      averageTimeSpent: {
        minutes: 20,
        trend: 'down',
      },
      averageScore: {
        percentage: 60,
        trend: 'up',
      },
    },
  },
} satisfies Meta<typeof WeeklySummary>;
export default meta;
type Story = StoryObj<typeof meta>;
export const AllAssigmentsCompleted: Story = {
  args: {
    weeklySummary: {
      activeStudents: {
        count: 43,
        totalStudents: 43,
        trend: 'same',
      },
      averageTimeSpent: {
        minutes: 60,
        trend: 'up',
      },
      averageScore: {
        percentage: 90,
        trend: 'up',
      },
    },
  },
};
export const FewAssignmentsDome: Story = {
  args: {
    weeklySummary: {
      activeStudents: {
        count: 21,
        totalStudents: 43,
        trend: 'down',
      },
      averageTimeSpent: {
        minutes: 10,
        trend: 'down',
      },
      averageScore: {
        percentage: 80,
        trend: 'same',
      },
    },
  },
};
