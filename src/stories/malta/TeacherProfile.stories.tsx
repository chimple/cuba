// TeacherProfile.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import TeacherProfile from "../../pages/Malta/TeacherProfile";

const meta: Meta = {
  title: "Pages/Malta/TeacherProfile",
  component: TeacherProfile,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof meta>;
export const Default = () => <TeacherProfile />;
