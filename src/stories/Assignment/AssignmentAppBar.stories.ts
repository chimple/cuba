import type { Meta, StoryObj } from "@storybook/react";
import CommonAppBar from "../../components/malta/common/CommonAppBar";

const meta = {
  title: "Component/malta/assignment/AssignmentAppBar",
  component: CommonAppBar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    title: {
      options: Object.values(""),
      mapping: Object.values(""),
      control: {
        type: "text",
        labels: Object.keys(""),
      },
    },
    loc: {
      options: Object.values(""),
      mapping: Object.values(""),
      control: {
        type: "text",
        labels: Object.keys(""),
      },
    },
  },
  args: {},
} satisfies Meta<typeof CommonAppBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const appBar: Story = {
  args: {
    title: "assignment",
    loc: "#",
  },
};
