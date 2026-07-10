import type { Meta, StoryObj } from "@storybook/react";
import EditClass from "../../pages/EditClass";

const meta: Meta = {
  title: "teachers-module/pages/EditClass",
  component: EditClass,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = () => <EditClass />;
