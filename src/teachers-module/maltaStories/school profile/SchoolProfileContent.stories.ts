import type { Meta, StoryObj } from "@storybook/react";
import SchoolProfileContent from "../../components/schoolComponent/SchoolProfileContent";
import { TableTypes } from "../../../common/constants";

const mockSchool: TableTypes<"school"> = {
  id: "1",
  name: "Greenwood High Greenwood Greenwood",
  group1: "California",
  group2: "Los Angeles",
  group3: "Los Angeles",
  created_at: "",
  updated_at: null,
  image: null,
  is_deleted: null,
};

const meta: Meta<typeof SchoolProfileContent> = {
  title: "components/schoolComponent/SchoolProfileContent",
  component: SchoolProfileContent,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    school: {
      control: {
        type: "object",
      },
      defaultValue: mockSchool,
    },
  },
  args: {
    school: mockSchool,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    school: mockSchool,
  },
};
