import type { Meta, StoryObj } from "@storybook/react";
import CommonAppBar from "../../components/malta/common/CommonAppBar";

const meta = {
  title: "Component/malta/school/schoolAppBar",
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
    title: "username",
    loc: "#",
    showAvatar: true,
    imgScr: "https://ionicframework.com/docs/img/demos/avatar.svg"
  },
};
