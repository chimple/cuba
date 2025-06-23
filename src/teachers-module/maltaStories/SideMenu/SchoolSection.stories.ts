import { Meta, StoryObj } from "@storybook/react";
import SchoolSection from "../../components/homePage/SchoolSection";

const meta: Meta<typeof SchoolSection> = {
  title: "components/SchoolSection",
  component: SchoolSection,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    schoolData: {
      control: "object",
      description: "Array of objects representing school data for the dropdown",
    },
    currentSchoolDetail: {
      control: "object",
      description: "The currently selected school object { id, name }",
    },
    handleSchoolSelect: {
      action: "schoolSelected",
      description: "Callback function when a school is selected",
    },
    handleManageSchoolClick: {
      action: "manageSchoolClicked",
      description: "Callback function when 'Manage School' button is clicked",
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    schoolData: [
      { id: "1", name: "Greenwood High" },
      { id: "2", name: "Lakeside Academy" },
      { id: "3", name: "Sunset International" },
    ],
    currentSchoolDetail: { id: "1", name: "Greenwood High" },
  },
};

export const NoSchoolSelected: Story = {
  args: {
    schoolData: [
      { id: "1", name: "Greenwood High" },
      { id: "2", name: "Lakeside Academy" },
      { id: "3", name: "Sunset International" },
    ],
    currentSchoolDetail: { id: "", name: "" },
  },
};

export const SelectedLakeside: Story = {
  args: {
    schoolData: [
      { id: "1", name: "Greenwood High" },
      { id: "2", name: "Lakeside Academy" },
      { id: "3", name: "Sunset International" },
    ],
    currentSchoolDetail: { id: "2", name: "Lakeside Academy" },
  },
};

export const SelectedSunset: Story = {
  args: {
    schoolData: [
      { id: "1", name: "Greenwood High" },
      { id: "2", name: "Lakeside Academy" },
      { id: "3", name: "Sunset International" },
    ],
    currentSchoolDetail: { id: "3", name: "Sunset International" },
  },
};

export const EmptyDropdown: Story = {
  args: {
    schoolData: [],
    currentSchoolDetail: { id: "", name: "" },
  },
};
