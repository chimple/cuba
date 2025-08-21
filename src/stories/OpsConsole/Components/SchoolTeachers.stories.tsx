import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
// import { I18nextProvider } from 'react-i18next'; // Uncomment if i18next is not globally configured in your Storybook preview.js
import SchoolTeachersComponent from '../../../ops-console/components/SchoolDetailsComponents/SchoolTeachers'; // Adjust path

// Define the data structures the component expects as props
interface UserType {
  id: string;
  name: string | null;
  gender: string | null;
  phone: string | null; // This was phoneNumber in the old structure
  email: string | null;
}

interface ApiTeacherData {
  user: UserType;
  grade: number; // Must be a number as per the new API response
  classSection: string; // Must be a string
}

// Updated sample data to match ApiTeacherData[]
const sampleApiTeachers: ApiTeacherData[] = [
  {
    user: { id: 'T001', name: 'Albus Dumbledore', gender: 'Male', phone: '001-HOG-WARTS', email: 'albus.d@hogwarts.wiz' },
    grade: 0, // Assign a numeric grade; 0 could represent special roles if your API handles it
    classSection: 'Headmaster',
  },
  {
    user: { id: 'T002', name: 'Minerva McGonagall', gender: 'Female', phone: '002-HOG-WARTS', email: 'minerva.m@hogwarts.wiz' },
    grade: 7,
    classSection: 'Gryffindor',
  },
  {
    user: { id: 'T003', name: 'Severus Snape', gender: 'Male', phone: '003-HOG-WARTS', email: 'severus.s@hogwarts.wiz' },
    grade: 0, // Example for a role-based "class"
    classSection: 'Potions Master',
  },
  {
    user: { id: 'T004', name: 'Rubeus Hagrid', gender: 'Male', phone: '004-HOG-WARTS', email: 'rubeus.h@hogwarts.wiz' },
    grade: 1, // Example grade
    classSection: 'Care of Magical Creatures',
  },
  {
    user: { id: 'T005', name: 'Filius Flitwick', gender: 'Male', phone: '005-HOG-WARTS', email: 'filius.f@hogwarts.wiz' },
    grade: 5,
    classSection: 'Charms',
  },
  {
    user: { id: 'T006', name: 'Pomona Sprout', gender: 'Female', phone: '006-HOG-WARTS', email: 'pomona.s@hogwarts.wiz' },
    grade: 2,
    classSection: 'Herbology',
  },
  {
    user: { id: 'T007', name: 'Sybill Trelawney', gender: 'Female', phone: '007-HOG-WARTS', email: 'sybill.t@hogwarts.wiz' },
    grade: 3, // Example grade
    classSection: 'Divination',
  },
];

const meta = {
  title: 'SchoolManagement/SchoolTeachersPage',
  component: SchoolTeachersComponent,
  decorators: [
    (Story) => (
        <MemoryRouter>
          {/* <I18nextProvider i18n={yourI18nInstance}> */}
          <Story />
          {/* </I18nextProvider> */}
        </MemoryRouter>
    ),
  ],
  tags: ['autodocs'],
  args: {
    isMobile: false,
    data: {
      teachers: [], // Default to an empty array of ApiTeacherData
    },
  },
  argTypes: {
    data: { control: 'object' },
    isMobile: { control: 'boolean' },
  },
} satisfies Meta<typeof SchoolTeachersComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyState: Story = {
  args: {
    data: {
      teachers: [],
    },
  },
};

export const WithTeachers: Story = {
  args: {
    data: {
      teachers: sampleApiTeachers, // Use the correctly structured sample data
    },
  },
};

export const MobileView: Story = {
  args: {
    data: {
      teachers: sampleApiTeachers.slice(0, 3), // Use the correctly structured sample data
    },
    isMobile: true,
  },
  parameters: {
    viewport: { defaultViewport: 'iphone6' },
  },
};

export const WithActiveFilters: Story = {
    args: {
      data: {
        teachers: sampleApiTeachers, // Use the correctly structured sample data
      },
    },
    name: "With Data (Filtering Testable)",
};

export const Searchable: Story = {
    args: {
      data: {
        teachers: sampleApiTeachers, // Use the correctly structured sample data
      },
    },
    name: "With Data (Search Testable)",
};