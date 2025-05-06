import type { Meta, StoryObj } from "@storybook/react";
import ClassProfile from "../../pages/ClassProfile";

const meta: Meta = {
  title: "teachers-module/pages/ClassProfile",
  component: ClassProfile,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = () => <ClassProfile />;
