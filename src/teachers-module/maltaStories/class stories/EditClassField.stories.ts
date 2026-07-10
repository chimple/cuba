import { Meta, StoryObj } from "@storybook/react";
import EditClassField from "../../components/classComponents/EditClassField";

const meta: Meta<typeof EditClassField> = {
  title: "components/classComponents/EditClassField",
  component: EditClassField,
  argTypes: {
    className: {
      control: "text",
      description: "The name of the class being edited",
    },
    setClassName: {
      action: "setClassName",
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    className: "Class 1",
  },
};

export const EmptyClassName: Story = {
  args: {
    className: "",
  },
};

export const LongClassName: Story = {
  args: {
    className: "This is a very long class name for testing purposes",
  },
};
