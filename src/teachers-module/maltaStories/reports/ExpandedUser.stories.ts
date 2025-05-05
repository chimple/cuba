import type { Meta, StoryObj } from "@storybook/react";
import { number, string } from "prop-types";
import ExpandedUser from "../../components/reports/ExpandedUser";

const meta = {
  title: "teachers-module/report/ExpandedUser",
  component: ExpandedUser,
  tags: ["autodocs"],
  argTypes: {
    name: string,
  },

  args: { name: "a" },
} satisfies Meta<typeof ExpandedUser>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Test1: Story = {
  args: {
    name: "Chimple",
    onClickViewDetails(){}

  },
};
export const Test2: Story = {
  args: {
   name: "abc",
    onClickViewDetails(){}
  },
};
export const Test3: Story = {
  args: {
    name: "a",
    onClickViewDetails(){}
  },
};
export const Test4: Story = {
  args: {
    name: "123",
    onClickViewDetails(){}
  },
};
export const Test5: Story = {
  args: {
    name: "abc123",
    onClickViewDetails(){}
  },
};
