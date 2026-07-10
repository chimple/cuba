import type { Meta, StoryObj } from "@storybook/react";
import AddSchool from "../../components/malta/school/AddSchool";
import { fn } from "@storybook/test";

const meta = {
  title: "Component/malta/school/AddSchool",
  component: AddSchool,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    schoolName: {
      options: Object.values(""),
      mapping: Object.values(""),
      control: {
        type: "text",
        labels: Object.keys(""),
      },
    },
    cityName: {
      options: Object.values(""),
      mapping: Object.values(""),
      control: {
        type: "text",
        labels: Object.keys(""),
      },
    },
    stateName: {
        options: Object.values(""),
        mapping: Object.values(""),
        control: {
          type: "text",
          labels: Object.keys(""),
        },
      },
  },
  args: {},
} satisfies Meta<typeof AddSchool>;

export default meta;
type Story = StoryObj<typeof meta>;

export const addSchool: Story = {
  args: {
    schoolName: '',
    cityName: '',
    stateName: '',
    onCancel: fn(),
    onCreate: fn()
  },
};
