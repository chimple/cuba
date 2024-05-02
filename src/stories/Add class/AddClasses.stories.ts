import type { Meta, StoryObj } from "@storybook/react";
import AddClasses from "../../pages/Malta/Add class details/AddClasses";
import { fn } from "@storybook/test";

const meta = {
  title: "Component/pages/Malta/Add class details/AddClasses",
  component: AddClasses,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    additionalClasses: {
      options: ["4th standard", "5th standard"],
      mapping: ["4th standard", "5th standard"],
    },
    open: {
      options: true,
      control: {
        type: "boolean",
      },
    },
  },
  args: {
    additionalClasses: ["4th standard", "5th standard"],
    open: true,
    onAddClass: fn(),
    onClose: fn(),
  },
} satisfies Meta<typeof AddClasses>;
export default meta;
type Story = StoryObj<typeof meta>;
export const oneClass: Story = {
  args: {
    additionalClasses: ["4th standard"],
    open: true,
  },
  parameters: {
    layout: "fullscreen",
    width: "800px",
  },
};

export const twoClasses: Story = {
  args: {
    additionalClasses: ["4th standard", "5th standard"],
    open: true,
  },
  parameters: {
    layout: "padded",
    width: "800px",
  },
};

export const threeClasses: Story = {
  args: {
    additionalClasses: ["4th standard", "5th standard", "6th standard"],
    open: false,
  },
  parameters: {
    layout: "centered",
    width: "10vw",
  },
};
