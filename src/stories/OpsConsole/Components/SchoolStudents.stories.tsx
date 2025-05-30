import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom"; 
import { I18nextProvider } from "react-i18next";
import SchoolStudentsComponent from "../../../ops-console/components/SchoolDetailsComponents/SchoolStudents";

// Define sample data
const sampleStudents = [
  {
    studentId: "S001",
    name: "Alice Wonderland",
    gender: "Female",
    className: "5A",
    phoneNumber: "123-456-7890",
    id: "S001",
  },
  {
    studentId: "S002",
    name: "Bob The Builder",
    gender: "Male",
    className: "5B",
    phoneNumber: "234-567-8901",
    id: "S002",
  },
  {
    studentId: "S003",
    name: "Charlie Brown",
    gender: "Male",
    className: "UKG C",
    phoneNumber: "345-678-9012",
    id: "S003",
  },
  {
    studentId: "S004",
    name: "Diana Prince",
    gender: "Female",
    className: "10",
    phoneNumber: "456-789-0123",
    id: "S004",
  },
  {
    studentId: "S005",
    name: "Edward Scissorhands",
    gender: "Male",
    className: "Section Blue",
    phoneNumber: "567-890-1234",
    id: "S005",
  },
  {
    studentId: "S006",
    name: "Fiona Apple",
    gender: "Female",
    className: "3B",
    phoneNumber: "678-901-2345",
    id: "S006",
  },
  {
    studentId: "S007",
    name: "George Jetson",
    gender: "Male",
    className: "12A",
    phoneNumber: "789-012-3456",
    id: "S007",
  },
  {
    studentId: "S008",
    name: "Hellen Keller",
    gender: "Female",
    className: "LKG",
    phoneNumber: "890-123-4567",
    id: "S008",
  },
];

const meta = {
  title: "SchoolManagement/SchoolStudentsPage", // Adjust path as needed
  component: SchoolStudentsComponent,
  parameters: {
  },
  decorators: [
    (Story) => (
        <MemoryRouter>
          <Story />
        </MemoryRouter>
    ),
  ],
  tags: ["autodocs"],
  args: {
    isMobile: false,
    data: {
      students: [], // Default to no students
    },
  },
  argTypes: {
    data: { control: "object" },
    isMobile: { control: "boolean" },
  },
} satisfies Meta<typeof SchoolStudentsComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyState: Story = {
  args: {
    data: {
      students: [],
    },
  },
};

export const WithStudents: Story = {
  args: {
    data: {
      students: sampleStudents,
    },
  },
};

export const MobileView: Story = {
  args: {
    data: {
      students: sampleStudents.slice(0, 3), // Fewer students for mobile example
    },
    isMobile: true,
  },
  parameters: {
    viewport: { defaultViewport: "iphone6" }, // Example mobile viewport
  },
};

export const WithActiveFilters: Story = {
  args: {
    data: {
      students: sampleStudents,
    },
  },
  name: "With Data (Filtering Testable)",
};

export const Searchable: Story = {
  args: {
    data: {
      students: sampleStudents,
    },
  },
  name: "With Data (Search Testable)",
};
