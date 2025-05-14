import type { Meta, StoryObj } from "@storybook/react";
import StudentReportTable from "../../components/studentReport/StudentReportTable";

const meta = {
  title: "teachers-module/studentReport/StudentReportTable",
  component: StudentReportTable,
  tags: ["autodocs"],
  argTypes: {},

  args: {},
} satisfies Meta<typeof StudentReportTable>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Test1: Story = {
  args: {
    report: [
      {
        lessonName: "Alphabet",
        score: 40,
        date: "20-06-2023",
        isAssignment: true,
      },
    ],
  },
};
export const Test2: Story = {
  args: {
    report: [
      {
        lessonName: "Alphabet",
        score: 40,
        date: "20-06-2023",
        isAssignment: true,
      },
      {
        lessonName: "Zebra",
        score: 80,
        date: "19-06-2023",
        isAssignment: false,
      },
      {
        lessonName: "Camel",
        score: 60,
        date: "20-04-2023",
        isAssignment: true,
      },
    ],
  },
};
export const Test3: Story = {
  args: {
    report: [
      {
        lessonName: "1",
        score: 40,
        date: "20-06-2023",
        isAssignment: false,
      },
      {
        lessonName: "5",
        score: 80,
        date: "20-09-2023",
        isAssignment: true,
      },
      {
        lessonName: "2",
        score: 20,
        date: "20-07-2023",
        isAssignment: false,
      },
      {
        lessonName: "8",
        score: 100,
        date: "20-01-2023",
        isAssignment: false,
      },
    ],
  },
};
export const Test4: Story = {
  args: {
    report: [
      {
        lessonName: "c",
        score: 69,
        date: "18-05-2023",
        isAssignment: false,
      },
      {
        lessonName: "z",
        score: 40,
        date: "10-01-2023",
        isAssignment: true,
      },
      {
        lessonName: "b",
        score: 80,
        date: "08-03-2023",
        isAssignment: false,
      },
      {
        lessonName: "u",
        score: 10,
        date: "08-03-2023",
        isAssignment: true,
      },
      {
        lessonName: "r",
        score: 20,
        date: "20-08-2022",
        isAssignment: true,
      },
      {
        lessonName: "b",
        score: 50,
        date: "20-04-2023",
        isAssignment: false,
      },
      {
        lessonName: "2",
        score: 7,
        date: "20-06-2023",
        isAssignment: true,
      },
      {
        lessonName: "8",
        score: 48,
        date: "02-09-2023",
        isAssignment: true,
      },
    ],
  },
};
