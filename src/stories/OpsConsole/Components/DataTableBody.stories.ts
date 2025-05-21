import type { Meta, StoryObj } from "@storybook/react";
import DataTableBody from "../../../ops-console/components/DataTableBody";
import React from "react";

const meta = {
  title: "OpsConsole/Component/DataTableBody",
  component: DataTableBody,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  args: {
    columns: [
      { key: "id", label: "ID", align: "left" },
      { key: "name", label: "Name", align: "left" },
      { key: "age", label: "Age", align: "right" },
    ],
    rows: [
      { id: 1, name: "Alice", age: 25 },
      { id: 2, name: "Bob", age: 30 },
      { id: 3, name: "Charlie", age: 22 },
    ],
    orderBy: "id",
    order: "asc",
    onSort: (key: string) => alert(`Sorting by ${key}`),
  },
} satisfies Meta<typeof DataTableBody>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SortedByNameDesc: Story = {
  args: {
    orderBy: "name",
    order: "desc",
  },
};

export const EmptyRows: Story = {
  args: {
    rows: [],
  },
};

export const CustomRender: Story = {
  args: {
    columns: [
      {
        key: "name",
        label: "Name",
        render: (row: any) => React.createElement("strong", null, row.name),
      },
      {
        key: "email",
        label: "Email",
      },
    ],
    rows: [
      { name: "Dana", email: "dana@example.com" },
      { name: "Eli", email: "eli@example.com" },
    ],
  },
};
