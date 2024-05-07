import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import CommonButton from "../../components/malta/common/CommonButton";

const meta = {
  title: "Component/malta/CommonButton",
  component: CommonButton,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: {
        type: "text",
      },
    },
    disabled: {
      options: Object.values(""),
      mapping: Object.values(""),
      control: {
        type: "boolean",
        labels: Object.keys(""),
      },
    },
    onClicked: fn(),
  },
  args: { title: "button", disabled: false, onClicked: fn() },
} satisfies Meta<typeof CommonButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const assignButton: Story = {
  parameters: { locale: "hi" },
  args: {
    title: "Assign",
    disabled: true,
    onClicked: fn(),
  },
};

export const switchSchoolButton: Story = {
  args: {
    title: "Switch school",
    disabled: false,
    onClicked: fn(),
  },
};

export const cancelButton: Story = {
  args: {
    title: "Cancel",
    disabled: false,
    onClicked: fn(),
  },
};

export const saveButton: Story = {
  args: {
    title: "Save",
    disabled: false,
    onClicked: fn(),
  },
};
