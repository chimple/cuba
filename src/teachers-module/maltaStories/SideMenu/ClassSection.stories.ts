import { Meta, StoryObj } from "@storybook/react";
import ClassSection from "../../components/homePage/ClassSection";

const meta: Meta<typeof ClassSection> = {
  title: "components/ClassSection",
  component: ClassSection,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    classData: {
      control: "object",
      description: "Array of objects representing class data for the dropdown",
    },
    currentClassDetail: {
      control: "object",
      description: "The currently selected class object { id, name }",
    },
    currentClassId: {
      control: "text",
      description: "The ID of the currently selected class",
    },
    classCode: {
      control: "number",
      description: "The class code for the selected class",
    },
    handleClassSelect: {
      action: "classSelected",
      description: "Callback function when a class is selected",
    },
    handleManageClassClick: {
      action: "manageClassClicked",
      description: "Callback function when 'Manage Class' button is clicked",
    },
    setClassCode: {
      action: "classCodeSet",
      description: "Callback function to set the class code",
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    classData: [
      { id: "1", name: "Mathematics" },
      { id: "2", name: "Science" },
      { id: "3", name: "History" },
    ],
    currentClassDetail: { id: "1", name: "Mathematics" },
    currentClassId: "1",
    classCode: 12345,
  },
};

export const NoClassSelected: Story = {
  args: {
    classData: [
      { id: "1", name: "Mathematics" },
      { id: "2", name: "Science" },
      { id: "3", name: "History" },
    ],
    currentClassDetail: { id: "", name: "" },
    currentClassId: "",
    classCode: undefined,
  },
};

export const SelectedScience: Story = {
  args: {
    classData: [
      { id: "1", name: "Mathematics" },
      { id: "2", name: "Science" },
      { id: "3", name: "History" },
    ],
    currentClassDetail: { id: "2", name: "Science" },
    currentClassId: "2",
    classCode: 67890,
  },
};

export const SelectedHistory: Story = {
  args: {
    classData: [
      { id: "1", name: "Mathematics" },
      { id: "2", name: "Science" },
      { id: "3", name: "History" },
    ],
    currentClassDetail: { id: "3", name: "History" },
    currentClassId: "3",
    classCode: 54321,
  },
};

export const EmptyDropdown: Story = {
  args: {
    classData: [],
    currentClassDetail: { id: "", name: "" },
    currentClassId: "",
    classCode: undefined,
  },
};
