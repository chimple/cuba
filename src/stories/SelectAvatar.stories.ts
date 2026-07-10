import { fn } from "@storybook/test";
import type { Meta, StoryObj } from "@storybook/react";
import SelectAvatar from "../components/editStudent/SelectAvatar";
import { AVATARS } from "../common/constants";

const meta = {
  title: "Component/EditStudent/SelectAvatar",
  component: SelectAvatar,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    avatar: {
      options: AVATARS,
      mapping: AVATARS,
      control: {
        type: "select",
        labels: AVATARS,
      },
    },
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: { avatar: AVATARS[0] },
} satisfies Meta<typeof SelectAvatar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Avatar: Story = {
  args: {
    avatar: AVATARS[0],
    onAvatarChange: fn(),
  },
};

export const Avatar2: Story = {
  args: {
    avatar: AVATARS[1],
    onAvatarChange: fn(),
  },
};

export const Avatar3: Story = {
  args: {
    avatar: AVATARS[2],
    onAvatarChange: fn(),
  },
};

export const Avatar4: Story = {
  args: {
    avatar: AVATARS[3],
    onAvatarChange: fn(),
  },
};

export const Avatar5: Story = {
  args: {
    avatar: AVATARS[4],
    onAvatarChange: fn(),
  },
};

export const Avatar6: Story = {
  args: {
    avatar: AVATARS[5],
    onAvatarChange: fn(),
  },
};

export const Avatar7: Story = {
  args: {
    avatar: AVATARS[6],
    onAvatarChange: fn(),
  },
};

export const Avatar8: Story = {
  args: {
    avatar: AVATARS[7],
    onAvatarChange: fn(),
  },
};

export const Avatar9: Story = {
  args: {
    avatar: AVATARS[8],
    onAvatarChange: fn(),
  },
};

export const Avatar10: Story = {
  args: {
    avatar: AVATARS[9],
    onAvatarChange: fn(),
  },
};

export const Avatar11: Story = {
  args: {
    avatar: AVATARS[10],
    onAvatarChange: fn(),
  },
};

export const Avatar12: Story = {
  args: {
    avatar: AVATARS[11],
    onAvatarChange: fn(),
  },
};

export const Avatar13: Story = {
  args: {
    avatar: AVATARS[12],
    onAvatarChange: fn(),
  },
};

export const Avatar14: Story = {
  args: {
    avatar: AVATARS[13],
    onAvatarChange: fn(),
  },
};

export const Avatar15: Story = {
  args: {
    avatar: AVATARS[14],
    onAvatarChange: fn(),
  },
};

export const Avatar16: Story = {
  args: {
    avatar: AVATARS[15],
    onAvatarChange: fn(),
  },
};

export const Avatar17: Story = {
  args: {
    avatar: AVATARS[16],
    onAvatarChange: fn(),
  },
};

export const Avatar18: Story = {
  args: {
    avatar: AVATARS[17],
    onAvatarChange: fn(),
  },
};

export const Avatar19: Story = {
  args: {
    avatar: AVATARS[18],
    onAvatarChange: fn(),
  },
};

export const Avatar20: Story = {
  args: {
    avatar: AVATARS[19],
    onAvatarChange: fn(),
  },
};

export const Avatar21: Story = {
  args: {
    avatar: AVATARS[20],
    onAvatarChange: fn(),
  },
};

export const Avatar22: Story = {
  args: {
    avatar: AVATARS[21],
    onAvatarChange: fn(),
  },
};

export const Avatar23: Story = {
  args: {
    avatar: AVATARS[22],
    onAvatarChange: fn(),
  },
};

export const Avatar24: Story = {
  args: {
    avatar: AVATARS[23],
    onAvatarChange: fn(),
  },
};

export const Avatar25: Story = {
  args: {
    avatar: AVATARS[24],
    onAvatarChange: fn(),
  },
};

export const Avatar26: Story = {
  args: {
    avatar: AVATARS[25],
    onAvatarChange: fn(),
  },
};

export const Avatar27: Story = {
  args: {
    avatar: AVATARS[26],
    onAvatarChange: fn(),
  },
};

export const Avatar28: Story = {
  args: {
    avatar: AVATARS[27],
    onAvatarChange: fn(),
  },
};

export const Avatar29: Story = {
  args: {
    avatar: AVATARS[28],
    onAvatarChange: fn(),
  },
};

export const Avatar30: Story = {
  args: {
    avatar: AVATARS[29],
    onAvatarChange: fn(),
  },
};

export const Avatar31: Story = {
  args: {
    avatar: AVATARS[30],
    onAvatarChange: fn(),
  },
};

export const Avatar32: Story = {
  args: {
    avatar: AVATARS[31],
    onAvatarChange: fn(),
  },
};

export const Avatar33: Story = {
  args: {
    avatar: AVATARS[32],
    onAvatarChange: fn(),
  },
};

export const Avatar34: Story = {
  args: {
    avatar: AVATARS[33],
    onAvatarChange: fn(),
  },
};

export const Avatar35: Story = {
  args: {
    avatar: AVATARS[34],
    onAvatarChange: fn(),
  },
};

export const Avatar36: Story = {
  args: {
    avatar: AVATARS[35],
    onAvatarChange: fn(),
  },
};

export const Avatar37: Story = {
  args: {
    avatar: AVATARS[36],
    onAvatarChange: fn(),
  },
};

export const Avatar38: Story = {
  args: {
    avatar: AVATARS[37],
    onAvatarChange: fn(),
  },
};

export const Avatar39: Story = {
  args: {
    avatar: AVATARS[38],
    onAvatarChange: fn(),
  },
};

export const Avatar40: Story = {
  args: {
    avatar: AVATARS[39],
    onAvatarChange: fn(),
  },
};
