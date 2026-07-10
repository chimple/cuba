//@ts-nocheck
import type { Meta, StoryObj } from "@storybook/react";
import SchoolDetailsTabsComponent from "../../../ops-console/components/SchoolDetailsComponents/SchoolDetailsTabsComponent";
import SchoolNameHeaderComponent from "../../../ops-console/components/SchoolDetailsComponents/SchoolNameHeaderComponent";
import Breadcrumb from "../../../ops-console/components/Breadcrumb";
const SchoolDetailPageLayout = ({
  schoolId,
  schoolName,
  udise,
  group1,
  group2,
  group3,
  group4,
  address,
  programName,
  programType,
  model,
  principalName,
  principalPhone,
  principalEmail,
  coordinatorName,
  coordinatorPhone,
  coordinatorEmail,
  programManagerName,
  programManagerPhone,
  programManagerEmail,
  isMobile,
}: any) => {
  const data = {
    schoolData: {
      name: schoolName,
      udise,
      group1,
      group2,
      group3,
      group4,
      address,
    },
    programData: { name: programName, program_type: programType, model },
    principals: [
      {
        name: principalName,
        role: "Principal",
        phone: principalPhone,
        email: principalEmail,
      },
    ],
    coordinators: [
      {
        name: coordinatorName,
        role: "Coordinator",
        phone: coordinatorPhone,
        email: coordinatorEmail,
      },
    ],
    programManagers: [
      {
        name: programManagerName,
        role: "Program Manager",
        phone: programManagerPhone,
        email: programManagerEmail,
      },
    ],
  };

  return (
    <div className="school-detail-container">
      <div className="school-detail-header">
        {schoolName && <SchoolNameHeaderComponent schoolName={schoolName} />}
      </div>
      {!isMobile && schoolName && (
        <div className="school-detail-secondary-header">
          <Breadcrumb
            crumbs={[
              {
                label: "Schools",
                onClick: () => alert("Go back to school list!"),
              },
              { label: schoolName },
            ]}
          />
        </div>
      )}
      <div className="school-detail-tertiary-gap" />
      <div className="school-detail-tertiary-header">
        <SchoolDetailsTabsComponent
          data={data}
          isMobile={isMobile}
          schoolId={schoolId}
        />
      </div>
      <div className="school-detail-columns-gap" />
    </div>
  );
};

const meta: Meta<typeof SchoolDetailPageLayout> = {
  title: "SchoolDetails/SchoolDetailPage",
  component: SchoolDetailPageLayout,
  argTypes: {
    schoolId: { control: "text" },
    schoolName: { control: "text" },
    udise: { control: "text" },
    group1: { control: "text" },
    group2: { control: "text" },
    group3: { control: "text" },
    group4: { control: "text" },
    address: { control: "text" },
    programName: { control: "text" },
    programType: { control: "text" },
    model: { control: "text" },
    principalName: { control: "text" },
    principalPhone: { control: "text" },
    principalEmail: { control: "text" },
    coordinatorName: { control: "text" },
    coordinatorPhone: { control: "text" },
    coordinatorEmail: { control: "text" },
    programManagerName: { control: "text" },
    programManagerPhone: { control: "text" },
    programManagerEmail: { control: "text" },
    isMobile: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof SchoolDetailPageLayout>;

export const FullPage: Story = {
  args: {
    schoolId: "school-green-valley-123",
    schoolName: "Green Valley High",
    udise: "12345678901",
    group1: "Karnataka",
    group2: "Bangalore",
    group3: "Cluster A",
    group4: "Block 5",
    address: "123 Main St, Bangalore, Karnataka",
    programName: "Awesome Learning",
    programType: "Government",
    model: "In School",
    principalName: "Ms. Rani Gupta",
    principalPhone: "9876543210",
    principalEmail: "rani.gupta@school.org",
    coordinatorName: "Mr. Suresh Rao",
    coordinatorPhone: "9876501234",
    coordinatorEmail: "suresh.rao@school.org",
    programManagerName: "Priya Singh",
    programManagerPhone: "9000000001",
    programManagerEmail: "priya.singh@org.com",
    isMobile: false,
  },
};
