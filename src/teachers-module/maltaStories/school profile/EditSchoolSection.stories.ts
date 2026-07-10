import type { Meta, StoryObj } from "@storybook/react";
import EditSchoolSection from "../../components/schoolComponent/EditSchoolSection";
import { action } from "@storybook/addon-actions";

const meta: Meta<typeof EditSchoolSection> = {
  title: "components/schoolComponent/EditSchoolSection",
  component: EditSchoolSection,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    name: {
      control: "text",
    },
    state: {
      control: "text",
    },
    district: {
      control: "text",
    },
    city: {
      control: "text",
    },
    onNameChange: {
      action: "nameChange",
    },
    onStateChange: {
      action: "stateChange",
    },
    onDistrictChange: {
      action: "districtChange",
    },
    onCityChange: {
      action: "cityChange",
    },
  },
  args: {
    name: "Greenwood High",
    state: "California",
    district: "Los Angeles",
    city: "Los Angeles",
    onNameChange: action("nameChange"),
    onStateChange: action("stateChange"),
    onDistrictChange: action("districtChange"),
    onCityChange: action("cityChange"),
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: "Greenwood High",
    state: "California",
    district: "Los Angeles",
    city: "Los Angeles",
    onNameChange: action("nameChange"),
    onStateChange: action("stateChange"),
    onDistrictChange: action("districtChange"),
    onCityChange: action("cityChange"),
  },
};
