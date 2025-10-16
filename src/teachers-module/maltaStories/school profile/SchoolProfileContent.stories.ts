//@ts-nocheck
import type { Meta, StoryObj } from "@storybook/react";
import SchoolProfileContent from "../../components/schoolComponent/SchoolProfileContent";
import { TableTypes } from "../../../common/constants";

const mockSchool: TableTypes<"school"> = {
  id: "1",
  name: "Greenwood High Greenwood Greenwood",
  group1: "California",
  group2: "Los Angeles",
  group3: "Los Angeles",
  group4: "Los Angeles",
  created_at: "",
  updated_at: null,
  image: null,
  is_deleted: null,
  udise: "1234567890",
  address: "address",
  program_id: "id-1",
  model: null,
  academic_year: null,
  firebase_id: null,
  is_firebase: null,
  is_ops: null,
  language: null,
  ops_created_by: null,
  student_login_type: null,
  status: null,
  key_contacts: null,
  country: null
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
