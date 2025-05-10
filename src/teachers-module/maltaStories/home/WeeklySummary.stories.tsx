import type { Meta, StoryObj } from "@storybook/react";
import { number, object } from "prop-types";
import WeeklySummary from "../../components/homePage/WeeklySummary";

const meta = {
  title: "teachers-module/home/WeeklySummary",
  component: WeeklySummary,
  tags: ["autodocs"],
  argTypes: {
    weeklySummary: object,
  },

  args: {
    weeklySummary: {
      assignments: {
        asgnmetCmptd: 2,
        totalAssignments: 10,
      },
      students: {
        stdCompletd: 3,
        totalStudents: 43,
      },
      timeSpent: 20,
      averageScore: 60,
    },
  },
} satisfies Meta<typeof WeeklySummary>;
export default meta;
type Story = StoryObj<typeof meta>;
export const AllAssigmentsCompleted: Story = {
  args: {
    weeklySummary: {
      assignments: {
        asgnmetCmptd: 10,
        totalAssignments: 10,
      },
      students: {
        stdCompletd: 43,
        totalStudents: 43,
      },
      timeSpent: 60,
      averageScore: 90,
    },
  },
};
export const FewAssignmentsDome: Story = {
    args: {
      weeklySummary: {
        assignments: {
          asgnmetCmptd: 8,
          totalAssignments: 10,
        },
        students: {
          stdCompletd: 21,
          totalStudents: 43,
        },
        timeSpent: 10,
        averageScore: 80,
      },
    },
  };
