import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import DropDown from "../../components/malta/assignment/DropDown";

const OPTIONS = [
  { id: "str", displayName: "strDisp" },
  { id: "str1", displayName: "strDisp1" },
];
const meta = {
  title: "component/malta/assignment/DropDown",
  component: DropDown,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    width: {
      type: "string",
    },
  },
  args: {
    width: "35vw",
  },
} satisfies Meta<typeof DropDown>;
export default meta;

type Story = StoryObj<typeof meta>;

export const dropdown: Story = {
  args: {
    currentValue: "value",
    optionList: OPTIONS,
    placeholder: "select",
    width: "35vw",
    onValueChange(evt) {},
  },
};
