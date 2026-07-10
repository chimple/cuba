import type { Meta, StoryObj } from "@storybook/react";
import SwitchSchool from "../../components/malta/school/SwitchSchool";
import { fn } from "@storybook/test";

const meta = {
  title: "Component/malta/school/SwitchSchool",
  component: SwitchSchool,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
  },
  args: {},
} satisfies Meta<typeof SwitchSchool>;

export default meta;
type Story = StoryObj<typeof meta>;

export const switchSchool: Story = {
  args: {
    schools: ['school1','school2','school3']
  },
};
