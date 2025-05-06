
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import LessonComponent from "../../components/library/LessonComponent";


const meta = {
    title: "teachers-module/library/LessonComponent",
    component: LessonComponent,
    argTypes: {
       lesson:{},
    },
    parameters:{},
    args: {
       lesson:{
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
       },handleLessonCLick:fn(),handleSelect:fn(),isSelButton:true,isSelcted:true},
} satisfies Meta<typeof LessonComponent>;
export default meta;
type Story = StoryObj<typeof meta>;
export const SelectButton: Story = {
    args: {
     lesson:{
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
    },
    isSelButton:true,
    isSelcted:false
    },
};
export const WithoutSelectButton: Story = {
    args: {
     lesson:{
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
    },
    isSelButton:false,
    isSelcted:true
    },
};
export const NonSelected: Story = {
    args: {
     lesson:{
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
    },
    isSelButton:true,
    isSelcted:false
    },
};