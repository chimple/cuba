//@ts-nocheck
import type { Meta, StoryObj } from "@storybook/react";
import ContactCard from "../../../ops-console/components/ContactCard";

const meta = {
  title: "OpsConsole/Component/ContactCard",
  component: ContactCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof ContactCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: "John Doe",
    role: "Program Manager",
    phone: "98765432210",
  },
};
