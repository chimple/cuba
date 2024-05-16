import type { Meta, StoryObj } from "@storybook/react";
import EditSchool from "../../components/malta/school/EditSchool";
import { fn } from "@storybook/test";

const meta = {
  title: "Component/malta/school/EditSchool",
  component: EditSchool,
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
  args: {schoolName:'School1', cityName: 'Bengaluru', stateName: 'Karnataka'},
} satisfies Meta<typeof EditSchool>;

export default meta;
type Story = StoryObj<typeof meta>;

export const editSchool: Story = {
  args: {
    schoolName: 'Bharthiya Vidhya Mandir',
    cityName: 'Bengaluru',
    stateName: 'Karnataka',
    onCancel: fn(),
    onSave: fn()
  },
};
