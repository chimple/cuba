import type { Meta, StoryObj } from "@storybook/react";
import AssignmentAppBar from "../../components/malta/assignment/AssignmentAppBar";

const meta = {
  title: "Component/malta/assignment/AssignmentAppBar",
  component: AssignmentAppBar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {},
  args: {},
} satisfies Meta<typeof AssignmentAppBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const enabled: Story = {};
