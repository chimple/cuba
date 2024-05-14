import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import { action } from "@storybook/addon-actions";
import DateTimePicker from "../../components/malta/assignment/StartEndDateSelect";

const meta = {
  title: "Component/malta/assignment/StartEndDateSelect",
  component: DateTimePicker,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    startDate: {
      options: Object.values(""),
      mapping: Object.values(""),
      control: {
        type: "text",
        labels: Object.keys(""),
      },
    },
    endDate: {
      options: Object.values(""),
      mapping: Object.values(""),
      control: {
        type: "text",
        labels: Object.keys(""),
      },
    },
  },
  args: {startDate: '2024-06-02', endDate: '2024-06-10'},
} satisfies Meta<typeof DateTimePicker>;
export default meta;
type Story = StoryObj<typeof meta>;

export const dt: Story = {
 args: {
  startDate: '2024-05-02',
  endDate: '2024-05-12'
 }
};
