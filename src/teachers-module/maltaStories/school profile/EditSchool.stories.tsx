import type { Meta, StoryObj } from "@storybook/react";
import EditSchool from "../../pages/EditSchool";

const meta: Meta = {
  title: "teachers-module/pages/EditSchool",
  component: EditSchool,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = () => <EditSchool />;
