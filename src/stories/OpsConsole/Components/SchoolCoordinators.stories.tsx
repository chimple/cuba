import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next'; 
import SchoolCoordinatorsComponent, { Coordinator } from '../../../ops-console/components/SchoolDetailsComponents/SchoolCoordinators' // Adjust path
import { Column } from "../../../ops-console/components/DataTableBody";
const MockDataTableBody = ({ columns, rows, orderBy, order, onSort }: {
  columns: Column<any>[],
  rows: any[],
  orderBy: string | null,
  order: 'asc' | 'desc',
  onSort: (key: string) => void
}) => (
  <div data-testid="mock-datatablebody" style={{ border: '1px dashed green', padding: '10px', marginTop: '10px' }}>
    <p><strong>Mock DataTableBody</strong></p>
    <p>Rows: {rows?.length || 0}</p>
    <p>Sorted by: {orderBy || 'N/A'} {order}</p>
    <p>Columns: {columns.map(c => c.label).join(', ')}</p>
  </div>
);

const MockDataTablePagination = ({ page, pageCount, onPageChange }: {
  page: number,
  pageCount: number,
  onPageChange: (newPage: number) => void
}) => (
  <div data-testid="mock-datatablepagination" style={{ border: '1px dashed blue', padding: '10px', marginTop: '10px' }}>
    <p><strong>Mock DataTablePagination</strong></p>
    <p>Page {page} of {pageCount}</p>
    <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}>Prev</button>
    <button onClick={() => onPageChange(page + 1)} disabled={page >= pageCount}>Next</button>
  </div>
);


// Define sample data for Coordinators
const sampleCoordinators: Coordinator[] = [
  { id: 'C001', name: 'Argus Filch', gender: 'Male', phoneNumber: '987-CARE-TAKER', email: 'argus.f@hogwarts.staff' },
  { id: 'C002', name: 'Poppy Pomfrey', gender: 'Female', phoneNumber: '987-MAT-RON', email: 'poppy.p@hogwarts.staff' },
  { id: 'C003', name: 'Irma Pince', gender: 'Female', phoneNumber: '987-LIB-RARY', email: 'irma.p@hogwarts.staff' },
  { id: 'C004', name: 'Rolanda Hooch', gender: 'Female', phoneNumber: '987-FLY-ING', email: 'rolanda.h@hogwarts.staff' },
  { id: 'C005', name: 'Gilderoy Lockhart', gender: 'Male', phoneNumber: '987-FAM-OUS', email: 'gilderoy.l@hogwarts.fanmail' },
  { id: 'C006', name: 'Quirinus Quirrell', gender: 'Male', phoneNumber: '987-TUR-BAN', email: 'quirinus.q@hogwarts.staff' },
  { id: 'C007', name: 'Horace Slughorn', gender: 'Male', phoneNumber: '987-SLU-GCLUB', email: 'horace.s@hogwarts.staff' },
];

const meta = {
  title: 'SchoolManagement/SchoolCoordinatorsPage', // Updated title
  component: SchoolCoordinatorsComponent,
  parameters: {
    // layout: 'fullscreen',
  },
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
      coordinators: [], // Default to no coordinators
    },
  },
  argTypes: {
    data: { control: 'object' },
    isMobile: { control: 'boolean' },
  },
} satisfies Meta<typeof SchoolCoordinatorsComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyState: Story = {
  args: {
    data: {
      coordinators: [],
    },
  },
};

export const WithCoordinators: Story = {
  args: {
    data: {
      coordinators: sampleCoordinators,
    },
  },
};

export const MobileView: Story = {
  args: {
    data: {
      coordinators: sampleCoordinators.slice(0, 3),
    },
    isMobile: true,
  },
  parameters: {
    viewport: { defaultViewport: 'iphone6' },
  },
};
