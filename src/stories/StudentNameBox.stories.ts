import { fn } from "@storybook/test";
import type { Meta, StoryObj } from "@storybook/react";
import StudentNameBox from "../components/editStudent/StudentNameBox";

const meta = {
  title: "Component/EditStudent/StudentNameBox",
  component: StudentNameBox,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    studentName: {
      type: "string",
    },
  },
  args: {
    onEnterDown: fn(),
    onValueChange: fn(),
    studentName: "Test Student name",
  },
} satisfies Meta<typeof StudentNameBox>;
export default meta;
type Story = StoryObj<typeof meta>;

export const StudentNameBoxNormal: Story = {
  args: {
    studentName: "Ram",
  },
};
