import { Meta, StoryObj } from "@storybook/react";
import DisplayClasses from "../pages/DisplayClasses";

const mockClasses = [
  { id: "class1", name: "Mathematics" },
  { id: "class2", name: "Science" },
  { id: "class3", name: "History" },
];

const mockSchool = { id: "school1", name: "Bharatiya Vidya Mandir" };

const meta: Meta<typeof DisplayClasses> = {
  title: "components/malta/DisplayClasses",
  component: DisplayClasses,
  parameters: {
    layout: "centered",
  },
  args: {
    allClasses: mockClasses,
    currentSchool: mockSchool,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    allClasses: mockClasses,
  },
};

export const EmptyState: Story = {
  args: {
    allClasses: [],
  },
};
