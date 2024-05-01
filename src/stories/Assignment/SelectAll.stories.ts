import type { Meta, StoryObj } from "@storybook/react";
import SelectAll from "../../components/malta/assignment/SelectAll";

const meta = {
  title: "Component/malta/assignment/SelectAll",
  component: SelectAll,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {},
  args: {},
} satisfies Meta<typeof SelectAll>;

export default meta;
type Story = StoryObj<typeof meta>;

export const selectall: Story = {};
