//@ts-nocheck
import type { Meta, StoryObj } from "@storybook/react";
import DataTablePagination from "../../../ops-console/components/DataTablePagination";


const meta = {
  title: "OpsConsole/Component/DataTablePagination",
  component: DataTablePagination,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    page: 1,
    pageCount: 5,
    onPageChange: (page: number) => alert(`Page changed to ${page}`),
  },
} satisfies Meta<typeof DataTablePagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FirstPage: Story = {
  args: {
    page: 1,
    pageCount: 10,
  },
};

export const MiddlePage: Story = {
  args: {
    page: 5,
    pageCount: 10,
  },
};

export const LastPage: Story = {
  args: {
    page: 10,
    pageCount: 10,
  },
};

export const SinglePage: Story = {
  args: {
    page: 1,
    pageCount: 1,
  },
};
