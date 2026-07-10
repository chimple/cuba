import type { Meta, StoryObj } from "@storybook/react";
import UserProfileSection from "../components/UserProfileSection";

const meta: Meta = {
  title: "components/malta/UserProfile/UserProfileSection",
  component: UserProfileSection,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
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
    email: {
      control: "text",
      defaultValue: "johndoe@example.com",
    },
    phoneNum: {
      control: "text",
      defaultValue: "1234567890",
    },
    language: {
      control: "text",
      defaultValue: "en",
    },
    isEditMode: {
      control: {
        type: "boolean",
      },
      defaultValue: true,
    },
  },
  args: {
    languageOptions: [
      { label: "English", value: "en" },
      { label: "Spanish", value: "es" },
    ],
    fullName: "Clementine",
    email: "clementine@example.com",
    phoneNum: "9876543210",
    language: "en",
    isEditMode: true,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultProfile: Story = {
  args: {
    fullName: "Christopher",
    email: "christopher@example.com",
    phoneNum: "1112223333",
    language: "en",
    isEditMode: true,
  },
};

export const ViewModeProfile: Story = {
  args: {
    fullName: "Emma Stone",
    email: "emma@example.com",
    phoneNum: "2223334444",
    language: "es",
    isEditMode: false,
  },
};

export const EditModeProfile: Story = {
  args: {
    fullName: "John Smith",
    email: "johnsmith@example.com",
    phoneNum: "4445556666",
    language: "en",
    isEditMode: true,
  },
};

export const WithDifferentLanguage: Story = {
  args: {
    fullName: "Lucas Brown",
    email: "lucas@example.com",
    phoneNum: "5556667777",
    language: "es",
    isEditMode: true,
  },
};
