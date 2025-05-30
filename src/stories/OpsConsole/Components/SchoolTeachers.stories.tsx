import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import SchoolTeachersComponent, { Teacher } from '../../../ops-console/components/SchoolDetailsComponents/SchoolTeachers'; // Adjust path

// Define sample data with the explicit Teacher[] type
const sampleTeachers: Teacher[] = [ // <--- CHANGE IS HERE
  { id: 'T001', name: 'Albus Dumbledore', gender: 'Male', grade: null, classSection: 'Headmaster', phoneNumber: '001-HOG-WARTS', email: 'albus.d@hogwarts.wiz' },
  { id: 'T002', name: 'Minerva McGonagall', gender: 'Female', grade: 7, classSection: 'Gryffindor', phoneNumber: '002-HOG-WARTS', email: 'minerva.m@hogwarts.wiz' },
  { id: 'T003', name: 'Severus Snape', gender: 'Male', grade: null, classSection: 'Potions Master', phoneNumber: '003-HOG-WARTS', email: 'severus.s@hogwarts.wiz' },
  { id: 'T004', name: 'Rubeus Hagrid', gender: 'Male', grade: null, classSection: 'Care of Magical Creatures', phoneNumber: '004-HOG-WARTS', email: 'rubeus.h@hogwarts.wiz' },
  { id: 'T005', name: 'Filius Flitwick', gender: 'Male', grade: 5, classSection: 'Charms', phoneNumber: '005-HOG-WARTS', email: 'filius.f@hogwarts.wiz' },
  { id: 'T006', name: 'Pomona Sprout', gender: 'Female', grade: 2, classSection: 'Herbology', phoneNumber: '006-HOG-WARTS', email: 'pomona.s@hogwarts.wiz' },
  { id: 'T007', name: 'Sybill Trelawney', gender: 'Female', grade: null, classSection: 'Divination', phoneNumber: '007-HOG-WARTS', email: 'sybill.t@hogwarts.wiz' },
];

const meta = {
  title: 'SchoolManagement/SchoolTeachersPage',
  component: SchoolTeachersComponent,
  decorators: [
    (Story) => (
        <MemoryRouter>
          <Story />
        </MemoryRouter>
    ),
  ],
  tags: ['autodocs'],
  args: {
    isMobile: false,
    data: {
      teachers: [],
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
      teachers: sampleTeachers,
    },
  },
};

export const MobileView: Story = {
  args: {
    data: {
      teachers: sampleTeachers.slice(0, 3),
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
        teachers: sampleTeachers,
      },
    },
    name: "With Data (Filtering Testable)",
};

export const Searchable: Story = {
    args: {
      data: {
        teachers: sampleTeachers,
      },
    },
    name: "With Data (Search Testable)",
};