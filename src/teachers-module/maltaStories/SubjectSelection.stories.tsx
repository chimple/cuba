import SubjectSelection from "../pages/SubjectSelection";
import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta = {
  title: "Pages/Malta/SubjectSelection",
  component: SubjectSelection,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    curriculumsWithCourses: {
      control: {
        type: "object",
      },
      defaultValue: [
        {
          curriculum: { id: "1", name: "Curriculum A", grade: "1" },
          courses: [
            { id: "1", name: "Math", image: "math-icon.png", curriculum_id: "1", grade_id: "1" },
            { id: "2", name: "Science", image: "science-icon.png", curriculum_id: "1", grade_id: "1" },
          ],
        },
        {
          curriculum: { id: "2", name: "Curriculum B", grade: "2" },
          courses: [
            { id: "3", name: "History", image: "history-icon.png", curriculum_id: "2", grade_id: "2" },
          ],
        },
      ],
    },
    selectedSubjects: {
      control: {
        type: "array",
      },
      defaultValue: [],
    },
    isSelecting: {
      control: "boolean",
      defaultValue: false,
    },
    isModalOpen: {
      control: "boolean",
      defaultValue: false,
    },
    currentSubject: {
      control: "text",
      defaultValue: null,
    },
  },
  args: {
    curriculumsWithCourses: [
      {
        curriculum: { id: "1", name: "Curriculum A", grade: "1" },
        courses: [
          { id: "1", name: "Math", image: "math-icon.png", curriculum_id: "1", grade_id: "1" },
          { id: "2", name: "Science", image: "science-icon.png", curriculum_id: "1", grade_id: "1" },
        ],
      },
      {
        curriculum: { id: "2", name: "Curriculum B", grade: "2" },
        courses: [
          { id: "3", name: "History", image: "history-icon.png", curriculum_id: "2", grade_id: "2" },
        ],
      },
    ],
    selectedSubjects: [],
    isSelecting: false,
    isModalOpen: false,
    currentSubject: null,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;
export const WithSubjectsSelected: Story = {
  args: {
    curriculumsWithCourses: [
      {
        curriculum: { id: "1", name: "Curriculum A", grade: "1" },
        courses: [
          { id: "1", name: "Math", image: "math-icon.png", curriculum_id: "1", grade_id: "1" },
          { id: "2", name: "Science", image: "science-icon.png", curriculum_id: "1", grade_id: "1" },
        ],
      },
      {
        curriculum: { id: "2", name: "Curriculum B", grade: "2" },
        courses: [
          { id: "3", name: "History", image: "history-icon.png", curriculum_id: "2", grade_id: "2" },
        ],
      },
    ],
    selectedSubjects: ["Math", "History"],
    isSelecting: false,
    isModalOpen: false,
    currentSubject: null,
  },
};

export const SubjectSelectionInProgress: Story = {
  args: {
    curriculumsWithCourses: [
      {
        curriculum: { id: "1", name: "Curriculum A", grade: "1" },
        courses: [
          { id: "1", name: "Math", image: "math-icon.png", curriculum_id: "1", grade_id: "1" },
          { id: "2", name: "Science", image: "science-icon.png", curriculum_id: "1", grade_id: "1" },
        ],
      },
      {
        curriculum: { id: "2", name: "Curriculum B", grade: "2" },
        courses: [
          { id: "3", name: "History", image: "history-icon.png", curriculum_id: "2", grade_id: "2" },
        ],
      },
    ],
    selectedSubjects: ["Math"],
    isSelecting: true,
    isModalOpen: false,
    currentSubject: null,
  },
};

export const SubjectRemovalModalOpen: Story = {
  args: {
    curriculumsWithCourses: [
      {
        curriculum: { id: "1", name: "Curriculum A", grade: "1" },
        courses: [
          { id: "1", name: "Math", image: "math-icon.png", curriculum_id: "1", grade_id: "1" },
          { id: "2", name: "Science", image: "science-icon.png", curriculum_id: "1", grade_id: "1" },
        ],
      },
      {
        curriculum: { id: "2", name: "Curriculum B", grade: "2" },
        courses: [
          { id: "3", name: "History", image: "history-icon.png", curriculum_id: "2", grade_id: "2" },
        ],
      },
    ],
    selectedSubjects: ["Math"],
    isSelecting: false,
    isModalOpen: true,
    currentSubject: "Math",
  },
};
