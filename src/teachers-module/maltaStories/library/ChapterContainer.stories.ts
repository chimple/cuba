
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import ChapterContainer from "../../components/library/ChapterContainer";

const meta = {
    title: "teachers-module/library/ChapterContainer",
    component: ChapterContainer,

    argTypes: {
       chapter:{},
       lessons:[{}],

    },
    parameters:{},
    args: {chapter:{
        course_id: 'string',
        created_at: 'string',
        id: '',
        image: 'string',
        is_deleted: false ,
        name: 'string',
        sort_index: 0,
        sub_topics: '',
        updated_at: '',
    } ,
       lessons:[{
           cocos_chapter_code: null,
           cocos_lesson_id: null,
           cocos_subject_code: null,
           color: null,
           created_at: "",
           created_by: null,
           id: "",
           image: null,
           is_deleted: null,
           language_id: null,
           name: null,
           outcome: null,
           plugin_type: null,
           status: null,
           subject_id: null,
           target_age_from: null,
           target_age_to: null,
           updated_at: null
       }],chapterSelectedLessons:fn(),lessonClickCallBack:fn(),syncSelectedLessons :[]},
} satisfies Meta<typeof ChapterContainer>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Test1: Story = {
    args: {
    isOpened:true,
       chapter:{
        course_id: 'string',
        created_at: 'string',
        id: 'string',
        image: 'string',
        is_deleted: false ,
        name: 'Chapter1',
        sort_index: 0,
        sub_topics: '',
        updated_at: '',
    },lessons:[{
        cocos_chapter_code: null,
        cocos_lesson_id: null,
        cocos_subject_code: null,
        color: null,
        created_at: "",
        created_by: null,
        id: "",
        image: null,
        is_deleted: null,
        language_id: null,
        name: 'lesson1',
        outcome: null,
        plugin_type: null,
        status: null,
        subject_id: null,
        target_age_from: null,
        target_age_to: null,
        updated_at: null
    }]
    },
};
export const Test2: Story = {
    args: {
        isOpened:true,
       chapter:{
        course_id: 'string',
        created_at: 'string',
        id: 'string',
        image: 'string',
        is_deleted: false ,
        name: 'Chapter1',
        sort_index: 0,
        sub_topics: '',
        updated_at: '',
    },lessons:[{
        cocos_chapter_code: null,
        cocos_lesson_id: null,
        cocos_subject_code: null,
        color: null,
        created_at: "",
        created_by: null,
        id: "",
        image: null,
        is_deleted: null,
        language_id: null,
        name: 'lesson1',
        outcome: null,
        plugin_type: null,
        status: null,
        subject_id: null,
        target_age_from: null,
        target_age_to: null,
        updated_at: null
    },{
        cocos_chapter_code: null,
        cocos_lesson_id: null,
        cocos_subject_code: null,
        color: null,
        created_at: "",
        created_by: null,
        id: "",
        image: null,
        is_deleted: null,
        language_id: null,
        name: 'lesson2',
        outcome: null,
        plugin_type: null,
        status: null,
        subject_id: null,
        target_age_from: null,
        target_age_to: null,
        updated_at: null
    }]
    },
}