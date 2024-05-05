import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { action } from "@storybook/addon-actions";
import CommonButton from "../../components/malta/common/CommonButton";

const meta = {
  title: "Component/malta/assignment/common/CommonButton",
  component: CommonButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    onClicked: action("on-click"),
  },
  args: { onClicked: fn() },
} satisfies Meta<typeof CommonButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const disabled: Story = {
  args: {
    title: "Assign",
    disabled: true,
  },
};

export const enabled: Story = {
  args: {
    title: "Assign",
    disabled: false,
  },
};
