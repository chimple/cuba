import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { string } from "prop-types";
import Sidebar from "../../components/malta/Dashboard/Sidebar";

const meta: Meta = {
  title: "components/malta/Dashboard/Sidebar",
  component: Sidebar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    name: string,
    email: string,
  },
  args: { name: "john Doe", email: "johndoe@gmail.com" },
};

export default meta;
type Story = StoryObj<typeof meta>;
export const Test1: Story = {
  args: {
    name: "John Doe",
    email: "johndoe@gmail.com",
  },
};
export const Test2: Story = {
  args: {
    name: "XYG Done",
    email: "xygdone@gmail.com",
  },
};
export const Test3: Story = {
  args: {
    name: "",
    email: "xygdone@gmail.com",
  },
};
export const Test4: Story = {
  args: {
    name: "",
    email: "",
  },
};
export const Test5: Story = {
  args: {
    name: "XYG HGHDG DHGHG Done",
    email: "xygdonechsgdhdsf@gmail.com",
  },
};
