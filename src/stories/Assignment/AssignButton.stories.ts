import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { action } from "@storybook/addon-actions";
import AssignButton from "../../components/malta/assignment/AssignButton";

const meta = {
  title: "Component/malta/assignment/AssignButton",
  component: AssignButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    onClicked: action("on-click"),
  },
  args: { onClicked: fn() },
} satisfies Meta<typeof AssignButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const disabled: Story = {
  args: {
    disabled: true,
  },
};

export const enabled: Story = {
  args: {
    disabled: false,
  },
};
