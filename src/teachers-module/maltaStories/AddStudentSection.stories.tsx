import type { Meta, StoryObj } from "@storybook/react";
import AddStudentSection from "../components/AddStudentSection";

const meta: Meta = {
  title: "components/malta/AddStudent/AddStudentSection",
  component: AddStudentSection,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    classOptions: {
      control: {
        type: "object",
      },
      defaultValue: [
        { label: "1st Standard", value: "1st Standard" },
        { label: "2nd Standard", value: "2nd Standard" },
      ],
    },
    languageOptions: {
      control: {
        type: "object",
      },
      defaultValue: [
        { label: "English", value: "en" },
        { label: "Spanish", value: "es" },
      ],
    },
    fullName: {
      control: "text",
      defaultValue: "John Doe",
    },
    age: {
      control: "text",
      defaultValue: "10",
    },
    studentId: {
      control: "text",
      defaultValue: "12345",
    },
    gender: {
      control: {
        type: "radio",
        options: ["male", "female", "other"],
      },
      defaultValue: "male",
    },
    language: {
      control: "text",
      defaultValue: "en",
    },
  },
  args: {
    classOptions: [
      { label: "1st Standard", value: "1st Standard" },
      { label: "2nd Standard", value: "2nd Standard" },
    ],
    languageOptions: [
      { label: "English", value: "en" },
      { label: "Spanish", value: "es" },
    ],
    fullName: "Clementine",
    age: "3",
    studentId: "788797987",
    gender: "male",
    language: "en",
  },
};

export default meta;
type Story = StoryObj<typeof meta>;
export const Test1: Story = {
  args: {
    languageOptions: [
      { label: "English", value: "en" },
      { label: "Spanish", value: "es" },
    ],
    fullName: "Christopher",
    age: "5",
    studentId: "12345",
    gender: "male",
    language: "en",
  },
};

export const Test2: Story = {
  args: {
    languageOptions: [
      { label: "English", value: "en" },
      { label: "Spanish", value: "es" },
    ],
    fullName: "abcdefgh pghffgf",
    age: "6",
    studentId: "98978",
    gender: "male",
    language: "en",
  },
};

export const Test3: Story = {
  args: {
    languageOptions: [
      { label: "English", value: "en" },
      { label: "Spanish", value: "es" },
    ],
    fullName: "John Doe",
    age: "10",
    studentId: "12",
    gender: "female",
    language: "hi",
  },
};

export const Test4: Story = {
  args: {
    languageOptions: [
      { label: "English", value: "en" },
      { label: "Spanish", value: "es" },
    ],
    fullName: "John Doe sundar varma",
    age: "6",
    studentId: "123456",
    gender: "male",
    language: "en",
  },
};
