import type { Meta, StoryObj } from "@storybook/react";
import SelectedAssignment from "../../pages/Malta/SelectedAssignment";

const meta: Meta = {
  title: "Pages/Malta/SelectedAssignment",
  component: SelectedAssignment,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
  argTypes: {},
} satisfies Meta<typeof SelectedAssignment>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
