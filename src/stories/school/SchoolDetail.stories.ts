import type { Meta, StoryObj } from "@storybook/react";
import SchoolDetail from "../../components/malta/school/SchoolDetail";

const meta = {
  title: "Component/malta/school/schoolDetail",
  component: SchoolDetail,
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
} satisfies Meta<typeof SchoolDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const schoolDetail: Story = {
  args: {
    schoolName: 'Bharthiya Vidhya Mandir',
    cityName: 'Bengaluru',
    stateName: 'Karnataka'
  },
};
