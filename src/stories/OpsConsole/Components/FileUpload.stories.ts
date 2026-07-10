import type { Meta, StoryObj } from "@storybook/react";
import FileUpload from "../../../ops-console/components/FileUpload";

const meta = {
  title: "OpsConsole/Component/FileUpload",
  component: FileUpload,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof FileUpload>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
