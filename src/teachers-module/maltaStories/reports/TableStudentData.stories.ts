import type { Meta, StoryObj } from "@storybook/react";
import { number, string } from "prop-types";
import TableStudentData from "../../components/reports/TableStudentData";
import { TABLEDROPDOWN } from "../../../common/constants";

const meta = {
  title: "teachers-module/report/TableStudentData",
  component: TableStudentData,
  tags: ["autodocs"],
  argTypes: {},

  args: {},
} satisfies Meta<typeof TableStudentData>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Test1: Story = {
  args: {
    studentData: {
      Friday: [],
      Saturday: [],
      Sunday: [],
      Monday: [
        {
          score: 100,
        },
      ],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
    },
    isScore: true,
    assignmentMap: {
      Monday: { belongsToClass: true },
    },
    selectedType: TABLEDROPDOWN.WEEKLY
  },
};
export const Count: Story = {
  args: {
    studentData: {
      Friday: [],
      Saturday: [],
      Sunday: [],
      Monday: [
        {
          score: 100,
        },
        {
          score: 100,
        },
        {
          score: 100,
        },
      ],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
    },
    isScore: false,
    assignmentMap: {
      Monday: { belongsToClass: true },
    },
    selectedType: TABLEDROPDOWN.WEEKLY
  },
};

export const Count1: Story = {
    args: {
      studentData: {
        Friday: [],
        Saturday: [{
            score: 100,
          },
          {
            score: 80,
          },
          {
            score: 60,
          },],
        Sunday: [],
        Monday: [
          {
            score: 10,
          },
          {
            score: 30,
          },
          {
            score: 40,
          },
        ],
        Tuesday: [],
        Wednesday: [
            {
                score: 40,
              },
              {
                score: 30,
              },
              {
                score: 70,
              },
        ],
        Thursday: [],
      },
      isScore: false,
      assignmentMap: {
        Monday: { belongsToClass: true },
      },
      selectedType: TABLEDROPDOWN.WEEKLY
    },
  };
export const Score: Story = {
  args: {
    studentData: {
      Friday: [],
      Saturday: [
        {
          score: 50,
        },
      ],
      Sunday: [
        {
          score: 100,
        },
      ],
      Monday: [
        {
          score: 60,
        },
      ],
      Tuesday: [],
      Wednesday: [],
      Thursday: [
        {
          score: 10,
        },
      ],
    },
    isScore: true,
    assignmentMap: {
      Monday: { belongsToClass: true },
    },
    selectedType: TABLEDROPDOWN.WEEKLY
  },
};
