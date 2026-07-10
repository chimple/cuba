import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import StudentProfile from "../../pages/Malta/StudentProfile";
import { string } from "prop-types";

const meta: Meta = {
  title: "Pages/Malta/StudentProfile",
  component: StudentProfile,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    name: string,
  },
  args: { name: "john Doe" },
};

export default meta;
type Story = StoryObj<typeof meta>;
export const Test1: Story = {
  args: {
    name: "John Doe",
  },
};
export const Test2: Story = {
  args: {
    name: "XYG Done",
  },
};
export const Test3: Story = {
  args: {
    name: "ABCDEFGHIJKLMNOP",
  },
};
export const Test4: Story = {
  args: {
    name: "",
  },
};
export const Test5: Story = {
  args: {
    name: "XYG ABC YYZ ABC",
  },
};
export const Default = () => <StudentProfile />;
