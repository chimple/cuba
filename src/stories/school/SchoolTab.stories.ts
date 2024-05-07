import type { Meta, StoryObj } from "@storybook/react";
import SchoolTab from "../../components/malta/school/SchoolTab";
import { fn } from "@storybook/test";

const meta = {
  title: "Component/malta/school/SchoolTab",
  component: SchoolTab,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {},
  args: {},
} satisfies Meta<typeof SchoolTab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const editSchool: Story = {
  args: {
    schoolName: "School1",
    cityName: "Bengaluru",
    stateName: "Karnataka",
    schools: ["School1", "School2"],
    isSchoolAdd: false,
    isSchoolEdit: true,
    onCancel: fn(),
    onSchoolAdd: fn(),
    onSchoolCreate: fn(),
    onSchoolEdit: fn(),
    onSchoolSave: fn(),
  },
};
