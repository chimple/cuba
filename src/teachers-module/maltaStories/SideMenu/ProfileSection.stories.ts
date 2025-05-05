import { Meta, StoryObj } from "@storybook/react";
import ProfileSection from "../../components/homePage/ProfileDetail";

// Define metadata for the Storybook
const meta: Meta<typeof ProfileSection> = {
  title: "components/ProfileSection",
  component: ProfileSection,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    fullName: {
      control: "text",
      description: "The full name of the user displayed in the profile section",
    },
    email: {
      control: "text",
      description: "The email of the user displayed in the profile section",
    },
  },
  args: {
    fullName: "John Doe",
    email: "john.doe@example.com",
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

// Define the default story for ProfileSection
export const Default3: Story = {
  args: {
    fullName: "John Doe",
    email: "john.doe@example.com",
  },
};

// Define another story for different scenario
export const NoEmailSelect: Story = {
  args: {
    fullName: "Jane Smith",
    email: "", // No email provided
  },
};

export const AnotherUserSelect: Story = {
  args: {
    fullName: "Alice Johnson",
    email: "alice.johnson@example.com",
  },
};
