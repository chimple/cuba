import type { Meta, StoryObj } from "@storybook/react";
import SelectClass from "../../pages/Malta/Add class details/SelectClass";
import { fn } from "@storybook/test";

const meta = {
  title: "Component/pages/Malta/Add class details/SelectClass",
  component: SelectClass,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    classes: {
      options: ["1st standard", "2nd standard", "3rd standard"],
      mapping: ["1st standard", "2nd standard", "3rd standard"],
    },
    selectedClass: {
      options: ["1st standard", "2nd standard", "3rd standard"],
      mapping: ["1st standard", "2nd standard", "3rd standard"],
    },
  },
  args: {
    classes: ["1st standard", "2nd standard", "3rd standard"],
    selectedClass: "3rd standard",
    onClassSelect: fn(),
    onSwitchClass: fn(),
  },
} satisfies Meta<typeof SelectClass>;
export default meta;
type Story = StoryObj<typeof meta>;
export const classes1: Story = {
  args: {
    classes: ["1st standard", "2nd standard", "3rd standard"],
    selectedClass: "1st standard",
  },
  parameters: {
    layout: "fullscreen",
    width: "800px",
  },
};

export const classes2: Story = {
  args: {
    classes: ["1st standard", "2nd standard", "3rd standard"],
    selectedClass: "2nd standard",
  },
  parameters: {
    layout: "centered",
    width: "800px",
  },
};

export const classes3: Story = {
  args: {
    classes: ["1st standard", "2nd standard", "3rd standard"],
    selectedClass: "3rd standard",
  },
  parameters: {
    layout: "padded",
    width: "800px",
  },
};
