import type { Meta, StoryObj } from "@storybook/react";
import ManageSchools from "../../pages/ManageSchools";

const meta: Meta = {
  title: "teachers-module/pages/ManageSchools",
  component: ManageSchools,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default = () => <ManageSchools />;
