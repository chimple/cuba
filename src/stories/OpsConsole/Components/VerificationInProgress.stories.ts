//@ts-nocheck
import type { Meta, StoryObj } from "@storybook/react";
import VerificationInProgress from "../../../ops-console/components/VerificationInProgress";

const meta = {
  title: "OpsConsole/Component/VerificationInProgress",
  component: VerificationInProgress,
  tags: ["autodocs"],
} satisfies Meta<typeof VerificationInProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Starting: Story = {
  args: {
    progress: 5,
    title: "Starting Verification",
    message: "We're beginning the verification process...",
  },
};

export const InProgressLow: Story = {
  args: {
    progress: 30,
    title: "Verification Underway",
    message: "Hang tight — we're working on it.",
  },
};

export const InProgressMid: Story = {
  args: {
    progress: 60,
    title: "More Than Halfway",
    message: "Still verifying... Almost there.",
  },
};

export const AlmostDone: Story = {
  args: {
    progress: 90,
    title: "Almost Done!",
    message: "Finalizing the last steps.",
  },
};

export const Completed: Story = {
  args: {
    progress: 100,
    title: "Verification Complete",
    message: "You're all set! Everything has been verified.",
  },
};
