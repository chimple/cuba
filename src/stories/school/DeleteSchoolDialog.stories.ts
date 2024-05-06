import type { Meta, StoryObj } from "@storybook/react";
import AddSchool from "../../components/malta/common/DeleteDialog";
import { fn } from "@storybook/test";
import DeleteDialog from "../../components/malta/common/DeleteDialog";

const meta = {
  title: "Component/malta/school/DeleteSchool",
  component: DeleteDialog,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    alertMsg: {
      options: Object.values(""),
      mapping: Object.values(""),
      control: {
        type: "text",
        labels: Object.keys(""),
      },
    }
  },
  args: {alertMsg:'Delete?'},
} satisfies Meta<typeof AddSchool>;

export default meta;
type Story = StoryObj<typeof meta>;

export const deleteSchool: Story = {
  args: {
    alertMsg: 'Are you sure to delete the school',
  },
};
