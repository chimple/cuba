import type { Meta, StoryObj } from "@storybook/react";
import AddTeacher from "../../pages/Malta/AddTeacher";

const meta: Meta = {
  title: "Component/AddTeacher",
  component: AddTeacher,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    teacherName: { control: "text" },
    additionalInfo: { control: "text" },
  },
  args: { teacherName: "Navi", additionalInfo: "Principal" },
} satisfies Meta<typeof AddTeacher>;
export default meta;

type Story = StoryObj<typeof meta>;

export const AddTeacher1: Story = {
  args: { teacherName: "Dhruv", additionalInfo: "Teacher" },
  parameters: {
    viewport: {
      defaultViewport: "mobile",
    },
  },
};

export const AddTeacher2: Story = {
  args: {
    teacherName: "Emma",
    additionalInfo: "Teacher",
  },
  parameters: {
    viewport: {
      defaultViewport: "desktop",
      viewports: {
        desktop: {
          name: "Desktop",
          styles: {
            width: "1440px",
            height: "900px",
          },
        },
      },
    },
  },
};
export const AddTeacher3: Story = {
  args: { teacherName: "Dhruv", additionalInfo: "Teacher" },
  parameters: {
    backgrounds: {
      default: "light",
    },
  },
};

export const AddTeacher4: Story = {
  args: {
    teacherName: "Ram",
    additionalInfo: "Principal",
  },
  parameters: {
    backgrounds: {
      default: "dark",
    },
  },
};
