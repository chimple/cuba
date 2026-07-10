import type { Meta, StoryObj } from "@storybook/react";
import ClassUsers from "../../pages/ClassUsers";

const meta: Meta<typeof ClassUsers> = {
  title: "teachers-module/pages/ClassUsers",
  component: ClassUsers,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <ClassUsers />,
};
