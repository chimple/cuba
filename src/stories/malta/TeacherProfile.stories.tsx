// TeacherProfile.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import TeacherProfile from "../../pages/Malta/TeacherProfile";
import { string } from "prop-types";

const meta: Meta = {
  title: "Pages/Malta/TeacherProfile",
  component: TeacherProfile,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    name: string,
    email: string,

},
args: { name: 'John Doe"', email: 'john.doe@example.com'},
};

export default meta;
type Story = StoryObj<typeof meta>;
export const Test1: Story = {
  args: {
    name: 'ABC student', email: '3rd Grade'
  },
};
export const Default = () => <TeacherProfile />;
