import type { Meta, StoryObj } from "@storybook/react";
import DetailList from "../../components/schoolComponent/DetailList";
import {
  IconType,
  PAGES,
  SchoolWithRole,
  TableTypes,
} from "../../../common/constants";
import { RoleType } from "../../../interface/modelInterfaces";

const mockSchools: SchoolWithRole[] = [
  {
    school: {
      id: "1",
      name: "Greenwood High",
      created_at: "",
      group1: null,
      group2: null,
      group3: null,
      image: null,
      is_deleted: null,
      updated_at: null,
    },
    role: RoleType.PRINCIPAL,
  },
  {
    school: {
      id: "2",
      name: "Sunnydale School",
      created_at: "",
      group1: null,
      group2: null,
      group3: null,
      image: null,
      is_deleted: null,
      updated_at: null,
    },
    role: RoleType.COORDINATOR,
  },
];

const mockClasses: TableTypes<"class">[] = [
  {
    id: "1",
    name: "2nd standard",
    created_at: "",
    image: null,
    is_deleted: null,
    school_id: "",
    updated_at: null,
  },
  {
    id: "2",
    name: "3rd standard",
    created_at: "",
    image: null,
    is_deleted: null,
    school_id: "",
    updated_at: null,
  },
];

const meta: Meta<typeof DetailList> = {
  title: "components/schoolComponent/DetailList",
  component: DetailList,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "radio",
      options: ["school", "class"],
    },
    school: {
      control: {
        type: "object",
      },
      defaultValue: {},
    },
    data: {
      control: {
        type: "object",
      },
      defaultValue: [],
    },
  },
  args: {
    type: IconType.SCHOOL,
    data: mockSchools,
    school: {
      id: "2",
      name: "Sunnydale School",
      created_at: "",
      group1: null,
      group2: null,
      group3: null,
      image: null,
      is_deleted: null,
      updated_at: null,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SchoolList: Story = {
  args: {
    type: IconType.SCHOOL,
    data: mockSchools,
  },
};

export const ClassList: Story = {
  args: {
    type: IconType.CLASS,
    data: mockClasses,
  },
};
