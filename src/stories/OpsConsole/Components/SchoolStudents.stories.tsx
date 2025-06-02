import type { Meta, StoryObj } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";
// import { I18nextProvider } from "react-i18next"; // If needed
import SchoolStudentsComponent from "../../../ops-console/components/SchoolDetailsComponents/SchoolStudents"; // Adjust path

// Define the UserType and ApiStudentData interfaces, matching those in SchoolStudentsComponent.tsx
interface UserType {
  id: string;
  student_id?: string | null;
  name: string | null;
  gender: string | null;
  phone: string | null;
}

interface ApiStudentData {
  user: UserType;
  grade: number;
  classSection: string;
}

// Helper function to simulate backend's parseClassName for story data
// This needs to be consistent with how your backend (or frontend NON_NUMERIC_GRADE_TO_NUMBER_MAP) handles grades
const parseSampleClassName = (
  classNameInput: string,
  studentId: string,
  name: string,
  gender: string,
  phone: string
): ApiStudentData => {
  let grade: number;
  let section: string;

  // Example parsing logic - MAKE THIS MATCH YOUR ACTUAL BACKEND/COMPONENT LOGIC
  if (classNameInput.toUpperCase().startsWith("UKG")) {
    grade = 0; // Assuming UKG maps to 0 as per NON_NUMERIC_GRADE_TO_NUMBER_MAP
    section = classNameInput.substring(3).trim() || "A"; // Default section if not specified
  } else if (classNameInput.toUpperCase().startsWith("LKG")) {
    grade = -1; // Assuming LKG maps to -1
    section = classNameInput.substring(3).trim() || "A";
  } else if (classNameInput === "10") {
    grade = 10;
    section = "A"; // Default section
  } else if (classNameInput.toUpperCase() === "SECTION BLUE") { // This one is tricky, needs a numeric grade
    grade = 1; // Arbitrary grade for a named section
    section = "BLUE";
  } else {
    const match = classNameInput.match(/^(\d+)([A-Z]*)$/i); // Simple "5A" or "12"
    if (match) {
      grade = parseInt(match[1], 10);
      section = match[2]?.toUpperCase() || "A"; // Default section if only number
    } else {
      // Fallback for more complex or unparsed
      grade = 1; // Default grade
      section = classNameInput.toUpperCase().substring(0,1) || "A"; // Default section
    }
  }

  return {
    user: {
      id: studentId, // Use studentId as internal user ID for sample
      student_id: studentId,
      name: name,
      gender: gender,
      phone: phone,
    },
    grade: grade,
    classSection: section,
  };
};


// Updated sample data to match ApiStudentData[]
const sampleApiStudents: ApiStudentData[] = [
  parseSampleClassName("5A", "S001", "Alice Wonderland", "Female", "123-456-7890"),
  parseSampleClassName("5B", "S002", "Bob The Builder", "Male", "234-567-8901"),
  parseSampleClassName("UKG C", "S003", "Charlie Brown", "Male", "345-678-9012"),
  parseSampleClassName("10", "S004", "Diana Prince", "Female", "456-789-0123"),
  parseSampleClassName("Section Blue", "S005", "Edward Scissorhands", "Male", "567-890-1234"),
  parseSampleClassName("3B", "S006", "Fiona Apple", "Female", "678-901-2345"),
  parseSampleClassName("12A", "S007", "George Jetson", "Male", "789-012-3456"),
  parseSampleClassName("LKG", "S008", "Hellen Keller", "Female", "890-123-4567"),
];


const meta = {
  title: "SchoolManagement/SchoolStudentsPage",
  component: SchoolStudentsComponent,
  decorators: [
    (Story) => (
        <MemoryRouter>
          {/* <I18nextProvider i18n={yourI18nInstance}> */}
          <Story />
          {/* </I18nextProvider> */}
        </MemoryRouter>
    ),
  ],
  tags: ["autodocs"],
  args: {
    isMobile: false,
    data: {
      students: [],
    },
  },
  argTypes: {
    data: { control: "object" }, // data.students should be ApiStudentData[]
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
      students: sampleApiStudents, // Use the correctly structured sample data
    },
  },
};

export const MobileView: Story = {
  args: {
    data: {
      students: sampleApiStudents.slice(0, 3), // Use correctly structured sample data
    },
    isMobile: true,
  },
  parameters: {
    viewport: { defaultViewport: "iphone6" },
  },
};

export const WithActiveFilters: Story = {
  args: {
    data: {
      students: sampleApiStudents, // Use correctly structured sample data
    },
  },
  name: "With Data (Filtering Testable)",
};

export const Searchable: Story = {
  args: {
    data: {
      students: sampleApiStudents, // Use correctly structured sample data
    },
  },
  name: "With Data (Search Testable)",
};