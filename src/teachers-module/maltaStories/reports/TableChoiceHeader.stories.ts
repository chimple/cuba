import type { Meta, StoryObj } from "@storybook/react"; 
import TableChoiceHeader from "../../components/reports/TableChoiceHeader";
import { subMonths } from "date-fns";

const meta = {
  title: "teachers-module/report/TableChoiceHeader",
  component: TableChoiceHeader,
  tags: ["autodocs"],
  argTypes: {},

  args: {},
} satisfies Meta<typeof TableChoiceHeader>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Test1: Story = {
  args: {
    isMonthly: false,
    dateRangeValue: {
      startDate: subMonths(new Date(), 6),
      endDate: new Date(),
    },
    onDateChange(){},
    handleNameSort(){},
    onIsAssignments(){},
    sortBy:"Name",
    isAssignmentsOnlyProp:false,
    isAssignmentReport: false,
  },
};
export const Test2: Story = {
    args: {
      isMonthly: false,
      dateRangeValue: {
        startDate: subMonths(new Date(), 6),
        endDate: new Date(),
      },
      onDateChange(){},
      handleNameSort(){},
      onIsAssignments(){},
      sortBy:"High Score",
      isAssignmentsOnlyProp:true,
      isAssignmentReport: true,
    },
  };
  export const Test3: Story = {
    args: {
      isMonthly: false,
      dateRangeValue: {
        startDate: subMonths(new Date(), 6),
        endDate: new Date(),
      },
      onDateChange(){},
      handleNameSort(){},
      onIsAssignments(){},
      sortBy:"Low Score",
      isAssignmentsOnlyProp:false,
      isAssignmentReport: false,
    },
  };
