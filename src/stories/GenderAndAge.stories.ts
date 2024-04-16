import GenderAndAge from "../components/editStudent/GenderAndAge";
import { fn } from "@storybook/test";
import type { Meta, StoryObj } from "@storybook/react";
import { GENDER } from "../common/constants";

const meta = {
  title: "Component/EditStudent/GenderAndAge",
  component: GenderAndAge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    gender: {
      options: Object.values(GENDER),
      mapping: Object.values(GENDER),
      control: {
        type: "select",
        labels: Object.keys(GENDER),
      },
    },
    age: {
      control: {
        type: "number",
        min: 4,
        max: 10,
        step: 1,
      },
    },
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: { gender: GENDER.BOY, age: 5, onGenderChange: fn(), onAgeChange: fn() },
} satisfies Meta<typeof GenderAndAge>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Girl: Story = {
  args: {
    gender: GENDER.GIRL,
  },
};

export const Boy: Story = {
  args: {
    gender: GENDER.BOY,
  },
};

export const Other: Story = {
  args: {
    gender: GENDER.OTHER,
  },
};

export const Age4: Story = {
  args: {
    gender: GENDER.GIRL,
    age: 4,
  },
};

export const Age5_: Story = {
  args: {
    gender: GENDER.BOY,
    age: 5,
  },
};

export const Age6: Story = {
  args: {
    gender: GENDER.BOY,
    age: 6,
  },
};

export const Age7: Story = {
  args: {
    gender: GENDER.BOY,
    age: 7,
  },
};
export const Age8: Story = {
  args: {
    gender: GENDER.BOY,
    age: 8,
  },
};
export const Age9: Story = {
  args: {
    gender: GENDER.BOY,
    age: 9,
  },
};
export const Age10: Story = {
  args: {
    gender: GENDER.BOY,
    age: 10,
  },
};
