import type { Meta, StoryObj } from "@storybook/react";
import FabList from "../../components/malta/school/AddEditDeleteFab";
import { fn } from "@storybook/test";

const meta = {
  title: "Component/malta/school/FabButtons",
  component: FabList,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    onAddClick: fn(),
    onEditClick: fn()
  },
  args: {},
} satisfies Meta<typeof FabList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const fabButtons: Story = {
  args: {
    disabled: false,
    onAddClick: fn(),
    onEditClick: fn()
  },
};
