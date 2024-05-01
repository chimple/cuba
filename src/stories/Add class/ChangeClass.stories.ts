import type { Meta, StoryObj } from "@storybook/react";
import ChangeClass from "../../pages/Malta/Add class details/ChangeClass";

const meta = {
  title: "Component/pages/Malta/Add class details/ChangeClass",
  component: ChangeClass,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    teachersName: {
      options: ["jyoti", "malar"],
      mapping: ["jyoti", "malar"],
      control: {
        type: "select",
        labels: Object.keys("jyoti"),
      },
    },
    classStandard: {
      options: ["1st standard", "2nd standard", "3rd standard"],
      mapping: ["1st standard", "2nd standard", "3rd standard"],
      control: {
        type: "select",
        labels: Object.keys("1st standard"),
      },
    },
  },
  args: { teachersName: "Jyoti", classStandard: "1st standard" },
} satisfies Meta<typeof ChangeClass>;
export default meta;
type Story = StoryObj<typeof meta>;
export const teachersName1: Story = {
  args: {
    teachersName: "Jyoti",
    classStandard: "1st standard",
  },
  parameters: {
    layout: "fullscreen",
    width: "800px",
  },
};

export const teachersName2: Story = {
  args: {
    teachersName: "malar",
    classStandard: "1st standard",
  },
  parameters: {
    layout: "padded",
    width: "800px",
  },
};

export const classStandard1: Story = {
  args: {
    teachersName: "Jyoti kanmani malar....",
    classStandard: "1st standard",
  },
  parameters: {
    layout: "centered",
    width: "10vw",
  },
};

export const classStandard2: Story = {
  args: {
    teachersName: "Jyoti",
    classStandard: "2nd standard",
  },
  parameters: {
    layout: "fullscreen",
    width: "100%",
  },
};

export const classStandard3: Story = {
  args: {
    teachersName: "Jyoti",
    classStandard: "3rd standard",
  },
  parameters: {
    layout: "fullscreen",
    width: "80%",
  },
};
