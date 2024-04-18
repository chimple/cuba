import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import LiveQuizCountdownTimer from "../components/liveQuiz/LiveQuizCountdownTimer";
import { Timestamp } from "@firebase/firestore";

const meta = {
  title: "Component/LiveQuiz/CountdownTimer",
  component: LiveQuizCountdownTimer,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    onTimeOut: fn(),
    startsAt: Timestamp.fromDate(
      new Date(new Date().setSeconds(new Date().getSeconds() + 30))
    ),
  },
  argTypes: {
    startsAt: {
      type: "function",
      defaultValue: Timestamp.fromDate(
        new Date(new Date().setSeconds(new Date().getSeconds() + 30))
      ),
    },
    onTimeOut: {
      defaultValue: fn(),
    },
  },
} satisfies Meta<typeof LiveQuizCountdownTimer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CountdownFor10Sec: Story = {
  args: {
    onTimeOut: fn(),
    startsAt: Timestamp.fromDate(
      new Date(new Date().setSeconds(new Date().getSeconds() + 10))
    ),
  },
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export const CountdownFor15Sec: Story = {
  args: {
    onTimeOut: fn(),
    startsAt: Timestamp.fromDate(
      new Date(new Date().setSeconds(new Date().getSeconds() + 15))
    ),
  },
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export const CountdownFor20Sec: Story = {
  args: {
    onTimeOut: fn(),
    startsAt: Timestamp.fromDate(
      new Date(new Date().setSeconds(new Date().getSeconds() + 20))
    ),
  },
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export const CountdownFor25Sec: Story = {
  args: {
    onTimeOut: fn(),
    startsAt: Timestamp.fromDate(
      new Date(new Date().setSeconds(new Date().getSeconds() + 25))
    ),
  },
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export const CountdownFor30Sec: Story = {
  args: {
    onTimeOut: fn(),
    startsAt: Timestamp.fromDate(
      new Date(new Date().setSeconds(new Date().getSeconds() + 30))
    ),
  },
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export const CountdownFor35Sec: Story = {
  args: {
    onTimeOut: fn(),
    startsAt: Timestamp.fromDate(
      new Date(new Date().setSeconds(new Date().getSeconds() + 35))
    ),
  },
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export const CountdownFor40Sec: Story = {
  args: {
    onTimeOut: fn(),
    startsAt: Timestamp.fromDate(
      new Date(new Date().setSeconds(new Date().getSeconds() + 40))
    ),
  },
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};
export const CountdownFor45Sec: Story = {
  args: {
    onTimeOut: fn(),
    startsAt: Timestamp.fromDate(
      new Date(new Date().setSeconds(new Date().getSeconds() + 45))
    ),
  },
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};
export const CountdownFor50Sec: Story = {
  args: {
    onTimeOut: fn(),
    startsAt: Timestamp.fromDate(
      new Date(new Date().setSeconds(new Date().getSeconds() + 50))
    ),
  },
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};
export const CountdownFor55Sec: Story = {
  args: {
    onTimeOut: fn(),
    startsAt: Timestamp.fromDate(
      new Date(new Date().setSeconds(new Date().getSeconds() + 55))
    ),
  },
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export const CountdownFor60Sec: Story = {
  args: {
    onTimeOut: fn(),
    startsAt: Timestamp.fromDate(
      new Date(new Date().setSeconds(new Date().getSeconds() + 60))
    ),
  },
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};
export const CountdownFor65Sec: Story = {
  args: {
    onTimeOut: fn(),
    startsAt: Timestamp.fromDate(
      new Date(new Date().setSeconds(new Date().getSeconds() + 65))
    ),
  },
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};
