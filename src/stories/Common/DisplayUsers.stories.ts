
import type { Meta, StoryObj } from "@storybook/react";
import { number, string } from "prop-types";
import DisplayUsers from "../../components/DisplayUsers";
interface DisplayUsersProps {
    users: { docId: string, name: string, image: string }[];
}

const meta = {
    title: "Component/Common/DisplayUsers",
    component: DisplayUsers,
    parameters: {
        layout: "fullscreen",
        demo: {
            demoArray: [3, 4],
          },
      
    },
    tags: ["autodocs"],
    argTypes: {
        users: {
            control: { type: 'object' },
            description: 'List of users to display',
            defaultValue: [
                { docId: '1', name: 'User 1', image: 'path_to_image_1' },
                { docId: '2', name: 'User 2', image: 'path_to_image_2' },
            ],
        },
    },
    args: {
        users: [
            { docId: '1', name: 'User 1', image: 'path_to_image_1' },
            { docId: '2', name: 'User 2', image: 'path_to_image_2' },
            // Add more user objects as needed
        ],
    },
} satisfies Meta<typeof DisplayUsers>;
export default meta;
type Story = StoryObj<typeof meta>;
export const TwoUsers: Story = {
    args: {
        users: [
            { docId: '1', name: 'User 1', image: 'path_to_image_1' },
            { docId: '2', name: 'User 2', image: 'path_to_image_2' },
            { docId: '1', name: 'User 1', image: 'path_to_image_1' },
            { docId: '2', name: 'User 2', image: 'path_to_image_2' },
            { docId: '1', name: 'User 1', image: 'path_to_image_1' },
            { docId: '2', name: 'User 2', image: 'path_to_image_2' },
            // Add more user objects as needed
        ],
    },
};

// export const Image: Story = {
//     args: {
//         userDocId: '323452',
//         userImgPath:'image.png',
//         userName:'Bhanu'
//     },
// };

