//@ts-nocheck
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
      group4: null,
      image: null,
      is_deleted: null,
      updated_at: null,
      program_id: "p1",
      address: null,
      udise: "12",
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
      group4: null,
      image: null,
      is_deleted: null,
      updated_at: null,
      program_id: "p1",
      address: null,
      udise: "12",
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
    academic_year: null,
    firebase_id: null,
    is_firebase: null,
    is_ops: null,
    ops_created_by: null,
    standard: null,
    status: null,
    group_id: null
  },
  {
    id: "2",
    name: "3rd standard",
    created_at: "",
    image: null,
    is_deleted: null,
    school_id: "",
    updated_at: null,
    academic_year: null,
    firebase_id: null,
    is_firebase: null,
    is_ops: null,
    ops_created_by: null,
    standard: null,
    status: null,
    group_id: null
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
      group4: null,
      image: null,
      is_deleted: null,
      updated_at: null,
      program_id: "p1",
      address: null,
      udise: "12",
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
