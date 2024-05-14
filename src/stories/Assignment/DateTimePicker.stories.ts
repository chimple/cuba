import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { action } from "@storybook/addon-actions";
import DateTimePicker from "../../components/malta/assignment/DateTimePicker";

const meta = {
  title: "Component/malta/assignment/DateTimePicker",
  component: DateTimePicker,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {},
  args: {},
} satisfies Meta<typeof DateTimePicker>;
export default meta;
type Story = StoryObj<typeof meta>;

export const dt: Story = {
  args: {},
};
