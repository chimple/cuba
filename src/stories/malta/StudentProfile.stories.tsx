import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import StudentProfile from "../../pages/Malta/StudentProfile";

const meta: Meta = {
  title: "Pages/Malta/StudentProfile",
  component: StudentProfile,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof meta>;
export const Default = () => <StudentProfile />;
